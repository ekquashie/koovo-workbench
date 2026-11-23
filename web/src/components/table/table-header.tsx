import { flexRender, type Table } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

/** Sortable columns render their header as a button with the sort state. */
export function DataTableHeader<TData>({ table }: { table: Table<TData> }) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-slate-50">
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id} className="hover:bg-slate-50">
          {headerGroup.headers.map((header) => {
            const sorted = header.column.getIsSorted();
            const align = header.column.columnDef.meta?.align;
            const label = header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext());
            return (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                aria-sort={sorted ? ARIA_SORT[sorted] : undefined}
                className={cn(align === "right" && "text-right")}
              >
                {header.column.getCanSort() ? (
                  <button
                    type="button"
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      "inline-flex items-center gap-1 uppercase hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-900",
                      align === "right" && "flex-row-reverse",
                    )}
                  >
                    {label}
                    {sorted === "asc" ? (
                      <ArrowUp className="size-3.5" aria-hidden />
                    ) : sorted === "desc" ? (
                      <ArrowDown className="size-3.5" aria-hidden />
                    ) : (
                      <ArrowUpDown
                        className="size-3.5 opacity-40"
                        aria-hidden
                      />
                    )}
                  </button>
                ) : (
                  label
                )}
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </TableHeader>
  );
}
