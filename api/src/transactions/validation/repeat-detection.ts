import { TransactionRecord } from '../entities/transaction-record.entity';
import { ValidationIssue } from '../entities/validation-issue';
import { IssueCode } from '../enums/validation.enums';

/** Fields compared to decide whether two same-identity records match. */
const COMPARED = [
  { key: 'type', field: 'type' },
  { key: 'supplierName', field: 'supplier' },
  { key: 'subtotalMinor', field: 'subtotal' },
  { key: 'vatMinor', field: 'vat' },
  { key: 'totalMinor', field: 'total' },
] as const satisfies readonly { key: keyof TransactionRecord; field: string }[];

/**
 * Compares the *parsed* values, so "120" and "120.00" or a stray space count
 * as the same. Supplier case is significant: a human should decide whether
 * "ACME" and "Acme" are the same supplier.
 */
const differingFields = (
  a: TransactionRecord,
  b: TransactionRecord,
): string[] =>
  COMPARED.filter(({ key }) => a[key] !== b[key]).map(({ field }) => field);

const refs = (records: TransactionRecord[]): string =>
  records.map((r) => r.recordRef).join(', ');

/**
 * Finds repeated source transactions: records sharing Client + Source +
 * Source ID (`identityKey`). Expects POSTED records only, in arrival order.
 *
 * - Exact repeat (D1): the earliest copy is processed normally; each later
 *   copy gets DUPLICATE_SOURCE_TRANSACTION pointing at the earliest.
 * - Different values (D2): every record under that identity gets
 *   CONFLICTING_SOURCE_TRANSACTION. We can't know which version is right, so
 *   none is silently preferred; the accountant decides.
 * - Both at once (A, A again, B): all three conflict, and the second A is
 *   also a duplicate.
 *
 * Returns issues by record id; records with no repeat problem are absent.
 */
export function detectRepeats(
  records: readonly TransactionRecord[],
): Map<string, ValidationIssue[]> {
  const groups = new Map<string, TransactionRecord[]>();
  for (const record of records) {
    const group = groups.get(record.identityKey) ?? [];
    group.push(record);
    groups.set(record.identityKey, group);
  }

  const result = new Map<string, ValidationIssue[]>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;

    group.forEach((record, index) => {
      const issues: ValidationIssue[] = [];

      const original = group
        .slice(0, index)
        .find((earlier) => differingFields(earlier, record).length === 0);
      if (original) {
        issues.push({
          code: IssueCode.DUPLICATE_SOURCE_TRANSACTION,
          message:
            `Exact repeat of ${original.recordRef} (same client, source, ` +
            `source ID and values). Kept for inspection, not processed again.`,
          fields: [],
          relatedRecordIds: [original.id],
        });
      }

      const different = group.filter(
        (other) => differingFields(other, record).length > 0,
      );
      if (different.length > 0) {
        const fields = [
          ...new Set(different.flatMap((o) => differingFields(o, record))),
        ];
        issues.push({
          code: IssueCode.CONFLICTING_SOURCE_TRANSACTION,
          message:
            `Same client, source and source ID as ${refs(different)} but ` +
            `different ${fields.join(', ')}. Check which version is correct.`,
          fields,
          relatedRecordIds: different.map((o) => o.id),
        });
      }

      if (issues.length > 0) result.set(record.id, issues);
    });
  }
  return result;
}
