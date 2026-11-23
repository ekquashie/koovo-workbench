import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { useReviewerStore } from "@/store/reviewer-store";
import { useWorkbenchStore } from "@/store/workbench-store";
import { createTestQueryClient, wrapperFor } from "./query-wrapper";

/** Renders with a fresh QueryClient and reset stores, so tests don't leak. */
export function renderWithProviders(ui: ReactElement) {
  useWorkbenchStore.setState({ filters: {}, selectedId: null });
  useReviewerStore.setState({ reviewerId: null });
  localStorage.clear();
  return render(ui, { wrapper: wrapperFor(createTestQueryClient()) });
}
