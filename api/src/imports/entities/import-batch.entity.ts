import { ImportOrigin } from '../enums/import-origin.enum';

export class ImportBatch {
  id!: string;
  origin!: ImportOrigin;
  /** Records received in this batch, repeats included. */
  recordCount!: number;
  importedAt!: string;

  constructor(props: ImportBatch) {
    Object.assign(this, props);
  }
}
