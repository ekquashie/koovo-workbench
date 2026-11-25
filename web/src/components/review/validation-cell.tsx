import type { TransactionListItem } from "@/integration";
import { ISSUE_LABEL, SOURCE_STATUS_LABEL } from "@/lib/labels";
import { ValidationBadge } from "./status-badges";

/** Badge plus issue names, so the "why" is visible without opening the record. */
export const ValidationCell = ({ item }: { item: TransactionListItem }) => {
  const { status, issues } = item.validation;
  return (
    <div className="flex flex-col items-start gap-1">
      <ValidationBadge status={status} />
      {status === "EXCLUDED" && (
        <span className="text-xs text-slate-600">
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
