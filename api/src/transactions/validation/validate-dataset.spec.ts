import { aRaw, loadSeedRows, recordsFromRaw } from '../../testing/fixtures';
import { ValidationResult } from '../entities/validation-result.entity';
import { IssueCode, ValidationStatus } from '../enums/validation.enums';
import { countByStatus, validateDataset } from './validate-dataset';

const AT = '2026-11-23T12:00:00.000Z';
const { VALID, NEEDS_ATTENTION, EXCLUDED } = ValidationStatus;

const byRef = (results: ValidationResult[]) =>
  new Map(results.map((r) => [r.recordId.replace('id-', ''), r]));

describe('validateDataset on the supplied dataset (R001–R011)', () => {
  const results = validateDataset(recordsFromRaw(loadSeedRows()), AT);
  const result = byRef(results);

  it('summarises as 5 valid / 4 needs attention / 2 excluded', () => {
    expect(results).toHaveLength(11);
    expect(countByStatus(results)).toEqual({
      [VALID]: 5,
      [NEEDS_ATTENTION]: 4,
      [EXCLUDED]: 2,
    });
  });

  it.each([
    ['R001', VALID, []],
    ['R002', VALID, []],
    ['R003', NEEDS_ATTENTION, [IssueCode.TOTAL_MISMATCH]],
    ['R004', NEEDS_ATTENTION, [IssueCode.MISSING_SUPPLIER]],
    ['R005', NEEDS_ATTENTION, [IssueCode.DUPLICATE_SOURCE_TRANSACTION]],
    ['R006', EXCLUDED, []],
    ['R007', VALID, []],
    ['R008', VALID, []],
    ['R009', EXCLUDED, []],
    ['R010', VALID, []],
    ['R011', NEEDS_ATTENTION, [IssueCode.INVALID_AMOUNT_SIGN]],
  ])('%s is %s with issues %j', (ref, status, issueCodes) => {
    expect(result.get(ref)!.status).toBe(status);
    expect(result.get(ref)!.issues.map((i) => i.code)).toEqual(issueCodes);
  });

  it('keeps R005 but does not process it twice', () => {
    expect(result.get('R001')!.processed).toBe(true);
    expect(result.get('R005')!.processed).toBe(false);
    expect(result.get('R005')!.issues[0].relatedRecordIds).toEqual(['id-R001']);
  });

  it('marks excluded records as not processed', () => {
    expect(result.get('R006')!.processed).toBe(false);
    expect(result.get('R009')!.processed).toBe(false);
  });

  it('stamps every result with the given time', () => {
    expect(results.every((r) => r.validatedAt === AT)).toBe(true);
  });
});

describe('validateDataset', () => {
  it('returns results in arrival order whatever order records are passed in', () => {
    const records = recordsFromRaw([
      aRaw({ record: 'A' }),
      aRaw({ record: 'B', sourceId: 'X-2' }),
    ]);
    const results = validateDataset([...records].reverse(), AT);
    expect(results.map((r) => r.recordId)).toEqual(['id-A', 'id-B']);
  });

  it('decides "first" by sequence, not by position in the input', () => {
    const [a, b] = recordsFromRaw([
      aRaw({ record: 'A' }),
      aRaw({ record: 'B' }),
    ]);
    const results = byRef(validateDataset([b, a], AT));
    expect(results.get('A')!.status).toBe(VALID);
    expect(results.get('B')!.issues[0].code).toBe(
      IssueCode.DUPLICATE_SOURCE_TRANSACTION,
    );
  });

  it('runs no rules on Draft/Void, even if the data is broken', () => {
    const results = validateDataset(
      recordsFromRaw([
        aRaw({
          status: 'Draft',
          supplier: '-',
          subtotal: '-50.00',
          total: '1.00',
        }),
      ]),
      AT,
    );
    expect(results[0]).toMatchObject({ status: EXCLUDED, issues: [] });
  });

  it('does not treat a Void record and a Posted record with the same identity as a conflict', () => {
    const results = byRef(
      validateDataset(
        recordsFromRaw([
          aRaw({ record: 'A', status: 'Void', total: '999.00' }),
          aRaw({ record: 'B', status: 'Posted' }),
        ]),
        AT,
      ),
    );
    expect(results.get('A')!.status).toBe(EXCLUDED);
    expect(results.get('B')!.status).toBe(VALID);
  });

  it('collects every issue on a record, not just the first', () => {
    const [result] = validateDataset(
      recordsFromRaw([
        aRaw({
          supplier: '-',
          subtotal: '-10.00',
          vat: '-2.00',
          total: '5.00',
        }),
      ]),
      AT,
    );
    expect(result.issues.map((i) => i.code)).toEqual([
      IssueCode.INVALID_AMOUNT_SIGN,
      IssueCode.TOTAL_MISMATCH,
      IssueCode.MISSING_SUPPLIER,
    ]);
  });

  it('reports a missing amount instead of a misleading total mismatch', () => {
    const [result] = validateDataset(recordsFromRaw([aRaw({ vat: '-' })]), AT);
    expect(result.issues.map((i) => i.code)).toEqual([
      IssueCode.MISSING_AMOUNT,
    ]);
  });

  it('marks both conflicting records as not processed', () => {
    const results = validateDataset(
      recordsFromRaw([
        aRaw({ record: 'A' }),
        aRaw({ record: 'B', total: '121.00' }),
      ]),
      AT,
    );
    expect(results.map((r) => r.processed)).toEqual([false, false]);
  });

  it('a later import can change an earlier record’s result', () => {
    const [r003] = recordsFromRaw([
      aRaw({
        record: 'R003',
        sourceId: 'X-102',
        subtotal: '300.00',
        vat: '60.00',
        total: '360.00',
      }),
    ]);
    expect(validateDataset([r003], AT)[0].status).toBe(VALID);

    const [, corrected] = recordsFromRaw([
      aRaw({
        record: 'R003',
        sourceId: 'X-102',
        subtotal: '300.00',
        vat: '60.00',
        total: '360.00',
      }),
      aRaw({
        record: 'R012',
        sourceId: 'X-102',
        subtotal: '300.00',
        vat: '60.00',
        total: '365.00',
      }),
    ]);
    const both = validateDataset([r003, corrected], AT);
    expect(both.map((r) => r.issues.map((i) => i.code))).toEqual([
      [IssueCode.CONFLICTING_SOURCE_TRANSACTION],
      [IssueCode.TOTAL_MISMATCH, IssueCode.CONFLICTING_SOURCE_TRANSACTION],
    ]);
  });

  it('returns an empty list for an empty dataset', () => {
    expect(validateDataset([], AT)).toEqual([]);
    expect(countByStatus([])).toEqual({
      [VALID]: 0,
      [NEEDS_ATTENTION]: 0,
      [EXCLUDED]: 0,
    });
  });
});
