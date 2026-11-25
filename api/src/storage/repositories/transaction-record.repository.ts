import { Injectable } from '@nestjs/common';
import {
  NewTransactionRecord,
  TransactionRecord,
} from '../../transactions/entities/transaction-record.entity';
import { InMemoryStore } from '../in-memory-store';

export abstract class TransactionRecordRepository {
  /**
   * Stores the records and gives each the next arrival `sequence`, in the
   * order given. Storage assigns it (like a database identity column) so two
   * imports running at once can never hand out the same number.
   */
  abstract addMany(
    records: NewTransactionRecord[],
  ): Promise<TransactionRecord[]>;
  abstract findById(id: string): Promise<TransactionRecord | null>;
  /** Ordered by `sequence`. */
  abstract findAll(): Promise<TransactionRecord[]>;
}

@Injectable()
export class InMemoryTransactionRecordRepository extends TransactionRecordRepository {
  private readonly store = new InMemoryStore<TransactionRecord>((r) => r.id);
  private lastSequence = 0;

  addMany(records: NewTransactionRecord[]): Promise<TransactionRecord[]> {
    // Synchronous on purpose: no await between reading and bumping the
    // counter, so concurrent callers can't interleave.
    const saved = records.map((draft) =>
      this.store.set(
        new TransactionRecord({ ...draft, sequence: ++this.lastSequence }),
      ),
    );
    return Promise.resolve(saved);
  }

  findById(id: string): Promise<TransactionRecord | null> {
    return Promise.resolve(this.store.get(id));
  }

  findAll(): Promise<TransactionRecord[]> {
    // Insertion order already equals sequence order; sort anyway so the
    // contract doesn't depend on Map iteration order.
    return Promise.resolve(
      this.store.values().sort((a, b) => a.sequence - b.sequence),
    );
  }
}
