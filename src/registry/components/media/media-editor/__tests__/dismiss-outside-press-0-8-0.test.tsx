/**
 * media-editor 0.8.0 ME-4: `dismissOnOutsidePress`. Real Radix dialog
 * (`@/components/ui/dialog` is Radix here): a backdrop press does nothing with
 * `false`, Escape / handle.close() still close, a press inside never counts.
 */
import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import type { MediaEditorHandle } from "../types";
import { classifyCloseReason } from "../lib/close-reason";

vi.mock("../parts/lazy-editor-canvas", () => ({ default: () => null }));

const PNG = new File([new Uint8Array([1, 2, 3, 4])], "p.png", { type: "image/png" });

beforeEach(() => {
  URL.createObjectURL = () => "blob:u1";
  URL.revokeObjectURL = () => {};
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const tick = () => act(async () => { await new Promise((r) => setTimeout(r, 10)); });

async function mount(
  dismiss: boolean | undefined,
  opts: { dirty?: boolean } = {},
) {
  const onClose = vi.fn();
  const ref = React.createRef<MediaEditorHandle>();
  const view = render(
    <MediaEditor
      ref={ref}
      presentation="dialog"
      isOpen
      onClose={onClose}
      dismissOnOutsidePress={dismiss}
      enabledModes={["photo"]}
      mediaSources={["upload"]}
    />,
  );
  await tick(); // Radix attaches its outside-press listener on a timeout
  if (opts.dirty) {
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await act(async () => {
      fireEvent.change(input, { target: { files: [PNG] } });
    });
    await tick();
  }
  return { onClose, ref, view };
}

const overlay = () => document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
const confirm = () => document.querySelector('[role="alertdialog"]');

async function press(el: Element, { touch = false }: { touch?: boolean } = {}) {
  const init = { pointerType: touch ? "touch" : "mouse", bubbles: true };
  await act(async () => {
    fireEvent.pointerDown(el, init);
    fireEvent.pointerUp(el, init);
    fireEvent.click(el);
  });
  await tick();
}

describe("dismissOnOutsidePress", () => {
  it("default: a backdrop press closes (clean editor -> onClose)", async () => {
    const { onClose } = await mount(undefined);
    expect(overlay()).not.toBeNull();
    await press(overlay());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("false: a mouse backdrop press does nothing", async () => {
    const { onClose } = await mount(false);
    await press(overlay());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("false: a touch backdrop press does nothing", async () => {
    const { onClose } = await mount(false);
    await press(overlay(), { touch: true });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("false: Escape closes a clean editor", async () => {
    const { onClose } = await mount(false);
    await press(overlay());
    await act(async () => {
      fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    });
    await tick();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("false: Escape opens the discard confirm on a dirty editor, a backdrop press does not", async () => {
    const { onClose } = await mount(false, { dirty: true });
    await press(overlay());
    expect(confirm()).toBeNull();
    await act(async () => {
      fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    });
    await tick();
    expect(confirm()).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("false: handle.close() still works", async () => {
    const { onClose, ref } = await mount(false);
    await act(async () => {
      ref.current!.close();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("false: a touch backdrop tap + an unrelated key before the deferred click does not close", async () => {
    const { onClose } = await mount(false);
    const init = { pointerType: "touch", bubbles: true };
    await act(async () => {
      fireEvent.pointerDown(overlay(), init);
      fireEvent.pointerUp(overlay(), init);
      fireEvent.keyDown(document.activeElement ?? document.body, { key: "a" });
      fireEvent.click(overlay());
    });
    await tick();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("classifyCloseReason", () => {
  it("reads Base UI shapes: (open, { reason }) and (open, event, reason)", () => {
    expect(classifyCloseReason([{ reason: "outside-press", event: {} }])).toBe("outside");
    expect(classifyCloseReason([{ reason: "escape-key" }])).toBe("escape");
    expect(classifyCloseReason([{ reason: "close-press" }])).toBe("other");
    expect(classifyCloseReason([new Event("pointerdown"), "outside-press"])).toBe("outside");
  });
  it("returns null when no reason is present (Radix)", () => {
    expect(classifyCloseReason([])).toBeNull();
    expect(classifyCloseReason([{}, 3, null, ""])).toBeNull();
  });
});
