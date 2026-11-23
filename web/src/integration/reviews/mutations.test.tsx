import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";
import { transactionKeys } from "../query-keys";
import { useCreateReviewMutation } from "./mutations";
import { apiError, ok } from "@/test/http";
import { createTestQueryClient, wrapperFor } from "@/test/query-wrapper";

const variables = {
  transactionId: "id-1",
  reviewerId: "rev-ama",
  body: { action: "MARK_REVIEWED" as const, expectedVersion: 0 },
};

function setup() {
  const client = createTestQueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const { result } = renderHook(() => useCreateReviewMutation(), {
    wrapper: wrapperFor(client),
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
}

describe("useCreateReviewMutation", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the unwrapped result and refreshes the record, its history and lists", async () => {
    const reviewResult = {
      review: { state: "REVIEWED", version: 1 },
      activity: {},
    };
    vi.spyOn(apiClient, "post").mockResolvedValue(ok(reviewResult, 201));
    const { result, invalidatedKeys } = setup();

    const returned = await act(() => result.current.mutateAsync(variables));

    expect(returned).toEqual(reviewResult);
    expect(invalidatedKeys()).toEqual([
      transactionKeys.detail("id-1"),
      transactionKeys.activity("id-1"),
      transactionKeys.lists(),
    ]);
  });

  it("does not refresh summary counts (reviews never change validation)", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValue(ok({}, 201));
    const { result, invalidatedKeys } = setup();
    await act(() => result.current.mutateAsync(variables));
    expect(invalidatedKeys()).not.toContainEqual(transactionKeys.summaries());
    expect(invalidatedKeys()).not.toContainEqual(transactionKeys.all);
  });

  it("on 409 refreshes the record so the newer decision shows", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue(apiError(409, "Reload"));
    const { result, invalidatedKeys } = setup();

    act(() => result.current.mutate(variables));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidatedKeys()).toContainEqual(transactionKeys.detail("id-1"));
  });

  it("on other errors changes nothing", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue(apiError(422, "Not allowed"));
    const { result, invalidatedKeys } = setup();

    act(() => result.current.mutate(variables));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidatedKeys()).toEqual([]);
  });
});
