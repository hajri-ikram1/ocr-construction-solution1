import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('DEVIS')
export class Devis {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'FILENAME', nullable: true })
  filename: string;

  @Column({ name: 'PIECES_DETECTEES', type: 'clob', nullable: true })
  pieces_detectees: string;

  @Column({ name: 'PROPOSITION_DEVIS', type: 'clob', nullable: true })
  proposition_devis: string;

  @Column({ name: 'CONFIDENCE_SCORE', type: 'number', nullable: true })
  confidence_score: number;

  @Column({ name: 'STATUS', default: 'BROUILLON' })
  status: string;

  @Column({ name: 'DATE_CREATION', type: 'timestamp', nullable: true })
  date_creation: Date;
}