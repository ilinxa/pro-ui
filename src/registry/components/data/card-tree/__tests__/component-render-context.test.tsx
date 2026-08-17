/**
 * T4 — component tier, happy path: a registered object-valued custom key
 * renders via the host `render`, receiving a correct `CustomKeyContext`
 * (cardId, level, isEditing). A registered array-valued key renders every
 * item. This is the render/edit-contract half of the pure-lib coverage in
 * `./precedence.test.ts` and `./round-trip.test.ts` — those prove
 * `classifyKey`/`parseInput` route the value correctly; this proves the
 * ACTUAL React render pass wires the resolved registration + a correct
 * per-node context through `parts/card.tsx`'s `PredefinedRenderer` into
 * `parts/predefined-custom.tsx`'s `PredefinedCustom`.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CardTree } from "../card-tree";
import type { CardTreeJsonNode, CustomKeyContext } from "../types";
import { makeBodyKey, makeMetricKey } from "./component-fixtures";

// `vitest.config.ts` does not set `test.globals: true`, so
// `@testing-library/react`'s auto-cleanup (which detects a GLOBAL
// `afterEach`) never registers — must be wired explicitly per file.
afterEach(() => cleanup());

describe("PredefinedCustom: object-valued key render + CustomKeyContext", () => {
  it("renders via the host render() and receives cardId/level/isEditing for the root card", () => {
    const calls: Array<{ value: unknown; ctx: CustomKeyContext }> = [];
    const tree: CardTreeJsonNode = {
      title: "Root",
      metric: { value: 42, unit: "kg" },
    };
    render(
      <CardTree
        defaultValue={tree}
        customPredefinedKeys={[
          makeMetricKey({ onRender: (value, ctx) => calls.push({ value, ctx }) }),
        ]}
      />,
    );

    const el = screen.getByTestId("metric-render");
    expect(el).toHaveTextContent("42 kg");
    expect(calls).toHaveLength(1);
    // Root card id is deterministic — see lib/parse.ts's `autoId("")`.
    expect(calls[0]!.ctx.cardId).toBe("rc-auto-root");
    expect(calls[0]!.ctx.level).toBe(1);
    // Always false: `render()` is only ever invoked in VIEW mode — in edit
    // mode, `parts/card.tsx`'s `PredefinedRenderer` swaps to `<PredefinedEdit>`
    // entirely and never calls `render()` at all (card.tsx:163-172,182).
    expect(calls[0]!.ctx.isEditing).toBe(false);
  });

  it("a nested card's custom block receives level 2 and its own cardId", () => {
    const tree: CardTreeJsonNode = {
      title: "Root",
      child: {
        title: "Child",
        metric: { value: 7, unit: "g" },
      },
    };
    const calls: Array<{ value: unknown; ctx: CustomKeyContext }> = [];
    render(
      <CardTree
        defaultValue={tree}
        customPredefinedKeys={[
          makeMetricKey({ onRender: (value, ctx) => calls.push({ value, ctx }) }),
        ]}
      />,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]!.ctx.cardId).toBe("rc-auto-child");
    expect(calls[0]!.ctx.level).toBe(2);
  });
});

describe("PredefinedCustom: array-valued key renders every item", () => {
  it("iterates the full array (a shape ordinary object children reject per Q-P4)", () => {
    const tree: CardTreeJsonNode = {
      title: "Root",
      body: [{ text: "first" }, { text: "second" }, { text: "third" }],
    };
    render(<CardTree defaultValue={tree} customPredefinedKeys={[makeBodyKey()]} />);

    const items = screen.getAllByTestId("body-item");
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.textContent)).toEqual(["first", "second", "third"]);
  });
});
