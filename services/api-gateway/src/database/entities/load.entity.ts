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
import { Shipper } from './shipper.entity';
import { EquipmentType } from './equipment-type.entity';
import { Quote } from './quote.entity';
import { Tender } from './tender.entity';
import { Award } from './award.entity';
import { Document } from './document.entity';
import { Invoice } from './invoice.entity';
import { Exception } from './exception.entity';

export type LoadStatus =
  | 'created'
  | 'quoted'
  | 'tendered'
  | 'awarded'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type ServiceLevel = 'standard' | 'expedited' | 'urgent';

@Entity('loads')
export class Load {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shipper_id' })
  shipperId: string;

  @Column({ name: 'origin_name', length: 255 })
  originName: string;

  @Column({ name: 'origin_address', length: 255 })
  originAddress: string;

  @Column({ name: 'origin_city', length: 100 })
  originCity: string;

  @Column({ name: 'origin_state', length: 50 })
  originState: string;

  @Column({ name: 'origin_zip', length: 20 })
  originZip: string;

  @Column({ name: 'origin_lat', type: 'decimal', precision: 10, scale: 8, nullable: true })
  originLat: number;

  @Column({ name: 'origin_lng', type: 'decimal', precision: 11, scale: 8, nullable: true })
  originLng: number;

  @Column({ name: 'destination_name', length: 255 })
  destinationName: string;

  @Column({ name: 'destination_address', length: 255 })
  destinationAddress: string;

  @Column({ name: 'destination_city', length: 100 })
  destinationCity: string;

  @Column({ name: 'destination_state', length: 50 })
  destinationState: string;

  @Column({ name: 'destination_zip', length: 20 })
  destinationZip: string;

  @Column({ name: 'destination_lat', type: 'decimal', precision: 10, scale: 8, nullable: true })
  destinationLat: number;

  @Column({ name: 'destination_lng', type: 'decimal', precision: 11, scale: 8, nullable: true })
  destinationLng: number;

  @Column({ length: 255, nullable: true })
  commodity: string;

  @Column({ name: 'weight_lbs', type: 'integer', nullable: true })
  weightLbs: number;

  @Column({ name: 'equipment_code', length: 10, nullable: true })
  equipmentCode: string;

  @Column({ name: 'pickup_earliest', type: 'timestamptz', nullable: true })
  pickupEarliest: Date;

  @Column({ name: 'delivery_latest', type: 'timestamptz', nullable: true })
  deliveryLatest: Date;

  @Column({ name: 'service_level', type: 'varchar', length: 20, default: 'standard' })
  serviceLevel: ServiceLevel;

  @Column({ name: 'special_requirements', type: 'text', array: true, nullable: true })
  specialRequirements: string[];

  @Column({ type: 'varchar', length: 20, default: 'created' })
  status: LoadStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Shipper, (shipper) => shipper.loads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipper_id' })
  shipper: Shipper;

  @ManyToOne(() => EquipmentType, (equipment) => equipment.loads)
  @JoinColumn({ name: 'equipment_code' })
  equipmentType: EquipmentType;

  @OneToMany(() => Quote, (quote) => quote.load)
  quotes: Quote[];

  @OneToMany(() => Tender, (tender) => tender.load)
  tenders: Tender[];

  @OneToMany(() => Award, (award) => award.load)
  awards: Award[];

  @OneToMany(() => Document, (document) => document.load)
  documents: Document[];

  @OneToMany(() => Invoice, (invoice) => invoice.load)
  invoices: Invoice[];

  @OneToMany(() => Exception, (exception) => exception.load)
  exceptions: Exception[];
}
