import { Module } from '@nestjs/common';
import { TransactionsModule } from '../transactions/transactions.module';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { SeedService } from './seed.service';

@Module({
  imports: [TransactionsModule],
  controllers: [ImportsController],
  providers: [ImportsService, SeedService],
})
export class ImportsModule {}
