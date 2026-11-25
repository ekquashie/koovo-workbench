import type {
  IssueCode,
  ReviewState,
  SourceStatus,
  SourceSystem,
  TransactionType,
  ValidationStatus,
} from "@/integration";

/** Accountant-facing wording for every API enum, in one place. */
export const VALIDATION_STATUS_LABEL: Record<ValidationStatus, string> = {
  VALID: "Valid",
  NEEDS_ATTENTION: "Needs attention",
  EXCLUDED: "Excluded",
};

export const REVIEW_STATE_LABEL: Record<ReviewState, string> = {
  NOT_REVIEWED: "Not reviewed",
  REVIEWED: "Reviewed",
  NEEDS_CORRECTION: "Needs correction",
};

export const ISSUE_LABEL: Record<IssueCode, string> = {
  TOTAL_MISMATCH: "Total mismatch",
  MISSING_SUPPLIER: "Missing supplier",
  MISSING_AMOUNT: "Missing amount",
  INVALID_AMOUNT_SIGN: "Negative amount on bill",
  DUPLICATE_SOURCE_TRANSACTION: "Duplicate",
  CONFLICTING_SOURCE_TRANSACTION: "Conflicting versions",
};

export const SOURCE_LABEL: Record<SourceSystem, string> = {
  XERO: "Xero",
  SAGE: "Sage",
};

export const TYPE_LABEL: Record<TransactionType, string> = {
  BILL: "Bill",
  CREDIT: "Credit",
};

export const SOURCE_STATUS_LABEL: Record<SourceStatus, string> = {
  POSTED: "Posted",
  DRAFT: "Draft",
  VOID: "Void",
};
