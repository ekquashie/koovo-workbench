import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/store/workbench-store";
import { ApiStatusBanner } from "./api-status-banner";
import { RecordDetailPanel } from "./record-detail-panel";
import { ReviewerPicker } from "./reviewer-picker";
import { SummaryCards } from "./summary-cards";
import { TransactionFilters } from "./transaction-filters";
import { TransactionsTable } from "./transactions-table";

export const Workbench = () => {
  const panelOpen = useWorkbenchStore((s) => s.selectedId !== null);
  return (
    // From lg up, leave room for the side panel so it doesn't cover columns;
    // the table scrolls sideways if it needs more width.
    <div
      className={cn(
        "mx-auto flex max-w-7xl flex-col gap-5 p-4 sm:p-6",
        panelOpen && "lg:mr-[480px]",
      )}
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Review workbench</h1>
          <p className="text-sm text-slate-600">
            Check imported Xero and Sage transactions before they're used.
          </p>
        </div>
        <ReviewerPicker />
      </header>
      <ApiStatusBanner />
      <SummaryCards />
      <TransactionFilters />
      <TransactionsTable />
      <RecordDetailPanel />
    </div>
  );
};
