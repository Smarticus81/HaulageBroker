import { IsString, IsNumber, IsOptional, IsArray, IsDateString, IsEnum, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

class LocationDto {
  @ApiProperty({ example: 'ABC Warehouse' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Industrial Blvd' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Chicago' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'IL' })
  @IsString()
  state: string;

  @ApiProperty({ example: '60601' })
  @IsString()
  zip: string;

  @ApiPropertyOptional()
  @IsOptional()
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export class CreateLoadDto {
  @ApiProperty({ description: 'Shipper ID' })
  @IsString()
  shipper_id: string;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @ApiPropertyOptional({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  commodity?: string;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight_lbs?: number;

  @ApiProperty({ example: 'DRY' })
  @IsString()
  equipment_code: string;

  @ApiPropertyOptional({ example: '2024-01-16T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  pickup_earliest?: string;

  @ApiPropertyOptional({ example: '2024-01-18T14:00:00Z' })
  @IsOptional()
  @IsDateString()
  delivery_latest?: string;

  @ApiPropertyOptional({ example: 'standard', enum: ['standard', 'expedited', 'urgent'] })
  @IsOptional()
  @IsEnum(['standard', 'expedited', 'urgent'])
  service_level?: 'standard' | 'expedited' | 'urgent';

  @ApiPropertyOptional({ example: ['Team drivers required', 'Liftgate needed'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  special_requirements?: string[];
}

export class UpdateLoadDto extends PartialType(CreateLoadDto) {
  @ApiPropertyOptional({ enum: ['created', 'quoted', 'tendered', 'awarded', 'picked_up', 'in_transit', 'delivered', 'cancelled'] })
  @IsOptional()
  @IsEnum(['created', 'quoted', 'tendered', 'awarded', 'picked_up', 'in_transit', 'delivered', 'cancelled'])
  status?: string;
}

export class LoadResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shipper_id: string;

  @ApiProperty()
  origin: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  @ApiProperty()
  destination: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  @ApiPropertyOptional()
  commodity?: string;

  @ApiPropertyOptional()
  weight_lbs?: number;

  @ApiProperty()
  equipment_code: string;

  @ApiPropertyOptional()
  pickup_earliest?: Date;

  @ApiPropertyOptional()
  delivery_latest?: Date;

  @ApiProperty()
  service_level: string;

  @ApiPropertyOptional()
  special_requirements?: string[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class LoadsListResponseDto {
  @ApiProperty({ type: [LoadResponseDto] })
  data: LoadResponseDto[];

  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
