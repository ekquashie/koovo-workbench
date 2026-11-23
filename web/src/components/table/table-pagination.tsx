import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const PAGE_SIZES = [10, 20, 50, 100];

export function TablePagination<TData>({ table }: { table: Table<TData> }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const rows = table.getFilteredRowModel().rows.length;
  const from = rows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(rows, (pageIndex + 1) * pageSize);

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-200 p-3 text-sm">
      <span className="text-slate-600" aria-live="polite">
        {from}–{to} of {rows} record{rows === 1 ? "" : "s"}
      </span>
      <div className="flex items-end gap-3">
        <Select
          label="Rows per page"
          value={String(pageSize)}
          options={PAGE_SIZES.map((n) => ({
            value: String(n),
            label: String(n),
          }))}
          onChange={(value) => table.setPageSize(Number(value))}
          className="min-w-20"
        />
        <span className="pb-2 font-medium">
          Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
        </span>
        <div className="flex gap-1 pb-0.5">
          <Button
            variant="secondary"
            size="sm"
            aria-label="First page"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="size-4" aria-hidden />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Previous page"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Next page"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Last page"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
