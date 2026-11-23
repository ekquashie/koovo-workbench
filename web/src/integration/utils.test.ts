import { describe, expect, it } from "vitest";
import {
  getErrorMessage,
  getErrorStatus,
  getFieldErrors,
  isConflictError,
} from "./utils";
import { GENERIC_SERVER_ERROR_MESSAGE } from "@/lib/api-error";
import { apiError } from "@/test/http";

describe("getErrorMessage", () => {
  it("shows the API's message for 4xx responses", () => {
    expect(getErrorMessage(apiError(400, "Note is required"))).toBe(
      "Note is required",
    );
  });

  it("hides server details for 5xx responses", () => {
    expect(getErrorMessage(apiError(500, "db exploded"))).toBe(
      GENERIC_SERVER_ERROR_MESSAGE,
    );
  });

  it("falls back for non-axios errors", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
    expect(getErrorMessage("??")).toBe("An unexpected error occurred");
  });
});

describe("getFieldErrors", () => {
  it("returns the per-field map from a 400", () => {
    const error = apiError(400, "Add a short note", {
      note: "Add a short note",
    });
    expect(getFieldErrors(error)).toEqual({ note: "Add a short note" });
  });

  it("is undefined for other statuses or errors without a map", () => {
    expect(getFieldErrors(apiError(422, "Not allowed"))).toBeUndefined();
    expect(getFieldErrors(apiError(400, "Bad"))).toBeUndefined();
    expect(getFieldErrors(new Error("x"))).toBeUndefined();
  });
});

describe("status helpers", () => {
  it("reads the HTTP status, undefined for network errors", () => {
    expect(getErrorStatus(apiError(404, "Not found"))).toBe(404);
    expect(getErrorStatus(new Error("offline"))).toBeUndefined();
  });

  it("recognises a 409 stale-screen conflict", () => {
    expect(isConflictError(apiError(409, "Reload"))).toBe(true);
    expect(isConflictError(apiError(422, "No"))).toBe(false);
  });
});
