import type { TransactionDetail } from "@/integration";
import { SOURCE_LABEL, SOURCE_STATUS_LABEL, TYPE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

const missing = <span className="text-slate-500 italic">Missing</span>;

/**
 * The row exactly as received next to how it was understood, so the
 * accountant can check the parsing. Fields named by an issue are highlighted.
 */
export const SourceDataTable = ({ record }: { record: TransactionDetail }) => {
  const flagged = new Set(record.validation.issues.flatMap((i) => i.fields));
  const { raw, amounts } = record;
  const rows: [
    field: string,
    label: string,
    received: string,
    understood: React.ReactNode,
  ][] = [
    ["client", "Client", raw.client, record.clientId],
    ["source", "Source", raw.source, SOURCE_LABEL[record.source]],
    ["sourceId", "Source ID", raw.sourceId, record.sourceId],
    ["type", "Type", raw.type, TYPE_LABEL[record.type]],
    ["status", "Status", raw.status, SOURCE_STATUS_LABEL[record.sourceStatus]],
    ["supplier", "Supplier", raw.supplier, record.supplierName ?? missing],
    ["subtotal", "Subtotal £", raw.subtotal, amounts.subtotal ?? missing],
    ["vat", "VAT £", raw.vat, amounts.vat ?? missing],
    ["total", "Total £", raw.total, amounts.total ?? missing],
  ];

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">
        Source data for {record.recordRef}: as received and as understood
      </caption>
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
          <th scope="col" className="py-1.5 pr-2 font-medium">
            Field
          </th>
          <th scope="col" className="py-1.5 pr-2 font-medium">
            As received
          </th>
          <th scope="col" className="py-1.5 font-medium">
            As understood
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([field, label, received, understood]) => {
          const isFlagged = flagged.has(field);
          return (
            <tr
              key={field}
              data-flagged={isFlagged || undefined}
              className={cn(
                "border-b border-slate-100 last:border-0",
                isFlagged && "bg-amber-50",
              )}
            >
              <th
                scope="row"
                className="py-1.5 pr-2 text-left font-normal text-slate-600"
              >
                {label}
                {isFlagged && <span className="sr-only"> (flagged)</span>}
              </th>
              <td className="py-1.5 pr-2 font-mono text-xs">{received}</td>
              <td
                className={cn(
                  "py-1.5",
                  isFlagged && "font-medium text-attention",
                )}
              >
                {understood}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
