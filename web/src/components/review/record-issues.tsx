import { AlertTriangle } from "lucide-react";
import type { TransactionDetail } from "@/integration";
import { ISSUE_LABEL, SOURCE_STATUS_LABEL } from "@/lib/labels";
import { useWorkbenchStore } from "@/store/workbench-store";

/** Plain-language "why": issues, links to related records, and status notes. */
export const RecordIssues = ({ record }: { record: TransactionDetail }) => {
  const select = useWorkbenchStore((s) => s.select);
  const { status, issues, processed } = record.validation;
  const refById = new Map(
    record.relatedRecords.map((r) => [r.id, r.recordRef]),
  );

  if (status === "EXCLUDED") {
    return (
      <p className="text-sm text-slate-600">
        This record is{" "}
        <strong>{SOURCE_STATUS_LABEL[record.sourceStatus]}</strong> in{" "}
        {record.raw.source}. Draft and Void records aren't checked and can't be
        reviewed.
      </p>
    );
  }
  if (issues.length === 0) {
    return <p className="text-sm text-valid">Passes every check.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {issues.map((issue) => (
          <li
            key={issue.code}
            className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm"
          >
            <p className="flex items-center gap-1.5 font-medium text-attention">
              <AlertTriangle className="size-4" aria-hidden />
              {ISSUE_LABEL[issue.code]}
            </p>
            <p className="mt-1 text-slate-800">{issue.message}</p>
            {issue.relatedRecordIds.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-2">
                {issue.relatedRecordIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => select(id)}
                    className="text-sm font-medium text-sky-800 underline underline-offset-2 hover:text-sky-950"
                  >
                    Open {refById.get(id) ?? "related record"}
                  </button>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
      {!processed && (
        <p className="text-xs text-slate-500">
          Not counted as a separate transaction until the repeat or conflict is
          resolved.
        </p>
      )}
    </div>
  );
};
