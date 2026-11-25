import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReviewerRepository } from '../../storage/repositories/reviewer.repository';
import { Reviewer } from '../entities/reviewer.entity';

export const REVIEWER_HEADER = 'x-reviewer-id';

type RequestWithReviewer = Request & { reviewer?: Reviewer };

/**
 * Mock identity (the brief allows it): the UI picks a reviewer and sends
 * their id in X-Reviewer-Id. Checked against the fixed list so an unknown id
 * can't write history. With real auth this guard would read the JWT instead,
 * and controllers wouldn't change.
 */
@Injectable()
export class ReviewerGuard implements CanActivate {
  constructor(private readonly reviewers: ReviewerRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithReviewer>();
    const header = request.headers[REVIEWER_HEADER];
    const id = (Array.isArray(header) ? header[0] : header)?.trim();
    if (!id) {
      throw new UnauthorizedException(
        'Choose a reviewer first (send the X-Reviewer-Id header).',
      );
    }
    const reviewer = await this.reviewers.findById(id);
    if (!reviewer) throw new UnauthorizedException(`Unknown reviewer "${id}".`);
    request.reviewer = reviewer;
    return true;
  }
}

/** The reviewer resolved by ReviewerGuard. */
export const CurrentReviewer = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Reviewer => {
    const reviewer = context
      .switchToHttp()
      .getRequest<RequestWithReviewer>().reviewer;
    // Only reachable if a route forgets @UseGuards(ReviewerGuard).
    if (!reviewer)
      throw new Error('CurrentReviewer used without ReviewerGuard');
    return reviewer;
  },
);
