import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { Quote } from '../database/entities/quote.entity';
import { Load } from '../database/entities/load.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, Load])],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
