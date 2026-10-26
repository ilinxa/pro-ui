/**
 * The add-on's `CarouselEditorProps` (a `Pick` of media-editor's props) must be assignable
 * to the base's untyped `editorProps` — the documented way to type it. `tsc` checks this file.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CarouselComposer } from "../carousel-composer";
import type { CarouselEditorPanelProps } from "../types";
import type { CarouselEditorProps } from "../features/editing";
import { mockResizeObserver } from "../../../../../../tests/helpers";
import { ITEMS } from "./support";

vi.mock("@/registry/components/media/media-editor/media-editor", () => ({ MediaEditor: () => null }));

let restoreRo: () => void;
beforeEach(() => {
  restoreRo = mockResizeObserver();
});
afterEach(() => restoreRo());

it("accepts a CarouselEditorProps value and passes it to the panel untouched", async () => {
  const editorProps: CarouselEditorProps = { enabledTools: ["crop", "adjust"] };
  const seen: CarouselEditorPanelProps[] = [];
  const Panel = (props: CarouselEditorPanelProps) => {
    seen.push(props);
    return <p>panel</p>;
  };
  render(
    <CarouselComposer defaultValue={ITEMS} editing={{ Panel }} editorProps={editorProps} />,
  );
  screen.getByRole("button", { name: "Edit" }).click();
  await screen.findByText("panel");
  expect(seen.at(-1)?.editorProps).toBe(editorProps);
});
