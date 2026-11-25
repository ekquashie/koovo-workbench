import type { AxiosRequestConfig } from "axios";
import { vi } from "vitest";
import {
  apiClient,
  type CreateReviewBody,
  type ReviewActivity,
  type ReviewState,
  type TransactionListItem,
} from "@/integration";
import { apiError, ok } from "./http";
import { ITEMS, REVIEWERS, makeDetail, summaryOf } from "./fixtures";

const TO_STATE: Record<CreateReviewBody["action"], ReviewState> = {
  MARK_REVIEWED: "REVIEWED",
  MARK_NEEDS_CORRECTION: "NEEDS_CORRECTION",
};

/**
 * Replaces apiClient with an in-memory API that behaves like the real one:
 * the same filters, a detail view, and a review endpoint that keeps state
 * and checks `expectedVersion` (409). Business rules are the API's job and
 * are tested there; this fake accepts any action on a posted record.
 * Returns the GET spy, with the POST spy attached as `.post`.
 */
export function fakeApi(initial: TransactionListItem[] = ITEMS) {
  const items: TransactionListItem[] = structuredClone(initial);
  const history = new Map<string, ReviewActivity[]>();
  let clock = 0;

  const get = vi
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
          const item = items.find((i) => `transactions/${i.id}` === url);
          if (!item) throw apiError(404, "Transaction not found");
          return ok(makeDetail(item, items, history.get(item.id)));
        }
      }
    });

  const post = vi
    .spyOn(apiClient, "post")
    .mockImplementation(
      async (url: string, body: unknown, config?: AxiosRequestConfig) => {
        const item = items.find((i) => `transactions/${i.id}/reviews` === url);
        if (!item) throw apiError(404, "Transaction not found");
        const { action, note, expectedVersion } = body as CreateReviewBody;
        if (expectedVersion !== item.review.version) {
          throw apiError(
            409,
            `${item.recordRef} was updated by someone else since you loaded it.`,
          );
        }
        const reviewerId = (config?.headers as Record<string, string>)[
          "X-Reviewer-Id"
        ];
        const at = new Date(Date.UTC(2026, 10, 23, 12, clock++)).toISOString();
        const activity: ReviewActivity = {
          id: `act-${clock}`,
          action,
          fromState: item.review.state,
          toState: TO_STATE[action],
          note: note ?? null,
          reviewerId,
          createdAt: at,
        };
        item.review = {
          state: activity.toState,
          note: activity.note,
          updatedBy: reviewerId,
          updatedAt: at,
          version: item.review.version + 1,
        };
        history.set(item.id, [...(history.get(item.id) ?? []), activity]);
        return ok({ review: item.review, activity }, 201);
      },
    );

  return Object.assign(get, { post, items });
}

/** Params of every GET to `url`, in order. */
export const requestsTo = (spy: ReturnType<typeof fakeApi>, url: string) =>
  spy.mock.calls
    .filter(([u]) => u === url)
    .map(([, config]) => (config as AxiosRequestConfig | undefined)?.params);
