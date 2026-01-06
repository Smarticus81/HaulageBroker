import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Load } from './load.entity';
import { Carrier } from './carrier.entity';
import { Payout } from './payout.entity';

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'disputed';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'load_id' })
  loadId: string;

  @Column({ name: 'carrier_id' })
  carrierId: string;

  @Column({ name: 'amount_usd', type: 'decimal', precision: 12, scale: 2 })
  amountUsd: number;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: InvoiceStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date;

  @ManyToOne(() => Load, (load) => load.invoices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'load_id' })
  load: Load;

  @ManyToOne(() => Carrier, (carrier) => carrier.invoices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrier_id' })
  carrier: Carrier;

  @OneToMany(() => Payout, (payout) => payout.invoice)
  payouts: Payout[];
}
