import type { ReviewActivity, Reviewer } from "@/integration";
import { formatDateTime } from "@/lib/format";
import { REVIEW_STATE_LABEL } from "@/lib/labels";

/** Newest first: the latest decision is what the accountant needs. */
export const ReviewHistory = ({
  activity,
  reviewers,
}: {
  activity: ReviewActivity[];
  reviewers: Reviewer[];
}) => {
  if (activity.length === 0) {
    return <p className="text-sm text-slate-500">No review actions yet.</p>;
  }
  const name = (id: string) => reviewers.find((r) => r.id === id)?.name ?? id;

  return (
    <ol
      className="flex flex-col gap-3"
      aria-label="Review history, newest first"
    >
      {[...activity].reverse().map((a) => (
        <li key={a.id} className="border-l-2 border-slate-200 pl-3 text-sm">
          <p>
            <strong>{name(a.reviewerId)}</strong> marked it{" "}
            <strong>{REVIEW_STATE_LABEL[a.toState]}</strong>
            <span className="text-slate-500">
              {" "}
              (was {REVIEW_STATE_LABEL[a.fromState]})
            </span>
          </p>
          <p className="text-xs text-slate-500">
            <time dateTime={a.createdAt}>{formatDateTime(a.createdAt)}</time>
          </p>
          {a.note && <p className="mt-1 text-slate-700">“{a.note}”</p>}
        </li>
      ))}
    </ol>
  );
};
