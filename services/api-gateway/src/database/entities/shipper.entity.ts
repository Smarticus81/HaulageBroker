import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Load } from './load.entity';

@Entity('shippers')
export class Shipper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Load, (load) => load.shipper)
  loads: Load[];
}
