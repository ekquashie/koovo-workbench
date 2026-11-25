import { describe, expect, it } from "vitest";
import { filtersFromSearch, searchFromFilters } from "./url-filters";

describe("filtersFromSearch", () => {
  it("reads client and status", () => {
    expect(filtersFromSearch("?status=needs_attention&client=C01")).toEqual({
      clientId: "C01",
      status: "NEEDS_ATTENTION",
    });
  });

  it("accepts the status in any case, like the API", () => {
    expect(filtersFromSearch("?status=Excluded").status).toBe("EXCLUDED");
    expect(filtersFromSearch("?status=VALID").status).toBe("VALID");
  });

  it("ignores an unknown status instead of breaking the page", () => {
    expect(filtersFromSearch("?status=banana&client=C02")).toEqual({
      clientId: "C02",
      status: undefined,
    });
  });

  it("treats a missing, empty or blank value as no filter", () => {
    expect(filtersFromSearch("")).toEqual({
      clientId: undefined,
      status: undefined,
    });
    expect(filtersFromSearch("?client=%20%20&status=")).toEqual({
      clientId: undefined,
      status: undefined,
    });
  });
});

describe("searchFromFilters", () => {
  it("writes client and a lower-case status", () => {
    expect(
      searchFromFilters({ clientId: "C01", status: "NEEDS_ATTENTION" }),
    ).toBe("?client=C01&status=needs_attention");
  });

  it("gives an empty string when there are no filters (a clean URL)", () => {
    expect(searchFromFilters({}, "?client=C01&status=valid")).toBe("");
  });

  it("keeps unrelated params", () => {
    expect(searchFromFilters({ status: "VALID" }, "?utm=mail&client=C01")).toBe(
      "?utm=mail&status=valid",
    );
  });

  it("round-trips", () => {
    const filters = { clientId: "C02", status: "EXCLUDED" as const };
    expect(filtersFromSearch(searchFromFilters(filters))).toEqual(filters);
  });
});
