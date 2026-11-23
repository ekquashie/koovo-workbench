import { ImportOrigin } from '../imports/enums/import-origin.enum';
import { ImportBatch } from '../imports/entities/import-batch.entity';
import { ReviewState } from '../reviews/enums/review.enums';
import { NewReview } from '../reviews/entities/review.entity';
import {
  SourceStatus,
  SourceSystem,
  TransactionType,
} from '../transactions/enums/transaction.enums';
import { NewTransactionRecord } from '../transactions/entities/transaction-record.entity';

/** Test-only builders for storage specs. */
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
