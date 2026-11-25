import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { useState, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { DataTableHeader } from "./table-header";
import { DataTableRow } from "./table-row";
import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar";

declare module "@tanstack/react-table" {
  // Lets a column ask for right-aligned numbers (header and cells). Type
  // parameter names must match TanStack's declaration, used or not.
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "left" | "right";
  }
}

interface DataTableProps<TData> {
  // TValue varies per column; `any` here is TanStack's own recommendation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  getRowId: (row: TData) => string;
  loading?: boolean;
  /** Screen-reader caption describing the table. */
  caption: string;
  /** Text searched by the toolbar box; omit to hide search. */
  searchText?: (row: TData) => string;
  searchPlaceholder?: string;
  initialSorting?: SortingState;
  onRowClick?: (row: TData) => void;
  selectedRowId?: string | null;
  rowClassName?: (row: TData) => string | undefined;
  /** Shown when there are no rows (before search). */
  empty?: ReactNode;
  showPagination?: boolean;
  pageSize?: number;
}

/**
 * Generic table on TanStack Table, same shape as the DataTable in our other
 * apps. Differences on purpose: `data` is used as given (no local copy kept
 * in sync with an effect, which can show stale rows after a refetch), and
 * rows can be clicked/selected.
 */
export function DataTable<TData>({
  columns,
  data,
  getRowId,
  loading = false,
  caption,
  searchText,
  searchPlaceholder,
  initialSorting = [],
  onRowClick,
  selectedRowId,
  rowClassName,
  empty = "No results.",
  showPagination = true,
  pageSize = 20,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [globalFilter, setGlobalFilter] = useState("");

  const matchesSearch: FilterFn<TData> = (row, _columnId, value: string) =>
    !searchText ||
    searchText(row.original).toLowerCase().includes(value.trim().toLowerCase());

  // TanStack Table returns new functions each render, which the React
  // Compiler lint can't memoise; that's expected for this library.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: matchesSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const rows = table.getRowModel().rows;
  const colSpan = table.getAllLeafColumns().length;
  const message = (content: ReactNode) => (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="h-24 text-center text-slate-500">
        {content}
      </TableCell>
    </TableRow>
  );

  return (
    <div>
      {searchText && (
        <TableToolbar
          search={globalFilter}
          onSearchChange={setGlobalFilter}
          placeholder={searchPlaceholder}
        />
      )}
      <Table className="min-w-[960px]">
        <TableCaption className="sr-only">{caption}</TableCaption>
        <DataTableHeader table={table} />
        <TableBody>
          {loading
            ? message("Loading…")
            : rows.length > 0
              ? rows.map((row) => (
                  <DataTableRow
                    key={row.id}
                    row={row}
                    selected={row.id === selectedRowId}
                    onClick={onRowClick}
                    className={rowClassName?.(row.original)}
                  />
                ))
              : message(
                  data.length === 0 ? empty : "Nothing matches your search.",
                )}
        </TableBody>
      </Table>
      {showPagination && !loading && data.length > 0 && (
        <TablePagination table={table} />
      )}
    </div>
  );
}
