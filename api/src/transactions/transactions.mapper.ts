import { formatMinor } from '../helper/money';
import { ReviewActivity } from '../reviews/entities/review-activity.entity';
import { Review } from '../reviews/entities/review.entity';
import { ReviewState } from '../reviews/enums/review.enums';
import {
  AmountsDto,
  RelatedRecordDto,
  ReviewStateDto,
  TransactionDetailDto,
  TransactionListItemDto,
} from './dto/transaction-response.dto';
import { TransactionRecord } from './entities/transaction-record.entity';
import { ValidationResult } from './entities/validation-result.entity';

const display = (minor: number | null): string | null =>
  minor === null ? null : formatMinor(minor);

export function toAmounts(record: TransactionRecord): AmountsDto {
  return {
    subtotal: display(record.subtotalMinor),
    vat: display(record.vatMinor),
    total: display(record.totalMinor),
    subtotalMinor: record.subtotalMinor,
    vatMinor: record.vatMinor,
    totalMinor: record.totalMinor,
  };
}

/** No stored review means nobody has acted yet. */
export function toReviewState(review: Review | null): ReviewStateDto {
  if (!review) {
    return {
      state: ReviewState.NOT_REVIEWED,
      note: null,
      updatedBy: null,
      updatedAt: null,
      version: 0,
    };
  }
  const { state, note, updatedBy, updatedAt, version } = review;
  return { state, note, updatedBy, updatedAt, version };
}

export function toListItem(
  record: TransactionRecord,
  validation: ValidationResult,
  review: Review | null,
): TransactionListItemDto {
  return {
    id: record.id,
    sequence: record.sequence,
    recordRef: record.recordRef,
    clientId: record.clientId,
    source: record.source,
    sourceId: record.sourceId,
    type: record.type,
    sourceStatus: record.sourceStatus,
    supplierName: record.supplierName,
    amounts: toAmounts(record),
    validation: {
      status: validation.status,
      issues: validation.issues,
      processed: validation.processed,
      validatedAt: validation.validatedAt,
    },
    review: toReviewState(review),
    receivedAt: record.receivedAt,
  };
}

export function toDetail(
  record: TransactionRecord,
  validation: ValidationResult,
  review: Review | null,
  relatedRecords: RelatedRecordDto[],
  activity: ReviewActivity[],
): TransactionDetailDto {
  return {
    ...toListItem(record, validation, review),
    importId: record.importId,
    identityKey: record.identityKey,
    raw: { ...record.raw },
    relatedRecords,
    activity: activity.map((a) => ({
      id: a.id,
      action: a.action,
      fromState: a.fromState,
      toState: a.toState,
      note: a.note,
      reviewerId: a.reviewerId,
      createdAt: a.createdAt,
    })),
  };
}
