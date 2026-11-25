import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  /** Extra controls on the right (e.g. a count). */
  children?: ReactNode;
}

export function TableToolbar({
  search,
  onSearchChange,
  placeholder = "Search…",
  children,
}: TableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-slate-400"
          aria-hidden
        />
        <Input
          type="search"
          aria-label={placeholder}
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-64 pl-8"
        />
      </div>
      {children}
    </div>
  );
}
