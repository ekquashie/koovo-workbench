import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";
import { importKeys, transactionKeys } from "../query-keys";
import { useCreateImportMutation } from "./mutations";
import { ok } from "@/test/http";
import { createTestQueryClient, wrapperFor } from "@/test/query-wrapper";

describe("useCreateImportMutation", () => {
  afterEach(() => vi.restoreAllMocks());

  it("refreshes everything under transactions plus the import list", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValue(
      ok({ import: {}, recordIds: [], summary: {} }, 201),
    );
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateImportMutation(), {
      wrapper: wrapperFor(client),
    });

    await act(() => result.current.mutateAsync({ records: [] }));

    expect(invalidate.mock.calls.map(([f]) => f?.queryKey)).toEqual([
      transactionKeys.all,
      importKeys.all,
    ]);
  });
});
