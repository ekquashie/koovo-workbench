import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";
import { createReview } from "./api-functions";
import { ok } from "@/test/http";

describe("createReview", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts the body with the reviewer in X-Reviewer-Id", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(ok({}, 201));
    const body = {
      action: "MARK_NEEDS_CORRECTION" as const,
      note: "VAT looks wrong",
      expectedVersion: 0,
    };

    await createReview("id-1", "rev-eyram", body);

    expect(post).toHaveBeenCalledWith("transactions/id-1/reviews", body, {
      headers: { "X-Reviewer-Id": "rev-eyram" },
    });
  });

  it("keeps any other headers the caller passes", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(ok({}, 201));
    await createReview(
      "id-1",
      "rev-shiela",
      { action: "MARK_REVIEWED", expectedVersion: 1 },
      { headers: { "X-Trace": "t1" } },
    );
    expect(post.mock.calls[0][2]).toEqual({
      headers: { "X-Trace": "t1", "X-Reviewer-Id": "rev-shiela" },
    });
  });
});
