import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import {
  ImportBatchRepository,
  InMemoryImportBatchRepository,
} from '../src/storage/repositories/import-batch.repository';
import { ReviewActivityRepository } from '../src/storage/repositories/review-activity.repository';
import { ReviewRepository } from '../src/storage/repositories/review.repository';
import { ReviewerRepository } from '../src/storage/repositories/reviewer.repository';
import { TransactionRecordRepository } from '../src/storage/repositories/transaction-record.repository';
import { ValidationResultRepository } from '../src/storage/repositories/validation-result.repository';

describe('StorageModule (integration)', () => {
  it('binds every abstract repository to a single shared instance', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    for (const token of [
      ImportBatchRepository,
      TransactionRecordRepository,
      ValidationResultRepository,
      ReviewRepository,
      ReviewActivityRepository,
      ReviewerRepository,
    ]) {
      expect(moduleRef.get(token)).toBeDefined();
    }
    expect(moduleRef.get(ImportBatchRepository)).toBeInstanceOf(
      InMemoryImportBatchRepository,
    );
    expect(moduleRef.get(ImportBatchRepository)).toBe(
      moduleRef.get(ImportBatchRepository),
    );
    await moduleRef.close();
  });
});
