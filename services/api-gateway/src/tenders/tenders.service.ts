import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tender, TenderStatus } from '../database/entities/tender.entity';
import { Load } from '../database/entities/load.entity';
import { Carrier } from '../database/entities/carrier.entity';
import { Award } from '../database/entities/award.entity';
import { Driver } from '../database/entities/driver.entity';
import { Event } from '../database/entities/event.entity';
import { CreateTenderDto, TenderResponseDto, AcceptTenderDto, AwardResponseDto } from './dto';

@Injectable()
export class TendersService {
  constructor(
    @InjectRepository(Tender)
    private readonly tenderRepository: Repository<Tender>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Carrier)
    private readonly carrierRepository: Repository<Carrier>,
    @InjectRepository(Award)
    private readonly awardRepository: Repository<Award>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(dto: CreateTenderDto): Promise<TenderResponseDto> {
    const load = await this.loadRepository.findOne({ where: { id: dto.loadId } });
    if (!load) {
      throw new NotFoundException('Load not found');
    }

    const carrier = await this.carrierRepository.findOne({ where: { id: dto.carrierId } });
    if (!carrier) {
      throw new NotFoundException('Carrier not found');
    }

    // Check if tender already exists for this load/carrier combo
    const existing = await this.tenderRepository.findOne({
      where: { loadId: dto.loadId, carrierId: dto.carrierId, status: 'sent' },
    });
    if (existing) {
      throw new BadRequestException('Active tender already exists for this load and carrier');
    }

    const tender = this.tenderRepository.create({
      loadId: dto.loadId,
      carrierId: dto.carrierId,
      priceUsd: dto.priceUsd,
      expiresAt: new Date(dto.expiresAt),
      status: 'sent',
    });

    await this.tenderRepository.save(tender);

    // Update load status
    if (load.status === 'quoted') {
      load.status = 'tendered';
      await this.loadRepository.save(load);
    }

    // Emit event
    await this.emitEvent('tender.created', tender.id, {
      loadId: dto.loadId,
      carrierId: dto.carrierId,
      priceUsd: dto.priceUsd,
    });

    return this.mapToResponse(tender, carrier);
  }

  async findAll(filters: {
    page: number;
    limit: number;
    loadId?: string;
    carrierId?: string;
    status?: string;
  }) {
    const where: any = {};
    if (filters.loadId) where.loadId = filters.loadId;
    if (filters.carrierId) where.carrierId = filters.carrierId;
    if (filters.status) where.status = filters.status;

    const [data, total] = await this.tenderRepository.findAndCount({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      order: { createdAt: 'DESC' },
      relations: ['carrier', 'load'],
    });

    return {
      data: data.map(t => this.mapToResponse(t, t.carrier)),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findOne(id: string): Promise<TenderResponseDto> {
    const tender = await this.tenderRepository.findOne({
      where: { id },
      relations: ['carrier', 'load'],
    });
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }
    return this.mapToResponse(tender, tender.carrier);
  }

  async findByLoad(loadId: string): Promise<TenderResponseDto[]> {
    const tenders = await this.tenderRepository.find({
      where: { loadId },
      relations: ['carrier'],
      order: { createdAt: 'DESC' },
    });
    return tenders.map(t => this.mapToResponse(t, t.carrier));
  }

  async findByCarrier(carrierId: string): Promise<TenderResponseDto[]> {
    const tenders = await this.tenderRepository.find({
      where: { carrierId },
      relations: ['load'],
      order: { createdAt: 'DESC' },
    });
    return tenders.map(t => this.mapToResponse(t));
  }

  async accept(id: string, dto: AcceptTenderDto): Promise<AwardResponseDto> {
    const tender = await this.tenderRepository.findOne({
      where: { id },
      relations: ['load', 'carrier'],
    });
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    if (tender.status !== 'sent') {
      throw new BadRequestException('Tender is not in sent status');
    }

    if (new Date() > tender.expiresAt) {
      tender.status = 'expired';
      await this.tenderRepository.save(tender);
      throw new BadRequestException('Tender has expired');
    }

    const driver = await this.driverRepository.findOne({
      where: { id: dto.driverId, carrierId: tender.carrierId },
    });
    if (!driver) {
      throw new NotFoundException('Driver not found or does not belong to carrier');
    }

    // Update tender status
    tender.status = 'accepted';
    await this.tenderRepository.save(tender);

    // Decline other pending tenders for this load
    await this.tenderRepository.update(
      { loadId: tender.loadId, status: 'sent' },
      { status: 'declined' },
    );

    // Create award
    const award = this.awardRepository.create({
      tenderId: tender.id,
      loadId: tender.loadId,
      carrierId: tender.carrierId,
      driverId: dto.driverId,
      pickupInstructions: dto.pickupInstructions,
      deliveryInstructions: dto.deliveryInstructions,
    });
    await this.awardRepository.save(award);

    // Update load status
    tender.load.status = 'awarded';
    await this.loadRepository.save(tender.load);

    // Emit event
    await this.emitEvent('tender.accepted', tender.id, {
      awardId: award.id,
      driverId: dto.driverId,
    });

    return {
      id: award.id,
      tenderId: tender.id,
      loadId: tender.loadId,
      carrierId: tender.carrierId,
      driverId: dto.driverId,
      priceUsd: Number(tender.priceUsd),
      pickupInstructions: award.pickupInstructions,
      deliveryInstructions: award.deliveryInstructions,
      awardedAt: award.awardedAt,
      carrier: {
        id: tender.carrier.id,
        name: tender.carrier.name,
        mcNumber: tender.carrier.mcNumber,
      },
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
      },
    };
  }

  async decline(id: string): Promise<TenderResponseDto> {
    const tender = await this.tenderRepository.findOne({
      where: { id },
      relations: ['carrier'],
    });
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    if (tender.status !== 'sent') {
      throw new BadRequestException('Tender is not in sent status');
    }

    tender.status = 'declined';
    await this.tenderRepository.save(tender);

    await this.emitEvent('tender.declined', tender.id, {});

    return this.mapToResponse(tender, tender.carrier);
  }

  private async emitEvent(eventType: string, aggregateId: string, data: Record<string, any>) {
    const event = this.eventRepository.create({
      aggregateId,
      aggregateType: 'tender',
      eventType,
      eventData: { ...data, timestamp: new Date() },
    });
    await this.eventRepository.save(event);
  }

  private mapToResponse(tender: Tender, carrier?: Carrier): TenderResponseDto {
    return {
      id: tender.id,
      loadId: tender.loadId,
      carrierId: tender.carrierId,
      priceUsd: Number(tender.priceUsd),
      status: tender.status,
      expiresAt: tender.expiresAt,
      createdAt: tender.createdAt,
      updatedAt: tender.updatedAt,
      carrier: carrier ? {
        id: carrier.id,
        name: carrier.name,
        mcNumber: carrier.mcNumber,
        trustScore: carrier.trustScore,
      } : undefined,
    };
  }
}
