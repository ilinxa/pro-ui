/**
 * media-editor 0.8.0 ME-4: lifetime rules of the outside-press record, driven
 * through a reason-less `onOpenChange` (the Radix shape) on a stubbed dialog.
 * Real-Radix flows can't separate these: Escape and `handle.close()` clear or
 * bypass the record on their own.
 */
import * as React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
      return (
        <div ref={ref} data-testid="content">
          {children}
        </div>
      );
    },
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const tick = () => act(async () => { await new Promise((r) => setTimeout(r, 10)); });

function mount() {
  const onClose = vi.fn();
  render(
    <MediaEditor
      presentation="dialog"
      isOpen
      onClose={onClose}
      dismissOnOutsidePress={false}
      mediaSources={["upload"]}
    />,
  );
  const outside = document.body.appendChild(document.createElement("div"));
  return { onClose, outside, content: document.querySelector<HTMLElement>('[data-testid="content"]')! };
}

const request = () => act(() => h.change!(false));

describe("outside-press record lifetime (reason-less close requests)", () => {
  it("is alive between the click and its clear timer, then gone", async () => {
    const { onClose, outside } = mount();
    await act(async () => {
      fireEvent.pointerDown(outside);
      fireEvent.pointerUp(outside);
      fireEvent.click(outside);
    });
    request(); // the deferred touch dismissal lands here
    expect(onClose).not.toHaveBeenCalled();
    await tick();
    request(); // a later close request that carries no reason
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("a press INSIDE the content replaces an earlier outside record", async () => {
    const { onClose, outside, content } = mount();
    await act(async () => {
      fireEvent.pointerDown(outside); // no click follows
    });
    request();
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.pointerDown(content);
    });
    request();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("a key other than Escape does not clear the record; Escape does", async () => {
    const { onClose, outside } = mount();
    await act(async () => {
      fireEvent.pointerDown(outside);
      fireEvent.keyDown(window, { key: "a" });
    });
    request();
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    request();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
