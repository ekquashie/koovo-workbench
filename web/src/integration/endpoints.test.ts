import { describe, expect, it } from "vitest";
import { buildEndpoint } from "./endpoints";
import { transactionKeys } from "./query-keys";

describe("buildEndpoint", () => {
  it("builds record paths", () => {
    expect(buildEndpoint.transaction("abc")).toBe("transactions/abc");
    expect(buildEndpoint.transactionReviews("abc")).toBe(
      "transactions/abc/reviews",
    );
    expect(buildEndpoint.transactionActivity("abc")).toBe(
      "transactions/abc/activity",
    );
  });

  it("encodes ids so they cannot change the path", () => {
    expect(buildEndpoint.transaction("../imports")).toBe(
      "transactions/..%2Fimports",
    );
  });
});

describe("transactionKeys", () => {
  it("treats empty filters like no filter (one cache entry)", () => {
    expect(transactionKeys.list({ clientId: "", status: undefined })).toEqual(
      transactionKeys.list({}),
    );
    expect(transactionKeys.summary("")).toEqual(transactionKeys.summary());
  });

  it("nests every key under transactions, so one invalidation covers all", () => {
    for (const key of [
      transactionKeys.list({ status: "VALID" }),
      transactionKeys.summary("C01"),
      transactionKeys.detail("id"),
      transactionKeys.activity("id"),
    ]) {
      expect(key[0]).toBe(transactionKeys.all[0]);
    }
  });
});
