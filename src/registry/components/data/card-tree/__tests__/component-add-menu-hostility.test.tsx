/**
 * T4 — `parts/predefined-add-menu.tsx` must survive hostile host code at
 * every point it touches: a throwing `icon` (wrapped in the same
 * `HostRenderBoundary` used for `render`), a throwing `defaultValue()`
 * (caught by a plain try/catch and degraded to `null`), and a `validate()`
 * that always rejects (the add is silently refused, never committed).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardTree } from "../card-tree";
import type { CardTreeJsonNode } from "../types";
import {
  makeRejectingKey,
  makeThrowingDefaultValueKey,
  makeThrowingIconKey,
} from "./component-fixtures";

// `vitest.config.ts` does not set `test.globals: true`, so
// `@testing-library/react`'s auto-cleanup (which detects a GLOBAL
// `afterEach`) never registers — must be wired explicitly per file.
afterEach(() => cleanup());

describe("PredefinedAddMenu: throwing host icon() does not crash the add-menu", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The icon crashes during React's render pass — same HostRenderBoundary
    // machinery as the render-boundary test, so React logs it. Scoped to
    // this describe block only.
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("the menu still opens and lists the key despite a throwing icon", async () => {
    const user = userEvent.setup();
    const tree: CardTreeJsonNode = { title: "Root" };
    render(
      <CardTree
        defaultValue={tree}
        editable
        customPredefinedKeys={[makeThrowingIconKey()]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "block" }));

    expect(screen.getByRole("button", { name: /Flagged/ })).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("adding the key still works after the icon crash", async () => {
    const user = userEvent.setup();
    const tree: CardTreeJsonNode = { title: "Root" };
    render(
      <CardTree
        defaultValue={tree}
        editable
        customPredefinedKeys={[makeThrowingIconKey()]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "block" }));
    await user.click(screen.getByRole("button", { name: /Flagged/ }));

    // predefinedAdd (card-tree.tsx) auto-enters edit mode for every freshly
    // added block (built-in or custom), so it commits straight into the
    // JSON-fallback editor (this fixture has no `edit`) — the add committed
    // without crashing. Cancel out of edit mode to reach the view render.
    expect(
      screen.getByRole("textbox", { name: "Edit flagged (JSON)" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel edit" }));

    expect(screen.getByTestId("flagged-render")).toBeInTheDocument();
  });
});

describe("PredefinedAddMenu: throwing defaultValue() degrades rather than crashing", () => {
  it("degrades the freshly-added entry to null and still renders it", async () => {
    const user = userEvent.setup();
    const tree: CardTreeJsonNode = { title: "Root" };
    render(
      <CardTree
        defaultValue={tree}
        editable
        customPredefinedKeys={[makeThrowingDefaultValueKey()]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "block" }));
    await user.click(screen.getByRole("button", { name: /Brittle/ }));

    // `defaultCustomEntry` (predefined-add-menu.tsx) caught the throw and
    // degraded the value to `null` — the entry still committed (this key's
    // `validate` accepts anything). It lands straight in the JSON-fallback
    // editor (predefinedAdd auto-enters edit mode), seeded with the
    // degraded value.
    expect(
      screen.getByRole("textbox", { name: "Edit brittle (JSON)" }),
    ).toHaveValue("null");

    // Cancel out of edit mode to prove the VIEW path also degrades cleanly.
    await user.click(screen.getByRole("button", { name: "Cancel edit" }));
    expect(screen.getByTestId("brittle-render")).toHaveTextContent("null");
  });
});

describe("PredefinedAddMenu: validate() rejection is silently refused", () => {
  it("drops the entry — it never commits, and the tree keeps rendering", async () => {
    const user = userEvent.setup();
    const tree: CardTreeJsonNode = { title: "Root" };
    render(
      <CardTree
        defaultValue={tree}
        aria-label="Root"
        editable
        customPredefinedKeys={[makeRejectingKey()]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "block" }));
    await user.click(screen.getByRole("button", { name: /Strict/ }));

    // Never committed — `dispatchers.predefinedAdd` (card-tree.tsx) gates on
    // `validateEntryShape`, which calls this key's always-failing `validate`
    // BEFORE the queueCommit, so the block never mounts.
    expect(screen.queryByTestId("strict-render")).not.toBeInTheDocument();

    // The tree survived the refused add — root card is still there, and the
    // add-menu itself is still usable (still offers "Strict", since it was
    // never actually added to the card's present keys).
    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Root", level: 3 })).toBeInTheDocument();
  });
});
