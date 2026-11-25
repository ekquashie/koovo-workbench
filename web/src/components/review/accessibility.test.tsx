import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, it, vi } from "vitest";
import { useReviewerStore } from "@/store/reviewer-store";
import { useWorkbenchStore } from "@/store/workbench-store";
import { expectNoAxeViolations } from "@/test/axe";
import { fakeApi } from "@/test/fake-api";
import { renderWithProviders } from "@/test/render";
import { Workbench } from "./workbench";

async function ready() {
  fakeApi();
  renderWithProviders(<Workbench />);
  await screen.findByText("R001");
  await waitFor(
    () =>
      screen.getByLabelText("Reviewing as").hasAttribute("disabled") === false,
  );
}

async function open(ref: string) {
  useWorkbenchStore.setState({ selectedId: `id-${ref}` });
  return screen.findByRole("complementary", { name: `Record ${ref}` });
}

describe("Accessibility (axe-core)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("workbench with every record", async () => {
    await ready();
    await expectNoAxeViolations();
  });

  it("filtered to one status, with a sorted column", async () => {
    const user = userEvent.setup();
    await ready();
    await user.click(
      screen.getByRole("button", { name: /^Needs attention 4 records/ }),
    );
    await user.click(screen.getByRole("button", { name: /Total £/ }));
    await expectNoAxeViolations();
  });

  it("record panel with an issue and the review form", async () => {
    useReviewerStore.setState({ reviewerId: "rev-eyram" });
    await ready();
    await open("R003");
    await expectNoAxeViolations();
  });

  it("review form showing a validation error", async () => {
    const user = userEvent.setup();
    await ready();
    useReviewerStore.setState({ reviewerId: "rev-eyram" });
    const panel = await open("R003");
    await user.click(
      within(panel).getByRole("button", { name: "Mark needs correction" }),
    );
    await within(panel).findByText(
      "Add a short note explaining what needs correcting.",
    );
    await expectNoAxeViolations();
  });

  it("excluded record (no form)", async () => {
    await ready();
    await open("R006");
    await expectNoAxeViolations();
  });
});
