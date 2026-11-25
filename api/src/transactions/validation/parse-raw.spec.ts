import { aRaw } from '../../testing/fixtures';
import {
  SourceStatus,
  SourceSystem,
  TransactionType,
} from '../enums/transaction.enums';
import { ParsedTransaction, parseRawTransaction } from './parse-raw';

const parseOk = (...args: Parameters<typeof aRaw>): ParsedTransaction => {
  const result = parseRawTransaction(aRaw(...args));
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.value;
};

describe('parseRawTransaction', () => {
  it('parses a normal row into typed fields and pence', () => {
    expect(parseOk()).toMatchObject({
      recordRef: 'R001',
      clientId: 'C01',
      source: SourceSystem.XERO,
      sourceId: 'X-101',
      type: TransactionType.BILL,
      sourceStatus: SourceStatus.POSTED,
      supplierName: 'Westline Office',
      subtotalMinor: 10000,
      vatMinor: 2000,
      totalMinor: 12000,
      identityKey: 'C01|XERO|X-101',
    });
  });

  it('keeps the raw row exactly as received, frozen', () => {
    const raw = aRaw({ supplier: '  Westline Office ' });
    const result = parseRawTransaction(raw);
    expect(result.ok && result.value.raw).toEqual(raw);
    expect(result.ok && Object.isFrozen(result.value.raw)).toBe(true);
    expect(result.ok && result.value.supplierName).toBe('Westline Office');
  });

  it.each(['-', '', '   '])(
    'treats supplier %p as missing (null)',
    (supplier) => {
      expect(parseOk({ supplier }).supplierName).toBeNull();
    },
  );

  it('treats a "-" amount as missing (null), not zero', () => {
    expect(parseOk({ vat: '-' }).vatMinor).toBeNull();
  });

  it('accepts source, type and status in any case', () => {
    expect(
      parseOk({ source: 'SAGE', type: 'credit', status: 'void' }),
    ).toMatchObject({
      source: SourceSystem.SAGE,
      type: TransactionType.CREDIT,
      sourceStatus: SourceStatus.VOID,
      identityKey: 'C01|SAGE|X-101',
    });
  });

  it('trims identity fields so stray spaces cannot hide a repeat', () => {
    expect(parseOk({ client: ' C01 ', sourceId: 'X-101 ' }).identityKey).toBe(
      'C01|XERO|X-101',
    );
  });

  it('rejects malformed values and reports every bad field at once', () => {
    const result = parseRawTransaction(
      aRaw({ source: 'QuickBooks', total: '12.345', client: '-' }),
    );
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.map((e) => e.field).sort()).toEqual([
      'client',
      'source',
      'total',
    ]);
    expect(
      !result.ok && result.errors.find((e) => e.field === 'total')?.message,
    ).toBe('Total "12.345" is not a valid amount (e.g. 120.00)');
  });
});
