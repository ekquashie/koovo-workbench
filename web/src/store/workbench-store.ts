import { create } from "zustand";
import type { TransactionFilters, ValidationStatus } from "@/integration";

interface WorkbenchState {
  filters: TransactionFilters;
  /** Record open in the detail panel. */
  selectedId: string | null;
  setClient: (clientId: string | undefined) => void;
  setStatus: (status: ValidationStatus | undefined) => void;
  /** Summary cards: clicking the active status again clears it. */
  toggleStatus: (status: ValidationStatus) => void;
  clearFilters: () => void;
  select: (id: string | null) => void;
}

/**
 * Screen state only (filters, selection). Server data stays in TanStack
 * Query; nothing here is a copy of it. Not persisted: a reload starts clean.
 */
export const useWorkbenchStore = create<WorkbenchState>()((set) => ({
  filters: {},
  selectedId: null,
  setClient: (clientId) =>
    set((s) => ({
      filters: { ...s.filters, clientId: clientId || undefined },
    })),
  setStatus: (status) =>
    set((s) => ({ filters: { ...s.filters, status: status || undefined } })),
  toggleStatus: (status) =>
    set((s) => ({
      filters: {
        ...s.filters,
        status: s.filters.status === status ? undefined : status,
      },
    })),
  clearFilters: () => set({ filters: {} }),
  select: (selectedId) => set({ selectedId }),
}));
