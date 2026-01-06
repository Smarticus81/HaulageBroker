import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThanOrEqual } from 'typeorm';
import { Carrier } from '../database/entities/carrier.entity';
import { Driver } from '../database/entities/driver.entity';
import { CreateCarrierDto, UpdateCarrierDto, CarrierResponseDto, CreateDriverDto, DriverResponseDto } from './dto';

@Injectable()
export class CarriersService {
  constructor(
    @InjectRepository(Carrier)
    private readonly carrierRepository: Repository<Carrier>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  async create(createCarrierDto: CreateCarrierDto): Promise<CarrierResponseDto> {
    const existingMc = await this.carrierRepository.findOne({
      where: { mcNumber: createCarrierDto.mcNumber },
    });
    if (existingMc) {
      throw new BadRequestException('MC number already exists');
    }

    const existingDot = await this.carrierRepository.findOne({
      where: { dotNumber: createCarrierDto.dotNumber },
    });
    if (existingDot) {
      throw new BadRequestException('DOT number already exists');
    }

    const carrier = this.carrierRepository.create({
      mcNumber: createCarrierDto.mcNumber,
      dotNumber: createCarrierDto.dotNumber,
      name: createCarrierDto.name,
      email: createCarrierDto.email,
      phone: createCarrierDto.phone,
      addressStreet: createCarrierDto.address?.street,
      addressCity: createCarrierDto.address?.city,
      addressState: createCarrierDto.address?.state,
      addressZip: createCarrierDto.address?.zip,
      addressCountry: createCarrierDto.address?.country || 'US',
      equipmentTypes: createCarrierDto.equipmentTypes,
      insuranceLiability: createCarrierDto.insurance?.liability,
      insuranceCargo: createCarrierDto.insurance?.cargo,
      insuranceGeneral: createCarrierDto.insurance?.general,
      insuranceExpiration: createCarrierDto.insurance?.expiration,
      trustScore: createCarrierDto.trustScore || 50,
    });

    await this.carrierRepository.save(carrier);
    return this.mapToResponse(carrier);
  }

  async findAll(filters: {
    page: number;
    limit: number;
    equipment?: string;
    minScore?: number;
  }) {
    const where: any = {};

    if (filters.minScore) {
      where.trustScore = MoreThanOrEqual(filters.minScore);
    }

    const [data, total] = await this.carrierRepository.findAndCount({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      order: { trustScore: 'DESC', name: 'ASC' },
    });

    let filteredData = data;
    if (filters.equipment) {
      filteredData = data.filter(c =>
        c.equipmentTypes?.some(eq =>
          eq.toLowerCase().includes(filters.equipment.toLowerCase())
        )
      );
    }

    return {
      data: filteredData.map(c => this.mapToResponse(c)),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findOne(id: string): Promise<CarrierResponseDto> {
    const carrier = await this.carrierRepository.findOne({ where: { id } });
    if (!carrier) {
      throw new NotFoundException('Carrier not found');
    }
    return this.mapToResponse(carrier);
  }

  async update(id: string, updateCarrierDto: UpdateCarrierDto): Promise<CarrierResponseDto> {
    const carrier = await this.carrierRepository.findOne({ where: { id } });
    if (!carrier) {
      throw new NotFoundException('Carrier not found');
    }

    if (updateCarrierDto.name) carrier.name = updateCarrierDto.name;
    if (updateCarrierDto.email) carrier.email = updateCarrierDto.email;
    if (updateCarrierDto.phone) carrier.phone = updateCarrierDto.phone;
    if (updateCarrierDto.address) {
      carrier.addressStreet = updateCarrierDto.address.street;
      carrier.addressCity = updateCarrierDto.address.city;
      carrier.addressState = updateCarrierDto.address.state;
      carrier.addressZip = updateCarrierDto.address.zip;
      if (updateCarrierDto.address.country) carrier.addressCountry = updateCarrierDto.address.country;
    }
    if (updateCarrierDto.equipmentTypes) carrier.equipmentTypes = updateCarrierDto.equipmentTypes;
    if (updateCarrierDto.insurance) {
      carrier.insuranceLiability = updateCarrierDto.insurance.liability;
      carrier.insuranceCargo = updateCarrierDto.insurance.cargo;
      carrier.insuranceGeneral = updateCarrierDto.insurance.general;
      carrier.insuranceExpiration = updateCarrierDto.insurance.expiration;
    }
    if (updateCarrierDto.trustScore !== undefined) carrier.trustScore = updateCarrierDto.trustScore;

    await this.carrierRepository.save(carrier);
    return this.mapToResponse(carrier);
  }

  async remove(id: string): Promise<void> {
    const carrier = await this.carrierRepository.findOne({ where: { id } });
    if (!carrier) {
      throw new NotFoundException('Carrier not found');
    }
    await this.carrierRepository.remove(carrier);
  }

  async addDriver(carrierId: string, createDriverDto: CreateDriverDto): Promise<DriverResponseDto> {
    const carrier = await this.carrierRepository.findOne({ where: { id: carrierId } });
    if (!carrier) {
      throw new NotFoundException('Carrier not found');
    }

    const existingDriver = await this.driverRepository.findOne({
      where: { licenseNumber: createDriverDto.licenseNumber },
    });
    if (existingDriver) {
      throw new BadRequestException('Driver license number already exists');
    }

    const driver = this.driverRepository.create({
      carrierId,
      name: createDriverDto.name,
      licenseNumber: createDriverDto.licenseNumber,
      cdlClass: createDriverDto.cdlClass,
      phone: createDriverDto.phone,
      email: createDriverDto.email,
    });

    await this.driverRepository.save(driver);
    return this.mapDriverToResponse(driver);
  }

  async getDrivers(carrierId: string): Promise<DriverResponseDto[]> {
    const carrier = await this.carrierRepository.findOne({ where: { id: carrierId } });
    if (!carrier) {
      throw new NotFoundException('Carrier not found');
    }

    const drivers = await this.driverRepository.find({ where: { carrierId } });
    return drivers.map(d => this.mapDriverToResponse(d));
  }

  async removeDriver(carrierId: string, driverId: string): Promise<void> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId, carrierId },
    });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    await this.driverRepository.remove(driver);
  }

  private mapToResponse(carrier: Carrier): CarrierResponseDto {
    return {
      id: carrier.id,
      mcNumber: carrier.mcNumber,
      dotNumber: carrier.dotNumber,
      name: carrier.name,
      email: carrier.email,
      phone: carrier.phone,
      address: {
        street: carrier.addressStreet,
        city: carrier.addressCity,
        state: carrier.addressState,
        zip: carrier.addressZip,
        country: carrier.addressCountry,
      },
      equipmentTypes: carrier.equipmentTypes,
      insurance: {
        liability: carrier.insuranceLiability,
        cargo: carrier.insuranceCargo,
        general: carrier.insuranceGeneral,
        expiration: carrier.insuranceExpiration,
      },
      trustScore: carrier.trustScore,
      createdAt: carrier.createdAt,
      updatedAt: carrier.updatedAt,
    };
  }

  private mapDriverToResponse(driver: Driver): DriverResponseDto {
    return {
      id: driver.id,
      carrierId: driver.carrierId,
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      cdlClass: driver.cdlClass,
      phone: driver.phone,
      email: driver.email,
      createdAt: driver.createdAt,
    };
  }
}
