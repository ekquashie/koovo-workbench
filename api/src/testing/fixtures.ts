import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImportOrigin } from '../imports/enums/import-origin.enum';
import { ImportBatch } from '../imports/entities/import-batch.entity';
import { ReviewState } from '../reviews/enums/review.enums';
import { NewReview } from '../reviews/entities/review.entity';
import {
  SourceStatus,
  SourceSystem,
  TransactionType,
} from '../transactions/enums/transaction.enums';
import { RawTransaction } from '../transactions/entities/raw-transaction';
import {
  NewTransactionRecord,
  TransactionRecord,
} from '../transactions/entities/transaction-record.entity';
import { parseRawTransaction } from '../transactions/validation/parse-raw';

/** Test-only builders. Excluded from the build (tsconfig.build.json). */
export const aBatch = (over: Partial<ImportBatch> = {}): ImportBatch =>
  new ImportBatch({
    id: 'batch-1',
    origin: ImportOrigin.SEED,
    recordCount: 1,
    importedAt: '2026-11-23T10:00:00.000Z',
    ...over,
  });

export const aRecordDraft = (
  over: Partial<NewTransactionRecord> = {},
): NewTransactionRecord => ({
  id: 'rec-1',
  importId: 'batch-1',
  recordRef: 'R001',
  raw: {
    record: 'R001',
    client: 'C01',
    source: 'Xero',
    sourceId: 'X-101',
    type: 'Bill',
    status: 'Posted',
    supplier: 'Acme Ltd',
    subtotal: '100.00',
    vat: '20.00',
    total: '120.00',
  },
  clientId: 'C01',
  source: SourceSystem.XERO,
  sourceId: 'X-101',
  type: TransactionType.BILL,
  sourceStatus: SourceStatus.POSTED,
  supplierName: 'Acme Ltd',
  subtotalMinor: 10000,
  vatMinor: 2000,
  totalMinor: 12000,
  identityKey: 'C01|XERO|X-101',
  receivedAt: '2026-11-23T10:00:00.000Z',
  ...over,
});

export const aReview = (over: Partial<NewReview> = {}): NewReview => ({
  recordId: 'rec-1',
  state: ReviewState.REVIEWED,
  note: null,
  updatedBy: 'rev-ama',
  updatedAt: '2026-11-23T10:00:00.000Z',
  ...over,
});

/** A valid posted Xero bill as raw input; override any column. */
export const aRaw = (over: Partial<RawTransaction> = {}): RawTransaction => ({
  record: 'R001',
  client: 'C01',
  source: 'Xero',
  sourceId: 'X-101',
  type: 'Bill',
  status: 'Posted',
  supplier: 'Westline Office',
  subtotal: '100.00',
  vat: '20.00',
  total: '120.00',
  ...over,
});

/**
 * Parses raw rows into stored-looking records: id = `id-<record>`, sequence
 * in array order. Throws if a row doesn't parse, so tests fail loudly.
 */
export function recordsFromRaw(rows: RawTransaction[]): TransactionRecord[] {
  return rows.map((raw, index) => {
    const parsed = parseRawTransaction(raw);
    if (!parsed.ok) {
      throw new Error(
        `Fixture ${raw.record} did not parse: ${JSON.stringify(parsed.errors)}`,
      );
    }
    return new TransactionRecord({
      ...parsed.value,
      id: `id-${raw.record}`,
      importId: 'batch-1',
      sequence: index + 1,
      receivedAt: '2026-11-23T10:00:00.000Z',
    });
  });
}

/** The brief's dataset (R001–R011), as shipped in src/data. */
export function loadSeedRows(): RawTransaction[] {
  const file = join(__dirname, '..', 'data', 'seed-transactions.json');
  return (
    JSON.parse(readFileSync(file, 'utf8')) as { records: RawTransaction[] }
  ).records;
}
