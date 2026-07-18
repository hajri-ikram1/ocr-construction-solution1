import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import FormData = require('form-data');
import { Depense } from './depense.entity';
import { Stock } from './stock.entity';
import { Devis } from './devis.entity';

@Injectable()
export class AppService {
  private readonly fastapiUrl = 'http://127.0.0.1:8000/api/ia';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Depense)
    private readonly depenseRepository: Repository<Depense>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(Devis)
    private readonly devisRepository: Repository<Devis>,
  ) {}

  private async callFastApi(endpoint: string, file: Express.Multer.File) {
    const formData = new FormData();
    formData.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.fastapiUrl}/${endpoint}`, formData, {
          headers: formData.getHeaders()
        })
      );
      return response.data;
    } catch (error: any) {
      console.error(`Erreur lors de l'appel à ${endpoint}:`, error.response?.data || error.message);
      throw new HttpException(
        'Erreur lors de l’analyse par l’IA',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async ocrFacture(file: Express.Multer.File) {
    const data = await this.callFastApi('ocr-facture', file);
    // On fusionne les champs extraits + le score de confiance renvoye par FastAPI
    const record = {
      ...data.donnees_extraites,
      confidence_score: data.confidence_score,
      status: 'BROUILLON',
    };
    return await this.depenseRepository.save(this.depenseRepository.create(record));
  }

  async devisFromPlan(file: Express.Multer.File) {
    const data = await this.callFastApi('devis-from-plan', file);

    // 🔧 CORRECTION : avant, cette route ne sauvegardait rien en base.
    // Desormais on cree un enregistrement BROUILLON en Oracle, comme pour les factures,
    // afin que "valider-devis-plan" puisse ensuite le faire passer a VALIDE.
    const estimation = data.estimation_plan || {};
    const saved = await this.devisRepository.save(
      this.devisRepository.create({
        filename: data.filename,
        pieces_detectees: JSON.stringify(estimation.pieces_detectees || []),
        proposition_devis: JSON.stringify(estimation.proposition_devis || []),
        confidence_score: data.confidence_score ?? null,
        status: 'BROUILLON',
        date_creation: new Date(),
      })
    );

    // On renvoie au frontend la meme forme qu'avant (estimation_plan)
    // + l'id Oracle necessaire pour la validation ulterieure.
    return {
      ...data,
      estimation_plan: {
        ...estimation,
        id: saved.id,
      },
    };
  }

  async ocrBonDeLivraison(file: Express.Multer.File) {
    return await this.callFastApi('ocr-bl', file);
  }

  async validerFacture(body: any) {
    return await this.depenseRepository.update(body.id, { ...body, status: 'VALIDE' });
  }

  async validerDevisPlan(body: any) {
    if (!body.id) {
      throw new HttpException(
        "Impossible de valider : identifiant du devis manquant (id).",
        HttpStatus.BAD_REQUEST
      );
    }

    // 🔧 CORRECTION : cette methode faisait juste `return { status: "SUCCESS" }`
    // sans jamais toucher a la base. Desormais on persiste reellement les
    // eventuelles corrections humaines et on passe le statut a VALIDE.
    await this.devisRepository.update(body.id, {
      pieces_detectees: JSON.stringify(body.pieces_detectees || []),
      proposition_devis: JSON.stringify(body.proposition_devis || []),
      status: 'VALIDE',
    });

    return { status: 'SUCCESS' };
  }

  async validerEtIncrementerStock(data: any) {
    try {
      const articles = data.articles_livres || [];
      const results: { designation: string; status: string }[] = [];

      for (const article of articles) {
        const existing = await this.stockRepository.query(
          'SELECT * FROM STOCK WHERE DESIGNATION = :des',
          [article.designation]
        );

        if (existing && existing.length > 0) {
          const item = existing[0];
          const currentQty = Number(item.QUANTITE || item.quantite || 0);
          const newQty = currentQty + Number(article.quantite_livree);

          await this.stockRepository.query(
            'UPDATE STOCK SET QUANTITE = :qty, DERNIERE_MISE_A_JOUR = SYSDATE WHERE DESIGNATION = :des',
            [newQty, article.designation]
          );
          results.push({ designation: article.designation, status: 'UPDATED' });
        } else {
          await this.stockRepository.query(
            'INSERT INTO STOCK (DESIGNATION, QUANTITE, DERNIERE_MISE_A_JOUR, FOURNISSEUR) VALUES (:des, :qty, SYSDATE, :four)',
            [article.designation, Number(article.quantite_livree), data.fournisseur || 'Inconnu']
          );
          results.push({ designation: article.designation, status: 'CREATED' });
        }
      }
      return { status: 'SUCCESS', details: results };
    } catch (error: any) {
      console.error('Erreur SQL:', error);
      throw new HttpException('Erreur Oracle SQL: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 📊 Recupere les statistiques de performance IA (confiance moyenne, temps moyen...)
  // exposees par le microservice FastAPI (endpoint GET /api/ia/logs)
  async getLogs() {
    try {
      const response = await this.httpService.axiosRef.get(`${this.fastapiUrl}/logs`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur logs:', error.response?.data || error.message);
      throw new HttpException(
        'Impossible de récupérer les logs depuis le service IA',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}