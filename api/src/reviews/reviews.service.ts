import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AppLogger } from '../logger/logger';
import { ReviewActivityRepository } from '../storage/repositories/review-activity.repository';
import { ReviewRepository } from '../storage/repositories/review.repository';
import { ReviewerRepository } from '../storage/repositories/reviewer.repository';
import { TransactionRecordRepository } from '../storage/repositories/transaction-record.repository';
import { ValidationResultRepository } from '../storage/repositories/validation-result.repository';
import { VersionConflictError } from '../storage/storage.errors';
import { ReviewActivityDto } from '../transactions/dto/transaction-response.dto';
import { CreateReviewDto, ReviewResultDto } from './dto/create-review.dto';
import { ReviewActivity } from './entities/review-activity.entity';
import { Review } from './entities/review.entity';
import { Reviewer } from './entities/reviewer.entity';
import { ReviewState } from './enums/review.enums';
import { decideReview } from './review-rules';
import { toActivity, toReviewState } from './reviews.mapper';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly records: TransactionRecordRepository,
    private readonly results: ValidationResultRepository,
    private readonly reviews: ReviewRepository,
    private readonly activity: ReviewActivityRepository,
    private readonly reviewers: ReviewerRepository,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Applies one review action. Refused actions (404/409/422) change nothing
   * and add no history; an accepted one updates the review and appends
   * exactly one activity entry.
   */
  async act(
    recordId: string,
    dto: CreateReviewDto,
    reviewer: Reviewer,
  ): Promise<ReviewResultDto> {
    const record = await this.records.findById(recordId);
    if (!record) throw new NotFoundException('Transaction not found');

    const [validation, current] = await Promise.all([
      this.results.findByRecordId(recordId),
      this.reviews.findByRecordId(recordId),
    ]);
    if (!validation) {
      throw new Error(`No validation result for record ${recordId}`);
    }

    // Checked first so a stale screen gets "reload" rather than a rule
    // message about a state it isn't showing.
    if ((current?.version ?? 0) !== dto.expectedVersion) {
      throw await this.staleScreen(record.recordRef, current);
    }

    const fromState = current?.state ?? ReviewState.NOT_REVIEWED;
    const decision = decideReview({
      action: dto.action,
      recordRef: record.recordRef,
      sourceStatus: record.sourceStatus,
      validationStatus: validation.status,
      issueCount: validation.issues.length,
      currentState: fromState,
    });
    if (!decision.allowed) {
      throw new UnprocessableEntityException(decision.reason);
    }

    const now = new Date().toISOString();
    const note = dto.note ?? null;
    let saved: Review;
    try {
      // Storage re-checks the version atomically, which closes the gap
      // between the check above and this write.
      saved = await this.reviews.save(
        {
          recordId,
          state: decision.toState,
          note,
          updatedBy: reviewer.id,
          updatedAt: now,
        },
        dto.expectedVersion,
      );
    } catch (error) {
      if (error instanceof VersionConflictError) {
        throw await this.staleScreen(
          record.recordRef,
          await this.reviews.findByRecordId(recordId),
        );
      }
      throw error;
    }

    const entry = await this.activity.append(
      new ReviewActivity({
        id: randomUUID(),
        recordId,
        action: dto.action,
        fromState,
        toState: decision.toState,
        note,
        reviewerId: reviewer.id,
        createdAt: now,
      }),
    );

    this.logger.log(
      `Review ${record.recordRef} (${recordId}): ${fromState} → ` +
        `${decision.toState} by ${reviewer.id}`,
    );
    return { review: toReviewState(saved), activity: toActivity(entry) };
  }

  async history(recordId: string): Promise<ReviewActivityDto[]> {
    if (!(await this.records.findById(recordId))) {
      throw new NotFoundException('Transaction not found');
    }
    return (await this.activity.findByRecordId(recordId)).map(toActivity);
  }

  private async staleScreen(
    recordRef: string,
    current: Review | null,
  ): Promise<ConflictException> {
    if (!current) {
      return new ConflictException(
        `${recordRef} has changed since you loaded it. Reload and try again.`,
      );
    }
    const by = await this.reviewers.findById(current.updatedBy);
    return new ConflictException(
      `${recordRef} was updated by ${by?.name ?? current.updatedBy} ` +
        `since you loaded it. Reload to see the latest decision.`,
    );
  }
}
