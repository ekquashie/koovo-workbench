import { formatMinor } from '../../helper/money';
import { TransactionRecord } from '../entities/transaction-record.entity';
import { ValidationIssue } from '../entities/validation-issue';
import { TransactionType } from '../enums/transaction.enums';
import { IssueCode } from '../enums/validation.enums';

/** The fields a single-record rule looks at; keeps rules easy to test. */
export type RuleInput = Pick<
  TransactionRecord,
  'type' | 'supplierName' | 'subtotalMinor' | 'vatMinor' | 'totalMinor'
>;

/** Checks one record on its own. Returns [] when the record passes. */
export type RecordRule = (record: RuleInput) => ValidationIssue[];

const AMOUNTS = [
  { field: 'subtotal', label: 'Subtotal', key: 'subtotalMinor' },
  { field: 'vat', label: 'VAT', key: 'vatMinor' },
  { field: 'total', label: 'Total', key: 'totalMinor' },
] as const;

const issue = (
  code: IssueCode,
  message: string,
  fields: string[],
): ValidationIssue => ({ code, message, fields, relatedRecordIds: [] });

const joinLabels = (labels: string[]): string =>
  labels.length === 1
    ? labels[0]
    : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;

/** A missing amount is not zero; it means the total can't be checked. */
export const missingAmountRule: RecordRule = (record) => {
  const missing = AMOUNTS.filter((a) => record[a.key] === null);
  if (missing.length === 0) return [];
  const verb = missing.length === 1 ? 'is' : 'are';
  return [
    issue(
      IssueCode.MISSING_AMOUNT,
      `${joinLabels(missing.map((a) => a.label))} ${verb} missing, so the total can't be checked.`,
      missing.map((a) => a.field),
    ),
  ];
};

/**
 * Total must equal subtotal + VAT to 2 d.p. Amounts are already integer pence,
 * so this is an exact integer comparison. Skipped when an amount is missing
 * (missingAmountRule reports that instead of a misleading mismatch).
 */
export const totalMismatchRule: RecordRule = ({
  subtotalMinor,
  vatMinor,
  totalMinor,
}) => {
  if (subtotalMinor === null || vatMinor === null || totalMinor === null) {
    return [];
  }
  const expected = subtotalMinor + vatMinor;
  if (totalMinor === expected) return [];
  return [
    issue(
      IssueCode.TOTAL_MISMATCH,
      `Total ${formatMinor(totalMinor)} does not equal subtotal ` +
        `${formatMinor(subtotalMinor)} + VAT ${formatMinor(vatMinor)} ` +
        `(${formatMinor(expected)}).`,
      ['total'],
    ),
  ];
};

/**
 * Posted bills must not have negative amounts. Credits may: a negative
 * amount on a credit is never an error on its own.
 */
export const amountSignRule: RecordRule = (record) => {
  if (record.type !== TransactionType.BILL) return [];
  const negative = AMOUNTS.filter((a) => {
    const value = record[a.key];
    return value !== null && value < 0;
  });
  if (negative.length === 0) return [];
  const listed = negative
    .map((a) => `${a.label} ${formatMinor(record[a.key]!)}`)
    .join(', ');
  return [
    issue(
      IssueCode.INVALID_AMOUNT_SIGN,
      `A posted bill can't have negative amounts: ${listed}.`,
      negative.map((a) => a.field),
    ),
  ];
};

export const missingSupplierRule: RecordRule = ({ supplierName }) =>
  supplierName === null
    ? [
        issue(IssueCode.MISSING_SUPPLIER, 'Supplier name is missing.', [
          'supplier',
        ]),
      ]
    : [];

/** Every single-record rule, run on each POSTED record. */
export const RECORD_RULES: readonly RecordRule[] = [
  amountSignRule,
  totalMismatchRule,
  missingAmountRule,
  missingSupplierRule,
];
