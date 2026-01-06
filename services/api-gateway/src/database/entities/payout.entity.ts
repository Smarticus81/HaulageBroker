import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Carrier } from './carrier.entity';
import { Invoice } from './invoice.entity';

export type PayoutMethod = 'ach' | 'rtp' | 'wire' | 'check';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'carrier_id' })
  carrierId: string;

  @Column({ name: 'invoice_id', nullable: true })
  invoiceId: string;

  @Column({ name: 'amount_usd', type: 'decimal', precision: 12, scale: 2 })
  amountUsd: number;

  @Column({ type: 'varchar', length: 10 })
  method: PayoutMethod;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: PayoutStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @ManyToOne(() => Carrier, (carrier) => carrier.payouts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrier_id' })
  carrier: Carrier;

  @ManyToOne(() => Invoice, (invoice) => invoice.payouts, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
