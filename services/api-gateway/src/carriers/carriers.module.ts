import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarriersController } from './carriers.controller';
import { CarriersService } from './carriers.service';
import { Carrier } from '../database/entities/carrier.entity';
import { Driver } from '../database/entities/driver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Carrier, Driver])],
  controllers: [CarriersController],
  providers: [CarriersService],
  exports: [CarriersService],
})
export class CarriersModule {}
