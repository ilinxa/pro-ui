/**
 * FU-2, component tier: the actual React render pass.
 *
 * `./derive-blocks.test.ts` proves the classifier and derivers route values
 * correctly. This file proves the viewer MOUNTS them — the half that was
 * missing when the bug shipped. card-tree v0.6.0's post-mortem is explicit
 * about this: no producer-side gate can see a wired-but-inert prop, only a
 * render that asserts on the output can.
 *
 * Assertions target STRUCTURE (`[data-block-key]`, descendant counts) rather
 * than page-wide text, per the test-tier convention.
 *
 * The fixtures carry no `ports`, so `PortsAt` short-circuits to null and no
 * xyflow provider is needed in jsdom.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { RenderContext } from "../../flow-canvas/types";
import type { CustomPredefinedKey } from "../../card-tree/types";
import { createCardTreeViewerRenderer } from "../parts/card-tree-viewer";
import { cardTreeViewerRenderer } from "../parts/card-tree-viewer";
import { CUSTOM_KEY_NAMES, everyBlockCard, plainCard } from "./fixtures";

// `vitest.config.ts` does not set `test.globals: true`, so
// @testing-library/react's auto-cleanup (which looks for a GLOBAL afterEach)
// never registers — it must be wired explicitly per file.
afterEach(() => cleanup());

const ctx: RenderContext = {
  nodeId: "n1",
  isSelected: false,
  isDragging: false,
  isReadOnly: false,
  renderChild: () => null,
  onEditRequest: undefined,
};

function makeKey(
  key: string,
  render?: (value: unknown) => ReactNode,
): CustomPredefinedKey {
  return {
    key,
    validate: () => ({ ok: true }),
    render: render ?? (() => null),
    defaultValue: () => null,
  };
}

function blockKeys(): string[] {
  return Array.from(document.querySelectorAll("[data-block-key]")).map(
    (el) => el.getAttribute("data-block-key") ?? "",
  );
}

describe("CardTreeViewer: blocks reach the DOM (FU-2)", () => {
  it("REPRODUCTION: every built-in and custom block renders, none vanish", () => {
    const renderer = createCardTreeViewerRenderer({
      customPredefinedKeys: CUSTOM_KEY_NAMES.map((k) => makeKey(k)),
      maxBlocks: 10,
    });
    render(<>{renderer.render(everyBlockCard, ctx)}</>);

    // Before v0.4.0 this list was empty — the whole of FU-2 in one assertion.
    expect(blockKeys().sort()).toEqual(
      ["body", "codearea", "image", "list", "metric", "quote", "table"].sort(),
    );
  });

  it("labels each block with its kind for consumer styling", () => {
    const renderer = createCardTreeViewerRenderer({ maxBlocks: 10 });
    render(<>{renderer.render(everyBlockCard, ctx)}</>);
    const table = document.querySelector('[data-block-key="table"]');
    expect(table?.getAttribute("data-block-kind")).toBe("table");
    expect(table?.textContent).toContain("2 x 3");
  });

  it("keeps `quote` out of the flat-field strip so a real field is not displaced", () => {
    const renderer = createCardTreeViewerRenderer({ maxBlocks: 10 });
    render(<>{renderer.render(everyBlockCard, ctx)}</>);
    // The field strip is a <dl>; `quote` must not appear as one of its terms.
    const terms = Array.from(document.querySelectorAll("dl dt")).map((el) => el.textContent);
    expect(terms).toEqual(["status", "weight"]);
    expect(blockKeys()).toContain("quote");
  });

  it("caps the block strip at maxBlocks", () => {
    const renderer = createCardTreeViewerRenderer({ maxBlocks: 2 });
    render(<>{renderer.render(everyBlockCard, ctx)}</>);
    expect(blockKeys()).toEqual(["image", "table"]);
  });

  it("REGRESSION: a card with no blocks renders no block strip at all", () => {
    render(<>{cardTreeViewerRenderer.render(plainCard, ctx)}</>);
    expect(blockKeys()).toEqual([]);
    expect(document.querySelectorAll("dl dt")).toHaveLength(3);
  });
});

describe("CardTreeViewer: host render opt-in", () => {
  it("shows a summary chip by default, never calling the host render()", () => {
    const hostRender = vi.fn(() => <span data-testid="host">HOST</span>);
    const renderer = createCardTreeViewerRenderer({
      customPredefinedKeys: [makeKey("metric", hostRender)],
      maxBlocks: 10,
    });
    render(<>{renderer.render(everyBlockCard, ctx)}</>);

    expect(hostRender).not.toHaveBeenCalled();
    expect(screen.queryByTestId("host")).toBeNull();
    expect(document.querySelector('[data-block-key="metric"]')?.textContent).toContain(
      "2 fields",
    );
  });

  it("calls the host render() when renderCustomBlocks is on, with a correct context", () => {
    const seen: Array<{ value: unknown; cardId: string; isEditing: boolean }> = [];
    const renderer = createCardTreeViewerRenderer({
      renderCustomBlocks: true,
      maxBlocks: 10,
      customPredefinedKeys: [
        {
          key: "metric",
          validate: () => ({ ok: true }),
          defaultValue: () => null,
          render: (value, c) => {
            seen.push({ value, cardId: c.cardId, isEditing: c.isEditing });
            return <span data-testid="host">94%</span>;
          },
        },
      ],
    });
    render(<>{renderer.render(everyBlockCard, ctx)}</>);

    expect(screen.getByTestId("host")).toBeTruthy();
    expect(seen).toHaveLength(1);
    expect(seen[0]?.value).toEqual({ value: 94, unit: "% task success" });
    expect(seen[0]?.cardId).toBe("card-every-block");
    expect(seen[0]?.isEditing).toBe(false);
  });

  it("never routes a BUILT-IN block through host render", () => {
    const hostRender = vi.fn(() => <span data-testid="host">HOST</span>);
    const renderer = createCardTreeViewerRenderer({
      renderCustomBlocks: true,
      maxBlocks: 10,
      // A host cannot hijack `table` — built-ins lose to nothing.
      customPredefinedKeys: [makeKey("table", hostRender)],
    });
    render(<>{renderer.render(everyBlockCard, ctx)}</>);
    expect(hostRender).not.toHaveBeenCalled();
    expect(document.querySelector('[data-block-key="table"]')?.textContent).toContain("2 x 3");
  });
});

describe("CardTreeViewer: hostile host code degrades, never blanks the canvas", () => {
  it("I-neg: a render() that throws during React's render falls back to the summary", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const Boom = (): ReactNode => {
      throw new Error("host render exploded");
    };
    const renderer = createCardTreeViewerRenderer({
      renderCustomBlocks: true,
      maxBlocks: 10,
      customPredefinedKeys: [makeKey("metric", () => <Boom />)],
    });
    render(<>{renderer.render(everyBlockCard, ctx)}</>);

    // The node survived, and the failed block shows its summary instead.
    expect(screen.getByRole("group")).toBeTruthy();
    expect(document.querySelector('[data-block-key="metric"]')?.textContent).toContain(
      "2 fields",
    );
    spy.mockRestore();
  });

  it("I-neg: a render() that throws SYNCHRONOUSLY falls back too", () => {
    const renderer = createCardTreeViewerRenderer({
      renderCustomBlocks: true,
      maxBlocks: 10,
      customPredefinedKeys: [
        makeKey("metric", () => {
          throw new Error("thrown at call time");
        }),
      ],
    });
    render(<>{renderer.render(everyBlockCard, ctx)}</>);

    expect(screen.getByRole("group")).toBeTruthy();
    expect(document.querySelector('[data-block-key="metric"]')?.textContent).toContain(
      "2 fields",
    );
  });

  it("degrades to a chip when the registration supplies no render()", () => {
    const renderer = createCardTreeViewerRenderer({
      renderCustomBlocks: true,
      maxBlocks: 10,
      customPredefinedKeys: [
        // `render` is required by the type, but host JS can omit it.
        { key: "metric", validate: () => ({ ok: true }), defaultValue: () => null } as never,
      ],
    });
    render(<>{renderer.render(everyBlockCard, ctx)}</>);
    expect(document.querySelector('[data-block-key="metric"]')?.textContent).toContain(
      "2 fields",
    );
  });
});
