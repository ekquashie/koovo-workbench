import { ImportBatch } from '../../imports/entities/import-batch.entity';
import { ReviewAction, ReviewState } from '../../reviews/enums/review.enums';
import { ReviewActivity } from '../../reviews/entities/review-activity.entity';
import { Review } from '../../reviews/entities/review.entity';
import { TransactionRecord } from '../../transactions/entities/transaction-record.entity';
import { ValidationResult } from '../../transactions/entities/validation-result.entity';
import {
  IssueCode,
  ValidationStatus,
} from '../../transactions/enums/validation.enums';
import { aBatch, aRecordDraft, aReview } from '../fixtures';
import { VersionConflictError } from '../storage.errors';
import { InMemoryImportBatchRepository } from './import-batch.repository';
import { InMemoryReviewActivityRepository } from './review-activity.repository';
import { InMemoryReviewRepository } from './review.repository';
import { InMemoryReviewerRepository } from './reviewer.repository';
import { InMemoryTransactionRecordRepository } from './transaction-record.repository';
import { InMemoryValidationResultRepository } from './validation-result.repository';

describe('ImportBatchRepository (in-memory)', () => {
  it('saves and finds batches in import order', async () => {
    const repo = new InMemoryImportBatchRepository();
    await repo.save(aBatch({ id: 'b1' }));
    await repo.save(aBatch({ id: 'b2' }));
    expect(await repo.findById('b1')).toBeInstanceOf(ImportBatch);
    expect(await repo.findById('nope')).toBeNull();
    expect((await repo.findAll()).map((b) => b.id)).toEqual(['b1', 'b2']);
  });
});

describe('TransactionRecordRepository (in-memory)', () => {
  it('assigns increasing sequences across calls, in the order given', async () => {
    const repo = new InMemoryTransactionRecordRepository();
    const first = await repo.addMany([
      aRecordDraft({ id: 'a' }),
      aRecordDraft({ id: 'b' }),
    ]);
    const second = await repo.addMany([aRecordDraft({ id: 'c' })]);
    expect(first.map((r) => r.sequence)).toEqual([1, 2]);
    expect(second[0].sequence).toBe(3);
    expect(second[0]).toBeInstanceOf(TransactionRecord);
  });

  it('never hands out the same sequence to concurrent imports', async () => {
    const repo = new InMemoryTransactionRecordRepository();
    await Promise.all([
      repo.addMany([aRecordDraft({ id: 'a' }), aRecordDraft({ id: 'b' })]),
      repo.addMany([aRecordDraft({ id: 'c' }), aRecordDraft({ id: 'd' })]),
    ]);
    const sequences = (await repo.findAll()).map((r) => r.sequence);
    expect(sequences).toEqual([1, 2, 3, 4]);
  });

  it('keeps an exact repeat as its own record (repeats are not merged)', async () => {
    const repo = new InMemoryTransactionRecordRepository();
    await repo.addMany([
      aRecordDraft({ id: 'r1', recordRef: 'R001' }),
      aRecordDraft({ id: 'r5', recordRef: 'R005' }),
    ]);
    expect(await repo.findAll()).toHaveLength(2);
  });

  it('returns null for an unknown id', async () => {
    const repo = new InMemoryTransactionRecordRepository();
    expect(await repo.findById('nope')).toBeNull();
  });
});

describe('ValidationResultRepository (in-memory)', () => {
  const result = (recordId: string, status: ValidationStatus) =>
    new ValidationResult({
      recordId,
      status,
      issues:
        status === ValidationStatus.NEEDS_ATTENTION
          ? [
              {
                code: IssueCode.TOTAL_MISMATCH,
                message: 'Total mismatch',
                fields: ['total'],
                relatedRecordIds: [],
              },
            ]
          : [],
      processed: true,
      validatedAt: '2026-11-23T10:00:00.000Z',
    });

  it('replaceAll swaps the whole result set', async () => {
    const repo = new InMemoryValidationResultRepository();
    await repo.replaceAll([
      result('a', ValidationStatus.VALID),
      result('b', ValidationStatus.VALID),
    ]);
    await repo.replaceAll([result('a', ValidationStatus.NEEDS_ATTENTION)]);
    expect(await repo.findAll()).toHaveLength(1);
    expect((await repo.findByRecordId('a'))?.issues[0].code).toBe(
      IssueCode.TOTAL_MISMATCH,
    );
    expect(await repo.findByRecordId('b')).toBeNull();
  });
});

describe('ReviewRepository (in-memory)', () => {
  it('creates the first review at version 1', async () => {
    const repo = new InMemoryReviewRepository();
    const saved = await repo.save(aReview(), 0);
    expect(saved).toBeInstanceOf(Review);
    expect(saved.version).toBe(1);
    expect((await repo.findByRecordId('rec-1'))?.state).toBe(
      ReviewState.REVIEWED,
    );
  });

  it('bumps the version on each change', async () => {
    const repo = new InMemoryReviewRepository();
    await repo.save(aReview(), 0);
    const updated = await repo.save(
      aReview({ state: ReviewState.NEEDS_CORRECTION, note: 'Check VAT' }),
      1,
    );
    expect(updated.version).toBe(2);
  });

  it('refuses a write based on a stale version and keeps the stored review', async () => {
    const repo = new InMemoryReviewRepository();
    await repo.save(aReview({ updatedBy: 'rev-ama' }), 0);

    // Kofi also read "no review yet" (version 0) before Ama saved.
    await expect(
      repo.save(
        aReview({ state: ReviewState.NEEDS_CORRECTION, updatedBy: 'rev-kofi' }),
        0,
      ),
    ).rejects.toBeInstanceOf(VersionConflictError);

    const stored = await repo.findByRecordId('rec-1');
    expect(stored).toMatchObject({ updatedBy: 'rev-ama', version: 1 });
  });

  it('returns null when a record has never been reviewed', async () => {
    const repo = new InMemoryReviewRepository();
    expect(await repo.findByRecordId('rec-1')).toBeNull();
  });
});

describe('ReviewActivityRepository (in-memory)', () => {
  const activity = (id: string, recordId: string) =>
    new ReviewActivity({
      id,
      recordId,
      action: ReviewAction.MARK_REVIEWED,
      fromState: ReviewState.NOT_REVIEWED,
      toState: ReviewState.REVIEWED,
      note: null,
      reviewerId: 'rev-ama',
      createdAt: '2026-11-23T10:00:00.000Z',
    });

  it('returns one record’s history, oldest first', async () => {
    const repo = new InMemoryReviewActivityRepository();
    await repo.append(activity('1', 'rec-1'));
    await repo.append(activity('2', 'rec-2'));
    await repo.append(activity('3', 'rec-1'));
    const history = await repo.findByRecordId('rec-1');
    expect(history.map((a) => a.id)).toEqual(['1', '3']);
  });

  it('refuses to overwrite an existing entry', async () => {
    const repo = new InMemoryReviewActivityRepository();
    await repo.append(activity('1', 'rec-1'));
    await expect(repo.append(activity('1', 'rec-2'))).rejects.toThrow(
      'already exists',
    );
    expect(await repo.findByRecordId('rec-2')).toEqual([]);
  });
});

describe('ReviewerRepository (in-memory)', () => {
  it('serves the fixed mock list', async () => {
    const repo = new InMemoryReviewerRepository();
    expect((await repo.findAll()).map((r) => r.id)).toEqual([
      'rev-ama',
      'rev-kofi',
    ]);
    expect((await repo.findById('rev-kofi'))?.name).toBe('Kofi Asante');
    expect(await repo.findById('rev-nobody')).toBeNull();
  });
});
