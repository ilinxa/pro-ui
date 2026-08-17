/**
 * T4 headline test — a throwing host `render` degrades to the generic JSON
 * fallback and does NOT blank the tree; the rest of the card survives.
 *
 * This is precisely the gap the component tier exists to close (see
 * docs/plans/test-infrastructure-plan.md §top of file): the throw happens
 * inside React's own render pass (rendering the element `render()` returns),
 * not at the `registration.render()` call site — a throwing validator can be
 * proven at the lib tier (`./host-hostility.test.ts`), but a throwing
 * RENDER can only be proven by actually mounting the component.
 *
 * React logs the caught error in dev mode (componentDidCatch diagnostics).
 * That noise is expected FOR THIS TEST ONLY — the spy is scoped to this
 * describe block and restored in `afterEach`, and the test asserts the spy
 * WAS called, so a silently-swallowed *different* failure can't hide behind
 * this suppression.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CardTree } from "../card-tree";
import type { CardTreeJsonNode } from "../types";
import { makeThrowingRenderKey } from "./component-fixtures";

// `vitest.config.ts` does not set `test.globals: true`, so
// `@testing-library/react`'s auto-cleanup (which detects a GLOBAL
// `afterEach`) never registers — must be wired explicitly per file.
afterEach(() => cleanup());

describe("PredefinedCustom: throwing host render() degrades via HostRenderBoundary", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("falls back to the generic JSON view and the rest of the card survives", () => {
    const tree: CardTreeJsonNode = {
      title: "Root",
      boom: { armed: true },
      note: "still here",
    };
    render(
      <CardTree
        defaultValue={tree}
        aria-label="Root"
        customPredefinedKeys={[makeThrowingRenderKey()]}
      />,
    );

    // The tree itself did not blank out.
    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Root", level: 3 })).toBeInTheDocument();

    // Degrades to the generic JSON fallback (parts/predefined-custom.tsx's
    // GenericJsonFallback), not a blank hole where the block was.
    expect(screen.getByText("custom renderer error")).toBeInTheDocument();
    expect(screen.getByText(/"armed": true/)).toBeInTheDocument();

    // A sibling scalar field on the SAME card survives the neighboring
    // block's crash — the throw didn't take the whole card down with it.
    expect(screen.getByText("note")).toBeInTheDocument();
    expect(screen.getByText("still here")).toBeInTheDocument();

    // React did log the caught error — proves this test didn't silence some
    // OTHER, unrelated failure by accident.
    expect(errorSpy).toHaveBeenCalled();
  });
});
