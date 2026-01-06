import { IsString, IsEnum, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Load ID' })
  @IsString()
  loadId: string;

  @ApiProperty({ enum: ['bol', 'pod', 'invoice', 'rate_confirmation', 'insurance_certificate'] })
  @IsEnum(['bol', 'pod', 'invoice', 'rate_confirmation', 'insurance_certificate'])
  type: 'bol' | 'pod' | 'invoice' | 'rate_confirmation' | 'insurance_certificate';

  @ApiProperty({ example: 'BOL-2024-001.pdf' })
  @IsString()
  filename: string;

  @ApiProperty({ example: 'https://storage.example.com/docs/BOL-2024-001.pdf' })
  @IsString()
  url: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  verified?: boolean;
}

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  loadId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  uploadedBy: string;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  verified: boolean;
}
