import {
  ReviewActivityDto,
  ReviewStateDto,
} from '../transactions/dto/transaction-response.dto';
import { ReviewActivity } from './entities/review-activity.entity';
import { Review } from './entities/review.entity';
import { ReviewState } from './enums/review.enums';

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

export function toActivity(a: ReviewActivity): ReviewActivityDto {
  return {
    id: a.id,
    action: a.action,
    fromState: a.fromState,
    toState: a.toState,
    note: a.note,
    reviewerId: a.reviewerId,
    createdAt: a.createdAt,
  };
}
