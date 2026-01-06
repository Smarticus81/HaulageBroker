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
import { Carrier } from './carrier.entity';
import { Award } from './award.entity';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'carrier_id' })
  carrierId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'license_number', length: 50, unique: true })
  licenseNumber: string;

  @Column({ name: 'cdl_class', length: 10, nullable: true })
  cdlClass: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Carrier, (carrier) => carrier.drivers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrier_id' })
  carrier: Carrier;

  @OneToMany(() => Award, (award) => award.driver)
  awards: Award[];
}
