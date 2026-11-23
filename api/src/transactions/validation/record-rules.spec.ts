import { TransactionType } from '../enums/transaction.enums';
import { IssueCode } from '../enums/validation.enums';
import {
  RuleInput,
  amountSignRule,
  missingAmountRule,
  missingSupplierRule,
  totalMismatchRule,
} from './record-rules';

const bill = (over: Partial<RuleInput> = {}): RuleInput => ({
  type: TransactionType.BILL,
  supplierName: 'Westline Office',
  subtotalMinor: 10000,
  vatMinor: 2000,
  totalMinor: 12000,
  ...over,
});
const credit = (over: Partial<RuleInput> = {}) =>
  bill({ type: TransactionType.CREDIT, ...over });

describe('totalMismatchRule', () => {
  it('passes when total = subtotal + VAT', () => {
    expect(totalMismatchRule(bill())).toEqual([]);
  });

  it('flags R003 (300 + 60 ≠ 365) with an accountant-readable message', () => {
    const [issue] = totalMismatchRule(
      bill({ subtotalMinor: 30000, vatMinor: 6000, totalMinor: 36500 }),
    );
    expect(issue).toEqual({
      code: IssueCode.TOTAL_MISMATCH,
      message:
        'Total 365.00 does not equal subtotal 300.00 + VAT 60.00 (360.00).',
      fields: ['total'],
      relatedRecordIds: [],
    });
  });

  it('catches a one-penny difference', () => {
    expect(totalMismatchRule(bill({ totalMinor: 12001 }))).toHaveLength(1);
  });

  it('checks credits too (negative but consistent passes)', () => {
    expect(
      totalMismatchRule(
        credit({ subtotalMinor: -10000, vatMinor: -2000, totalMinor: -12000 }),
      ),
    ).toEqual([]);
    expect(
      totalMismatchRule(
        credit({ subtotalMinor: -10000, vatMinor: -2000, totalMinor: -11000 }),
      ),
    ).toHaveLength(1);
  });

  it('is skipped when an amount is missing (reported as MISSING_AMOUNT instead)', () => {
    expect(totalMismatchRule(bill({ vatMinor: null }))).toEqual([]);
  });
});

describe('amountSignRule', () => {
  it('flags R011: a posted bill with negative amounts, naming each one', () => {
    const [issue] = amountSignRule(
      bill({ subtotalMinor: -3000, vatMinor: -600, totalMinor: -3600 }),
    );
    expect(issue.code).toBe(IssueCode.INVALID_AMOUNT_SIGN);
    expect(issue.fields).toEqual(['subtotal', 'vat', 'total']);
    expect(issue.message).toBe(
      "A posted bill can't have negative amounts: Subtotal -30.00, VAT -6.00, Total -36.00.",
    );
  });

  it('flags only the negative field on a mixed-sign bill', () => {
    const [issue] = amountSignRule(bill({ vatMinor: -2000, totalMinor: 8000 }));
    expect(issue.fields).toEqual(['vat']);
  });

  it('allows zero on a bill (R009 has VAT 0.00)', () => {
    expect(amountSignRule(bill({ vatMinor: 0, totalMinor: 10000 }))).toEqual(
      [],
    );
  });

  it('never flags a credit for negative amounts alone (R010)', () => {
    expect(
      amountSignRule(
        credit({ subtotalMinor: -10000, vatMinor: -2000, totalMinor: -12000 }),
      ),
    ).toEqual([]);
  });

  it('ignores missing amounts', () => {
    expect(amountSignRule(bill({ subtotalMinor: null }))).toEqual([]);
  });
});

describe('missingAmountRule', () => {
  it('passes when all amounts are present', () => {
    expect(missingAmountRule(bill())).toEqual([]);
  });

  it('names a single missing amount', () => {
    const [issue] = missingAmountRule(bill({ vatMinor: null }));
    expect(issue.code).toBe(IssueCode.MISSING_AMOUNT);
    expect(issue.fields).toEqual(['vat']);
    expect(issue.message).toBe(
      "VAT is missing, so the total can't be checked.",
    );
  });

  it('lists several missing amounts in one issue', () => {
    const [issue] = missingAmountRule(
      bill({ subtotalMinor: null, totalMinor: null }),
    );
    expect(issue.fields).toEqual(['subtotal', 'total']);
    expect(issue.message).toBe(
      "Subtotal and Total are missing, so the total can't be checked.",
    );
  });
});

describe('missingSupplierRule', () => {
  it('flags R004 (supplier "-")', () => {
    expect(missingSupplierRule(bill({ supplierName: null }))).toEqual([
      {
        code: IssueCode.MISSING_SUPPLIER,
        message: 'Supplier name is missing.',
        fields: ['supplier'],
        relatedRecordIds: [],
      },
    ]);
  });

  it('passes when a supplier is present', () => {
    expect(missingSupplierRule(bill())).toEqual([]);
  });
});
