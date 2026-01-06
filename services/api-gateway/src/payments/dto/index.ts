import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Load ID' })
  @IsString()
  loadId: string;

  @ApiProperty({ description: 'Carrier ID' })
  @IsString()
  carrierId: string;

  @ApiProperty({ example: 2400.00 })
  @IsNumber()
  @Min(0)
  amountUsd: number;

  @ApiProperty({ example: '2024-02-15' })
  @IsDateString()
  dueDate: string;
}

export class CreatePayoutDto {
  @ApiProperty({ description: 'Carrier ID' })
  @IsString()
  carrierId: string;

  @ApiPropertyOptional({ description: 'Invoice ID if associated' })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiProperty({ example: 2400.00 })
  @IsNumber()
  @Min(0)
  amountUsd: number;

  @ApiProperty({ enum: ['ach', 'rtp', 'wire', 'check'] })
  @IsEnum(['ach', 'rtp', 'wire', 'check'])
  method: 'ach' | 'rtp' | 'wire' | 'check';
}

export class InvoiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  loadId: string;

  @ApiProperty()
  carrierId: string;

  @ApiProperty()
  amountUsd: number;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty({ enum: ['pending', 'paid', 'overdue', 'disputed'] })
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiPropertyOptional()
  carrier?: {
    id: string;
    name: string;
  };
}

export class PayoutResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  carrierId: string;

  @ApiPropertyOptional()
  invoiceId?: string;

  @ApiProperty()
  amountUsd: number;

  @ApiProperty({ enum: ['ach', 'rtp', 'wire', 'check'] })
  method: string;

  @ApiProperty({ enum: ['pending', 'processing', 'completed', 'failed'] })
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  carrier?: {
    id: string;
    name: string;
  };
}

export class PaymentSummaryDto {
  @ApiProperty()
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    count: number;
  };

  @ApiProperty()
  payouts: {
    completed: number;
    pending: number;
    count: number;
  };

  @ApiProperty()
  netPosition: number;
}
