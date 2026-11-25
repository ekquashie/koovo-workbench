import { create } from "zustand";
import type { TransactionFilters, ValidationStatus } from "@/integration";
import { filtersFromSearch, searchFromFilters } from "@/lib/url-filters";

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
  /** Re-reads the filters from the address bar (start-up, Back/Forward). */
  loadFiltersFromUrl: () => void;
}

const hasWindow = typeof window !== "undefined";

/**
 * Screen state only (filters, selection). Server data stays in TanStack
 * Query; nothing here is a copy of it.
 *
 * The filters are mirrored in the URL (`?status=needs_attention&client=C01`)
 * so a filtered view survives a refresh and can be shared. The selected
 * record is not: a reload starts with the panel closed.
 */
export const useWorkbenchStore = create<WorkbenchState>()((set) => ({
  filters: hasWindow ? filtersFromSearch(window.location.search) : {},
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
  loadFiltersFromUrl: () =>
    set({ filters: filtersFromSearch(window.location.search) }),
}));

if (hasWindow) {
  // Store → URL. replaceState, not pushState: changing a filter shouldn't
  // add a Back-button step for every click (same as our Next.js shops).
  useWorkbenchStore.subscribe((state, previous) => {
    if (state.filters === previous.filters) return;
    const { pathname, search, hash } = window.location;
    const next = searchFromFilters(state.filters, search);
    if (next !== search) {
      window.history.replaceState(
        window.history.state,
        "",
        pathname + next + hash,
      );
    }
  });
  // URL → store, when the user goes Back/Forward to another filtered URL.
  window.addEventListener("popstate", () =>
    useWorkbenchStore.getState().loadFiltersFromUrl(),
  );
}
