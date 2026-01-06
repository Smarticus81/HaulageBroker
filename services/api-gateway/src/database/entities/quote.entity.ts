import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Load } from './load.entity';

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'load_id' })
  loadId: string;

  @Column({ name: 'price_usd', type: 'decimal', precision: 12, scale: 2 })
  priceUsd: number;

  @Column({ name: 'fuel_index', type: 'decimal', precision: 6, scale: 3, nullable: true })
  fuelIndex: number;

  @Column({ length: 255, nullable: true })
  basis: string;

  @Column({ name: 'valid_until', type: 'timestamptz' })
  validUntil: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Load, (load) => load.quotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'load_id' })
  load: Load;
}
