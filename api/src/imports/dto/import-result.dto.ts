import { ApiProperty } from '@nestjs/swagger';
import { ImportOrigin } from '../enums/import-origin.enum';
import { ValidationStatus } from '../../transactions/enums/validation.enums';

export class ImportBatchDto {
  id!: string;
  @ApiProperty({ enum: ImportOrigin })
  origin!: ImportOrigin;
  recordCount!: number;
  importedAt!: string;
}

export class ImportResultDto {
  import!: ImportBatchDto;
  /** Ids of the records created by this import, in input order. */
  recordIds!: string[];
  /** Counts for the whole dataset after this import, not just this batch. */
  @ApiProperty({
    example: { VALID: 5, NEEDS_ATTENTION: 4, EXCLUDED: 2 },
  })
  summary!: Record<ValidationStatus, number>;
}
