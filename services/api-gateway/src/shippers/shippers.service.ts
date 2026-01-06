import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Shipper } from '../database/entities/shipper.entity';
import { CreateShipperDto, UpdateShipperDto, ShipperResponseDto } from './dto';

@Injectable()
export class ShippersService {
  constructor(
    @InjectRepository(Shipper)
    private readonly shipperRepository: Repository<Shipper>,
  ) {}

  async create(createShipperDto: CreateShipperDto): Promise<ShipperResponseDto> {
    const existing = await this.shipperRepository.findOne({
      where: { email: createShipperDto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const shipper = this.shipperRepository.create({
      name: createShipperDto.name,
      email: createShipperDto.email,
      phone: createShipperDto.phone,
      addressStreet: createShipperDto.address?.street,
      addressCity: createShipperDto.address?.city,
      addressState: createShipperDto.address?.state,
      addressZip: createShipperDto.address?.zip,
      addressCountry: createShipperDto.address?.country || 'US',
    });

    await this.shipperRepository.save(shipper);
    return this.mapToResponse(shipper);
  }

  async findAll(filters: { page: number; limit: number; search?: string }) {
    const where: any = {};

    if (filters.search) {
      where.name = Like(`%${filters.search}%`);
    }

    const [data, total] = await this.shipperRepository.findAndCount({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      order: { name: 'ASC' },
    });

    return {
      data: data.map(s => this.mapToResponse(s)),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findOne(id: string): Promise<ShipperResponseDto> {
    const shipper = await this.shipperRepository.findOne({ where: { id } });
    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }
    return this.mapToResponse(shipper);
  }

  async update(id: string, updateShipperDto: UpdateShipperDto): Promise<ShipperResponseDto> {
    const shipper = await this.shipperRepository.findOne({ where: { id } });
    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }

    if (updateShipperDto.name) shipper.name = updateShipperDto.name;
    if (updateShipperDto.email) shipper.email = updateShipperDto.email;
    if (updateShipperDto.phone) shipper.phone = updateShipperDto.phone;
    if (updateShipperDto.address) {
      shipper.addressStreet = updateShipperDto.address.street;
      shipper.addressCity = updateShipperDto.address.city;
      shipper.addressState = updateShipperDto.address.state;
      shipper.addressZip = updateShipperDto.address.zip;
      if (updateShipperDto.address.country) shipper.addressCountry = updateShipperDto.address.country;
    }

    await this.shipperRepository.save(shipper);
    return this.mapToResponse(shipper);
  }

  async remove(id: string): Promise<void> {
    const shipper = await this.shipperRepository.findOne({ where: { id } });
    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }
    await this.shipperRepository.remove(shipper);
  }

  async getLoads(id: string) {
    const shipper = await this.shipperRepository.findOne({
      where: { id },
      relations: ['loads'],
    });
    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }
    return shipper.loads || [];
  }

  private mapToResponse(shipper: Shipper): ShipperResponseDto {
    return {
      id: shipper.id,
      name: shipper.name,
      email: shipper.email,
      phone: shipper.phone,
      address: {
        street: shipper.addressStreet,
        city: shipper.addressCity,
        state: shipper.addressState,
        zip: shipper.addressZip,
        country: shipper.addressCountry,
      },
      createdAt: shipper.createdAt,
      updatedAt: shipper.updatedAt,
    };
  }
}
