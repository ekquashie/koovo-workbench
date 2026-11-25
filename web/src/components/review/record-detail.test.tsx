import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReviewerStore } from "@/store/reviewer-store";
import { useWorkbenchStore } from "@/store/workbench-store";
import { apiError } from "@/test/http";
import { fakeApi } from "@/test/fake-api";
import { renderWithProviders } from "@/test/render";
import { Workbench } from "./workbench";

/** Renders the workbench with a record open and (optionally) a reviewer chosen. */
async function openRecord(
  ref: string,
  { reviewer = "rev-eyram" as string | null } = {},
) {
  const api = fakeApi();
  renderWithProviders(<Workbench />);
  if (reviewer) useReviewerStore.setState({ reviewerId: reviewer });
  await screen.findByText("R001");
  useWorkbenchStore.setState({ selectedId: `id-${ref}` });
  const panel = await screen.findByRole("complementary", {
    name: `Record ${ref}`,
  });
  // Wait until reviewers are loaded so the form knows who is reviewing.
  await waitFor(() =>
    expect(screen.getByLabelText("Reviewing as")).toBeEnabled(),
  );
  return { api, panel, user: userEvent.setup() };
}

const reviewPosts = (api: ReturnType<typeof fakeApi>) =>
  api.post.mock.calls.map(([url, body, config]) => ({
    url,
    body,
    reviewer: (config?.headers as Record<string, string>)["X-Reviewer-Id"],
  }));

