import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { ReviewForm } from "@/components/forms/review-form";
import { Button } from "@/components/ui/button";
import {
  getErrorMessage,
  useReviewersQuery,
  useTransactionQuery,
} from "@/integration";
import { formatDateTime } from "@/lib/format";
import { SOURCE_LABEL, TYPE_LABEL } from "@/lib/labels";
import { useWorkbenchStore } from "@/store/workbench-store";
import { RecordIssues } from "./record-issues";
import { ReviewHistory } from "./review-history";
import { SourceDataTable } from "./source-data-table";
import { ReviewBadge, ValidationBadge } from "./status-badges";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-2 border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {children}
  </section>
);

/**
 * Side panel for the selected record. It sits beside the table rather than
 * over it as a modal, so the accountant can click from row to row and the
 * panel follows. Escape closes it.
 */
export const RecordDetailPanel = () => {
  const { selectedId, select } = useWorkbenchStore();
  const {
    data: record,
    isLoading,
    isError,
    error,
  } = useTransactionQuery(selectedId);
  const { data: reviewers = [] } = useReviewersQuery();

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && select(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, select]);

  if (!selectedId) return null;

  const reviewerName = (id: string | null) =>
    id ? (reviewers.find((r) => r.id === id)?.name ?? id) : null;

  return (
    <aside
      aria-label={record ? `Record ${record.recordRef}` : "Record detail"}
      className="fixed inset-y-0 right-0 z-20 flex w-full flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-xl sm:w-[480px]"
    >
      <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-4">
        {record ? (
          <div>
            <h2 className="font-mono text-lg font-semibold">
              {record.recordRef}
            </h2>
            <p className="text-sm text-slate-600">
              {record.clientId} · {SOURCE_LABEL[record.source]}{" "}
              {record.sourceId} · {TYPE_LABEL[record.type]}
            </p>
            <div className="mt-2 flex gap-2">
              <ValidationBadge status={record.validation.status} />
              <ReviewBadge state={record.review.state} />
            </div>
          </div>
        ) : (
          <h2 className="text-lg font-semibold">Record</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          aria-label="Close record"
          onClick={() => select(null)}
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {isLoading && <p className="text-sm text-slate-500">Loading record…</p>}
        {isError && (
          <p role="alert" className="text-sm text-red-800">
            Couldn't load this record: {getErrorMessage(error)}
          </p>
        )}
        {record && (
          <>
            <Section
              title={
                record.validation.status === "NEEDS_ATTENTION"
                  ? "Why it needs attention"
                  : "Checks"
              }
            >
              <RecordIssues record={record} />
            </Section>

            <Section title="Source data">
              <SourceDataTable record={record} />
            </Section>

            {record.validation.status !== "EXCLUDED" && (
              <Section title="Review">
                <p className="text-sm text-slate-600">
                  {record.review.updatedBy && record.review.updatedAt ? (
                    <>
                      Last updated by {reviewerName(record.review.updatedBy)},{" "}
                      {formatDateTime(record.review.updatedAt)}.
                      {record.review.note && (
                        <span className="block text-slate-800">
                          “{record.review.note}”
                        </span>
                      )}
                    </>
                  ) : (
                    "Not reviewed yet."
                  )}
                </p>
                {/* Keyed so the note resets when moving to another record. */}
                <ReviewForm key={record.id} record={record} />
              </Section>
            )}

            <Section title="History">
              <ReviewHistory activity={record.activity} reviewers={reviewers} />
            </Section>
          </>
        )}
      </div>
    </aside>
  );
};
