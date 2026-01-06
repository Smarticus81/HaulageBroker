import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Shipper } from './entities/shipper.entity';
import { Carrier } from './entities/carrier.entity';
import { Driver } from './entities/driver.entity';
import { EquipmentType } from './entities/equipment-type.entity';
import { Load } from './entities/load.entity';
import { Quote } from './entities/quote.entity';
import { Tender } from './entities/tender.entity';
import { Award } from './entities/award.entity';
import { Document } from './entities/document.entity';
import { Invoice } from './entities/invoice.entity';
import { Payout } from './entities/payout.entity';
import { Exception } from './entities/exception.entity';
import { Event } from './entities/event.entity';
import { User } from './entities/user.entity';

const entities = [
  Shipper,
  Carrier,
  Driver,
  EquipmentType,
  Load,
  Quote,
  Tender,
  Award,
  Document,
  Invoice,
  Payout,
  Exception,
  Event,
  User,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'clearhaul'),
        entities,
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
