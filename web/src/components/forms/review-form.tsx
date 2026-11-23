import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getErrorMessage,
  getFieldErrors,
  isConflictError,
  useCreateReviewMutation,
  useReviewersQuery,
  type ReviewAction,
  type TransactionDetail,
} from "@/integration";
import {
  NOTE_MAX,
  reviewFormSchema,
  type ReviewFormInput,
  type ReviewFormValues,
} from "@/lib/form-schemas";
import { REVIEW_STATE_LABEL } from "@/lib/labels";
import { useReviewerStore } from "@/store/reviewer-store";

const RESULT_LABEL: Record<ReviewAction, string> = {
  MARK_REVIEWED: REVIEW_STATE_LABEL.REVIEWED,
  MARK_NEEDS_CORRECTION: REVIEW_STATE_LABEL.NEEDS_CORRECTION,
};

/**
 * Why "Mark reviewed" is unavailable, mirroring the API's rules so the button
 * explains itself instead of failing. The API is still the authority.
 */
function reviewedBlockedReason(record: TransactionDetail): string | null {
  if (record.validation.status !== "VALID") {
    return "A record with unresolved issues can't be marked Reviewed. Mark it Needs correction instead.";
  }
  if (record.review.state === "REVIEWED") return "Already marked Reviewed.";
  return null;
}

/** Review actions for one posted record. Rendered with key={record.id}. */
export const ReviewForm = ({ record }: { record: TransactionDetail }) => {
  const reviewerId = useReviewerStore((s) => s.reviewerId);
  const { data: reviewers = [] } = useReviewersQuery();
  const reviewer = reviewers.find((r) => r.id === reviewerId);
  const review = useCreateReviewMutation();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<ReviewFormInput, unknown, ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { action: "MARK_REVIEWED", note: "" },
  });

  const onValid = (values: ReviewFormValues) => {
    if (!reviewer) return;
    review.mutate(
      {
        transactionId: record.id,
        reviewerId: reviewer.id,
        body: {
          action: values.action,
          note: values.note || undefined,
          // What this screen was showing; a newer decision wins with a 409.
          expectedVersion: record.review.version,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            `${record.recordRef} marked ${RESULT_LABEL[values.action]}`,
          );
          reset({ action: values.action, note: "" });
        },
        onError: (error) => {
          const fields = getFieldErrors(error);
          if (fields?.note) {
            setError("note", { message: fields.note });
            return;
          }
          setError("root.server", {
            message: isConflictError(error)
              ? `${getErrorMessage(error)} The latest version is now shown.`
              : getErrorMessage(error),
          });
        },
      },
    );
  };

  /** Both buttons share one form; the action decides whether a note is required. */
  const submitAs = (action: ReviewAction) => {
    setValue("action", action);
    void handleSubmit(onValid)();
  };

  const blocked = reviewedBlockedReason(record);
  const disabled = !reviewer || review.isPending;
  const noteLength = (useWatch({ control, name: "note" }) ?? "").trim().length;

  return (
    <form
      noValidate
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-3"
      aria-label={`Review ${record.recordRef}`}
    >
      {!reviewer && (
        <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-900">
          Choose who is reviewing (top right) before recording a decision.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="review-note" className="text-sm font-medium">
          Note{" "}
          <span className="font-normal text-slate-500">
            (required for Needs correction)
          </span>
        </label>
        <Textarea
          id="review-note"
          placeholder="e.g. Total is 5.00 higher than subtotal + VAT; check the invoice."
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={
            errors.note ? "review-note-error" : "review-note-count"
          }
          maxLength={NOTE_MAX + 50}
          {...register("note")}
        />
        {errors.note ? (
          <p id="review-note-error" className="text-sm text-red-700">
            {errors.note.message}
          </p>
        ) : (
          <p id="review-note-count" className="text-xs text-slate-500">
            {noteLength}/{NOTE_MAX}
          </p>
        )}
      </div>

      {errors.root?.server && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-2 text-sm text-red-800"
        >
          {errors.root.server.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => submitAs("MARK_REVIEWED")}
          disabled={disabled || blocked !== null}
          aria-describedby={blocked ? "reviewed-blocked" : undefined}
        >
          Mark reviewed
        </Button>
        <Button
          variant="secondary"
          onClick={() => submitAs("MARK_NEEDS_CORRECTION")}
          disabled={disabled}
        >
          Mark needs correction
        </Button>
      </div>
      {blocked && (
        <p id="reviewed-blocked" className="text-xs text-slate-500">
          {blocked}
        </p>
      )}
    </form>
  );
};
