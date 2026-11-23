import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { ValidationService } from './validation.service';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, ValidationService],
  exports: [ValidationService],
})
export class TransactionsModule {}
