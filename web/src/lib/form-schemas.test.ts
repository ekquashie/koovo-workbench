import { describe, expect, it } from "vitest";
import { NOTE_MAX, reviewFormSchema } from "./form-schemas";

const parse = (
  action: "MARK_REVIEWED" | "MARK_NEEDS_CORRECTION",
  note: string,
) => reviewFormSchema.safeParse({ action, note });

const noteError = (result: ReturnType<typeof parse>) =>
  result.success
    ? undefined
    : result.error.issues.find((i) => i.path[0] === "note")?.message;

describe("reviewFormSchema (mirrors the API's CreateReviewDto)", () => {
  it("lets Mark reviewed through with no note", () => {
    expect(parse("MARK_REVIEWED", "")).toMatchObject({
      success: true,
      data: { note: "" },
    });
  });

  it("requires a note for Needs correction, with the API's wording", () => {
    expect(noteError(parse("MARK_NEEDS_CORRECTION", ""))).toBe(
      "Add a short note explaining what needs correcting.",
    );
    expect(noteError(parse("MARK_NEEDS_CORRECTION", "   "))).toBe(
      "Add a short note explaining what needs correcting.",
    );
  });

  it("counts length after trimming (3–500)", () => {
    expect(noteError(parse("MARK_NEEDS_CORRECTION", "  ab  "))).toBe(
      "The note must be at least 3 characters.",
    );
    expect(parse("MARK_NEEDS_CORRECTION", "  abc  ")).toMatchObject({
      success: true,
      data: { note: "abc" },
    });
    expect(parse("MARK_NEEDS_CORRECTION", "x".repeat(NOTE_MAX)).success).toBe(
      true,
    );
  });

  it("caps any note at 500 characters, whichever action", () => {
    for (const action of ["MARK_REVIEWED", "MARK_NEEDS_CORRECTION"] as const) {
      expect(noteError(parse(action, "x".repeat(NOTE_MAX + 1)))).toBe(
        "The note must be at most 500 characters.",
      );
    }
  });

  it("rejects an unknown action", () => {
    expect(
      reviewFormSchema.safeParse({ action: "APPROVE", note: "" }).success,
    ).toBe(false);
  });
});
