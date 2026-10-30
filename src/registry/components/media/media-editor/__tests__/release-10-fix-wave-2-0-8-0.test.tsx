/**
 * media-editor 0.8.0 release-10 fix wave 2: F-3 dark scheme on the edge-to-edge
 * surface, F-4 named slider thumbs.
 */
import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import { resolveEditorLabels } from "../lib/normalize-labels";
import { ToolAdjustSliders } from "../parts/tool-adjust-sliders";
import { ToolDrawControls } from "../parts/tool-draw-controls";
import { ToolTextInput } from "../parts/tool-text-input";
import type { TextOverlay } from "../types";

vi.mock("../parts/lazy-editor-canvas", () => ({ default: () => null }));

const LABELS = resolveEditorLabels(undefined);
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
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function mount(presentation: "inline" | "dialog", aspect: string, extra = {}) {
  const dialog = presentation === "dialog" ? { isOpen: true, onClose: () => {} } : {};
  render(
    <MediaEditor
      presentation={presentation}
      enabledModes={["photo"]}
      mediaSources={["upload"]}
      initialSource={{ kind: "blob", blob: PHOTO, mode: "photo" }}
      aspect={aspect as never}
      {...dialog}
      {...extra}
    />,
  );
  await screen.findByLabelText(LABELS.backToCapture);
  return document.querySelector<HTMLElement>('[data-slot="media-editor"]')!;
}

describe("F-3 edge-to-edge takes the dark colour scheme", () => {
  it("fixed-aspect dialog root has dark + color-scheme dark, bg-black kept", async () => {
    const root = await mount("dialog", "9:16");
    const cls = root.className.split(/\s+/);
    expect(cls).toContain("dark");
    expect(cls).toContain("bg-black");
    expect(root.style.colorScheme).toBe("dark");
  });
  it("contentClassName still merges last", async () => {
    const root = await mount("dialog", "9:16", { contentClassName: "bg-background" });
    const cls = root.className.split(/\s+/);
    expect(cls.indexOf("bg-background")).toBeGreaterThan(cls.indexOf("dark"));
    expect(cls.indexOf("bg-background")).toBeGreaterThan(cls.indexOf("bg-black"));
  });
  it("inline and free dialog do not get it", async () => {
    for (const [p, a] of [["inline", "9:16"], ["dialog", "free"]] as const) {
      const root = await mount(p, a);
      expect(root.className.split(/\s+/)).not.toContain("dark");
      expect(root.style.colorScheme).toBe("");
      cleanup();
    }
  });
});

describe("F-4 slider thumbs are named", () => {
  const overlay: TextOverlay = {
    id: "t1",
    text: "hi",
    x: 0,
    y: 0,
    fontSize: 32,
    fontFamily: "sans-serif",
    fill: "#ffffff",
    align: "center",
  } as TextOverlay;

  function names() {
    const thumbs = Array.from(document.querySelectorAll<HTMLElement>('[role="slider"]'));
    expect(thumbs.length).toBeGreaterThan(0);
    return thumbs.map((t) => t.getAttribute("aria-label"));
  }

  it("text font-size slider", () => {
    render(
      <ToolTextInput
        overlay={overlay}
        fonts={[]}
        colorPresets={["#ffffff"]}
        labels={LABELS}
        onChange={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(names()).toEqual([LABELS.textFontSize]);
  });
  it("draw brush slider", () => {
    render(
      <ToolDrawControls
        color="#ffffff"
        brushSize={8}
        mode="draw"
        colorPresets={["#ffffff"]}
        labels={LABELS}
        onColorChange={() => {}}
        onBrushSizeChange={() => {}}
        onModeChange={() => {}}
      />,
    );
    expect(names()).toEqual([LABELS.drawBrush]);
  });
  it("every adjust slider", () => {
    render(
      <ToolAdjustSliders
        value={{ brightness: 0, contrast: 0, saturation: 0, warmth: 0 } as never}
        onChange={() => {}}
        labels={LABELS}
      />,
    );
    const n = names();
    expect(n.every((x) => !!x && x.length > 0)).toBe(true);
    expect(new Set(n).size).toBe(n.length);
  });
});
