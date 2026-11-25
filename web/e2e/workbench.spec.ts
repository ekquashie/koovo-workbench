import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * The brief's main flow against the real API. Tests run in order on one
 * seeded API, so later tests see earlier reviews (as a user would).
 */
test.describe.configure({ mode: "serial" });

const records = (page: Page) =>
  page.getByRole("table", { name: /^Transactions/ });
const row = (page: Page, ref: string) =>
  records(page)
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: ref, exact: true }) });
const refs = async (page: Page) =>
  records(page).locator("tbody tr td:first-child").allTextContents();
const card = (page: Page, label: string) =>
  page.getByRole("button", { name: new RegExp(`^${label} \\d+ records`) });
const panel = (page: Page, ref: string): Locator =>
  page.getByRole("complementary", { name: `Record ${ref}` });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(row(page, "R001")).toBeVisible();
});

test("shows the supplied dataset as 5 valid / 4 needs attention / 2 excluded", async ({
  page,
}) => {
  await expect(card(page, "Valid")).toHaveAccessibleName(/Valid 5 records/);
  await expect(card(page, "Needs attention")).toHaveAccessibleName(
    /Needs attention 4 records/,
  );
  await expect(card(page, "Excluded")).toHaveAccessibleName(
    /Excluded 2 records/,
  );
  expect(await refs(page)).toHaveLength(11);
  await expect(row(page, "R003")).toContainText("Total mismatch");
  await expect(row(page, "R005")).toContainText("Duplicate");
});

test("filters by validation status and by client", async ({ page }) => {
  await card(page, "Needs attention").click();
  await expect.poll(() => refs(page)).toEqual(["R003", "R004", "R005", "R011"]);

  await card(page, "Needs attention").click();
  await page.getByLabel("Client").selectOption("C02");
  await expect.poll(() => refs(page)).toEqual(["R007"]);
  await expect(card(page, "Valid")).toHaveAccessibleName(/Valid 1 records/);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect.poll(() => refs(page)).toHaveLength(11);
});

test("keeps filters in the URL: shareable and kept on reload", async ({
  page,
}) => {
  await card(page, "Needs attention").click();
  await page.getByLabel("Client").selectOption("C01");
  await expect(page).toHaveURL(/\?status=needs_attention&client=C01$/);

  // Reload, and a fresh tab opening the same link: same filtered view.
  await page.reload();
  await expect.poll(() => refs(page)).toEqual(["R003", "R004", "R005", "R011"]);
  const shared = await page.context().newPage();
  await shared.goto("/?client=C02&status=VALID");
  await expect.poll(() => refs(shared)).toEqual(["R007"]);
  await expect(shared.getByLabel("Validation status")).toHaveValue("VALID");
  await shared.close();

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("explains a repeated record and links to the original", async ({
  page,
}) => {
  await row(page, "R005").click();
  const detail = panel(page, "R005");
  await expect(detail).toContainText("Exact repeat of R001");
  await expect(
    detail.getByRole("rowheader", { name: /Total £/ }),
  ).toBeVisible();

  await detail.getByRole("button", { name: "Open R001" }).click();
  await expect(panel(page, "R001")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("complementary")).toHaveCount(0);
});

test("reviews records without changing validation counts", async ({ page }) => {
  await page.getByLabel("Reviewing as").selectOption("rev-eyram");

  // A record with an issue: Reviewed is blocked, Needs correction needs a note.
  await row(page, "R003").click();
  const r003 = panel(page, "R003");
  await expect(
    r003.getByRole("button", { name: "Mark reviewed" }),
  ).toBeDisabled();
  await r003.getByRole("button", { name: "Mark needs correction" }).click();
  await expect(r003).toContainText(
    "Add a short note explaining what needs correcting.",
  );
  await r003
    .getByLabel(/Note/)
    .fill("Total is 5.00 higher than subtotal + VAT");
  await r003.getByRole("button", { name: "Mark needs correction" }).click();
  await expect(
    r003.getByRole("list", { name: /Review history/ }),
  ).toContainText("Eyram Quashie marked it Needs correction");
  await expect(row(page, "R003")).toContainText("Needs correction");

  // A valid record can be marked Reviewed, once.
  await row(page, "R001").click();
  const r001 = panel(page, "R001");
  await r001.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(r001).toContainText("Already marked Reviewed.");
  await expect(row(page, "R001")).toContainText("Reviewed");

  // Review state is separate from validation.
  await expect(card(page, "Valid")).toHaveAccessibleName(/Valid 5 records/);
  await expect(card(page, "Needs attention")).toHaveAccessibleName(
    /Needs attention 4 records/,
  );
});

test("keeps review decisions after a reload (stored by the API)", async ({
  page,
}) => {
  await expect(row(page, "R001")).toContainText("Reviewed");
  await row(page, "R003").click();
  await expect(panel(page, "R003")).toContainText(
    "“Total is 5.00 higher than subtotal + VAT”",
  );
});

test("offers no review actions on excluded records", async ({ page }) => {
  await row(page, "R006").click();
  const r006 = panel(page, "R006");
  await expect(r006).toContainText("Draft and Void records aren't checked");
  await expect(r006.getByRole("button", { name: /Mark/ })).toHaveCount(0);
});

test("has no accessibility violations in a real browser, including colour contrast", async ({
  page,
}, testInfo) => {
  const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
  await page.addScriptTag({ content: readFileSync(axePath, "utf8") });
  const scan = () =>
    page.evaluate(async () => {
      const result = await (
        window as unknown as { axe: typeof import("axe-core") }
      ).axe.run();
      return result.violations.map((v) => ({
        id: v.id,
        help: v.help,
        nodes: v.nodes
          .slice(0, 5)
          .map((n) => `${n.target.join(" ")}: ${n.failureSummary ?? ""}`),
      }));
    });

  // 1. An excluded record. Select a row with secondary text (source ID) and
  // let the selected background finish fading in, so the scan sees the
  // final colours.
  await row(page, "R006").click();
  await expect(panel(page, "R006")).toBeVisible();
  await page.waitForTimeout(400);
  let violations = await scan();
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);

  // 2. The review form with no reviewer chosen yet (fresh browser storage):
  // the prompt with its own reviewer picker, and disabled buttons.
  await row(page, "R003").click();
  const r003 = panel(page, "R003");
  await expect(r003.getByLabel("Choose reviewer")).toBeVisible();
  await page.waitForTimeout(400);
  await r003
    .getByRole("form", { name: "Review R003" })
    .screenshot({ path: testInfo.outputPath("r003-no-reviewer.png") });
  violations = await scan();
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});
