import { VALIDATION_STATUSES, useTransactionSummaryQuery } from "@/integration";
import { VALIDATION_STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/store/workbench-store";

const ACCENT = {
  VALID: "border-l-valid",
  NEEDS_ATTENTION: "border-l-attention",
  EXCLUDED: "border-l-excluded",
} as const;

const HINT = {
  VALID: "Pass every check",
  NEEDS_ATTENTION: "One or more issues",
  EXCLUDED: "Draft or Void",
} as const;

/**
 * Totals per validation status for the chosen client. Each card is also a
 * status filter: click to show only those records, click again to clear.
 */
export const SummaryCards = () => {
  const { filters, toggleStatus } = useWorkbenchStore();
  const { data, isLoading } = useTransactionSummaryQuery(filters.clientId);

  return (
    <section
      aria-label="Validation summary"
      className="grid gap-3 sm:grid-cols-3"
    >
      {VALIDATION_STATUSES.map((status) => {
        const active = filters.status === status;
        const count = isLoading ? undefined : (data?.counts[status] ?? 0);
        return (
          <button
            key={status}
            type="button"
            aria-pressed={active}
            aria-describedby={`summary-hint-${status}`}
            onClick={() => toggleStatus(status)}
            className={cn(
              "rounded-lg border border-l-4 border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-slate-900",
              ACCENT[status],
              active && "ring-2 ring-slate-900",
            )}
          >
            {/* Name = visible text + hidden "records": "Needs attention 4 records".
                Keeping the visible words in the name lets voice-control users
                say what they see. The hint is the description. */}
            <span className="block text-sm font-medium text-slate-600">
              {VALIDATION_STATUS_LABEL[status]}
            </span>{" "}
            <span className="mt-1 block text-3xl font-semibold tabular-nums">
              {count ?? "–"}
            </span>{" "}
            <span className="sr-only">records</span>
            <span
              id={`summary-hint-${status}`}
              aria-hidden
              className="mt-1 block text-xs text-slate-500"
            >
              {HINT[status]}
            </span>
          </button>
        );
      })}
    </section>
  );
};
