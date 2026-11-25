import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";
import {
  getTransaction,
  getTransactions,
  getTransactionSummary,
} from "./api-functions";
import { ok } from "@/test/http";

describe("transactions api-functions", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends filters as query params", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(ok([]));
    await getTransactions({ clientId: "C01", status: "NEEDS_ATTENTION" });
    expect(get).toHaveBeenCalledWith("transactions", {
      params: { clientId: "C01", status: "NEEDS_ATTENTION" },
    });
  });

  it("drops empty filters instead of sending ?clientId=", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(ok([]));
    await getTransactions({ clientId: "" });
    expect(get).toHaveBeenCalledWith("transactions", {
      params: { clientId: undefined, status: undefined },
    });
  });

  it("passes the abort signal through", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(ok([]));
    const signal = new AbortController().signal;
    await getTransactions({}, { signal });
    expect(get.mock.calls[0][1]).toMatchObject({ signal });
  });

  it("asks for the summary of one client", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(ok({}));
    await getTransactionSummary("C02");
    expect(get).toHaveBeenCalledWith("transactions/summary", {
      params: { clientId: "C02" },
    });
  });

  it("fetches one record by id", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(ok({}));
    await getTransaction("id-1");
    expect(get).toHaveBeenCalledWith("transactions/id-1", undefined);
  });
});
