import type { TransactionFilters } from "./types";

/**
 * One place for every cache key, so mutations invalidate exactly what they
 * changed. Hierarchical: invalidating `transactionKeys.all` hits lists,
 * summaries, details and activity in one go.
 */
export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.lists(), normaliseFilters(filters)] as const,
  summaries: () => [...transactionKeys.all, "summary"] as const,
  summary: (clientId?: string) =>
    [
      ...transactionKeys.summaries(),
      { clientId: clientId || undefined },
    ] as const,
  detail: (id: string) => [...transactionKeys.all, "detail", id] as const,
  activity: (id: string) => [...transactionKeys.all, "activity", id] as const,
};

export const reviewerKeys = {
  all: ["reviewers"] as const,
};

export const importKeys = {
  all: ["imports"] as const,
};

/** "" and undefined mean the same filter, so they share one cache entry. */
function normaliseFilters({
  clientId,
  status,
}: TransactionFilters): TransactionFilters {
  return { clientId: clientId || undefined, status: status || undefined };
}
