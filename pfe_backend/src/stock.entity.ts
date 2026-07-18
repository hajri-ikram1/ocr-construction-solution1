import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('STOCK') 
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  designation: string;

  @Column({ type: 'number', default: 0 })
  quantite: number;

  @Column({ type: 'timestamp', nullable: true })
  derniere_mise_a_jour: Date;

  @Column({ nullable: true })
  fournisseur: string;
}