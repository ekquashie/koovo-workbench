/** Envelope every API response is wrapped in by the NestJS ResponseInterceptor. */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  /** Present on 400s from FieldValidationException: field -> message. */
  errors?: Record<string, string>;
}

// Mirrors api/src/**/dto. Enums are string unions plus a runtime list, so the
// UI can both type-check and render options from one source.

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: "ok";
}

// ─── Enums ────────────────────────────────────────────────────────────────────

export const VALIDATION_STATUSES = [
  "VALID",
  "NEEDS_ATTENTION",
  "EXCLUDED",
] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export const REVIEW_STATES = [
  "NOT_REVIEWED",
  "REVIEWED",
  "NEEDS_CORRECTION",
] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

export const REVIEW_ACTIONS = [
  "MARK_REVIEWED",
  "MARK_NEEDS_CORRECTION",
] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export type IssueCode =
  | "TOTAL_MISMATCH"
  | "MISSING_SUPPLIER"
  | "MISSING_AMOUNT"
  | "INVALID_AMOUNT_SIGN"
  | "DUPLICATE_SOURCE_TRANSACTION"
  | "CONFLICTING_SOURCE_TRANSACTION";

export type SourceSystem = "XERO" | "SAGE";
export type TransactionType = "BILL" | "CREDIT";
export type SourceStatus = "POSTED" | "DRAFT" | "VOID";
export type ImportOrigin = "SEED" | "API";

// ─── Transactions ─────────────────────────────────────────────────────────────

/** The row exactly as received; every column is a string ("-" = missing). */
export interface RawTransaction {
  record: string;
  client: string;
  source: string;
  sourceId: string;
  type: string;
  status: string;
  supplier: string;
  subtotal: string;
  vat: string;
  total: string;
}

/**
 * Display strings ("120.00") and integer pence. Never do arithmetic on the
 * strings; null means missing in the source, not zero.
 */
export interface Amounts {
  subtotal: string | null;
  vat: string | null;
  total: string | null;
  subtotalMinor: number | null;
  vatMinor: number | null;
  totalMinor: number | null;
}

export interface ValidationIssue {
  code: IssueCode;
  message: string;
  /** Columns to highlight, e.g. ["total"]. */
  fields: string[];
  relatedRecordIds: string[];
}

export interface Validation {
  status: ValidationStatus;
  issues: ValidationIssue[];
  /** False for repeats, conflicts and excluded records. */
  processed: boolean;
  validatedAt: string;
}

export interface ReviewStatus {
  state: ReviewState;
  note: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
  /** Send back as expectedVersion when reviewing. 0 = never reviewed. */
  version: number;
}

export interface TransactionListItem {
  id: string;
  sequence: number;
  recordRef: string;
  clientId: string;
  source: SourceSystem;
  sourceId: string;
  type: TransactionType;
  sourceStatus: SourceStatus;
  supplierName: string | null;
  amounts: Amounts;
  validation: Validation;
  review: ReviewStatus;
  receivedAt: string;
}

export interface RelatedRecord {
  id: string;
  recordRef: string;
}

export interface ReviewActivity {
  id: string;
  action: ReviewAction;
  fromState: ReviewState;
  toState: ReviewState;
  note: string | null;
  reviewerId: string;
  createdAt: string;
}

export interface TransactionDetail extends TransactionListItem {
  importId: string;
  identityKey: string;
  raw: RawTransaction;
  relatedRecords: RelatedRecord[];
  /** Oldest first. */
  activity: ReviewActivity[];
}

export type StatusCounts = Record<ValidationStatus, number>;

export interface TransactionSummary {
  counts: StatusCounts;
  total: number;
  /** Every client, regardless of the clientId filter. */
  clients: string[];
}

export interface TransactionFilters {
  clientId?: string;
  status?: ValidationStatus;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface Reviewer {
  id: string;
  name: string;
}

export interface CreateReviewBody {
  action: ReviewAction;
  /** Required (3–500 chars) for MARK_NEEDS_CORRECTION. */
  note?: string;
  expectedVersion: number;
}

export interface ReviewResult {
  review: ReviewStatus;
  activity: ReviewActivity;
}

// ─── Imports ──────────────────────────────────────────────────────────────────

export interface ImportBatch {
  id: string;
  origin: ImportOrigin;
  recordCount: number;
  importedAt: string;
}

export interface CreateImportBody {
  records: RawTransaction[];
}

export interface ImportResult {
  import: ImportBatch;
  recordIds: string[];
  /** Whole dataset after the import. */
  summary: StatusCounts;
}
