/**
 * T4 negative/regression path (mandatory): with NO `customPredefinedKeys`
 * registered, `<CardTree>` renders exactly as it did pre-v0.6 — an
 * object-valued key still becomes a nested card, and no custom block ever
 * appears. Guards against a card-tree.tsx regression that starts routing
 * values through the custom path even when the host registered nothing.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CardTree } from "../card-tree";
import type { CardTreeJsonNode } from "../types";

// `vitest.config.ts` does not set `test.globals: true`, so
// `@testing-library/react`'s auto-cleanup (which detects a GLOBAL
// `afterEach`) never registers — must be wired explicitly per file.
afterEach(() => cleanup());

describe("no customPredefinedKeys registered: pre-v0.6 regression guard", () => {
  it("an object-valued key becomes a nested card, not a custom block", () => {
    const tree: CardTreeJsonNode = {
      title: "Root",
      metric: { value: 42, unit: "kg" },
    };
    render(<CardTree defaultValue={tree} />);

    // No custom-render surface exists at all — the fixtures' testids can
    // never appear because no registration was ever supplied.
    expect(screen.queryByTestId("metric-render")).not.toBeInTheDocument();

    // "metric" is classified as a child card: its key becomes the child
    // card's title, and its own object properties become scalar fields.
    expect(
      screen.getByRole("heading", { name: "metric", level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByText("value")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("unit")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
  });
});
