import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tender } from './tender.entity';
import { Load } from './load.entity';
import { Carrier } from './carrier.entity';
import { Driver } from './driver.entity';

@Entity('awards')
export class Award {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tender_id' })
  tenderId: string;

  @Column({ name: 'load_id' })
  loadId: string;

  @Column({ name: 'carrier_id' })
  carrierId: string;

  @Column({ name: 'driver_id' })
  driverId: string;

  @CreateDateColumn({ name: 'awarded_at', type: 'timestamptz' })
  awardedAt: Date;

  @Column({ name: 'pickup_instructions', type: 'text', nullable: true })
  pickupInstructions: string;

  @Column({ name: 'delivery_instructions', type: 'text', nullable: true })
  deliveryInstructions: string;

  @ManyToOne(() => Tender, (tender) => tender.awards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tender_id' })
  tender: Tender;

  @ManyToOne(() => Load, (load) => load.awards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'load_id' })
  load: Load;

  @ManyToOne(() => Carrier, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrier_id' })
  carrier: Carrier;

  @ManyToOne(() => Driver, (driver) => driver.awards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;
}
