import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/integration";
import { useReviewerStore } from "@/store/reviewer-store";
import { useWorkbenchStore } from "@/store/workbench-store";
import { fakeApi, requestsTo } from "@/test/fake-api";
import { makeItem, ITEMS } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { Workbench } from "./workbench";

/** Record refs in the table body, top to bottom. */
const tableRefs = () =>
  within(screen.getByRole("table", { name: /^Transactions/ }))
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);

/** The body row for a record ref. */
const rowOf = (ref: string) =>
  within(screen.getByRole("table", { name: /^Transactions/ }))
    .getAllByRole("row")
    .find((row) => within(row).queryAllByRole("cell")[0]?.textContent === ref)!;

const card = (name: RegExp) => screen.getByRole("button", { name });

async function renderWorkbench() {
  const spy = fakeApi();
  renderWithProviders(<Workbench />);
  // Wait for real data: rows loaded and the client options filled in.
  await screen.findByText("R001");
  await waitFor(() =>
    expect(
      within(screen.getByLabelText("Client")).getAllByRole("option"),
    ).toHaveLength(3),
  );
  return spy;
}

describe("Workbench", () => {
  afterEach(() => vi.restoreAllMocks());

  describe("summary cards", () => {
    it("shows totals for Valid, Needs attention and Excluded", async () => {
      await renderWorkbench();
      await waitFor(() =>
        expect(card(/^Valid: 5 records/)).toBeInTheDocument(),
      );
      expect(card(/^Needs attention: 4 records/)).toBeInTheDocument();
      expect(card(/^Excluded: 2 records/)).toBeInTheDocument();
    });

    it("filters the table by status when a card is clicked, and clears on a second click", async () => {
      const user = userEvent.setup();
      await renderWorkbench();

      await user.click(card(/^Needs attention/));
      expect(card(/^Needs attention/)).toHaveAttribute("aria-pressed", "true");
      await waitFor(() =>
        expect(tableRefs()).toEqual(["R003", "R004", "R005", "R011"]),
      );

      await user.click(card(/^Needs attention/));
      await waitFor(() => expect(tableRefs()).toHaveLength(11));
    });
  });

  describe("filters", () => {
    it("filters by client, and the cards count that client only", async () => {
      const user = userEvent.setup();
      const spy = await renderWorkbench();

      await user.selectOptions(screen.getByLabelText("Client"), "C02");

      await waitFor(() => expect(tableRefs()).toEqual(["R007"]));
      await waitFor(() =>
        expect(card(/^Valid: 1 records/)).toBeInTheDocument(),
      );
      expect(card(/^Needs attention: 0 records/)).toBeInTheDocument();
      expect(requestsTo(spy, "transactions").at(-1)).toEqual({
        clientId: "C02",
        status: undefined,
      });
    });

    it("keeps every client in the dropdown after filtering", async () => {
      const user = userEvent.setup();
      await renderWorkbench();
      const client = screen.getByLabelText("Client");
      await waitFor(() =>
        expect(within(client).getAllByRole("option")).toHaveLength(3),
      );

      await user.selectOptions(client, "C02");
      await waitFor(() => expect(tableRefs()).toEqual(["R007"]));
      expect(
        within(client)
          .getAllByRole("option")
          .map((o) => o.textContent),
      ).toEqual(["All clients", "C01", "C02"]);
    });

    it("combines client and status, and Clear filters resets both", async () => {
      const user = userEvent.setup();
      await renderWorkbench();

      await user.selectOptions(screen.getByLabelText("Client"), "C01");
      await user.selectOptions(
        screen.getByLabelText("Validation status"),
        "VALID",
      );
      await waitFor(() =>
        expect(tableRefs()).toEqual(["R001", "R002", "R008", "R010"]),
      );

      await user.click(screen.getByRole("button", { name: "Clear filters" }));
      await waitFor(() => expect(tableRefs()).toHaveLength(11));
      expect(screen.getByLabelText("Client")).toHaveValue("");
      expect(screen.getByLabelText("Validation status")).toHaveValue("");
    });

    it("keeps the status dropdown and the cards in sync", async () => {
      const user = userEvent.setup();
      await renderWorkbench();
      await user.click(card(/^Excluded/));
      expect(screen.getByLabelText("Validation status")).toHaveValue(
        "EXCLUDED",
      );
    });
  });

  describe("records table", () => {
    it("lists every record in arrival order", async () => {
      await renderWorkbench();
      expect(tableRefs()).toEqual(ITEMS.map((i) => i.recordRef));
    });

    it("explains why a record needs attention", async () => {
      await renderWorkbench();
      const row = rowOf("R003");
      expect(within(row).getByText("Needs attention")).toBeInTheDocument();
      expect(within(row).getByText("Total mismatch")).toHaveAttribute(
        "title",
        "TOTAL_MISMATCH on R003",
      );
    });

    it("shows a missing supplier as Missing, not blank", async () => {
      await renderWorkbench();
      const row = rowOf("R004");
      expect(within(row).getByText("Missing")).toBeInTheDocument();
    });

    it("shows a missing amount as a dash labelled missing, never 0.00", async () => {
      const r = makeItem([
        "R099",
        "C01",
        "XERO",
        "X-9",
        "BILL",
        "POSTED",
        "Acme",
        "100.00",
        null,
        "120.00",
        "NEEDS_ATTENTION",
        ["MISSING_AMOUNT"],
      ]);
      fakeApi([r]);
      renderWithProviders(<Workbench />);
      const row = (await screen.findByText("R099")).closest("tr")!;
      expect(within(row).getByText("missing")).toHaveClass("sr-only");
      expect(within(row).queryByText("0.00")).not.toBeInTheDocument();
    });

    it("shows amounts exactly as the API sends them, and doesn't colour a credit as an error", async () => {
      await renderWorkbench();
      const total = within(rowOf("R010")).getByText("-120.00");
      expect(total.className).not.toMatch(/red/);
    });

    it("labels excluded records with their source status", async () => {
      await renderWorkbench();
      const row = rowOf("R006");
      expect(within(row).getByText("Excluded")).toBeInTheDocument();
      expect(within(row).getByText("Draft")).toBeInTheDocument();
    });

    it("shows review state separately from validation", async () => {
      fakeApi([
        makeItem(
          [
            "R001",
            "C01",
            "XERO",
            "X-101",
            "BILL",
            "POSTED",
            "W",
            "1.00",
            "0.00",
            "1.00",
            "VALID",
            [],
          ],
          "REVIEWED",
        ),
      ]);
      renderWithProviders(<Workbench />);
      const row = (await screen.findByText("R001")).closest("tr")!;
      expect(within(row).getByText("Valid")).toBeInTheDocument();
      expect(within(row).getByText("Reviewed")).toBeInTheDocument();
    });

    it("selects a record by click or keyboard", async () => {
      const user = userEvent.setup();
      await renderWorkbench();

      await user.click(screen.getByText("Global Parts"));
      expect(rowOf("R003")).toHaveAttribute("aria-selected", "true");

      rowOf("R008").focus();
      await user.keyboard("{Enter}");
      expect(useWorkbenchStore.getState().selectedId).toBe("id-R008");
    });

    it("shows an empty state with a way out", async () => {
      const user = userEvent.setup();
      fakeApi([]);
      renderWithProviders(<Workbench />);
      expect(
        await screen.findByText("No records match these filters."),
      ).toBeInTheDocument();
      useWorkbenchStore.setState({ filters: { clientId: "C09" } });
      await user.click(
        screen.getAllByRole("button", { name: "Clear filters" })[0],
      );
      expect(useWorkbenchStore.getState().filters).toEqual({});
    });
  });

  describe("reviewer picker", () => {
    it("lists the reviewers and remembers the choice", async () => {
      const user = userEvent.setup();
      await renderWorkbench();
      const picker = screen.getByLabelText("Reviewing as");
      await waitFor(() => expect(picker).toBeEnabled());

      await user.selectOptions(picker, "rev-kofi");

      expect(useReviewerStore.getState().reviewerId).toBe("rev-kofi");
      expect(
        JSON.parse(localStorage.getItem("koovo.reviewer")!).state.reviewerId,
      ).toBe("rev-kofi");
    });

    it("ignores a remembered reviewer who no longer exists", async () => {
      fakeApi();
      renderWithProviders(<Workbench />);
      useReviewerStore.setState({ reviewerId: "rev-gone" });
      const picker = await screen.findByLabelText("Reviewing as");
      await waitFor(() => expect(picker).toBeEnabled());
      expect(picker).toHaveValue("");
    });
  });

  describe("when the API is down", () => {
    it("says how to start it", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Network Error"));
      renderWithProviders(<Workbench />);
      expect(
        await screen.findByText(/Can't reach the API/),
      ).toBeInTheDocument();
      expect(
        await screen.findByText(/Couldn't load records/),
      ).toBeInTheDocument();
    });
  });
});
