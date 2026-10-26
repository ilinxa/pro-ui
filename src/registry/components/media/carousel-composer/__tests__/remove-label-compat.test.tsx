/**
 * 0.2 hosts translated `labels.remove`. 0.3.0 names the rail's remove buttons with `removeItem`;
 * a host that passes only `remove` keeps its text on those buttons.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { CarouselComposer } from "../carousel-composer";
import { mergeLabels } from "../lib/labels";
import { mockResizeObserver } from "../../../../../../tests/helpers";
import { ITEMS } from "./support";

let restoreRo: () => void;
beforeEach(() => {
  restoreRo = mockResizeObserver();
});
afterEach(() => restoreRo());

it("names the remove buttons with a 0.2 `remove` translation when `removeItem` is not passed", () => {
  render(<CarouselComposer defaultValue={ITEMS} labels={{ remove: "Kaldır" }} />);
  expect(screen.getAllByRole("button", { name: "Kaldır" })).toHaveLength(ITEMS.length);
});

it("prefers `removeItem` when both are passed", () => {
  const { labels } = mergeLabels({ remove: "Kaldır", removeItem: ({ position }) => `${position}. öğeyi kaldır` });
  expect(labels.removeItem({ position: 2, total: 3, kind: "image" })).toBe("2. öğeyi kaldır");
});
