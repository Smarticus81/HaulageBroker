import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from '../database/entities/quote.entity';
import { Load } from '../database/entities/load.entity';
import { CreateQuoteDto, QuoteResponseDto, CalculateRateDto, RateResponseDto } from './dto';

@Injectable()
export class QuotesService {
  // Base rates per mile by equipment type
  private readonly baseRates: Record<string, number> = {
    'DRY': 2.50,
    'REEFER': 3.00,
    'FLATBED': 2.75,
    'STEPDECK': 2.85,
    'LOWBOY': 4.00,
    'RGN': 4.50,
    'TANKER': 3.25,
  };

  // Service level multipliers
  private readonly serviceMultipliers: Record<string, number> = {
    'standard': 1.0,
    'expedited': 1.25,
    'urgent': 1.5,
  };

  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  async create(createQuoteDto: CreateQuoteDto): Promise<QuoteResponseDto> {
    const load = await this.loadRepository.findOne({
      where: { id: createQuoteDto.loadId },
    });
    if (!load) {
      throw new NotFoundException('Load not found');
    }

    const quote = this.quoteRepository.create({
      loadId: createQuoteDto.loadId,
      priceUsd: createQuoteDto.priceUsd,
      fuelIndex: createQuoteDto.fuelIndex,
      basis: createQuoteDto.basis,
      validUntil: new Date(createQuoteDto.validUntil),
    });

    await this.quoteRepository.save(quote);

    // Update load status to quoted
    if (load.status === 'created') {
      load.status = 'quoted';
      await this.loadRepository.save(load);
    }

    return this.mapToResponse(quote);
  }

  async findAll(filters: { page: number; limit: number; loadId?: string }) {
    const where: any = {};
    if (filters.loadId) {
      where.loadId = filters.loadId;
    }

    const [data, total] = await this.quoteRepository.findAndCount({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      order: { createdAt: 'DESC' },
      relations: ['load'],
    });

    return {
      data: data.map(q => this.mapToResponse(q)),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findOne(id: string): Promise<QuoteResponseDto> {
    const quote = await this.quoteRepository.findOne({
      where: { id },
      relations: ['load'],
    });
    if (!quote) {
      throw new NotFoundException('Quote not found');
    }
    return this.mapToResponse(quote);
  }

  async remove(id: string): Promise<void> {
    const quote = await this.quoteRepository.findOne({ where: { id } });
    if (!quote) {
      throw new NotFoundException('Quote not found');
    }
    await this.quoteRepository.remove(quote);
  }

  async calculateRate(dto: CalculateRateDto): Promise<RateResponseDto> {
    const equipmentCode = dto.equipmentCode.toUpperCase();
    const baseRate = this.baseRates[equipmentCode] || 2.50;
    const serviceMultiplier = this.serviceMultipliers[dto.serviceLevel] || 1.0;

    // Calculate base price
    let price = dto.distance * baseRate * serviceMultiplier;

    // Add fuel surcharge (based on fuel index, defaulting to current average)
    const fuelIndex = dto.fuelIndex || 3.50;
    const fuelSurcharge = dto.distance * (fuelIndex - 2.50) * 0.06;
    price += Math.max(0, fuelSurcharge);

    // Add weight surcharge if over 40,000 lbs
    if (dto.weight && dto.weight > 40000) {
      const overweight = dto.weight - 40000;
      price += overweight * 0.01;
    }

    // Minimum charge
    price = Math.max(price, 350);

    // Round to nearest dollar
    price = Math.round(price);

    // Calculate valid until (24 hours by default)
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 24);

    return {
      priceUsd: price,
      fuelIndex,
      ratePerMile: price / dto.distance,
      basis: `${equipmentCode} ${dto.serviceLevel} - ${dto.distance} miles`,
      validUntil,
      breakdown: {
        baseRate: dto.distance * baseRate,
        serviceMultiplier,
        fuelSurcharge: Math.max(0, fuelSurcharge),
        weightSurcharge: dto.weight && dto.weight > 40000 ? (dto.weight - 40000) * 0.01 : 0,
      },
    };
  }

  private mapToResponse(quote: Quote): QuoteResponseDto {
    return {
      id: quote.id,
      loadId: quote.loadId,
      priceUsd: Number(quote.priceUsd),
      fuelIndex: quote.fuelIndex ? Number(quote.fuelIndex) : undefined,
      basis: quote.basis,
      validUntil: quote.validUntil,
      createdAt: quote.createdAt,
    };
  }
}
