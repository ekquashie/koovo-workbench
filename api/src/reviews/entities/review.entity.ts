import { ReviewState } from '../enums/review.enums';

/**
 * Current review decision for a record, kept separate from validation status.
 * No Review stored means NOT_REVIEWED.
 */
export class Review {
  recordId!: string;
  state!: ReviewState;
  /** Required for NEEDS_CORRECTION. */
  note!: string | null;
  updatedBy!: string;
  updatedAt!: string;
  /** Bumped on every change, for optimistic concurrency. */
  version!: number;

  constructor(props: Review) {
    Object.assign(this, props);
  }
}

/** A review decision before storage has assigned its version. */
export type NewReview = Omit<Review, 'version'>;
