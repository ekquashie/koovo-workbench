import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewActivityRepository } from '../storage/repositories/review-activity.repository';
import { ReviewRepository } from '../storage/repositories/review.repository';
import { TransactionRecordRepository } from '../storage/repositories/transaction-record.repository';
import { ValidationResultRepository } from '../storage/repositories/validation-result.repository';
import {
  ListTransactionsQueryDto,
  SummaryQueryDto,
} from './dto/list-transactions-query.dto';
import {
  TransactionDetailDto,
  TransactionListItemDto,
  TransactionSummaryDto,
} from './dto/transaction-response.dto';
import { TransactionRecord } from './entities/transaction-record.entity';
import { ValidationResult } from './entities/validation-result.entity';
import { toDetail, toListItem } from './transactions.mapper';
import { countByStatus } from './validation/validate-dataset';

/**
 * Read side. Records, validation results and reviews are stored separately
 * and joined here, because they change for different reasons: records on
 * import, results on re-validation, reviews on accountant action.
 */
@Injectable()
export class TransactionsService {
  constructor(
    private readonly records: TransactionRecordRepository,
    private readonly results: ValidationResultRepository,
    private readonly reviews: ReviewRepository,
    private readonly activity: ReviewActivityRepository,
  ) {}

  /** In arrival order. Filters combine (client AND status). */
  async list(
    query: ListTransactionsQueryDto,
  ): Promise<TransactionListItemDto[]> {
    const [records, results, reviews] = await Promise.all([
      this.records.findAll(),
      this.resultsByRecordId(),
      this.reviews.findAll(),
    ]);
    const reviewByRecord = new Map(reviews.map((r) => [r.recordId, r]));

    return records
      .filter((r) => !query.clientId || r.clientId === query.clientId)
      .map((r) => ({ record: r, validation: this.resultFor(r, results) }))
      .filter(
        ({ validation }) => !query.status || validation.status === query.status,
      )
      .map(({ record, validation }) =>
        toListItem(record, validation, reviewByRecord.get(record.id) ?? null),
      );
  }

  async summary(query: SummaryQueryDto): Promise<TransactionSummaryDto> {
    const [records, results] = await Promise.all([
      this.records.findAll(),
      this.resultsByRecordId(),
    ]);
    const inScope = records.filter(
      (r) => !query.clientId || r.clientId === query.clientId,
    );
    return {
      counts: countByStatus(inScope.map((r) => this.resultFor(r, results))),
      total: inScope.length,
      clients: [...new Set(records.map((r) => r.clientId))].sort(),
    };
  }

  async detail(id: string): Promise<TransactionDetailDto> {
    const record = await this.records.findById(id);
    if (!record) throw new NotFoundException('Transaction not found');

    const [validation, review, activity] = await Promise.all([
      this.results.findByRecordId(id),
      this.reviews.findByRecordId(id),
      this.activity.findByRecordId(id),
    ]);
    if (!validation) throw this.missingResult(record);

    const relatedIds = [
      ...new Set(validation.issues.flatMap((i) => i.relatedRecordIds)),
    ];
    const related = await Promise.all(
      relatedIds.map((relatedId) => this.records.findById(relatedId)),
    );
    const relatedRecords = related
      .filter((r): r is TransactionRecord => r !== null)
      .map((r) => ({ id: r.id, recordRef: r.recordRef }));

    return toDetail(record, validation, review, relatedRecords, activity);
  }

  private async resultsByRecordId(): Promise<Map<string, ValidationResult>> {
    const results = await this.results.findAll();
    return new Map(results.map((r) => [r.recordId, r]));
  }

  private resultFor(
    record: TransactionRecord,
    results: Map<string, ValidationResult>,
  ): ValidationResult {
    const result = results.get(record.id);
    if (!result) throw this.missingResult(record);
    return result;
  }

  /**
   * Imports always re-validate before returning, so this can't happen unless
   * there's a bug. Fail loudly (500, logged) rather than show a record as if
   * it had passed.
   */
  private missingResult(record: TransactionRecord): Error {
    return new Error(`No validation result for record ${record.id}`);
  }
}
