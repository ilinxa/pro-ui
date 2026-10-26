/**
 * media-editor 0.6.0 U5 browser findings W2 + W3: focus is never stranded on
 * <body> after "Keep editing" on the discard confirm (W2) or after a tool
 * panel's Apply / Back unmounts the panel (W3).
 */
import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import { resolveEditorLabels } from "../lib/normalize-labels";

const h = vi.hoisted(() => ({ props: null as null | Record<string, any> })); // eslint-disable-line @typescript-eslint/no-explicit-any

vi.mock("../parts/lazy-editor-canvas", () => ({
  default: function StubCanvas(props: Record<string, unknown>) {
    h.props = props;
    const onStageReady = props.onStageReady as ((s: unknown) => void) | undefined;
    React.useEffect(() => {
      onStageReady?.({
        width: () => 400,
        height: () => 300,
        x: () => 0,
        y: () => 0,
        scaleX: () => 1,
        scaleY: () => 1,
        scale: () => {},
        position: () => {},
        batchDraw: () => {},
        findOne: () => undefined,
      });
    }, [onStageReady]);
    return null;
  },
}));

const ENGLISH = resolveEditorLabels(undefined);
const PHOTO = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });

beforeEach(() => {
  URL.createObjectURL = () => "blob:u1";
  URL.revokeObjectURL = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  h.props = null;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const wait = (ms: number) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
const chip = (tool: string) => document.querySelector<HTMLElement>(`[data-tool="${tool}"]`)!;

describe("W3: tool panel Apply / Back hands focus to the tool's chip", () => {
  async function mountInline() {
    render(
      <MediaEditor
        presentation="inline"
        enabledModes={["photo"]}
        mediaSources={["upload"]}
        initialSource={{ kind: "blob", blob: PHOTO, mode: "photo" }}
      />,
    );
    await screen.findByLabelText(ENGLISH.backToCapture);
    await vi.waitFor(() => expect(h.props).not.toBeNull());
    await act(async () => {
      h.props!.onStageSize({ width: 400, height: 300 });
      h.props!.onMediaRect({ x: 0, y: 0, width: 400, height: 300 });
      h.props!.onImagePainted(h.props!.imageUrl, { width: 800, height: 600 });
      await new Promise((r) => setTimeout(r, 0));
    });
  }

  for (const [name, label] of [
    ["Apply", ENGLISH.apply],
    ["Back", ENGLISH.back],
  ] as const) {
    it(`${name}: focus lands on the Text chip, not <body>`, async () => {
      await mountInline();
      fireEvent.click(chip("text"));
      const button = await screen.findByText(label);
      act(() => button.focus());
      expect(document.activeElement).toBe(button);
      fireEvent.click(button);
      await wait(0);
      expect(screen.queryByText(label)).toBeNull(); // the panel is gone
      expect(document.activeElement).toBe(chip("text"));
    });
  }

  it("does not steal focus the user already moved elsewhere", async () => {
    await mountInline();
    fireEvent.click(chip("text"));
    const apply = await screen.findByText(ENGLISH.apply);
    const other = chip("filters");
    fireEvent.click(apply);
    act(() => other.focus());
    await wait(0);
    expect(document.activeElement).toBe(other);
  });
});

describe("W2: 'Keep editing' on the discard confirm returns focus", () => {
  async function openAndPick() {
    render(
      <MediaEditor
        presentation="dialog"
        isOpen
        onClose={() => {}}
        enabledModes={["photo"]}
        mediaSources={["upload"]}
      />,
    );
    const input = await vi.waitFor(() => {
      const el = document.querySelector<HTMLInputElement>('input[type="file"]');
      if (!el) throw new Error("no file input yet");
      return el;
    });
    await act(async () => {
      fireEvent.change(input, {
        target: { files: [new File([new Uint8Array([1, 2])], "a.png", { type: "image/png" })] },
      });
    });
    await vi.waitFor(() => expect(h.props).not.toBeNull());
    await wait(80);
  }

  it("focus held before the confirm opened is restored", async () => {
    await openAndPick();
    const dialog = screen.getByRole("dialog");
    const target = dialog.querySelector<HTMLElement>('button, [tabindex="0"]')!;
    act(() => target.focus());
    expect(document.activeElement).toBe(target);
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await screen.findByText(ENGLISH.discardConfirmTitle);
    // the confirm took focus (Radix), as in the browser
    await wait(30);
    fireEvent.click(screen.getByText(ENGLISH.discardCancel));
    await wait(120);
    expect(screen.queryByText(ENGLISH.discardConfirmTitle)).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(target);
  });

  it("focus that was on <body> lands inside the editor dialog", async () => {
    await openAndPick();
    act(() => (document.activeElement as HTMLElement | null)?.blur());
    expect(document.activeElement).toBe(document.body);
    fireEvent.keyDown(document.body, { key: "Escape" });
    await screen.findByText(ENGLISH.discardConfirmTitle);
    await wait(30);
    fireEvent.click(screen.getByText(ENGLISH.discardCancel));
    await wait(120);
    expect(screen.queryByText(ENGLISH.discardConfirmTitle)).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
  });
});
