import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Textarea = ({
  className,
  ...props
}: ComponentProps<"textarea">) => (
  <textarea
    className={cn(
      "min-h-20 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-slate-900 aria-invalid:border-red-500",
      className,
    )}
    {...props}
  />
);
