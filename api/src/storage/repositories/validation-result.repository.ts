import { Injectable } from '@nestjs/common';
import { ValidationResult } from '../../transactions/entities/validation-result.entity';
import { InMemoryStore } from '../in-memory-store';

export abstract class ValidationResultRepository {
  /**
   * Swaps in a freshly computed result set. Validation is recomputed for the
   * whole dataset after each import, so results are replaced, not patched.
   */
  abstract replaceAll(results: ValidationResult[]): Promise<void>;
  abstract findByRecordId(recordId: string): Promise<ValidationResult | null>;
  abstract findAll(): Promise<ValidationResult[]>;
}

@Injectable()
export class InMemoryValidationResultRepository extends ValidationResultRepository {
  private readonly store = new InMemoryStore<ValidationResult>(
    (r) => r.recordId,
  );

  replaceAll(results: ValidationResult[]): Promise<void> {
    this.store.replaceAll(results);
    return Promise.resolve();
  }

  findByRecordId(recordId: string): Promise<ValidationResult | null> {
    return Promise.resolve(this.store.get(recordId));
  }

  findAll(): Promise<ValidationResult[]> {
    return Promise.resolve(this.store.values());
  }
}
