/**
 * Paths relative to API_BASE_URL (/api/v1). Health is version-neutral on the
 * API, so it steps out of the versioned base.
 */
export const ENDPOINTS = {
  HEALTH: "../health",
  IMPORTS: "imports",
  TRANSACTIONS: "transactions",
  TRANSACTIONS_SUMMARY: "transactions/summary",
  REVIEWERS: "reviewers",
} as const;

/** Ids are encoded so an odd id can never change the path. */
const id = (value: string) => encodeURIComponent(value);

export const buildEndpoint = {
  transaction: (transactionId: string) => `transactions/${id(transactionId)}`,
  transactionReviews: (transactionId: string) =>
    `transactions/${id(transactionId)}/reviews`,
  transactionActivity: (transactionId: string) =>
    `transactions/${id(transactionId)}/activity`,
} as const;
