import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onChange"
> {
  label: string;
  options: SelectOption[];
  /** First option, for "no choice" (value ""). */
  placeholder?: string;
  onChange: (value: string) => void;
}

/** Native select: keyboard and screen-reader support come for free. */
export const Select = ({
  label,
  options,
  placeholder,
  onChange,
  className,
  id,
  ...props
}: SelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-xs font-medium text-slate-600">
        {label}
      </label>
      <select
        id={selectId}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 min-w-40 rounded-md border border-slate-300 bg-white px-2.5 text-sm focus-visible:outline-2 focus-visible:outline-slate-900",
          className,
        )}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};
