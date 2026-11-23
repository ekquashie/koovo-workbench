import { z } from "zod";
import { REVIEW_ACTIONS } from "@/integration";

export const NOTE_MIN = 3;
export const NOTE_MAX = 500;

/**
 * Mirrors the API's CreateReviewDto (same limits, same wording) so the user
 * gets the same message whether the browser or the server catches it. The
 * server still checks: this is for fast feedback, not trust.
 */
export const reviewFormSchema = z
  .object({
    action: z.enum(REVIEW_ACTIONS),
    note: z
      .string()
      .trim()
      .max(NOTE_MAX, `The note must be at most ${NOTE_MAX} characters.`),
  })
  .superRefine(({ action, note }, ctx) => {
    if (action !== "MARK_NEEDS_CORRECTION" || note.length >= NOTE_MIN) return;
    ctx.addIssue({
      code: "custom",
      path: ["note"],
      message:
        note.length === 0
          ? "Add a short note explaining what needs correcting."
          : `The note must be at least ${NOTE_MIN} characters.`,
    });
  });

export type ReviewFormInput = z.input<typeof reviewFormSchema>;
export type ReviewFormValues = z.output<typeof reviewFormSchema>;
