import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType } from '../database/entities/document.entity';
import { Load } from '../database/entities/load.entity';
import { CreateDocumentDto, DocumentResponseDto } from './dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  async create(dto: CreateDocumentDto, userId: string): Promise<DocumentResponseDto> {
    const load = await this.loadRepository.findOne({ where: { id: dto.loadId } });
    if (!load) {
      throw new NotFoundException('Load not found');
    }

    const document = this.documentRepository.create({
      loadId: dto.loadId,
      type: dto.type as DocumentType,
      filename: dto.filename,
      url: dto.url,
      uploadedBy: userId,
    });

    await this.documentRepository.save(document);

    // If POD is uploaded and load is in transit, update to delivered
    if (dto.type === 'pod' && load.status === 'in_transit') {
      load.status = 'delivered';
      await this.loadRepository.save(load);
    }

    return this.mapToResponse(document);
  }

  async findAll(filters: { page: number; limit: number; loadId?: string; type?: string }) {
    const where: any = {};
    if (filters.loadId) where.loadId = filters.loadId;
    if (filters.type) where.type = filters.type;

    const [data, total] = await this.documentRepository.findAndCount({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      order: { uploadedAt: 'DESC' },
    });

    return {
      data: data.map(d => this.mapToResponse(d)),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findOne(id: string): Promise<DocumentResponseDto> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return this.mapToResponse(document);
  }

  async findByLoad(loadId: string): Promise<DocumentResponseDto[]> {
    const documents = await this.documentRepository.find({
      where: { loadId },
      order: { uploadedAt: 'DESC' },
    });
    return documents.map(d => this.mapToResponse(d));
  }

  async verify(id: string): Promise<DocumentResponseDto> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.verified = true;
    await this.documentRepository.save(document);
    return this.mapToResponse(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    await this.documentRepository.remove(document);
  }

  private mapToResponse(document: Document): DocumentResponseDto {
    return {
      id: document.id,
      loadId: document.loadId,
      type: document.type,
      filename: document.filename,
      url: document.url,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.uploadedAt,
      verified: document.verified,
    };
  }
}
