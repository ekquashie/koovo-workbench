import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FieldValidationException } from '../exceptions/exceptions';
import { AppLogger } from '../logger/logger';
import { ImportBatchRepository } from '../storage/repositories/import-batch.repository';
import { TransactionRecordRepository } from '../storage/repositories/transaction-record.repository';
import { RawTransaction } from '../transactions/entities/raw-transaction';
import { NewTransactionRecord } from '../transactions/entities/transaction-record.entity';
import { ValidationService } from '../transactions/validation.service';
import { countByStatus } from '../transactions/validation/validate-dataset';
import {
  ParsedTransaction,
  parseRawTransaction,
} from '../transactions/validation/parse-raw';
import { ImportResultDto } from './dto/import-result.dto';
import { ImportBatch } from './entities/import-batch.entity';
import { ImportOrigin } from './enums/import-origin.enum';

@Injectable()
export class ImportsService {
  /**
   * Imports run one at a time. Each one stores records and then re-validates
   * everything; if two overlapped, the slower one could save results computed
   * before the other's records existed. A promise chain is enough in memory;
   * a database would use a transaction or advisory lock instead.
   */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly batches: ImportBatchRepository,
    private readonly records: TransactionRecordRepository,
    private readonly validation: ValidationService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * All or nothing: every row is parsed first, and if any row is malformed
   * nothing is stored and every problem is returned at once (400, keyed like
   * `records.3.total`, the same shape class-validator errors use).
   */
  import(
    rows: RawTransaction[],
    origin: ImportOrigin,
  ): Promise<ImportResultDto> {
    const run = this.queue.then(() =>
      this.store(rows, this.parseAll(rows), origin),
    );
    this.queue = run.catch(() => undefined);
    return run;
  }

  findAll(): Promise<ImportBatch[]> {
    return this.batches.findAll();
  }

  private parseAll(rows: RawTransaction[]): ParsedTransaction[] {
    const errors: Record<string, string> = {};
    const parsed: ParsedTransaction[] = [];
    rows.forEach((raw, index) => {
      const result = parseRawTransaction(raw);
      if (result.ok) {
        parsed.push(result.value);
        return;
      }
      const label = raw.record?.trim() || `Row ${index + 1}`;
      for (const { field, message } of result.errors) {
        errors[`records.${index}.${field}`] = `${label}: ${message}`;
      }
    });
    if (Object.keys(errors).length > 0) {
      throw new FieldValidationException(errors);
    }
    return parsed;
  }

  private async store(
    rows: RawTransaction[],
    parsed: ParsedTransaction[],
    origin: ImportOrigin,
  ): Promise<ImportResultDto> {
    const now = new Date().toISOString();
    const batch = await this.batches.save(
      new ImportBatch({
        id: randomUUID(),
        origin,
        recordCount: rows.length,
        importedAt: now,
      }),
    );
    const drafts: NewTransactionRecord[] = parsed.map((fields) => ({
      ...fields,
      id: randomUUID(),
      importId: batch.id,
      receivedAt: now,
    }));
    const saved = await this.records.addMany(drafts);
    const summary = countByStatus(await this.validation.revalidateAll(now));

    this.logger.log(
      `Import ${batch.id} (${origin}): ${saved.length} records; dataset now ` +
        `${summary.VALID} valid / ${summary.NEEDS_ATTENTION} needs attention / ` +
        `${summary.EXCLUDED} excluded`,
    );
    return { import: batch, recordIds: saved.map((r) => r.id), summary };
  }
}
