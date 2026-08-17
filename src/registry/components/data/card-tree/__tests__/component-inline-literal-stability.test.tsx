/**
 * T4 (mandatory extra, per review finding) — `customPredefinedKeys` is
 * documented as an inline array literal (`customPredefinedKeys={[metricKey]}`),
 * a NEW array identity every render. A prior bug made that exact pattern
 * combine with `onSearchResults` to produce an unbounded render loop: a
 * memo keyed on array identity instead of registration NAMES would
 * recompute `customKeys` every render → recompute `useSearch`'s result memo
 * → refire `onSearchResults` every render → a host that `setState`s in that
 * callback (its only realistic purpose) loops forever.
 *
 * card-tree.tsx now memoizes `customKeys` on a NAME SIGNATURE
 * (`customPredefinedKeys.map(k => k.key).join(" ")`), not the array
 * reference (card-tree.tsx L201-227). This test proves that guard holds by
 * mounting with a brand-new array + brand-new closures on every rerender
 * (exactly the documented usage) and asserting `onSearchResults` does NOT
 * refire beyond its one mount-time call.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CardTree } from "../card-tree";
import type { CardTreeJsonNode, CustomPredefinedKey } from "../types";

// `vitest.config.ts` does not set `test.globals: true`, so
// `@testing-library/react`'s auto-cleanup (which detects a GLOBAL
// `afterEach`) never registers — must be wired explicitly per file.
afterEach(() => cleanup());

function makeInlineMetricKey(onRender: () => void): CustomPredefinedKey {
  return {
    key: "metric",
    defaultValue: () => ({ value: 0, unit: "" }),
    validate: () => ({ ok: true }),
    render: (value) => {
      onRender();
      return <div data-testid="metric-render">{JSON.stringify(value)}</div>;
    },
  };
}

describe("inline customPredefinedKeys array literal: render-loop guard", () => {
  it("a brand-new array + function identity on every rerender does not refire onSearchResults", () => {
    const tree: CardTreeJsonNode = { title: "Root", metric: { value: 1, unit: "kg" } };
    let renderCalls = 0;
    let searchResultCalls = 0;
    // Stable across renders — a real host would define this once too; the
    // instability under test is `customPredefinedKeys`, not this callback.
    const onSearchResults = () => {
      searchResultCalls += 1;
    };

    const { rerender } = render(
      <CardTree
        defaultValue={tree}
        customPredefinedKeys={[makeInlineMetricKey(() => renderCalls++)]}
        search={{ query: "" }}
        onSearchResults={onSearchResults}
      />,
    );

    expect(screen.getByTestId("metric-render")).toBeInTheDocument();
    expect(searchResultCalls).toBe(1); // fires exactly once, on mount
    expect(renderCalls).toBe(1);

    // Re-render 10 times, each with a BRAND NEW array + BRAND NEW closures —
    // mirrors the documented inline-literal usage exactly (not a stable
    // module-level constant).
    for (let i = 0; i < 10; i++) {
      rerender(
        <CardTree
          defaultValue={tree}
          customPredefinedKeys={[makeInlineMetricKey(() => renderCalls++)]}
          search={{ query: "" }}
          onSearchResults={onSearchResults}
        />,
      );
    }

    // THE assertion: if the mount-only memo were keyed on array identity
    // instead of the registered NAME signature, `customKeys.keys` would be a
    // new reference every render, `useSearch`'s result memo would recompute
    // every render, and `onSearchResults` would fire 11 times (once per
    // render) instead of staying at its mount-time count of 1 — exactly the
    // shape of the documented unbounded-loop bug this guard prevents.
    expect(searchResultCalls).toBe(1);

    // The host render() itself is still called once per actual React render
    // pass (1 mount + 10 rerenders = 11) — bounded, not runaway. If the
    // guard above failed silently this number would still be 11 (rendering
    // is a normal consequence of the parent rerendering); it is
    // `searchResultCalls` that exposes the loop-shaped regression.
    expect(renderCalls).toBe(11);
  });
});
