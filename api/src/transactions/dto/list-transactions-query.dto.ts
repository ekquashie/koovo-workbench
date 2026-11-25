import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { trimToUndefined, trimUpperToUndefined } from '../../helper/transforms';
import { ValidationStatus } from '../enums/validation.enums';

export class SummaryQueryDto {
  /** Only count this client's records, e.g. C01. */
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(50)
  clientId?: string;
}

export class ListTransactionsQueryDto extends SummaryQueryDto {
  /** Case-insensitive: `valid` works. */
  @IsOptional()
  @Transform(trimUpperToUndefined)
  @IsEnum(ValidationStatus, {
    message: `status must be one of: ${Object.values(ValidationStatus).join(', ')}`,
  })
  status?: ValidationStatus;
}
