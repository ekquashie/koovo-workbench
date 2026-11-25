import { TransactionRecord } from '../entities/transaction-record.entity';
import { ValidationResult } from '../entities/validation-result.entity';
import { SourceStatus } from '../enums/transaction.enums';
import { IssueCode, ValidationStatus } from '../enums/validation.enums';
import { RECORD_RULES } from './record-rules';
import { detectRepeats } from './repeat-detection';

/** Issues that mean "don't count this record as its own transaction". */
const NOT_PROCESSED = new Set([
  IssueCode.DUPLICATE_SOURCE_TRANSACTION,
  IssueCode.CONFLICTING_SOURCE_TRANSACTION,
]);

/**
 * Validates the whole dataset at once. It has to be the whole dataset:
 * whether a record is a duplicate depends on the records around it, so a new
 * import can change the result of an old record.
 *
 * Pure: same records in, same results out; no clock, no storage.
 */
export function validateDataset(
  records: readonly TransactionRecord[],
  validatedAt: string,
): ValidationResult[] {
  const ordered = [...records].sort((a, b) => a.sequence - b.sequence);

  // Draft/Void are out of scope for every rule, including repeat detection:
  // a voided X-101 followed by a posted X-101 is a normal lifecycle, not a
  // conflict.
  const repeats = detectRepeats(
    ordered.filter((r) => r.sourceStatus === SourceStatus.POSTED),
  );

  return ordered.map((record) => {
    if (record.sourceStatus !== SourceStatus.POSTED) {
      return new ValidationResult({
        recordId: record.id,
        status: ValidationStatus.EXCLUDED,
        issues: [],
        processed: false,
        validatedAt,
      });
    }

    const issues = [
      ...RECORD_RULES.flatMap((rule) => rule(record)),
      ...(repeats.get(record.id) ?? []),
    ];
    return new ValidationResult({
      recordId: record.id,
      status:
        issues.length > 0
          ? ValidationStatus.NEEDS_ATTENTION
          : ValidationStatus.VALID,
      issues,
      processed: !issues.some((i) => NOT_PROCESSED.has(i.code)),
      validatedAt,
    });
  });
}

/** Count per status, with every status present (0 when none). */
export function countByStatus(
  results: readonly Pick<ValidationResult, 'status'>[],
): Record<ValidationStatus, number> {
  const counts = {
    [ValidationStatus.VALID]: 0,
    [ValidationStatus.NEEDS_ATTENTION]: 0,
    [ValidationStatus.EXCLUDED]: 0,
  };
  for (const { status } of results) counts[status] += 1;
  return counts;
}
