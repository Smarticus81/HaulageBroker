import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Load } from './load.entity';

export type DocumentType = 'bol' | 'pod' | 'invoice' | 'rate_confirmation' | 'insurance_certificate';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'load_id' })
  loadId: string;

  @Column({ type: 'varchar', length: 30 })
  type: DocumentType;

  @Column({ length: 255 })
  filename: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt: Date;

  @Column({ default: false })
  verified: boolean;

  @ManyToOne(() => Load, (load) => load.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'load_id' })
  load: Load;
}
