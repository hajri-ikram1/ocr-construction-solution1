import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('DEPENSES') 
export class Depense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  fournisseur: string;

  @Column({ nullable: true })
  date_facture: string;

  @Column({ nullable: true })
  numero_facture: string;

  @Column({ nullable: true })
  total_ht: string;

  @Column({ nullable: true })
  tva_taux: string;

  @Column({ nullable: true })
  total_ttc: string;


  @Column({ type: 'simple-json', nullable: true })
references_produits: any;

  @Column({ default: 'BROUILLON' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}