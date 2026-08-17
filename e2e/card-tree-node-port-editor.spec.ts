import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

/**
 * E2E — card-tree-node v0.5.0 `<PortEditorStrip>` (FU-A), on a production build.
 *
 * v0.5.0 retired the strip's private `isCardLike` copy: the walker that
 * resolves `(nodeId, subPath)` now classifies keys through the same router as
 * the viewer, and takes the same `customPredefinedKeys` the renderer takes.
 *
 * The unit tier proves the classification (`__tests__/find-port-target.test.ts`,
 * 13 checks, watched failing first). What it cannot prove is that threading
 * the options through a memo did not break the shipped flow — the strip is
 * reached by clicking a node, and its empty state ("No card found at this
 * path.") is exactly what a broken walker renders. That failure mode is
 * SILENT-ish: the dialog still opens, the card-tree editor still works, and
 * only the ports quietly vanish. So it is asserted here, live.
 *
 * ASSERT ON STRUCTURE, NOT ON RENDERED TEXT — sibling-spec lesson; the one
 * text assertion below is the empty-state sentence, and it is asserted
 * ABSENT, which cannot be satisfied by unrelated demo prose matching.
 */

const ROUTE = "/components/card-tree-node";
/** The demo's prompt node — title "User Prompt", one root port, one `metadata`
 *  subcard that carries its own port (see card-tree-node/dummy-data.ts). */
const PROMPT_NODE = '[role="group"][aria-label="Card tree: User Prompt"]';
const NO_CARD_FOUND = "No card found at this path.";

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

/** Open the consumer-owned edit dialog by clicking a node's title strip. */
async function openRootDialog(page: Page) {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await page.locator(`${PROMPT_NODE} button`).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("card-tree-node port editor strip", () => {
  test("REGRESSION: the root card resolves — ports render, not the empty state", async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    const dialog = await openRootDialog(page);

    // A walker that fails to resolve renders the empty state instead of rows.
    await expect(dialog.getByText(NO_CARD_FOUND)).toHaveCount(0);

    // The strip's header is the structural anchor for "a target was found".
    await expect(dialog.getByText(/^Ports/)).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("a subcard click re-targets the strip at that subcard", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    // The prompt node carries a nested `metadata` subcard with its own ports.
    const subcard = page
      .locator(`${PROMPT_NODE} button[aria-label^="Subcard:"]`)
      .first();
    await expect(subcard).toBeVisible();
    await subcard.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Resolving a subcard by __rcid is the walk the fix rewrote.
    await expect(dialog.getByText(NO_CARD_FOUND)).toHaveCount(0);
    await expect(dialog.getByText(/^Ports/)).toBeVisible();
  });

  test("the strip is still editable — the add-port affordance is live", async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    const dialog = await openRootDialog(page);

    // `canAdd` is gated on a resolved target; if the walk failed there would
    // be no strip at all, let alone its add control.
    const addPort = dialog.getByRole("button", { name: /add port/i });
    await expect(addPort).toBeVisible();
    await addPort.click();
    // Scope to the popover, don't match on page text: an unscoped
    // getByText("Direction") also matches the usage prose on this very page
    // (three hits, strict-mode violation). Structure over text — the same
    // lesson the card-tree spec records.
    const popover = page.locator('[data-slot="popover-content"]');
    await expect(popover).toBeVisible();
    await expect(popover.getByText("Direction", { exact: true })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("dark theme renders the strip", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    const dialog = await openRootDialog(page);
    await expect(dialog.getByText(/^Ports/)).toBeVisible();
    await expect(dialog.getByText(NO_CARD_FOUND)).toHaveCount(0);
  });
});
