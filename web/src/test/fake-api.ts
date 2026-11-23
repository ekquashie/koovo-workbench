import type { AxiosRequestConfig } from "axios";
import { vi } from "vitest";
import { apiClient, type TransactionListItem } from "@/integration";
import { ok } from "./http";
import { ITEMS, REVIEWERS, summaryOf } from "./fixtures";

/**
 * Replaces apiClient.get with an in-memory API that applies the same
 * filters as the real one, so components are tested against realistic
 * behaviour. Returns the spy to assert on requests.
 */
export function fakeApi(items: TransactionListItem[] = ITEMS) {
  return vi
    .spyOn(apiClient, "get")
    .mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
      const params = (config?.params ?? {}) as {
        clientId?: string;
        status?: string;
      };
      switch (url) {
        case "../health":
          return ok({ status: "ok" });
        case "reviewers":
          return ok(REVIEWERS);
        case "transactions/summary":
          return ok(summaryOf(items, params.clientId));
        case "transactions":
          return ok(
            items.filter(
              (i) =>
                (!params.clientId || i.clientId === params.clientId) &&
                (!params.status || i.validation.status === params.status),
            ),
          );
        default: {
          const id = url.replace("transactions/", "");
          const item = items.find((i) => i.id === id);
          if (item)
            return ok({ ...item, raw: {}, relatedRecords: [], activity: [] });
          throw new Error(`fakeApi: unhandled GET ${url}`);
        }
      }
    });
}

/** Params of every GET to `url`, in order. */
export const requestsTo = (spy: ReturnType<typeof fakeApi>, url: string) =>
  spy.mock.calls
    .filter(([u]) => u === url)
    .map(([, config]) => (config as AxiosRequestConfig | undefined)?.params);
