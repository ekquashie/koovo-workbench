import type { ColumnDef } from "@tanstack/react-table";
import type { TransactionListItem } from "@/integration";
import {
  REVIEW_STATE_LABEL,
  SOURCE_LABEL,
  TYPE_LABEL,
  VALIDATION_STATUS_LABEL,
} from "@/lib/labels";
import { Amount } from "./amount";
import { ReviewBadge } from "./status-badges";
import { ValidationCell } from "./validation-cell";

type Item = TransactionListItem;

/**
 * Sorts by pence, never by the display string ("-120.00" < "100.00" as text
 * would be wrong). Missing amounts return undefined so they sort last.
 */
const amountColumn = (
  id: string,
  header: string,
  key: "subtotal" | "vat" | "total",
): ColumnDef<Item, number | undefined> => ({
  id,
  header,
  accessorFn: (row) => row.amounts[`${key}Minor`] ?? undefined,
  sortUndefined: "last",
  cell: ({ row }) => <Amount value={row.original.amounts[key]} />,
  meta: { align: "right" },
});

export const transactionColumns: ColumnDef<Item, never>[] = [
  {
    id: "record",
    header: "Record",
    // Arrival order, so sorting by Record means "as imported".
    accessorFn: (row) => row.sequence,
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.original.recordRef}</span>
    ),
  },
  { id: "client", header: "Client", accessorFn: (row) => row.clientId },
  {
    id: "source",
    header: "Source",
    accessorFn: (row) => `${SOURCE_LABEL[row.source]} ${row.sourceId}`,
    cell: ({ row }) => (
      <>
        {SOURCE_LABEL[row.original.source]}
        <span className="block font-mono text-xs text-slate-500">
          {row.original.sourceId}
        </span>
      </>
    ),
  },
  { id: "type", header: "Type", accessorFn: (row) => TYPE_LABEL[row.type] },
  {
    id: "supplier",
    header: "Supplier",
    accessorFn: (row) => row.supplierName ?? undefined,
    sortUndefined: "last",
    cell: ({ row }) =>
      row.original.supplierName ?? (
        <span className="text-slate-400 italic">Missing</span>
      ),
  },
  amountColumn("subtotal", "Subtotal £", "subtotal"),
  amountColumn("vat", "VAT £", "vat"),
  amountColumn("total", "Total £", "total"),
  {
    id: "validation",
    header: "Validation",
    accessorFn: (row) => VALIDATION_STATUS_LABEL[row.validation.status],
    cell: ({ row }) => <ValidationCell item={row.original} />,
  },
  {
    id: "review",
    header: "Review",
    accessorFn: (row) => REVIEW_STATE_LABEL[row.review.state],
    cell: ({ row }) => <ReviewBadge state={row.original.review.state} />,
  },
] as ColumnDef<Item, never>[];

/** What the search box matches: record, supplier, source ID, client. */
export const transactionSearchText = (row: Item): string =>
  [row.recordRef, row.supplierName ?? "", row.sourceId, row.clientId].join(" ");
