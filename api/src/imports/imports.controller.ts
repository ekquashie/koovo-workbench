import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../interceptors/response.interceptor';
import { CreateImportDto } from './dto/create-import.dto';
import { ImportBatchDto, ImportResultDto } from './dto/import-result.dto';
import { ImportBatch } from './entities/import-batch.entity';
import { ImportOrigin } from './enums/import-origin.enum';
import { ImportsService } from './imports.service';

@ApiTags('Imports')
@Controller('imports')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  /** Ingest raw transactions and re-validate the whole dataset. */
  @Post()
  @ResponseMessage('Import accepted')
  @ApiCreatedResponse({ type: ImportResultDto })
  @ApiBadRequestResponse({
    description:
      'Body shape is wrong or a row is malformed. Nothing is stored; ' +
      '`errors` lists every problem, keyed like `records.3.total`.',
  })
  create(@Body() body: CreateImportDto): Promise<ImportResultDto> {
    return this.imports.import(body.records, ImportOrigin.API);
  }

  /** Import batches, oldest first. */
  @Get()
  @ApiOkResponse({ type: [ImportBatchDto] })
  findAll(): Promise<ImportBatch[]> {
    return this.imports.findAll();
  }
}
