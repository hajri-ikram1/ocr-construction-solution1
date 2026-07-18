import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as oracledb from 'oracledb';

async function bootstrap() {
  try {
    oracledb.initOracleClient(); 
    console.log("💎 [Oracle Driver] Thick Mode activé avec succès !");
  } catch (err: any) {
    console.error("⚠️ [Oracle Driver Warning] Thick Mode introuvable...", err.message);
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // 🌟 SÉCURISATION : On commente le Flush pour ne pas effacer la table à chaque reload ! 🌟
  /*
  const dataSource = app.get(DataSource);
  try {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      console.log("🧹 [Oracle DB] Nettoyage de l'ancienne table...");
      await queryRunner.query(`DROP TABLE DEPENSES CASCADE CONSTRAINTS`);
      await queryRunner.query(`DROP SEQUENCE DEPENSES_SEQ`);
    } catch (e) {}

    console.log("🏗️ [Oracle DB] Création de la table DEPENSES propre...");
    await queryRunner.query(`
      CREATE TABLE DEPENSES (
        "id" NUMBER PRIMARY KEY,
        "fournisseur" VARCHAR2(255),
        "date_facture" VARCHAR2(255),
        "numero_facture" VARCHAR2(255),
        "total_ht" VARCHAR2(255),
        "tva_taux" VARCHAR2(255),
        "total_ttc" VARCHAR2(255),
        "references_produits" CLOB, 
        "status" VARCHAR2(255) DEFAULT 'BROUILLON',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`CREATE SEQUENCE DEPENSES_SEQ START WITH 1 INCREMENT BY 1`);
    await queryRunner.query(`
      CREATE OR REPLACE TRIGGER DEPENSES_TRG
      BEFORE INSERT ON DEPENSES
      FOR EACH ROW
      BEGIN
        IF :NEW."id" IS NULL THEN
          SELECT DEPENSES_SEQ.NEXTVAL INTO :NEW."id" FROM DUAL;
        END IF;
      END;
    `);

    console.log("✅ [Oracle DB] Table DEPENSES et Séquence créées proprement !");
    await queryRunner.release();
  } catch (dbError: any) {
    console.error("❌ [Oracle Init Error] :", dbError.message);
  }
  */

  await app.listen(3000);
  console.log('🚀 Gateway NestJS en marche sur : http://localhost:3000');
}
bootstrap();