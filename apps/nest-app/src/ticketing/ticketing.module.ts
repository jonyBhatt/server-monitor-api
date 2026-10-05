import { Anomaly } from '@/log-analysis';
import { QueriesModule } from '@/queries';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketingProviderFactory } from './ticketing-providers/ticketing-provider.factory';
import { TicketingService } from './ticketing.service';

@Module({
  imports: [QueriesModule, TypeOrmModule.forFeature([Anomaly])],
  providers: [TicketingService, TicketingProviderFactory],
  exports: [TicketingService],
})
export class TicketingModule {}
