import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippersController } from './shippers.controller';
import { ShippersService } from './shippers.service';
import { Shipper } from '../database/entities/shipper.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shipper])],
  controllers: [ShippersController],
  providers: [ShippersService],
  exports: [ShippersService],
})
export class ShippersModule {}
