import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  VALIDATION_STATUSES,
  useTransactionSummaryQuery,
  type ValidationStatus,
} from "@/integration";
import { VALIDATION_STATUS_LABEL } from "@/lib/labels";
import { useWorkbenchStore } from "@/store/workbench-store";

export const TransactionFilters = () => {
  const { filters, setClient, setStatus, clearFilters } = useWorkbenchStore();
  // Unfiltered summary: its client list never shrinks when a client is chosen.
  const { data: summary } = useTransactionSummaryQuery();
  const active = Boolean(filters.clientId || filters.status);

  return (
    <div
      className="flex flex-wrap items-end gap-3"
      role="group"
      aria-label="Filters"
    >
      <Select
        label="Client"
        placeholder="All clients"
        value={filters.clientId ?? ""}
        options={(summary?.clients ?? []).map((c) => ({ value: c, label: c }))}
        onChange={(value) => setClient(value || undefined)}
      />
      <Select
        label="Validation status"
        placeholder="All statuses"
        value={filters.status ?? ""}
        options={VALIDATION_STATUSES.map((s) => ({
          value: s,
          label: VALIDATION_STATUS_LABEL[s],
        }))}
        onChange={(value) =>
          setStatus((value || undefined) as ValidationStatus | undefined)
        }
      />
      {active && (
        <Button variant="ghost" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
};
