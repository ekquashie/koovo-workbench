import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
  {
    variants: {
      tone: {
        valid: "bg-green-50 text-valid ring-green-600/20",
        attention: "bg-amber-50 text-attention ring-amber-600/25",
        excluded: "bg-slate-100 text-excluded ring-slate-500/20",
        info: "bg-sky-50 text-sky-800 ring-sky-600/20",
        danger: "bg-red-50 text-red-800 ring-red-600/20",
        neutral: "bg-white text-slate-600 ring-slate-300",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export const Badge = ({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) => (
  <span className={cn(badgeVariants({ tone }), className)} {...props} />
);
