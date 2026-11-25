import { ValidationStatus } from '../enums/validation.enums';
import { ValidationIssue } from './validation-issue';

/**
 * Derived from the records, never edited directly. Recomputed for the whole
 * dataset after every import, because duplicates depend on other records.
 */
export class ValidationResult {
  recordId!: string;
  status!: ValidationStatus;
  /** Empty when VALID or EXCLUDED. */
  issues!: ValidationIssue[];
  /** False for duplicate repeats and conflicting records. */
  processed!: boolean;
  validatedAt!: string;

  constructor(props: ValidationResult) {
    Object.assign(this, props);
  }
}
