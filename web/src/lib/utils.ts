import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind classes, letting later ones win (e.g. variant overrides). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
