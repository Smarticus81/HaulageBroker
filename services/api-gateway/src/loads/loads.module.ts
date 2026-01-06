import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoadsController } from './loads.controller';
import { LoadsService } from './loads.service';
import { Load } from '../database/entities/load.entity';
import { Shipper } from '../database/entities/shipper.entity';
import { Carrier } from '../database/entities/carrier.entity';
import { EquipmentType } from '../database/entities/equipment-type.entity';
import { Tender } from '../database/entities/tender.entity';
import { Event } from '../database/entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Load, Shipper, Carrier, EquipmentType, Tender, Event])],
  controllers: [LoadsController],
  providers: [LoadsService],
  exports: [LoadsService],
})
export class LoadsModule {}
