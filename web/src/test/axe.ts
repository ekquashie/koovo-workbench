import axe from "axe-core";
import { expect } from "vitest";

/**
 * Runs axe-core on rendered DOM and fails with a readable list of
 * violations. jsdom doesn't lay out or paint, so colour contrast is checked
 * in the browser (e2e), not here.
 */
export async function expectNoAxeViolations(root: Element = document.body) {
  const { violations } = await axe.run(root, {
    rules: { "color-contrast": { enabled: false } },
  });
  const report = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n` +
      v.nodes.map((n) => `  - ${n.target.join(" ")}`).join("\n"),
  );
  expect(report, report.join("\n")).toEqual([]);
}
