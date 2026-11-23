import { Module } from '@nestjs/common';
import { ValidationService } from './validation.service';

/** Read API arrives in task 5; for now it owns re-validation. */
@Module({
  providers: [ValidationService],
  exports: [ValidationService],
})
export class TransactionsModule {}
