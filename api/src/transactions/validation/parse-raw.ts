import { parseMinor } from '../../helper/money';
import { NewTransactionRecord } from '../entities/transaction-record.entity';
import { RawTransaction } from '../entities/raw-transaction';
import {
  SourceStatus,
  SourceSystem,
  TransactionType,
} from '../enums/transaction.enums';

/** Parsed fields of one row; the caller adds id, importId and receivedAt. */
export type ParsedTransaction = Omit<
  NewTransactionRecord,
  'id' | 'importId' | 'receivedAt'
>;

export interface RawFieldError {
  field: keyof RawTransaction;
  message: string;
}

export type ParseResult =
  | { ok: true; value: ParsedTransaction }
  | { ok: false; errors: RawFieldError[] };

/** The dataset uses "-" for a missing value; blank is treated the same. */
const isMissing = (value: string): boolean =>
  value.trim() === '' || value.trim() === '-';

const SOURCES: Record<string, SourceSystem> = {
  xero: SourceSystem.XERO,
  sage: SourceSystem.SAGE,
};
const TYPES: Record<string, TransactionType> = {
  bill: TransactionType.BILL,
  credit: TransactionType.CREDIT,
};
const STATUSES: Record<string, SourceStatus> = {
  posted: SourceStatus.POSTED,
  draft: SourceStatus.DRAFT,
  void: SourceStatus.VOID,
};

export const buildIdentityKey = (
  clientId: string,
  source: SourceSystem,
  sourceId: string,
): string => `${clientId}|${source}|${sourceId}`;

/**
 * Turns one raw row into typed fields. Never throws: every problem is
 * collected per field, so an import can report all of them at once.
 *
 * Two kinds of "bad" are kept apart on purpose:
 * - a value that is *missing* ("-") is legitimate imperfect data: it becomes
 *   null and the validation rules flag it (MISSING_SUPPLIER, MISSING_AMOUNT);
 * - a value that is *malformed* ("12.345", "QuickBooks") can't be understood
 *   at all, so the row is rejected here rather than guessed at.
 */
export function parseRawTransaction(raw: RawTransaction): ParseResult {
  const errors: RawFieldError[] = [];

  const required = (field: keyof RawTransaction, label: string): string => {
    const value = raw[field].trim();
    if (isMissing(value))
      errors.push({ field, message: `${label} is required` });
    return value;
  };

  const oneOf = <T>(
    field: keyof RawTransaction,
    label: string,
    allowed: Record<string, T>,
  ): T => {
    const value = allowed[raw[field].trim().toLowerCase()];
    if (value === undefined) {
      const options = Object.keys(allowed).join(', ');
      errors.push({
        field,
        message: `${label} "${raw[field]}" is not one of: ${options}`,
      });
    }
    return value;
  };

  const amount = (field: keyof RawTransaction, label: string) => {
    if (isMissing(raw[field])) return null;
    const minor = parseMinor(raw[field]);
    if (minor === null) {
      errors.push({
        field,
        message: `${label} "${raw[field]}" is not a valid amount (e.g. 120.00)`,
      });
    }
    return minor;
  };

  const recordRef = required('record', 'Record');
  const clientId = required('client', 'Client');
  const sourceId = required('sourceId', 'Source ID');
  const source = oneOf('source', 'Source', SOURCES);
  const type = oneOf('type', 'Type', TYPES);
  const sourceStatus = oneOf('status', 'Status', STATUSES);
  const subtotalMinor = amount('subtotal', 'Subtotal');
  const vatMinor = amount('vat', 'VAT');
  const totalMinor = amount('total', 'Total');

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      recordRef,
      // A copy, frozen: the original input is shown for inspection and must
      // never be edited by anything downstream.
      raw: Object.freeze({ ...raw }),
      clientId,
      source,
      sourceId,
      type,
      sourceStatus,
      supplierName: isMissing(raw.supplier) ? null : raw.supplier.trim(),
      subtotalMinor,
      vatMinor,
      totalMinor,
      identityKey: buildIdentityKey(clientId, source, sourceId),
    },
  };
}
