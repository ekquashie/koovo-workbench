import { aRaw, recordsFromRaw } from '../../testing/fixtures';
import { IssueCode } from '../enums/validation.enums';
import { detectRepeats } from './repeat-detection';

const codes = (map: ReturnType<typeof detectRepeats>, id: string) =>
  (map.get(id) ?? []).map((i) => i.code);

describe('detectRepeats', () => {
  it('ignores records with a unique identity', () => {
    const records = recordsFromRaw([
      aRaw({ record: 'R001', sourceId: 'X-101' }),
      aRaw({ record: 'R008', sourceId: 'X-103' }),
    ]);
    expect(detectRepeats(records).size).toBe(0);
  });

  it('allows the same Source ID under different clients (R001 vs R007)', () => {
    const records = recordsFromRaw([
      aRaw({ record: 'R001', client: 'C01' }),
      aRaw({
        record: 'R007',
        client: 'C02',
        subtotal: '400.00',
        vat: '80.00',
        total: '480.00',
      }),
    ]);
    expect(detectRepeats(records).size).toBe(0);
  });

  it('treats the same Source ID from a different source system as different', () => {
    const records = recordsFromRaw([
      aRaw({ record: 'A', source: 'Xero' }),
      aRaw({ record: 'B', source: 'Sage' }),
    ]);
    expect(detectRepeats(records).size).toBe(0);
  });

  it('flags only the later copy of an exact repeat (R005 repeats R001)', () => {
    const records = recordsFromRaw([
      aRaw({ record: 'R001' }),
      aRaw({ record: 'R005' }),
    ]);
    const result = detectRepeats(records);

    expect(result.has('id-R001')).toBe(false);
    const [issue] = result.get('id-R005')!;
    expect(issue).toMatchObject({
      code: IssueCode.DUPLICATE_SOURCE_TRANSACTION,
      relatedRecordIds: ['id-R001'],
    });
    expect(issue.message).toContain('Exact repeat of R001');
  });

  it('points every later copy at the first one', () => {
    const records = recordsFromRaw([
      aRaw({ record: 'A' }),
      aRaw({ record: 'B' }),
      aRaw({ record: 'C' }),
    ]);
    const result = detectRepeats(records);
    expect(result.get('id-B')![0].relatedRecordIds).toEqual(['id-A']);
    expect(result.get('id-C')![0].relatedRecordIds).toEqual(['id-A']);
  });

  it('compares parsed values, so "120" and " 120.00" are still an exact repeat', () => {
    const records = recordsFromRaw([
      aRaw({ record: 'A', total: '120' }),
      aRaw({ record: 'B', total: ' 120.00', supplier: ' Westline Office ' }),
    ]);
    expect(codes(detectRepeats(records), 'id-B')).toEqual([
      IssueCode.DUPLICATE_SOURCE_TRANSACTION,
    ]);
  });

  it('flags both records when the same identity has different values', () => {
    const records = recordsFromRaw([
      aRaw({ record: 'A' }),
      aRaw({ record: 'B', subtotal: '110.00', total: '130.00' }),
    ]);
    const result = detectRepeats(records);

    for (const [id, other] of [
      ['id-A', 'id-B'],
      ['id-B', 'id-A'],
    ]) {
      const [issue] = result.get(id)!;
      expect(issue).toMatchObject({
        code: IssueCode.CONFLICTING_SOURCE_TRANSACTION,
        fields: ['subtotal', 'total'],
        relatedRecordIds: [other],
      });
    }
    expect(result.get('id-A')![0].message).toBe(
      'Same client, source and source ID as B but different subtotal, total. ' +
        'Check which version is correct.',
    );
  });

  it('treats a supplier spelt differently as a conflict for a human to judge', () => {
    const records = recordsFromRaw([
      aRaw({ record: 'A' }),
      aRaw({ record: 'B', supplier: 'WESTLINE OFFICE' }),
    ]);
    expect(codes(detectRepeats(records), 'id-A')).toEqual([
      IssueCode.CONFLICTING_SOURCE_TRANSACTION,
    ]);
  });

  it('handles a repeat and a conflict under one identity (A, A again, B)', () => {
    const records = recordsFromRaw([
      aRaw({ record: 'A' }),
      aRaw({ record: 'A2' }),
      aRaw({ record: 'B', total: '999.00' }),
    ]);
    const result = detectRepeats(records);

    expect(codes(result, 'id-A')).toEqual([
      IssueCode.CONFLICTING_SOURCE_TRANSACTION,
    ]);
    expect(codes(result, 'id-A2')).toEqual([
      IssueCode.DUPLICATE_SOURCE_TRANSACTION,
      IssueCode.CONFLICTING_SOURCE_TRANSACTION,
    ]);
    expect(codes(result, 'id-B')).toEqual([
      IssueCode.CONFLICTING_SOURCE_TRANSACTION,
    ]);
    expect(result.get('id-B')![0].relatedRecordIds).toEqual(['id-A', 'id-A2']);
  });
});
