import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage, useTransactionsQuery } from "@/integration";
import { useWorkbenchStore } from "@/store/workbench-store";
import {
  transactionColumns,
  transactionSearchText,
} from "./transaction-columns";

/** Records for the current client/status filters (applied by the API). */
export const TransactionsTable = () => {
  const { filters, selectedId, select, clearFilters } = useWorkbenchStore();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useTransactionsQuery(filters);

  if (isError) {
    return (
      <Card
        role="alert"
        className="flex items-center justify-between gap-4 p-6 text-sm"
      >
        <span className="text-red-800">
          Couldn't load records: {getErrorMessage(error)}
        </span>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  return (
    <Card className={isFetching && !isLoading ? "opacity-70" : undefined}>
      <DataTable
        columns={transactionColumns}
        data={data ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        caption={`Transactions (${data?.length ?? 0}). Select a row to inspect it.`}
        searchText={transactionSearchText}
        searchPlaceholder="Search record, supplier or source ID"
        initialSorting={[{ id: "record", desc: false }]}
        onRowClick={(row) => select(row.id)}
        selectedRowId={selectedId}
        rowClassName={(row) =>
          row.validation.status === "EXCLUDED" ? "text-slate-500" : undefined
        }
        empty={
          <span className="inline-flex items-center gap-3">
            No records match these filters.
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </span>
        }
      />
    </Card>
  );
};
