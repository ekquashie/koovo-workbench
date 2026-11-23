import { Card } from "@/components/ui/card";
import { useTransactionQuery } from "@/integration";
import { useWorkbenchStore } from "@/store/workbench-store";
import { ApiStatusBanner } from "./api-status-banner";
import { ReviewerPicker } from "./reviewer-picker";
import { SummaryCards } from "./summary-cards";
import { TransactionFilters } from "./transaction-filters";
import { TransactionsTable } from "./transactions-table";

/** Placeholder until the record detail panel (task 9). */
const SelectedRecordHint = () => {
  const selectedId = useWorkbenchStore((s) => s.selectedId);
  const { data } = useTransactionQuery(selectedId);
  return (
    <Card className="p-4 text-sm text-slate-600" aria-live="polite">
      {data ? `Selected ${data.recordRef}.` : "Select a record to inspect it."}
    </Card>
  );
};

export const Workbench = () => (
  <div className="mx-auto flex max-w-7xl flex-col gap-5 p-4 sm:p-6">
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
    <SelectedRecordHint />
  </div>
);
