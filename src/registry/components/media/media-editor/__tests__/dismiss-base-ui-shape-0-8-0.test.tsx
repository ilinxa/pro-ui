/**
 * media-editor 0.8.0 ME-4 with a Base-UI-shaped dialog: `onOpenChange(false,
 * { reason })` carries the close reason, so no pointer record is needed. The
 * dialog primitive is stubbed to call the editor's `onOpenChange` directly.
 */
import * as React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";

const h = vi.hoisted(() => ({
  change: null as null | ((open: boolean, ...rest: unknown[]) => void),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    onOpenChange,
    children,
  }: {
    onOpenChange: (open: boolean, ...rest: unknown[]) => void;
    children: React.ReactNode;
  }) => {
    h.change = onOpenChange;
    return <div>{children}</div>;
  },
  DialogContent: React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
    function DialogContent({ children }, ref) {
      return <div ref={ref}>{children}</div>;
    },
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

afterEach(cleanup);

function mount(dismiss: boolean | undefined) {
  const onClose = vi.fn();
  render(
    <MediaEditor
      presentation="dialog"
      isOpen
      onClose={onClose}
      dismissOnOutsidePress={dismiss}
      mediaSources={["upload"]}
    />,
  );
  return onClose;
}

describe("dismissOnOutsidePress with a Base-UI-shaped close", () => {
  it("false: (false, { reason: 'outside-press' }) is ignored", () => {
    const onClose = mount(false);
    act(() => h.change!(false, { reason: "outside-press", event: {} }));
    expect(onClose).not.toHaveBeenCalled();
  });
  it("false: escape and other reasons still close", () => {
    const onClose = mount(false);
    act(() => h.change!(false, { reason: "escape-key" }));
    act(() => h.change!(false, { reason: "close-press" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
  it("default: an outside-press reason closes", () => {
    const onClose = mount(undefined);
    act(() => h.change!(false, { reason: "outside-press" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
