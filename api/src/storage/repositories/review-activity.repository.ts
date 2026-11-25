import { Injectable } from '@nestjs/common';
import { ReviewActivity } from '../../reviews/entities/review-activity.entity';
import { InMemoryStore } from '../in-memory-store';

/** Append-only: there is deliberately no update or delete. */
export abstract class ReviewActivityRepository {
  abstract append(activity: ReviewActivity): Promise<ReviewActivity>;
  /** Oldest first. */
  abstract findByRecordId(recordId: string): Promise<ReviewActivity[]>;
}

@Injectable()
export class InMemoryReviewActivityRepository extends ReviewActivityRepository {
  private readonly store = new InMemoryStore<ReviewActivity>((a) => a.id);

  append(activity: ReviewActivity): Promise<ReviewActivity> {
    if (this.store.get(activity.id)) {
      return Promise.reject(
        new Error(`ReviewActivity ${activity.id} already exists`),
      );
    }
    return Promise.resolve(this.store.set(activity));
  }

  findByRecordId(recordId: string): Promise<ReviewActivity[]> {
    return Promise.resolve(
      this.store.values().filter((a) => a.recordId === recordId),
    );
  }
}
