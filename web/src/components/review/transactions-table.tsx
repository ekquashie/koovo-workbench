import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getErrorMessage,
  useTransactionsQuery,
  type TransactionListItem,
} from "@/integration";
import {
  ISSUE_LABEL,
  SOURCE_LABEL,
  SOURCE_STATUS_LABEL,
  TYPE_LABEL,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/store/workbench-store";
import { Amount } from "./amount";
import { ReviewBadge, ValidationBadge } from "./status-badges";

const HEAD =
  "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
const CELL = "px-3 py-2.5 align-top";

/** Validation badge plus the issue names, so the "why" is visible at a glance. */
const ValidationCell = ({ item }: { item: TransactionListItem }) => {
  const { status, issues } = item.validation;
  return (
    <div className="flex flex-col items-start gap-1">
      <ValidationBadge status={status} />
      {status === "EXCLUDED" && (
        <span className="text-xs text-slate-500">
          {SOURCE_STATUS_LABEL[item.sourceStatus]}
        </span>
      )}
      {issues.length > 0 && (
        <ul className="text-xs text-attention">
          {issues.map((issue) => (
            <li key={issue.code} title={issue.message}>
              {ISSUE_LABEL[issue.code]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const TransactionsTable = () => {
  const { filters, selectedId, select, clearFilters } = useWorkbenchStore();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useTransactionsQuery(filters);

  if (isLoading) {
    return <Card className="p-6 text-sm text-slate-500">Loading records…</Card>;
  }
  if (isError) {
    return (
      <Card
        role="alert"
        className="flex items-center justify-between gap-4 p-6 text-sm"
      >
        <span className="text-red-800">
          Couldn't load records: {getErrorMessage(error)}
        </span>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </Card>
    );
  }
  if (!data?.length) {
    return (
      <Card className="flex items-center justify-between gap-4 p-6 text-sm text-slate-600">
        <span>No records match these filters.</span>
        <Button variant="secondary" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-x-auto", isFetching && "opacity-70")}>
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <caption className="sr-only">
          Transactions ({data.length}). Select a record to inspect it.
        </caption>
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th scope="col" className={HEAD}>
              Record
            </th>
            <th scope="col" className={HEAD}>
              Client
            </th>
            <th scope="col" className={HEAD}>
              Source
            </th>
            <th scope="col" className={HEAD}>
              Type
            </th>
            <th scope="col" className={HEAD}>
              Supplier
            </th>
            <th scope="col" className={cn(HEAD, "text-right")}>
              Subtotal £
            </th>
            <th scope="col" className={cn(HEAD, "text-right")}>
              VAT £
            </th>
            <th scope="col" className={cn(HEAD, "text-right")}>
              Total £
            </th>
            <th scope="col" className={HEAD}>
              Validation
            </th>
            <th scope="col" className={HEAD}>
              Review
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const selected = item.id === selectedId;
            return (
              <tr
                key={item.id}
                aria-selected={selected}
                onClick={() => select(item.id)}
                className={cn(
                  "cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50",
                  item.validation.status === "EXCLUDED" && "text-slate-500",
                  selected && "bg-sky-50 hover:bg-sky-50",
                )}
              >
                <td className={CELL}>
                  {/* The real control for keyboard users; the row click is a shortcut. */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      select(item.id);
                    }}
                    aria-label={`Open ${item.recordRef}`}
                    className="font-mono font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-slate-900"
                  >
                    {item.recordRef}
                  </button>
                </td>
                <td className={CELL}>{item.clientId}</td>
                <td className={CELL}>
                  {SOURCE_LABEL[item.source]}
                  <span className="block font-mono text-xs text-slate-500">
                    {item.sourceId}
                  </span>
                </td>
                <td className={CELL}>{TYPE_LABEL[item.type]}</td>
                <td className={CELL}>
                  {item.supplierName ?? (
                    <span className="text-slate-400 italic">Missing</span>
                  )}
                </td>
                <td className={cn(CELL, "text-right tabular-nums")}>
                  <Amount value={item.amounts.subtotal} />
                </td>
                <td className={cn(CELL, "text-right tabular-nums")}>
                  <Amount value={item.amounts.vat} />
                </td>
                <td className={cn(CELL, "text-right font-medium tabular-nums")}>
                  <Amount value={item.amounts.total} />
                </td>
                <td className={CELL}>
                  <ValidationCell item={item} />
                </td>
                <td className={CELL}>
                  <ReviewBadge state={item.review.state} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
};
