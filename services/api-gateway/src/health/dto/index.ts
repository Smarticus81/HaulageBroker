import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'healthy' })
  status: string;

  @ApiProperty({ example: '0.1.0' })
  version: string;

  @ApiProperty({ example: '2024-01-15T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 3600 })
  uptime: number;

  @ApiProperty()
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };

  @ApiProperty({ example: 'development' })
  environment: string;
}
