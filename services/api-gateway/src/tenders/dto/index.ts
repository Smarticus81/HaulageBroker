import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenderDto {
  @ApiProperty({ description: 'Load ID' })
  @IsString()
  loadId: string;

  @ApiProperty({ description: 'Carrier ID' })
  @IsString()
  carrierId: string;

  @ApiProperty({ example: 2400.00 })
  @IsNumber()
  @Min(0)
  priceUsd: number;

  @ApiProperty({ example: '2024-01-18T23:59:59Z' })
  @IsDateString()
  expiresAt: string;
}

export class AcceptTenderDto {
  @ApiProperty({ description: 'Driver ID to assign' })
  @IsString()
  driverId: string;

  @ApiPropertyOptional({ example: 'Use dock 5, check in at gate B' })
  @IsOptional()
  @IsString()
  pickupInstructions?: string;

  @ApiPropertyOptional({ example: 'Deliver to receiving, call 30 min ahead' })
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;
}

export class TenderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  loadId: string;

  @ApiProperty()
  carrierId: string;

  @ApiProperty()
  priceUsd: number;

  @ApiProperty({ enum: ['sent', 'accepted', 'declined', 'expired'] })
  status: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  carrier?: {
    id: string;
    name: string;
    mcNumber: string;
    trustScore: number;
  };
}

export class AwardResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenderId: string;

  @ApiProperty()
  loadId: string;

  @ApiProperty()
  carrierId: string;

  @ApiProperty()
  driverId: string;

  @ApiProperty()
  priceUsd: number;

  @ApiPropertyOptional()
  pickupInstructions?: string;

  @ApiPropertyOptional()
  deliveryInstructions?: string;

  @ApiProperty()
  awardedAt: Date;

  @ApiProperty()
  carrier: {
    id: string;
    name: string;
    mcNumber: string;
  };

  @ApiProperty()
  driver: {
    id: string;
    name: string;
    phone?: string;
  };
}
