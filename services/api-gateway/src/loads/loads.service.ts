import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load, LoadStatus } from '../database/entities/load.entity';
import { Shipper } from '../database/entities/shipper.entity';
import { Carrier } from '../database/entities/carrier.entity';
import { EquipmentType } from '../database/entities/equipment-type.entity';
import { Tender } from '../database/entities/tender.entity';
import { Event } from '../database/entities/event.entity';
import { CreateLoadDto, UpdateLoadDto, LoadResponseDto, LoadsListResponseDto } from './dto';

@Injectable()
export class LoadsService {
  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Shipper)
    private readonly shipperRepository: Repository<Shipper>,
    @InjectRepository(Carrier)
    private readonly carrierRepository: Repository<Carrier>,
    @InjectRepository(EquipmentType)
    private readonly equipmentRepository: Repository<EquipmentType>,
    @InjectRepository(Tender)
    private readonly tenderRepository: Repository<Tender>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async createLoad(createLoadDto: CreateLoadDto): Promise<LoadResponseDto> {
    // Validate shipper exists
    const shipper = await this.shipperRepository.findOne({
      where: { id: createLoadDto.shipper_id },
    });
    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }

    // Create load
    const load = this.loadRepository.create({
      shipperId: createLoadDto.shipper_id,
      originName: createLoadDto.origin.name,
      originAddress: createLoadDto.origin.address,
      originCity: createLoadDto.origin.city,
      originState: createLoadDto.origin.state,
      originZip: createLoadDto.origin.zip,
      originLat: createLoadDto.origin.coordinates?.lat,
      originLng: createLoadDto.origin.coordinates?.lng,
      destinationName: createLoadDto.destination.name,
      destinationAddress: createLoadDto.destination.address,
      destinationCity: createLoadDto.destination.city,
      destinationState: createLoadDto.destination.state,
      destinationZip: createLoadDto.destination.zip,
      destinationLat: createLoadDto.destination.coordinates?.lat,
      destinationLng: createLoadDto.destination.coordinates?.lng,
      commodity: createLoadDto.commodity,
      weightLbs: createLoadDto.weight_lbs,
      equipmentCode: createLoadDto.equipment_code,
      pickupEarliest: createLoadDto.pickup_earliest ? new Date(createLoadDto.pickup_earliest) : null,
      deliveryLatest: createLoadDto.delivery_latest ? new Date(createLoadDto.delivery_latest) : null,
      serviceLevel: createLoadDto.service_level || 'standard',
      specialRequirements: createLoadDto.special_requirements,
      status: 'created',
    });

    await this.loadRepository.save(load);

    // Emit load.created event
    await this.emitEvent('load.created', load.id, {
      shipper_id: load.shipperId,
    });

    return this.mapToResponseDto(load);
  }

  async getLoads(filters: {
    page: number;
    limit: number;
    status?: string;
    shipperId?: string;
  }): Promise<LoadsListResponseDto> {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.shipperId) where.shipperId = filters.shipperId;

    const [data, total] = await this.loadRepository.findAndCount({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: data.map((load) => this.mapToResponseDto(load)),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        total_pages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getLoad(id: string): Promise<LoadResponseDto> {
    const load = await this.loadRepository.findOne({ where: { id } });
    if (!load) {
      throw new NotFoundException('Load not found');
    }
    return this.mapToResponseDto(load);
  }

  async updateLoad(id: string, updateLoadDto: UpdateLoadDto): Promise<LoadResponseDto> {
    const load = await this.loadRepository.findOne({ where: { id } });
    if (!load) {
      throw new NotFoundException('Load not found');
    }

    if (updateLoadDto.origin) {
      load.originName = updateLoadDto.origin.name;
      load.originAddress = updateLoadDto.origin.address;
      load.originCity = updateLoadDto.origin.city;
      load.originState = updateLoadDto.origin.state;
      load.originZip = updateLoadDto.origin.zip;
      if (updateLoadDto.origin.coordinates) {
        load.originLat = updateLoadDto.origin.coordinates.lat;
        load.originLng = updateLoadDto.origin.coordinates.lng;
      }
    }

    if (updateLoadDto.destination) {
      load.destinationName = updateLoadDto.destination.name;
      load.destinationAddress = updateLoadDto.destination.address;
      load.destinationCity = updateLoadDto.destination.city;
      load.destinationState = updateLoadDto.destination.state;
      load.destinationZip = updateLoadDto.destination.zip;
      if (updateLoadDto.destination.coordinates) {
        load.destinationLat = updateLoadDto.destination.coordinates.lat;
        load.destinationLng = updateLoadDto.destination.coordinates.lng;
      }
    }

    if (updateLoadDto.commodity !== undefined) load.commodity = updateLoadDto.commodity;
    if (updateLoadDto.weight_lbs !== undefined) load.weightLbs = updateLoadDto.weight_lbs;
    if (updateLoadDto.equipment_code) load.equipmentCode = updateLoadDto.equipment_code;
    if (updateLoadDto.pickup_earliest) load.pickupEarliest = new Date(updateLoadDto.pickup_earliest);
    if (updateLoadDto.delivery_latest) load.deliveryLatest = new Date(updateLoadDto.delivery_latest);
    if (updateLoadDto.service_level) load.serviceLevel = updateLoadDto.service_level;
    if (updateLoadDto.special_requirements) load.specialRequirements = updateLoadDto.special_requirements;
    if (updateLoadDto.status) load.status = updateLoadDto.status as LoadStatus;

    await this.loadRepository.save(load);
    return this.mapToResponseDto(load);
  }

  async deleteLoad(id: string): Promise<void> {
    const load = await this.loadRepository.findOne({ where: { id } });
    if (!load) {
      throw new NotFoundException('Load not found');
    }
    await this.loadRepository.remove(load);
  }

  async requestQuote(loadId: string): Promise<void> {
    const load = await this.loadRepository.findOne({ where: { id: loadId } });
    if (!load) {
      throw new NotFoundException('Load not found');
    }

    if (load.status !== 'created') {
      throw new BadRequestException('Quote can only be requested for created loads');
    }

    load.status = 'quoted';
    await this.loadRepository.save(load);

    await this.emitEvent('load.quote_requested', loadId, {});
  }

  async createTender(
    loadId: string,
    tenderData: { carrier_id: string; price_usd: number; expires_at: string },
  ): Promise<string> {
    const load = await this.loadRepository.findOne({ where: { id: loadId } });
    if (!load) {
      throw new NotFoundException('Load not found');
    }

    if (load.status !== 'quoted') {
      throw new BadRequestException('Tender can only be created for quoted loads');
    }

    const carrier = await this.carrierRepository.findOne({
      where: { id: tenderData.carrier_id },
    });
    if (!carrier) {
      throw new NotFoundException('Carrier not found');
    }

    const tender = this.tenderRepository.create({
      loadId,
      carrierId: tenderData.carrier_id,
      priceUsd: tenderData.price_usd,
      expiresAt: new Date(tenderData.expires_at),
      status: 'sent',
    });

    await this.tenderRepository.save(tender);

    load.status = 'tendered';
    await this.loadRepository.save(load);

    return tender.id;
  }

  private async emitEvent(eventType: string, aggregateId: string, data: Record<string, any>) {
    const event = this.eventRepository.create({
      aggregateId,
      aggregateType: 'load',
      eventType,
      eventData: { ...data, timestamp: new Date() },
    });
    await this.eventRepository.save(event);
  }

  private mapToResponseDto(load: Load): LoadResponseDto {
    return {
      id: load.id,
      shipper_id: load.shipperId,
      origin: {
        name: load.originName,
        address: load.originAddress,
        city: load.originCity,
        state: load.originState,
        zip: load.originZip,
        coordinates:
          load.originLat && load.originLng
            ? {
                lat: Number(load.originLat),
                lng: Number(load.originLng),
              }
            : undefined,
      },
      destination: {
        name: load.destinationName,
        address: load.destinationAddress,
        city: load.destinationCity,
        state: load.destinationState,
        zip: load.destinationZip,
        coordinates:
          load.destinationLat && load.destinationLng
            ? {
                lat: Number(load.destinationLat),
                lng: Number(load.destinationLng),
              }
            : undefined,
      },
      commodity: load.commodity,
      weight_lbs: load.weightLbs,
      equipment_code: load.equipmentCode,
      pickup_earliest: load.pickupEarliest,
      delivery_latest: load.deliveryLatest,
      service_level: load.serviceLevel,
      special_requirements: load.specialRequirements,
      status: load.status,
      created_at: load.createdAt,
      updated_at: load.updatedAt,
    };
  }
}
