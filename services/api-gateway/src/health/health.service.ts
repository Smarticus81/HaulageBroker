import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './dto';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  async check(): Promise<HealthResponseDto> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();

    return {
      status: 'healthy',
      version: process.env.npm_package_version || '0.1.0',
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async ready(): Promise<{ status: string }> {
    // Could add database connectivity check here
    return { status: 'ready' };
  }

  async live(): Promise<{ status: string }> {
    return { status: 'alive' };
  }
}
