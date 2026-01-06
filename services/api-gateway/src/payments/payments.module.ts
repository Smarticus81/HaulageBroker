import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Invoice } from '../database/entities/invoice.entity';
import { Payout } from '../database/entities/payout.entity';
import { Load } from '../database/entities/load.entity';
import { Carrier } from '../database/entities/carrier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Payout, Load, Carrier])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
