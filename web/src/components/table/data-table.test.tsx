import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  transactionColumns,
  transactionSearchText,
} from "@/components/review/transaction-columns";
import type { TransactionListItem } from "@/integration";
import { ITEMS, makeItem } from "@/test/fixtures";
import { DataTable } from "./data-table";

const refs = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);

function renderTable(
  props: Partial<Parameters<typeof DataTable<TransactionListItem>>[0]> = {},
) {
  return render(
    <DataTable
      columns={transactionColumns}
      data={ITEMS}
      getRowId={(r) => r.id}
      caption="Transactions"
      searchText={transactionSearchText}
      searchPlaceholder="Search records"
      initialSorting={[{ id: "record", desc: false }]}
      {...props}
    />,
  );
}

const sortBy = (name: RegExp) =>
  userEvent.click(screen.getByRole("button", { name }));

describe("DataTable (with transaction columns)", () => {
  it("starts in arrival order", () => {
    renderTable();
    expect(refs()).toEqual(ITEMS.map((i) => i.recordRef));
  });

  it("sorts amounts by pence, not as text: biggest first, then smallest", async () => {
    renderTable();
    await sortBy(/Total £/);
    expect(refs()[0]).toBe("R007"); // 480.00
    expect(
      screen.getByRole("columnheader", { name: /Total £/ }),
    ).toHaveAttribute("aria-sort", "descending");

    await sortBy(/Total £/);
    // As text, "-120.00" vs "-36.00" vs "60.00" would sort wrongly.
    expect(refs().slice(0, 3)).toEqual(["R010", "R011", "R006"]);
    expect(
      screen.getByRole("columnheader", { name: /Total £/ }),
    ).toHaveAttribute("aria-sort", "ascending");
  });

  it("puts missing amounts last whichever way you sort", async () => {
    const missing = makeItem([
      "R099",
      "C01",
      "XERO",
      "X-9",
      "BILL",
      "POSTED",
      "Acme",
      "1.00",
      null,
      "1.00",
      "NEEDS_ATTENTION",
      ["MISSING_AMOUNT"],
    ]);
    renderTable({ data: [missing, ...ITEMS] });
    await sortBy(/VAT £/);
    expect(refs().at(-1)).toBe("R099");
    await sortBy(/VAT £/);
    expect(refs().at(-1)).toBe("R099");
  });

  it("searches record, supplier and source ID, ignoring case", async () => {
    const user = userEvent.setup();
    renderTable();
    const search = screen.getByRole("searchbox", { name: "Search records" });

    await user.type(search, "westline");
    expect(refs()).toEqual(["R001", "R005", "R007"]);

    await user.clear(search);
    await user.type(search, "s-20");
    expect(refs()).toEqual(["R002", "R004", "R006", "R009"]);

    await user.clear(search);
    await user.type(search, "zzz");
    expect(
      screen.getByText("Nothing matches your search."),
    ).toBeInTheDocument();
  });

  it("pages through rows", async () => {
    const user = userEvent.setup();
    renderTable({ pageSize: 10 });
    expect(refs()).toHaveLength(10);
    expect(screen.getByText("1–10 of 11 records")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(refs()).toEqual(["R011"]);
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("opens a row by click, Enter or Space, and marks the selected one", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    renderTable({ onRowClick, selectedRowId: "id-R003" });
    const rows = within(screen.getByRole("table")).getAllByRole("row");

    expect(rows[3]).toHaveAttribute("aria-selected", "true");
    expect(rows[1]).toHaveAttribute("aria-selected", "false");

    await user.click(rows[1]);
    rows[2].focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onRowClick.mock.calls.map(([r]) => r.recordRef)).toEqual([
      "R001",
      "R002",
      "R002",
    ]);
  });

  it("shows loading and empty states", () => {
    const { rerender } = renderTable({ loading: true });
    expect(screen.getByText("Loading…")).toBeInTheDocument();

    rerender(
      <DataTable
        columns={transactionColumns}
        data={[]}
        getRowId={(r) => r.id}
        caption="Transactions"
        empty="Nothing imported yet."
      />,
    );
    expect(screen.getByText("Nothing imported yet.")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});
