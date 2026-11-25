import { Injectable } from '@nestjs/common';
import { ImportBatch } from '../../imports/entities/import-batch.entity';
import { InMemoryStore } from '../in-memory-store';

export abstract class ImportBatchRepository {
  abstract save(batch: ImportBatch): Promise<ImportBatch>;
  abstract findById(id: string): Promise<ImportBatch | null>;
  /** In import order. */
  abstract findAll(): Promise<ImportBatch[]>;
}

@Injectable()
export class InMemoryImportBatchRepository extends ImportBatchRepository {
  private readonly store = new InMemoryStore<ImportBatch>((b) => b.id);

  save(batch: ImportBatch): Promise<ImportBatch> {
    return Promise.resolve(this.store.set(batch));
  }

  findById(id: string): Promise<ImportBatch | null> {
    return Promise.resolve(this.store.get(id));
  }

  findAll(): Promise<ImportBatch[]> {
    return Promise.resolve(this.store.values());
  }
}
