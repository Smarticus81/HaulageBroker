import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Load } from './load.entity';

@Entity('equipment_types')
export class EquipmentType {
  @PrimaryColumn({ length: 10 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'max_weight', type: 'integer', nullable: true })
  maxWeight: number;

  @Column({ name: 'max_length', type: 'decimal', precision: 8, scale: 2, nullable: true })
  maxLength: number;

  @Column({ name: 'max_width', type: 'decimal', precision: 8, scale: 2, nullable: true })
  maxWidth: number;

  @Column({ name: 'max_height', type: 'decimal', precision: 8, scale: 2, nullable: true })
  maxHeight: number;

  @OneToMany(() => Load, (load) => load.equipmentType)
  loads: Load[];
}
