import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Driver } from './driver.entity';
import { Tender } from './tender.entity';
import { Invoice } from './invoice.entity';
import { Payout } from './payout.entity';

@Entity('carriers')
export class Carrier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mc_number', length: 20, unique: true })
  mcNumber: string;

  @Column({ name: 'dot_number', length: 20, unique: true })
  dotNumber: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ name: 'address_street', length: 255, nullable: true })
  addressStreet: string;

  @Column({ name: 'address_city', length: 100, nullable: true })
  addressCity: string;

  @Column({ name: 'address_state', length: 50, nullable: true })
  addressState: string;

  @Column({ name: 'address_zip', length: 20, nullable: true })
  addressZip: string;

  @Column({ name: 'address_country', length: 2, default: 'US' })
  addressCountry: string;

  @Column({ name: 'equipment_types', type: 'text', array: true, nullable: true })
  equipmentTypes: string[];

  @Column({ name: 'insurance_liability', type: 'decimal', precision: 12, scale: 2, nullable: true })
  insuranceLiability: number;

  @Column({ name: 'insurance_cargo', type: 'decimal', precision: 12, scale: 2, nullable: true })
  insuranceCargo: number;

  @Column({ name: 'insurance_general', type: 'decimal', precision: 12, scale: 2, nullable: true })
  insuranceGeneral: number;

  @Column({ name: 'insurance_expiration', type: 'date', nullable: true })
  insuranceExpiration: Date;

  @Column({ name: 'trust_score', type: 'integer', default: 0 })
  trustScore: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Driver, (driver) => driver.carrier)
  drivers: Driver[];

  @OneToMany(() => Tender, (tender) => tender.carrier)
  tenders: Tender[];

  @OneToMany(() => Invoice, (invoice) => invoice.carrier)
  invoices: Invoice[];

  @OneToMany(() => Payout, (payout) => payout.carrier)
  payouts: Payout[];
}
