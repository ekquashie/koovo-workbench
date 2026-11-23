import { Injectable } from '@nestjs/common';
import { ValidationResultRepository } from '../storage/repositories/validation-result.repository';
import { TransactionRecordRepository } from '../storage/repositories/transaction-record.repository';
import { ValidationResult } from './entities/validation-result.entity';
import { validateDataset } from './validation/validate-dataset';

/** Runs the pure validation engine over everything stored and saves the result. */
@Injectable()
export class ValidationService {
  constructor(
    private readonly records: TransactionRecordRepository,
    private readonly results: ValidationResultRepository,
  ) {}

  /**
   * Re-validates the whole dataset, not just new records: a new import can
   * make an existing record a duplicate or a conflict.
   */
  async revalidateAll(
    validatedAt = new Date().toISOString(),
  ): Promise<ValidationResult[]> {
    const results = validateDataset(await this.records.findAll(), validatedAt);
    await this.results.replaceAll(results);
    return results;
  }
}
