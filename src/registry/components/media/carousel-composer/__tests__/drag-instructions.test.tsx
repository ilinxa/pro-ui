/**
 * dnd-kit reads its own English keyboard instructions to a focused drag handle unless
 * `screenReaderInstructions` is passed. They come from `labels.drag.instructions`.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { CarouselComposer } from "../carousel-composer";
import { defaultCarouselComposerLabels } from "../types";
import { mockResizeObserver } from "../../../../../../tests/helpers";
import { ITEMS } from "./support";

let restoreRo: () => void;
beforeEach(() => {
  restoreRo = mockResizeObserver();
});
afterEach(() => restoreRo());

it("describes the drag handles with labels.drag.instructions, not dnd-kit's English", () => {
  render(
    <CarouselComposer
      defaultValue={ITEMS}
      labels={{ drag: { instructions: "Taşımak için boşluk tuşuna basın." } }}
    />,
  );
  const handle = screen.getAllByRole("button", { name: defaultCarouselComposerLabels.reorderHint })[0];
  const describedBy = handle.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy!)).toHaveTextContent("Taşımak için boşluk tuşuna basın.");
  expect(document.body).not.toHaveTextContent("To pick up a draggable item");
});
