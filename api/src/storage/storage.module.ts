import { Global, Module, Provider } from '@nestjs/common';
import {
  ImportBatchRepository,
  InMemoryImportBatchRepository,
} from './repositories/import-batch.repository';
import {
  InMemoryReviewActivityRepository,
  ReviewActivityRepository,
} from './repositories/review-activity.repository';
import {
  InMemoryReviewRepository,
  ReviewRepository,
} from './repositories/review.repository';
import {
  InMemoryReviewerRepository,
  ReviewerRepository,
} from './repositories/reviewer.repository';
import {
  InMemoryTransactionRecordRepository,
  TransactionRecordRepository,
} from './repositories/transaction-record.repository';
import {
  InMemoryValidationResultRepository,
  ValidationResultRepository,
} from './repositories/validation-result.repository';

/**
 * Services inject the abstract classes; only this module knows the data lives
 * in memory. Swapping to Postgres means new implementations bound here, with
 * no change to services.
 */
const repositories: Provider[] = [
  { provide: ImportBatchRepository, useClass: InMemoryImportBatchRepository },
  {
    provide: TransactionRecordRepository,
    useClass: InMemoryTransactionRecordRepository,
  },
  {
    provide: ValidationResultRepository,
    useClass: InMemoryValidationResultRepository,
  },
  { provide: ReviewRepository, useClass: InMemoryReviewRepository },
  {
    provide: ReviewActivityRepository,
    useClass: InMemoryReviewActivityRepository,
  },
  { provide: ReviewerRepository, useClass: InMemoryReviewerRepository },
];

@Global()
@Module({
  providers: repositories,
  exports: [
    ImportBatchRepository,
    TransactionRecordRepository,
    ValidationResultRepository,
    ReviewRepository,
    ReviewActivityRepository,
    ReviewerRepository,
  ],
})
export class StorageModule {}
