import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Input = ({ className, ...props }: ComponentProps<"input">) => (
  <input
    className={cn(
      "h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-slate-900",
      className,
    )}
    {...props}
  />
);
