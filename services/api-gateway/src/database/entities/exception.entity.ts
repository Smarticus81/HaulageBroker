import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Load } from './load.entity';

export type ExceptionType = 'delay' | 'damage' | 'dispute' | 'fraud' | 'compliance';
export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';

@Entity('exceptions')
export class Exception {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'load_id' })
  loadId: string;

  @Column({ name: 'exception_type', type: 'varchar', length: 20 })
  exceptionType: ExceptionType;

  @Column({ type: 'varchar', length: 10 })
  severity: ExceptionSeverity;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  resolved: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date;

  @ManyToOne(() => Load, (load) => load.exceptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'load_id' })
  load: Load;
}
