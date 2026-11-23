import { QueryClient } from "@tanstack/react-query";

/**
 * Data is in-memory on the API and only changes through this UI, so a short
 * stale time is enough; mutations invalidate what they change explicitly.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false },
    },
  });
}
