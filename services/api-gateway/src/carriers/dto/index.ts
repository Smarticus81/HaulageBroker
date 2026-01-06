import { IsString, IsEmail, IsOptional, IsArray, IsNumber, Min, Max, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

class AddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zip?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}

class InsuranceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  liability?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cargo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  general?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiration?: Date;
}

export class CreateCarrierDto {
  @ApiProperty({ example: 'MC-123456' })
  @IsString()
  mcNumber: string;

  @ApiProperty({ example: 'DOT-789012' })
  @IsString()
  dotNumber: string;

  @ApiProperty({ example: 'Reliable Transport LLC' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'contact@reliabletransport.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '(555) 123-4567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ example: ['Dry Van', 'Reefer', 'Flatbed'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipmentTypes?: string[];

  @ApiPropertyOptional({ type: InsuranceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceDto)
  insurance?: InsuranceDto;

  @ApiPropertyOptional({ example: 75, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  trustScore?: number;
}

export class UpdateCarrierDto extends PartialType(CreateCarrierDto) {}

export class CarrierResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mcNumber: string;

  @ApiProperty()
  dotNumber: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };

  @ApiPropertyOptional()
  equipmentTypes?: string[];

  @ApiPropertyOptional()
  insurance?: {
    liability?: number;
    cargo?: number;
    general?: number;
    expiration?: Date;
  };

  @ApiProperty()
  trustScore: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateDriverDto {
  @ApiProperty({ example: 'John Driver' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CDL-TX-123456' })
  @IsString()
  licenseNumber: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  cdlClass?: string;

  @ApiPropertyOptional({ example: '(555) 987-6543' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'driver@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class DriverResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  carrierId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  licenseNumber: string;

  @ApiPropertyOptional()
  cdlClass?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  createdAt: Date;
}
