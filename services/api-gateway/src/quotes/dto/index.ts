import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuoteDto {
  @ApiProperty({ description: 'Load ID to quote' })
  @IsString()
  loadId: string;

  @ApiProperty({ example: 2500.00 })
  @IsNumber()
  @Min(0)
  priceUsd: number;

  @ApiPropertyOptional({ example: 3.45 })
  @IsOptional()
  @IsNumber()
  fuelIndex?: number;

  @ApiPropertyOptional({ example: 'Dry Van Standard - 925 miles' })
  @IsOptional()
  @IsString()
  basis?: string;

  @ApiProperty({ example: '2024-01-20T23:59:59Z' })
  @IsDateString()
  validUntil: string;
}

export class QuoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  loadId: string;

  @ApiProperty()
  priceUsd: number;

  @ApiPropertyOptional()
  fuelIndex?: number;

  @ApiPropertyOptional()
  basis?: string;

  @ApiProperty()
  validUntil: Date;

  @ApiProperty()
  createdAt: Date;
}

export class CalculateRateDto {
  @ApiProperty({ example: 925 })
  @IsNumber()
  @Min(1)
  distance: number;

  @ApiProperty({ example: 'DRY', enum: ['DRY', 'REEFER', 'FLATBED', 'STEPDECK', 'LOWBOY', 'RGN', 'TANKER'] })
  @IsString()
  equipmentCode: string;

  @ApiProperty({ example: 'standard', enum: ['standard', 'expedited', 'urgent'] })
  @IsEnum(['standard', 'expedited', 'urgent'])
  serviceLevel: 'standard' | 'expedited' | 'urgent';

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 3.45 })
  @IsOptional()
  @IsNumber()
  fuelIndex?: number;
}

export class RateResponseDto {
  @ApiProperty()
  priceUsd: number;

  @ApiProperty()
  fuelIndex: number;

  @ApiProperty()
  ratePerMile: number;

  @ApiProperty()
  basis: string;

  @ApiProperty()
  validUntil: Date;

  @ApiProperty()
  breakdown: {
    baseRate: number;
    serviceMultiplier: number;
    fuelSurcharge: number;
    weightSurcharge: number;
  };
}
