import { IssueCode } from '../enums/validation.enums';

/** Value object: one problem found on a record. */
export interface ValidationIssue {
  code: IssueCode;
  /** Accountant-readable, e.g. "Total 365.00 ≠ subtotal 300.00 + VAT 60.00 (360.00)". */
  message: string;
  /** Fields to highlight in the UI, e.g. `['total']`. */
  fields: string[];
  /** For duplicates and conflicts: the other record(s) involved. */
  relatedRecordIds: string[];
}
