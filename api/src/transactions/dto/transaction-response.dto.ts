import { ApiProperty } from '@nestjs/swagger';
import { RawTransactionDto } from '../../imports/dto/create-import.dto';
import { ReviewAction, ReviewState } from '../../reviews/enums/review.enums';
import {
  SourceStatus,
  SourceSystem,
  TransactionType,
} from '../enums/transaction.enums';
import { IssueCode, ValidationStatus } from '../enums/validation.enums';

/**
 * Each amount twice: integer pence for anything that calculates or sorts,
 * and a 2 d.p. string for display, so the client never does float maths.
 * null = missing in the source ("-"), not zero.
 */
export class AmountsDto {
  @ApiProperty({ example: '120.00', nullable: true, type: String })
  subtotal!: string | null;
  @ApiProperty({ example: '20.00', nullable: true, type: String })
  vat!: string | null;
  @ApiProperty({ example: '120.00', nullable: true, type: String })
  total!: string | null;
  @ApiProperty({ example: 10000, nullable: true, type: Number })
  subtotalMinor!: number | null;
  @ApiProperty({ example: 2000, nullable: true, type: Number })
  vatMinor!: number | null;
  @ApiProperty({ example: 12000, nullable: true, type: Number })
  totalMinor!: number | null;
}

export class ValidationIssueDto {
  @ApiProperty({ enum: IssueCode })
  code!: IssueCode;
  message!: string;
  /** Columns to highlight, e.g. ["total"]. */
  fields!: string[];
  relatedRecordIds!: string[];
}

export class ValidationDto {
  @ApiProperty({ enum: ValidationStatus })
  status!: ValidationStatus;
  issues!: ValidationIssueDto[];
  /** False for repeats, conflicts and excluded records. */
  processed!: boolean;
  validatedAt!: string;
}

/** Current review decision; NOT_REVIEWED with version 0 when none exists. */
export class ReviewStateDto {
  @ApiProperty({ enum: ReviewState })
  state!: ReviewState;
  @ApiProperty({ nullable: true, type: String })
  note!: string | null;
  @ApiProperty({ nullable: true, type: String })
  updatedBy!: string | null;
  @ApiProperty({ nullable: true, type: String })
  updatedAt!: string | null;
  /** Send back when reviewing, so a stale screen can't overwrite a newer decision. */
  version!: number;
}

export class TransactionListItemDto {
  id!: string;
  /** Arrival order across all imports. */
  sequence!: number;
  recordRef!: string;
  clientId!: string;
  @ApiProperty({ enum: SourceSystem })
  source!: SourceSystem;
  sourceId!: string;
  @ApiProperty({ enum: TransactionType })
  type!: TransactionType;
  @ApiProperty({ enum: SourceStatus })
  sourceStatus!: SourceStatus;
  @ApiProperty({ nullable: true, type: String })
  supplierName!: string | null;
  amounts!: AmountsDto;
  validation!: ValidationDto;
  review!: ReviewStateDto;
  receivedAt!: string;
}

export class RelatedRecordDto {
  id!: string;
  recordRef!: string;
}

export class ReviewActivityDto {
  id!: string;
  @ApiProperty({ enum: ReviewAction })
  action!: ReviewAction;
  @ApiProperty({ enum: ReviewState })
  fromState!: ReviewState;
  @ApiProperty({ enum: ReviewState })
  toState!: ReviewState;
  @ApiProperty({ nullable: true, type: String })
  note!: string | null;
  reviewerId!: string;
  createdAt!: string;
}

export class TransactionDetailDto extends TransactionListItemDto {
  importId!: string;
  /** `client|SOURCE|sourceId`, the identity used for repeat detection. */
  identityKey!: string;
  /** The row exactly as received. */
  raw!: RawTransactionDto;
  /** Records referenced by issues (the original of a repeat, the other side of a conflict). */
  relatedRecords!: RelatedRecordDto[];
  /** Review history, oldest first. */
  activity!: ReviewActivityDto[];
}

export class StatusCountsDto {
  VALID!: number;
  NEEDS_ATTENTION!: number;
  EXCLUDED!: number;
}

export class TransactionSummaryDto {
  counts!: StatusCountsDto;
  total!: number;
  /** Every client in the dataset, regardless of the clientId filter. */
  @ApiProperty({ example: ['C01', 'C02'] })
  clients!: string[];
}
