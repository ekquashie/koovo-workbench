import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { RawTransaction } from '../../transactions/entities/raw-transaction';

/** Largest batch accepted in one request. */
export const MAX_IMPORT_RECORDS = 1000;

/**
 * A required raw column: present, a string, not absurdly long. IsString is
 * listed first so a JSON number reports "must be text" rather than a
 * length error.
 */
const RawColumn = (column: string, maxLength: number) =>
  applyDecorators(
    IsDefined({ message: `${column} is required (use "-" if missing)` }),
    IsString({
      message: `${column} must be text, e.g. "120.00" or "-" for missing`,
    }),
    MaxLength(maxLength, {
      message: `${column} must be at most ${maxLength} characters`,
    }),
  );

/**
 * One row exactly as the source sent it. Only the *shape* is checked here
 * (every column present, as a string). Values are deliberately not trimmed or
 * converted: the original is kept for inspection, and meaning is checked by
 * parseRawTransaction afterwards. Amounts must be strings, not JSON numbers,
 * so "120.10" never passes through a float.
 */
export class RawTransactionDto implements RawTransaction {
  @ApiProperty({ example: 'R001' })
  @RawColumn('record', 50)
  record!: string;

  @ApiProperty({ example: 'C01' })
  @RawColumn('client', 50)
  client!: string;

  @ApiProperty({ example: 'Xero', description: 'Xero or Sage' })
  @RawColumn('source', 50)
  source!: string;

  @ApiProperty({ example: 'X-101' })
  @RawColumn('sourceId', 100)
  sourceId!: string;

  @ApiProperty({ example: 'Bill', description: 'Bill or Credit' })
  @RawColumn('type', 50)
  type!: string;

  @ApiProperty({ example: 'Posted', description: 'Posted, Draft or Void' })
  @RawColumn('status', 50)
  status!: string;

  @ApiProperty({ example: 'Westline Office', description: '"-" if missing' })
  @RawColumn('supplier', 200)
  supplier!: string;

  @ApiProperty({
    example: '100.00',
    description: 'Decimal string; "-" if missing',
  })
  @RawColumn('subtotal', 30)
  subtotal!: string;

  @ApiProperty({
    example: '20.00',
    description: 'Decimal string; "-" if missing',
  })
  @RawColumn('vat', 30)
  vat!: string;

  @ApiProperty({
    example: '120.00',
    description: 'Decimal string; "-" if missing',
  })
  @RawColumn('total', 30)
  total!: string;
}

export class CreateImportDto {
  @ApiProperty({ type: [RawTransactionDto] })
  @IsArray({ message: 'records must be a list of transactions' })
  @ArrayMinSize(1, { message: 'records must contain at least one transaction' })
  @ArrayMaxSize(MAX_IMPORT_RECORDS, {
    message: `records can contain at most ${MAX_IMPORT_RECORDS} transactions per import`,
  })
  @ValidateNested({ each: true })
  @Type(() => RawTransactionDto)
  records!: RawTransactionDto[];
}
