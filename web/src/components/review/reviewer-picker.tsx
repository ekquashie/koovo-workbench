import { Select } from "@/components/ui/select";
import { useReviewersQuery } from "@/integration";
import { useReviewerStore } from "@/store/reviewer-store";

/**
 * Mock sign-in: who review actions are recorded against. Shown in the page
 * header, and again inside the review form when nobody is chosen yet; both
 * use the same store, so they always agree.
 */
export const ReviewerPicker = ({
  label = "Reviewing as",
}: {
  label?: string;
}) => {
  const { data: reviewers = [], isLoading } = useReviewersQuery();
  const { reviewerId, setReviewer } = useReviewerStore();

  // A remembered id that is no longer valid is treated as "not chosen".
  const known = reviewers.some((r) => r.id === reviewerId);

  return (
    <Select
      label={label}
      placeholder={isLoading ? "Loading…" : "Choose reviewer…"}
      value={known ? reviewerId! : ""}
      options={reviewers.map((r) => ({ value: r.id, label: r.name }))}
      onChange={(value) => setReviewer(value || null)}
      disabled={isLoading}
    />
  );
};
