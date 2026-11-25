import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RawTransaction } from '../transactions/entities/raw-transaction';
import { ImportResultDto } from './dto/import-result.dto';
import { ImportOrigin } from './enums/import-origin.enum';
import { ImportsService } from './imports.service';

/** src/data in development and tests; dist/data after `nest build` (assets). */
export const SEED_FILE = join(
  __dirname,
  '..',
  'data',
  'seed-transactions.json',
);

/**
 * Loads the brief's dataset when the app starts, through the same import
 * path as POST /imports, so seeded and API data are processed identically.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    private readonly config: ConfigService,
    private readonly imports: ImportsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get<boolean>('seedOnStartup')) await this.seed();
  }

  /** A broken seed file fails startup loudly rather than serving no data. */
  async seed(file = SEED_FILE): Promise<ImportResultDto> {
    const { records } = JSON.parse(await readFile(file, 'utf8')) as {
      records: RawTransaction[];
    };
    return this.imports.import(records, ImportOrigin.SEED);
  }
}
