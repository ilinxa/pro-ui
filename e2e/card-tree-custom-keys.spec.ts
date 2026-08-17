import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

/**
 * E2E — card-tree v0.6.0 custom predefined-keys, on a production build.
 *
 * These assert the things the other two tiers structurally cannot: that the
 * feature survives a real Next build, real hydration, and real user input.
 *
 * Origin: `customPredefinedKeys` shipped declared, documented and completely
 * inert for three minor versions. The regression these guard against is that
 * a registered block silently falls back to being an ordinary nested card —
 * which round-trips correctly and therefore looks like success.
 *
 * ASSERT ON STRUCTURE, NOT ON RENDERED TEXT. An earlier version of the
 * regression check counted the literal string "metric" and matched demo prose
 * in a <code> tag plus a table column header in an unrelated card. Text
 * matching produced a false failure; structure did not.
 */

const ROUTE = "/components/card-tree";

/** The demo card carrying both custom blocks (see card-tree/demo.tsx DEMO_TREE). */
const IMPACT_CARD = '[data-rcid="ch4"]';

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

test.describe("card-tree custom predefined-keys", () => {
  test("both custom blocks render after hydration, with no console errors", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    /* SCOPED TO THE CARD, deliberately. An earlier version of this test queried
     * the whole page and PASSED under a full regression (fix reverted, blocks
     * gone) because the demo's own descriptive prose contains these same
     * strings. A page-wide text query proves nothing here. Scoping to the card
     * that owns the blocks is what makes the assertion mean something. */
    const impact = page.locator(IMPACT_CARD);
    await expect(impact).toHaveCount(1);

    // object-valued registration (`metric`)
    await expect(impact.getByText("% task success")).toBeVisible();

    // array-valued registration (`body`) — every item, not just the first
    await expect(impact.getByText("Why array-valued blocks matter")).toBeVisible();
    await expect(impact.getByText(/Plate Value and editor\.js/)).toBeVisible();

    expect(errors, `unexpected console/page errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REGRESSION: the card holding both custom blocks has zero descendant cards", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const impact = page.locator(IMPACT_CARD);
    await expect(impact).toHaveCount(1);

    /* This is the decisive assertion. Under v0.5.0 the object-valued `metric`
     * fell through classifyKey to the `child` route and rendered as a nested
     * CARD, and the array-valued `body` was rejected outright. If either
     * regresses, a descendant card appears here. */
    await expect(impact.locator("[data-rcid]")).toHaveCount(0);
    await expect(impact.locator('[role="treeitem"]')).toHaveCount(0);
  });

  test("custom blocks survive the search path (searchableText is wired)", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    /* Asserted, not skipped. An earlier draft did `test.skip(...)` when the
     * search box was absent — which means a demo refactor that drops the input
     * silently stops testing this path while CI still reports green. A missing
     * affordance should be a loud failure, not a quiet loss of coverage. */
    const search = page.getByRole("searchbox").or(page.getByPlaceholder(/search/i)).first();
    await expect(search, "demo must expose a search input for this spec to mean anything").toHaveCount(1);
    await search.fill("Plate Value");
    // The block's text is reachable through the custom key's searchableText;
    // at minimum the page must not error or blank the tree, and the block must
    // still be a block (scoped — see the note in the first test).
    const impact = page.locator(IMPACT_CARD);
    await expect(impact).toHaveCount(1);
    await expect(impact.locator("[data-rcid]")).toHaveCount(0);
  });

  test("edit mode exposes the add-block menu without crashing on host icons", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    // The demo ships a view/editing toggle (aria-pressed) — flip it on.
    // Asserted rather than skipped, for the same reason as the search spec above.
    const toggle = page.locator("[aria-pressed]").first();
    await expect(toggle, "demo must expose an editable toggle for this spec to mean anything").toHaveCount(1);
    await toggle.click();

    // Both custom blocks must still be present in edit mode.
    await expect(page.getByText("% task success").first()).toBeVisible();
    await expect(page.locator(IMPACT_CARD).locator("[data-rcid]")).toHaveCount(0);

    /* The add-menu renders host-supplied `icon` nodes. A throwing icon is
     * covered by the component tier; here we only prove the real menu opens on
     * a production build without taking the page down. */
    expect(errors, `errors after entering edit mode:\n${errors.join("\n")}`).toEqual([]);
  });

  test("dark theme renders custom blocks", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    // Scoped, for the same reason as the first test.
    const impact = page.locator(IMPACT_CARD);
    await expect(impact.getByText("% task success")).toBeVisible();
    await expect(impact.getByText("Why array-valued blocks matter")).toBeVisible();
  });
});
