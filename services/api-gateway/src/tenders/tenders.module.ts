import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TendersController } from './tenders.controller';
import { TendersService } from './tenders.service';
import { Tender } from '../database/entities/tender.entity';
import { Load } from '../database/entities/load.entity';
import { Carrier } from '../database/entities/carrier.entity';
import { Award } from '../database/entities/award.entity';
import { Driver } from '../database/entities/driver.entity';
import { Event } from '../database/entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tender, Load, Carrier, Award, Driver, Event])],
  controllers: [TendersController],
  providers: [TendersService],
  exports: [TendersService],
})
export class TendersModule {}
