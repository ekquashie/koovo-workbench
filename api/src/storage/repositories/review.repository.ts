import { Injectable } from '@nestjs/common';
import { NewReview, Review } from '../../reviews/entities/review.entity';
import { InMemoryStore } from '../in-memory-store';
import { VersionConflictError } from '../storage.errors';

export abstract class ReviewRepository {
  abstract findByRecordId(recordId: string): Promise<Review | null>;
  abstract findAll(): Promise<Review[]>;
  /**
   * Optimistic-concurrency write. `expectedVersion` is the version the caller
   * read (0 when there was no review yet). If the stored version differs,
   * someone else got there first: throws VersionConflictError and writes
   * nothing. On success the review is stored at `expectedVersion + 1`.
   */
  abstract save(review: NewReview, expectedVersion: number): Promise<Review>;
}

@Injectable()
export class InMemoryReviewRepository extends ReviewRepository {
  private readonly store = new InMemoryStore<Review>((r) => r.recordId);

  findByRecordId(recordId: string): Promise<Review | null> {
    return Promise.resolve(this.store.get(recordId));
  }

  findAll(): Promise<Review[]> {
    return Promise.resolve(this.store.values());
  }

  save(review: NewReview, expectedVersion: number): Promise<Review> {
    const actualVersion = this.store.get(review.recordId)?.version ?? 0;
    if (actualVersion !== expectedVersion) {
      return Promise.reject(
        new VersionConflictError(
          'Review',
          review.recordId,
          expectedVersion,
          actualVersion,
        ),
      );
    }
    return Promise.resolve(
      this.store.set(new Review({ ...review, version: expectedVersion + 1 })),
    );
  }
}
