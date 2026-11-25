import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ReviewerState {
  /** Sent as X-Reviewer-Id on review actions. */
  reviewerId: string | null;
  setReviewer: (reviewerId: string | null) => void;
}

/**
 * Who is reviewing (mock identity). Remembered across reloads so the
 * accountant doesn't pick themselves every time; the picker ignores an id
 * that is no longer in the reviewer list.
 */
export const useReviewerStore = create<ReviewerState>()(
  persist(
    (set) => ({
      reviewerId: null,
      setReviewer: (reviewerId) => set({ reviewerId: reviewerId || null }),
    }),
    {
      name: "koovo.reviewer",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
