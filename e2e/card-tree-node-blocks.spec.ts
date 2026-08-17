import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

/**
 * E2E — card-tree-node v0.4.0 block rendering (FU-2), on a production build.
 *
 * Origin: the canvas viewer recognised scalars and `__rcid`-tagged objects and
 * nothing else, so every card-tree block — the five built-in predefined keys
 * AND every host-registered custom key — rendered as literally nothing. No
 * warning, no error; the node just looked like a node with fewer fields.
 *
 * These specs assert what the unit and component tiers structurally cannot:
 * that the blocks survive a real Next build, real hydration inside xyflow's
 * canvas, and the round trip through the edit dialog.
 *
 * ASSERT ON STRUCTURE, NOT ON RENDERED TEXT — the sibling card-tree spec
 * records why: a text-based regression check matched demo prose in a <code>
 * tag and produced a false failure. Here every assertion is anchored on
 * `[data-block-key]` / `[data-block-kind]`.
 */

const ROUTE = "/components/card-tree-node";

/**
 * The demo's block-bearing node (see card-tree-node/dummy-data.ts). Anchored
 * on the viewer's own `role="group"` + aria-label rather than an xyflow
 * internal class, so an xyflow upgrade cannot silently void these specs.
 */
const RESPONSE_NODE = '[role="group"][aria-label="Card tree: Response"]';

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

test.describe("card-tree-node blocks on the canvas", () => {
  test("REGRESSION: blocks render at all, with no console errors", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    // Before v0.4.0 this count was ZERO — the entire defect in one assertion.
    const chips = page.locator("[data-block-key]");
    await expect(chips.first()).toBeVisible();
    expect(await chips.count()).toBeGreaterThanOrEqual(4);

    expect(errors).toEqual([]);
  });

  test("built-in blocks render as summary chips carrying their kind", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    // `table` lives on the prompt node, the rest on the response node.
    for (const kind of ["table", "codearea", "quote"]) {
      await expect(page.locator(`[data-block-kind="${kind}"]`).first()).toBeVisible();
    }

    // The table summary is derived from the payload, not hardcoded:
    // 1 row x 3 headers in the fixture.
    await expect(page.locator('[data-block-key="table"]').first()).toContainText("1 x 3");
  });

  test("a card with more blocks than the cap says so, rather than hiding them", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    // The response card carries 4 blocks against the default cap of 3, so the
    // fourth (`list`) must be accounted for by an overflow chip — never just
    // dropped. Silent truncation is the failure mode this release is about.
    const node = page.locator(RESPONSE_NODE).first();
    await expect(node.locator("[data-block-overflow]")).toHaveText("+1");
    await expect(node.locator('[data-block-key="list"]')).toHaveCount(0);
  });

  test("a host-registered custom block is painted by the host renderer", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    // The demo turns `renderCustomBlocks` on for `body`, so this chip holds
    // the host's own output rather than the "2 items" summary.
    const body = page.locator('[data-block-key="body"]');
    await expect(body).toBeVisible();
    await expect(body).toHaveAttribute("data-block-kind", "custom");
    await expect(body).toContainText("Summary");
    await expect(body).not.toContainText("2 items");
  });

  test("REGRESSION: a block is never rendered as a nested subcard", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const node = page.locator(RESPONSE_NODE).first();
    await expect(node).toBeVisible();

    // The response card has exactly ONE genuine child card (`metadata`).
    // If the classifier regressed, blocks would reappear as subcard buttons
    // and this count would climb.
    const subcards = node.locator('button[aria-label^="Subcard:"]');
    await expect(subcards).toHaveCount(1);
    await expect(subcards.first()).toHaveAttribute("aria-label", "Subcard: Metadata");
  });

  test("`quote` does not displace a real flat field", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const node = page.locator(RESPONSE_NODE).first();
    // Through v0.3 `quote` was absorbed into the <dl> as a string field and
    // could consume one of the three slots. It must be a chip, not a term.
    const terms = await node.locator("dl dt").allTextContents();
    expect(terms).not.toContain("quote");
    await expect(node.locator('[data-block-key="quote"]')).toBeVisible();
  });

  test("the node and the edit dialog agree about what is a block", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const node = page.locator(RESPONSE_NODE).first();
    await node.locator("button").first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    /* The demo hands the SAME `customPredefinedKeys` array to the canvas
     * renderer and to <CardTree>. If the dialog did not receive it, `body`
     * would be an unregistered array — which card-tree's parser drops (Q-P4),
     * so the content would silently disappear on open. Scoped to the dialog,
     * per the sibling spec's lesson about page-wide text queries. */
    await expect(dialog.getByText("Three sources agreed; one dissented.")).toBeVisible();
  });
});
