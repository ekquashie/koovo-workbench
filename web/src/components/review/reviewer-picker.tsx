import { Select } from "@/components/ui/select";
import { useReviewersQuery } from "@/integration";
import { useReviewerStore } from "@/store/reviewer-store";

/** Mock sign-in: who review actions are recorded against. */
export const ReviewerPicker = () => {
  const { data: reviewers = [], isLoading } = useReviewersQuery();
  const { reviewerId, setReviewer } = useReviewerStore();

  // A remembered id that is no longer valid is treated as "not chosen".
  const known = reviewers.some((r) => r.id === reviewerId);

  return (
    <Select
      label="Reviewing as"
      placeholder={isLoading ? "Loading…" : "Choose reviewer…"}
      value={known ? reviewerId! : ""}
      options={reviewers.map((r) => ({ value: r.id, label: r.name }))}
      onChange={(value) => setReviewer(value || null)}
      disabled={isLoading}
    />
  );
};
