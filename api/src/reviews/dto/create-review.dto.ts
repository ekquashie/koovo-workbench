import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { trimToUndefined } from '../../helper/transforms';
import {
  ReviewActivityDto,
  ReviewStateDto,
} from '../../transactions/dto/transaction-response.dto';
import { ReviewAction } from '../enums/review.enums';

export const NOTE_MIN = 3;
export const NOTE_MAX = 500;

export class CreateReviewDto {
  @ApiProperty({ enum: ReviewAction })
  @IsEnum(ReviewAction, {
    message: `action must be one of: ${Object.values(ReviewAction).join(', ')}`,
  })
  action!: ReviewAction;

  /**
   * Required for MARK_NEEDS_CORRECTION (3–500 characters after trimming);
   * optional for MARK_REVIEWED.
   */
  @ApiProperty({
    required: false,
    example: 'VAT looks wrong, please check the invoice.',
  })
  @Transform(trimToUndefined)
  @ValidateIf(
    (dto: CreateReviewDto) =>
      dto.action === ReviewAction.MARK_NEEDS_CORRECTION ||
      dto.note !== undefined,
  )
  // Stacked decorators register bottom-up, and only the first failure is
  // shown, so the most basic check (IsString) sits at the bottom.
  @MaxLength(NOTE_MAX, {
    message: `The note must be at most ${NOTE_MAX} characters.`,
  })
  @MinLength(NOTE_MIN, {
    message: `The note must be at least ${NOTE_MIN} characters.`,
  })
  @IsString({ message: 'Add a short note explaining what needs correcting.' })
  note?: string;

  /**
   * The `review.version` the screen was showing (0 if never reviewed). If
   * someone has changed the review since, the request is refused with 409.
   */
  @ApiProperty({ example: 0 })
  @IsInt({ message: 'expectedVersion must be a whole number' })
  @Min(0)
  expectedVersion!: number;
}

export class ReviewResultDto {
  review!: ReviewStateDto;
  /** The history entry this action created. */
  activity!: ReviewActivityDto;
}
