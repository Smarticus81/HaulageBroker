import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Load } from './load.entity';
import { Carrier } from './carrier.entity';
import { Award } from './award.entity';

export type TenderStatus = 'sent' | 'accepted' | 'declined' | 'expired';

@Entity('tenders')
export class Tender {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'load_id' })
  loadId: string;

  @Column({ name: 'carrier_id' })
  carrierId: string;

  @Column({ name: 'price_usd', type: 'decimal', precision: 12, scale: 2 })
  priceUsd: number;

  @Column({ type: 'varchar', length: 20, default: 'sent' })
  status: TenderStatus;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Load, (load) => load.tenders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'load_id' })
  load: Load;

  @ManyToOne(() => Carrier, (carrier) => carrier.tenders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrier_id' })
  carrier: Carrier;

  @OneToMany(() => Award, (award) => award.tender)
  awards: Award[];
}
