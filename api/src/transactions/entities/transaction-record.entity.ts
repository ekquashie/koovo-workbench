import {
  SourceStatus,
  SourceSystem,
  TransactionType,
} from '../enums/transaction.enums';
import { RawTransaction } from './raw-transaction';

/** One per input row, repeats included. `raw` is never modified. */
export class TransactionRecord {
  id!: string;
  importId!: string;
  /** Global arrival order; decides which of two repeats came first. */
  sequence!: number;
  recordRef!: string;
  raw!: Readonly<RawTransaction>;
  clientId!: string;
  source!: SourceSystem;
  sourceId!: string;
  type!: TransactionType;
  sourceStatus!: SourceStatus;
  /** `-` or blank in the input becomes null. */
  supplierName!: string | null;
  /** Amounts in pence; `-` in the input becomes null (missing, not zero). */
  subtotalMinor!: number | null;
  vatMinor!: number | null;
  totalMinor!: number | null;
  /** `clientId|source|sourceId`, e.g. `C01|XERO|X-101`. */
  identityKey!: string;
  receivedAt!: string;

  constructor(props: TransactionRecord) {
    Object.assign(this, props);
  }
}

/** A record before storage has assigned its arrival sequence. */
export type NewTransactionRecord = Omit<TransactionRecord, 'sequence'>;
