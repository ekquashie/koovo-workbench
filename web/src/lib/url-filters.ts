import {
  VALIDATION_STATUSES,
  type TransactionFilters,
  type ValidationStatus,
} from "@/integration";

/**
 * Filters live in the URL so a filtered view can be refreshed, bookmarked or
 * shared: `/?status=needs_attention&client=C01`. The names match what an
 * accountant would type; values are checked here, so a bad link shows
 * everything instead of breaking the page.
 */
export const FILTER_PARAMS = { client: "client", status: "status" } as const;

/** Reads filters from a query string. Unknown or empty values are ignored. */
export function filtersFromSearch(search: string): TransactionFilters {
  const params = new URLSearchParams(search);
  const clientId = params.get(FILTER_PARAMS.client)?.trim() || undefined;
  // Any case, like the API: "needs_attention" and "NEEDS_ATTENTION" both work.
  const rawStatus = params.get(FILTER_PARAMS.status)?.trim().toUpperCase();
  const status = VALIDATION_STATUSES.find((s) => s === rawStatus) as
    ValidationStatus | undefined;
  return { clientId, status };
}

/**
 * Writes filters into a query string, keeping any other params. Status is
 * written in lower case because it reads better in an address bar. Returns
 * "" when nothing is left, so a clear filter gives a clean URL.
 */
export function searchFromFilters(
  filters: TransactionFilters,
  currentSearch = "",
): string {
  const params = new URLSearchParams(currentSearch);
  const set = (key: string, value: string | undefined) =>
    value ? params.set(key, value) : params.delete(key);
  set(FILTER_PARAMS.client, filters.clientId);
  set(FILTER_PARAMS.status, filters.status?.toLowerCase());
  const query = params.toString();
  return query ? `?${query}` : "";
}
