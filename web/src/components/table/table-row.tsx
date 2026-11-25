import { flexRender, type Row } from "@tanstack/react-table";
import type { KeyboardEvent } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableRowProps<TData> {
  row: Row<TData>;
  selected?: boolean;
  onClick?: (row: TData) => void;
  className?: string;
}

/**
 * A clickable row is also focusable and opens with Enter or Space, so the
 * row action works without a mouse.
 */
export function DataTableRow<TData>({
  row,
  selected,
  onClick,
  className,
}: DataTableRowProps<TData>) {
  const open = onClick ? () => onClick(row.original) : undefined;
  const onKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (open && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open();
    }
  };
  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      aria-selected={onClick ? Boolean(selected) : undefined}
      tabIndex={open ? 0 : undefined}
      onClick={open}
      onKeyDown={open ? onKeyDown : undefined}
      className={cn(
        open &&
          "cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-slate-900",
        className,
      )}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn(
            cell.column.columnDef.meta?.align === "right" &&
              "text-right tabular-nums",
          )}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
