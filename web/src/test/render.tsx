import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { useReviewerStore } from "@/store/reviewer-store";
import { useWorkbenchStore } from "@/store/workbench-store";
import { createTestQueryClient, wrapperFor } from "./query-wrapper";

/**
 * Renders with a fresh QueryClient and reset stores, so tests don't leak.
 * `url` opens the page at that address, as if following a shared link.
 */
export function renderWithProviders(
  ui: ReactElement,
  { url = "/" }: { url?: string } = {},
) {
  useWorkbenchStore.setState({ filters: {}, selectedId: null });
  window.history.replaceState(null, "", url);
  useWorkbenchStore.getState().loadFiltersFromUrl();
  useReviewerStore.setState({ reviewerId: null });
  localStorage.clear();
  return render(ui, { wrapper: wrapperFor(createTestQueryClient()) });
}
