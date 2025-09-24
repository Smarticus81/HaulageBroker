import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateLoadDto, UpdateLoadDto, LoadResponseDto, LoadsListResponseDto } from './dto';
import { LoadsRepository } from './loads.repository';

@Injectable()
export class LoadsService {
  constructor(private readonly loadsRepository: LoadsRepository) {}

  async createLoad(createLoadDto: CreateLoadDto): Promise<LoadResponseDto> {
    // Validate shipper exists
    const shipper = await this.loadsRepository.findShipperById(createLoadDto.shipper_id);
    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }

    // Validate equipment type
    const equipmentType = await this.loadsRepository.findEquipmentTypeByCode(createLoadDto.equipment_code);
    if (!equipmentType) {
      throw new BadRequestException('Invalid equipment type');
    }

    // Create load
    const load = await this.loadsRepository.createLoad(createLoadDto);
    
    // Emit load.created event
    await this.loadsRepository.emitEvent('load.created', {
      load_id: load.id,
      shipper_id: load.shipper_id,
      timestamp: new Date(),
    });

    return this.mapToResponseDto(load);
  }

  async getLoads(filters: {
    page: number;
    limit: number;
    status?: string;
    shipperId?: string;
  }): Promise<LoadsListResponseDto> {
    const { data, total } = await this.loadsRepository.getLoads(filters);
    
    return {
      data: data.map(load => this.mapToResponseDto(load)),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        total_pages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getLoad(id: string): Promise<LoadResponseDto> {
    const load = await this.loadsRepository.findLoadById(id);
    if (!load) {
      throw new NotFoundException('Load not found');
    }
    return this.mapToResponseDto(load);
  }

  async updateLoad(id: string, updateLoadDto: UpdateLoadDto): Promise<LoadResponseDto> {
    const load = await this.loadsRepository.findLoadById(id);
    if (!load) {
      throw new NotFoundException('Load not found');
    }

    const updatedLoad = await this.loadsRepository.updateLoad(id, updateLoadDto);
    return this.mapToResponseDto(updatedLoad);
  }

  async deleteLoad(id: string): Promise<void> {
    const load = await this.loadsRepository.findLoadById(id);
    if (!load) {
      throw new NotFoundException('Load not found');
    }

    await this.loadsRepository.deleteLoad(id);
  }

  async requestQuote(loadId: string): Promise<void> {
    const load = await this.loadsRepository.findLoadById(loadId);
    if (!load) {
      throw new NotFoundException('Load not found');
    }

    if (load.status !== 'created') {
      throw new BadRequestException('Quote can only be requested for created loads');
    }

    // Update load status to quoted
    await this.loadsRepository.updateLoadStatus(loadId, 'quoted');

    // Trigger pricing service
    await this.loadsRepository.emitEvent('load.quote_requested', {
      load_id: loadId,
      timestamp: new Date(),
    });
  }

  async createTender(loadId: string, tenderData: {
    carrier_id: string;
    price_usd: number;
    expires_at: string;
  }): Promise<string> {
    const load = await this.loadsRepository.findLoadById(loadId);
    if (!load) {
      throw new NotFoundException('Load not found');
    }

    if (load.status !== 'quoted') {
      throw new BadRequestException('Tender can only be created for quoted loads');
    }

    // Validate carrier exists
    const carrier = await this.loadsRepository.findCarrierById(tenderData.carrier_id);
    if (!carrier) {
      throw new NotFoundException('Carrier not found');
    }

    // Create tender
    const tender = await this.loadsRepository.createTender({
      load_id: loadId,
      carrier_id: tenderData.carrier_id,
      price_usd: tenderData.price_usd,
      expires_at: new Date(tenderData.expires_at),
    });

    // Update load status
    await this.loadsRepository.updateLoadStatus(loadId, 'tendered');

    return tender.id;
  }

  private mapToResponseDto(load: any): LoadResponseDto {
    return {
      id: load.id,
      shipper_id: load.shipper_id,
      origin: {
        name: load.origin_name,
        address: load.origin_address,
        city: load.origin_city,
        state: load.origin_state,
        zip: load.origin_zip,
        coordinates: load.origin_lat && load.origin_lng ? {
          lat: parseFloat(load.origin_lat),
          lng: parseFloat(load.origin_lng),
        } : undefined,
      },
      destination: {
        name: load.destination_name,
        address: load.destination_address,
        city: load.destination_city,
        state: load.destination_state,
        zip: load.destination_zip,
        coordinates: load.destination_lat && load.destination_lng ? {
          lat: parseFloat(load.destination_lat),
          lng: parseFloat(load.destination_lng),
        } : undefined,
      },
      commodity: load.commodity,
      weight_lbs: load.weight_lbs,
      equipment_code: load.equipment_code,
      pickup_earliest: load.pickup_earliest,
      delivery_latest: load.delivery_latest,
      service_level: load.service_level,
      special_requirements: load.special_requirements,
      status: load.status,
      created_at: load.created_at,
      updated_at: load.updated_at,
    };
  }
}
