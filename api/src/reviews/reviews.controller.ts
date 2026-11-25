import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ResponseMessage } from '../interceptors/response.interceptor';
import { ReviewerRepository } from '../storage/repositories/reviewer.repository';
import { ReviewActivityDto } from '../transactions/dto/transaction-response.dto';
import { CurrentReviewer, ReviewerGuard } from './auth/current-reviewer';
import { CreateReviewDto, ReviewResultDto } from './dto/create-review.dto';
import { Reviewer } from './entities/reviewer.entity';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('transactions/:id')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Mark a record Reviewed or Needs Correction. */
  @Post('reviews')
  @UseGuards(ReviewerGuard)
  @ResponseMessage('Review recorded')
  @ApiHeader({ name: 'X-Reviewer-Id', required: true, example: 'rev-eyram' })
  @ApiCreatedResponse({ type: ReviewResultDto })
  @ApiUnauthorizedResponse({ description: 'Missing or unknown reviewer' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiConflictResponse({
    description: 'expectedVersion is stale: someone else changed the review',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Not allowed: excluded record, unresolved issues, or already Reviewed',
  })
  review(
    @Param('id') id: string,
    @Body() body: CreateReviewDto,
    @CurrentReviewer() reviewer: Reviewer,
  ) {
    return this.reviews.act(id, body, reviewer);
  }

  /** Review history, oldest first. */
  @Get('activity')
  @ApiOkResponse({ type: [ReviewActivityDto] })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  activity(@Param('id') id: string) {
    return this.reviews.history(id);
  }
}

@ApiTags('Reviews')
@Controller('reviewers')
export class ReviewersController {
  constructor(private readonly reviewers: ReviewerRepository) {}

  /** Mock reviewers for the UI picker. */
  @Get()
  @ApiOkResponse({ type: [Reviewer] })
  findAll() {
    return this.reviewers.findAll();
  }
}
