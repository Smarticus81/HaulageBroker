import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoadsModule } from './loads/loads.module';
import { QuotesModule } from './quotes/quotes.module';
import { TendersModule } from './tenders/tenders.module';
import { CarriersModule } from './carriers/carriers.module';
import { ShippersModule } from './shippers/shippers.module';
import { DocumentsModule } from './documents/documents.module';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    AuthModule,
    HealthModule,
    LoadsModule,
    QuotesModule,
    TendersModule,
    CarriersModule,
    ShippersModule,
    DocumentsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
