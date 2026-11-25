import { Module } from '@nestjs/common';
import { ReviewerGuard } from './auth/current-reviewer';
import { ReviewersController, ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [ReviewsController, ReviewersController],
  providers: [ReviewsService, ReviewerGuard],
})
export class ReviewsModule {}