describe("Record detail panel", () => {
  afterEach(() => vi.restoreAllMocks());

  it("opens when a row is clicked and closes with the button or Escape", async () => {
    fakeApi();
    const user = userEvent.setup();
    renderWithProviders(<Workbench />);
    await user.click(await screen.findByText("Global Parts"));
    expect(
      await screen.findByRole("complementary", { name: "Record R003" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close record" }));
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();

    await user.click(screen.getByText("Global Parts"));
    await screen.findByRole("complementary", { name: "Record R003" });
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  describe("explaining the record", () => {
    it("says why it needs attention and highlights the field", async () => {
      const { panel } = await openRecord("R003");
      expect(
        within(panel).getByRole("heading", { name: "Why it needs attention" }),
      ).toBeInTheDocument();
      expect(within(panel).getByText("Total mismatch")).toBeInTheDocument();

      const source = within(panel).getByRole("table", {
        name: /Source data for R003/,
      });
      const totalRow = within(source)
        .getByRole("rowheader", { name: /Total £/ })
        .closest("tr")!;
      expect(totalRow).toHaveAttribute("data-flagged", "true");
      expect(within(totalRow).getByText("(flagged)")).toHaveClass("sr-only");
      expect(
        within(source)
          .getByRole("rowheader", { name: /Subtotal £/ })
          .closest("tr"),
      ).not.toHaveAttribute("data-flagged");
    });

    it("shows the raw input next to what was understood", async () => {
      const { panel } = await openRecord("R004");
      const source = within(panel).getByRole("table", { name: /Source data/ });
      const supplier = within(source)
        .getByRole("rowheader", { name: /Supplier/ })
        .closest("tr")!;
      expect(within(supplier).getByText("-")).toBeInTheDocument();
      expect(within(supplier).getByText("Missing")).toBeInTheDocument();
    });

    it("links a repeat to the original record", async () => {
      const { panel, user } = await openRecord("R005");
      expect(
        within(panel).getByText(/Exact repeat of R001/),
      ).toBeInTheDocument();
      expect(
        within(panel).getByText(/Not counted as a separate transaction/),
      ).toBeInTheDocument();

      await user.click(
        within(panel).getByRole("button", { name: "Open R001" }),
      );
      expect(
        await screen.findByRole("complementary", { name: "Record R001" }),
      ).toBeInTheDocument();
    });

    it("explains an excluded record and offers no review actions", async () => {
      const { panel } = await openRecord("R006");
      expect(
        within(panel).getByText(/Draft and Void records aren't checked/),
      ).toBeInTheDocument();
      expect(
        within(panel).queryByRole("button", { name: /Mark/ }),
      ).not.toBeInTheDocument();
    });

    it("says when a record passes every check", async () => {
      const { panel } = await openRecord("R001");
      expect(
        within(panel).getByText("Passes every check."),
      ).toBeInTheDocument();
    });
  });

  describe("reviewing", () => {
    it("asks for a reviewer before allowing any action", async () => {
      const { panel } = await openRecord("R001", { reviewer: null });
      expect(
        within(panel).getByText(/Choose who is reviewing/),
      ).toBeInTheDocument();
      expect(
        within(panel).getByRole("button", { name: "Mark reviewed" }),
      ).toBeDisabled();
      expect(
        within(panel).getByRole("button", { name: "Mark needs correction" }),
      ).toBeDisabled();
    });

    it("lets the reviewer be chosen right in the panel, and keeps the header in sync", async () => {
      const { panel, user } = await openRecord("R003", { reviewer: null });
      await user.selectOptions(
        within(panel).getByLabelText("Choose reviewer"),
        "rev-shiela",
      );

      expect(
        within(panel).getByRole("button", { name: "Mark needs correction" }),
      ).toBeEnabled();
      expect(screen.getByLabelText("Reviewing as")).toHaveValue("rev-shiela");
      // Once chosen, the prompt (and its picker) goes away.
      expect(
        within(panel).queryByText(/Choose who is reviewing/),
      ).not.toBeInTheDocument();
    });

    it("marks a valid record Reviewed, sending the reviewer and the version shown", async () => {
      const { api, panel, user } = await openRecord("R001");
      await user.click(
        within(panel).getByRole("button", { name: "Mark reviewed" }),
      );

      expect(reviewPosts(api)).toEqual([
        {
          url: "transactions/id-R001/reviews",
          body: {
            action: "MARK_REVIEWED",
            note: undefined,
            expectedVersion: 0,
          },
          reviewer: "rev-eyram",
        },
      ]);
      // The record, its history and the table row refresh.
      await waitFor(() =>
        expect(within(panel).getAllByText("Reviewed").length).toBeGreaterThan(
          0,
        ),
      );
      expect(
        await within(panel).findByText("Eyram Quashie"),
      ).toBeInTheDocument();
      expect(
        within(panel).getByRole("button", { name: "Mark reviewed" }),
      ).toBeDisabled();
      expect(
        within(panel).getByText("Already marked Reviewed."),
      ).toBeInTheDocument();
    });

    it("never changes the validation counts: review state is separate", async () => {
      const { panel, user } = await openRecord("R001");
      // The summary cards are named "Valid 5 records" etc.
      const expectCounts = () => {
        for (const name of [
          "Valid 5 records",
          "Needs attention 4 records",
          "Excluded 2 records",
        ]) {
          expect(screen.getByRole("button", { name })).toBeInTheDocument();
        }
      };
      await waitFor(expectCounts);

      await user.click(
        within(panel).getByRole("button", { name: "Mark reviewed" }),
      );
      // The table row shows the new review state…
      const table = screen.getByRole("table", { name: /^Transactions/ });
      await waitFor(() =>
        expect(within(table).getByText("Reviewed")).toBeInTheDocument(),
      );
      // …while validation and the counts are untouched.
      expect(within(table).getAllByText("Valid")).toHaveLength(5);
      expectCounts();
    });

    it("won't mark a record with issues Reviewed, and says why", async () => {
      const { api, panel } = await openRecord("R003");
      expect(
        within(panel).getByRole("button", { name: "Mark reviewed" }),
      ).toBeDisabled();
      expect(
        within(panel).getByText(
          /can't be marked Reviewed. Mark it Needs correction instead./,
        ),
      ).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    it("requires a note for Needs correction, without calling the API", async () => {
      const { api, panel, user } = await openRecord("R003");
      await user.click(
        within(panel).getByRole("button", { name: "Mark needs correction" }),
      );
      expect(
        await within(panel).findByText(
          "Add a short note explaining what needs correcting.",
        ),
      ).toBeInTheDocument();

      await user.type(within(panel).getByLabelText(/Note/), "  ab ");
      await user.click(
        within(panel).getByRole("button", { name: "Mark needs correction" }),
      );
      expect(
        await within(panel).findByText(
          "The note must be at least 3 characters.",
        ),
      ).toBeInTheDocument();
      expect(within(panel).getByLabelText(/Note/)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(api.post).not.toHaveBeenCalled();
    });

    it("records Needs correction with a trimmed note and shows it in the history", async () => {
      const { api, panel, user } = await openRecord("R003");
      await user.type(
        within(panel).getByLabelText(/Note/),
        "  Total is 5.00 too high  ",
      );
      await user.click(
        within(panel).getByRole("button", { name: "Mark needs correction" }),
      );

      expect(reviewPosts(api)[0].body).toEqual({
        action: "MARK_NEEDS_CORRECTION",
        note: "Total is 5.00 too high",
        expectedVersion: 0,
      });
      const history = await within(panel).findByRole("list", {
        name: /Review history/,
      });
      expect(
        within(history).getByText("“Total is 5.00 too high”"),
      ).toBeInTheDocument();
      expect(within(panel).getByLabelText(/Note/)).toHaveValue("");
    });

    it("sends the new version on the next action (Needs correction → Reviewed)", async () => {
      const { api, panel, user } = await openRecord("R001");
      await user.type(
        within(panel).getByLabelText(/Note/),
        "Check with client",
      );
      await user.click(
        within(panel).getByRole("button", { name: "Mark needs correction" }),
      );
      await within(panel).findByText("“Check with client”", { selector: "p" });

      useReviewerStore.setState({ reviewerId: "rev-shiela" });
      await user.click(
        within(panel).getByRole("button", { name: "Mark reviewed" }),
      );

      await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
      expect(reviewPosts(api)[1]).toMatchObject({
        body: { action: "MARK_REVIEWED", expectedVersion: 1 },
        reviewer: "rev-shiela",
      });
      const history = await within(panel).findByRole("list", {
        name: /Review history/,
      });
      await waitFor(() =>
        expect(within(history).getAllByRole("listitem")).toHaveLength(2),
      );
      // Newest first.
      expect(within(history).getAllByRole("listitem")[0]).toHaveTextContent(
        "Shiela Plange marked it Reviewed",
      );
    });

    it("on 409 explains that someone else got there first and shows the latest", async () => {
      const { api, panel, user } = await openRecord("R002");
      // Someone else reviews R002 after this screen loaded it.
      api.items[1].review = {
        ...api.items[1].review,
        state: "NEEDS_CORRECTION",
        version: 1,
        updatedBy: "rev-shiela",
      };

      await user.click(
        within(panel).getByRole("button", { name: "Mark reviewed" }),
      );

      expect(await within(panel).findByRole("alert")).toHaveTextContent(
        "R002 was updated by someone else since you loaded it. The latest version is now shown.",
      );
      await waitFor(() =>
        expect(
          within(panel).getAllByText("Needs correction").length,
        ).toBeGreaterThan(0),
      );
    });

    it("shows the API's field error on the note", async () => {
      const { api, panel, user } = await openRecord("R003");
      api.post.mockRejectedValueOnce(
        apiError(400, "Bad note", {
          note: "The note must be at most 500 characters.",
        }),
      );
      await user.type(within(panel).getByLabelText(/Note/), "fine locally");
      await user.click(
        within(panel).getByRole("button", { name: "Mark needs correction" }),
      );
      expect(
        await within(panel).findByText(
          "The note must be at most 500 characters.",
        ),
      ).toBeInTheDocument();
    });

    it("shows a refusal from the API as a message", async () => {
      const { api, panel, user } = await openRecord("R001");
      api.post.mockRejectedValueOnce(
        apiError(422, "R001 is already marked Reviewed."),
      );
      await user.click(
        within(panel).getByRole("button", { name: "Mark reviewed" }),
      );
      expect(await within(panel).findByRole("alert")).toHaveTextContent(
        "R001 is already marked Reviewed.",
      );
    });

    it("clears the note when switching to another record", async () => {
      const { panel, user } = await openRecord("R003");
      await user.type(within(panel).getByLabelText(/Note/), "draft note");
      useWorkbenchStore.setState({ selectedId: "id-R004" });
      const next = await screen.findByRole("complementary", {
        name: "Record R004",
      });
      expect(within(next).getByLabelText(/Note/)).toHaveValue("");
    });
  });
});
