/**
 * media-editor 0.8.0 release-10 fix wave: A1 stage size, A2 collapsed-region
 * warning, A3 letterbox surface, A5 narrow-strip count.
 */
import * as React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import { resolveEditorLabels } from "../lib/normalize-labels";
import { stageSizeFor } from "../hooks/use-konva-stage-size";

vi.mock("../parts/lazy-editor-canvas", () => ({ default: () => null }));

const ENGLISH = resolveEditorLabels(undefined);
const PHOTO = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });

const ro = vi.hoisted(() => ({ cbs: [] as Array<(e: unknown[]) => void> }));

beforeEach(() => {
  URL.createObjectURL = () => "blob:u1";
  URL.revokeObjectURL = () => {};
  ro.cbs = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(cb: (e: unknown[]) => void) {
        ro.cbs.push(cb);
      }
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

async function mount(
  presentation: "inline" | "dialog",
  aspect: string,
  extra: Record<string, unknown> = {},
) {
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
  await screen.findByLabelText(ENGLISH.backToCapture);
  return document.querySelector<HTMLElement>('[data-slot="media-editor"]')!;
}

describe("A1 stageSizeFor", () => {
  const cases: Array<[string, number, number, number]> = [
    ["9:16 w 300.5", 300.5, 300.5 / (9 / 16), 9 / 16],
    ["9:16 w 300.49", 300.49, 300.49 / (9 / 16), 9 / 16],
    ["1:3", 200.5, 601.5, 1 / 3],
    ["3:1", 601.4, 200.47, 3],
    ["16:9", 640.5, 360.28, 16 / 9],
    ["1:1", 400.5, 400.5, 1],
    ["1.91:1", 573.5, 573.5 / 1.91, 1.91],
  ];
  it.each(cases)("%s: both sides within 1 px of the box", (_n, w, h, ratio) => {
    const s = stageSizeFor(w, h, ratio);
    expect(Math.abs(s.width - w)).toBeLessThanOrEqual(1);
    expect(Math.abs(s.height - h)).toBeLessThanOrEqual(1);
    expect(s.width).toBeLessThanOrEqual(Math.round(w));
    expect(s.height).toBeLessThanOrEqual(Math.round(h));
  });
  it("no ratio: measured size as is", () => {
    expect(stageSizeFor(100.4, 50.6)).toEqual({ width: 100, height: 51 });
  });
});

describe("A2 collapsed canvas region", () => {
  const fire = (blockSize: number) =>
    act(() => {
      for (const cb of ro.cbs) cb([{ contentBoxSize: [{ inlineSize: 300, blockSize }] }]);
    });

  it("warns once when the fixed-aspect dialog region measures 0 high", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await mount("dialog", "9:16");
    expect(ro.cbs.length).toBeGreaterThan(0);
    fire(0);
    fire(0);
    const hits = warn.mock.calls.filter((c) => String(c[0]).includes("measures 0 high"));
    expect(hits).toHaveLength(1);
  });

  it("does not warn for a non-zero region", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await mount("dialog", "9:16");
    expect(ro.cbs.length).toBeGreaterThan(0);
    fire(500);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("measures 0 high"))).toHaveLength(0);
  });
});

describe("A3 letterbox surface", () => {
  it("fixed-aspect dialog root has the dark surface", async () => {
    const root = await mount("dialog", "9:16");
    expect(root.className).toContain("bg-black");
  });
  it("a host bg-* via contentClassName comes later in the class list", async () => {
    const root = await mount("dialog", "9:16", { contentClassName: "bg-background" });
    const cls = root.className.split(/\s+/);
    expect(cls.indexOf("bg-background")).toBeGreaterThan(cls.indexOf("bg-black"));
  });
  it("inline and free dialog do not get it", async () => {
    expect((await mount("inline", "9:16")).className).not.toContain("bg-black");
    cleanup();
    expect((await mount("dialog", "free")).className).not.toContain("bg-black");
  });
});

describe("A5 narrow strip", () => {
  it("the crop-aspect count span collapses (sr-only) below the icon-only threshold", async () => {
    await mount("dialog", "free");
    const crop = document.querySelector<HTMLElement>('[data-tool="crop"]');
    expect(crop).not.toBeNull();
    const span = crop!.parentElement!.querySelector<HTMLElement>(":scope > span");
    expect(span).not.toBeNull();
    expect(span!.className).toContain("@max-[31rem]:sr-only");
  });
});
