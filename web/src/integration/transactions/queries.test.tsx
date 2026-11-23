import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";
import { useTransactionQuery, useTransactionsQuery } from "./queries";
import { ok } from "@/test/http";
import { createTestQueryClient, wrapperFor } from "@/test/query-wrapper";

describe("transactions queries", () => {
  afterEach(() => vi.restoreAllMocks());

  it("unwraps the envelope to the list", async () => {
    const rows = [{ id: "a", recordRef: "R001" }];
    vi.spyOn(apiClient, "get").mockResolvedValue(ok(rows));
    const { result } = renderHook(
      () => useTransactionsQuery({ status: "VALID" }),
      {
        wrapper: wrapperFor(createTestQueryClient()),
      },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(rows);
  });

  it("does not fetch a detail until a record is selected", () => {
    const get = vi.spyOn(apiClient, "get");
    const { result } = renderHook(() => useTransactionQuery(null), {
      wrapper: wrapperFor(createTestQueryClient()),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(get).not.toHaveBeenCalled();
  });
});
