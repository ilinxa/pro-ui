/**
 * R8 — the viewer's shortcuts act only for events from inside its root, and never while the
 * user types (the page-number input, a select, contentEditable).
 */
import { fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { usePdfKeyboard } from "../hooks/use-pdf-keyboard";
import type { PdfActions } from "../types";

function Viewer({ actions }: { actions: PdfActions }) {
  const rootRef = useRef<HTMLDivElement>(null);
  usePdfKeyboard({ containerRef: rootRef, rootRef, actions, status: "ready", allowDownload: true, allowPrint: true });
  return (
    <div ref={rootRef} tabIndex={-1} data-testid="root">
      <input aria-label="page" />
      <select aria-label="zoom">
        <option>100%</option>
      </select>
    </div>
  );
}

const make = () => {
  const actions = { goToNextPage: vi.fn(), goToPrevPage: vi.fn(), goToPage: vi.fn(), zoomIn: vi.fn() };
  const view = render(<Viewer actions={actions as unknown as PdfActions} />);
  return { actions, ...view };
};

describe("pdf-viewer keyboard (R8)", () => {
  it("PageDown inside the viewer goes to the next page", () => {
    const { actions, getByTestId } = make();
    fireEvent.keyDown(getByTestId("root"), { key: "PageDown" });
    expect(actions.goToNextPage).toHaveBeenCalledTimes(1);
  });

  it("keys typed in the page input or the zoom select are left alone", () => {
    const { actions, getByLabelText } = make();
    fireEvent.keyDown(getByLabelText("page"), { key: "End" });
    fireEvent.keyDown(getByLabelText("zoom"), { key: "PageDown" });
    fireEvent.keyDown(getByLabelText("zoom"), { key: "=", ctrlKey: true });
    expect(actions.goToPage).not.toHaveBeenCalled();
    expect(actions.goToNextPage).not.toHaveBeenCalled();
    expect(actions.zoomIn).not.toHaveBeenCalled();
  });

  it("keys from outside the viewer are ignored", () => {
    const { actions } = make();
    fireEvent.keyDown(document.body, { key: "PageDown" });
    expect(actions.goToNextPage).not.toHaveBeenCalled();
  });
});
