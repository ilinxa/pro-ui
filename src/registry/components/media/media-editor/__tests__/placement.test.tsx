/**
 * media-editor 0.5.1 — new text overlays and stickers start centred on the part of the image
 * the user can see (platform request; was a fixed x:100,y:200 / 200,200 / 0,0).
 */
import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Konva from "konva";
import { MediaEditor } from "../media-editor";
import type { MediaEditorHandle } from "../types";
import {
  BASE_IMAGE_NODE_NAME,
  measureTextBox,
  visibleImageCenter,
} from "../lib/placement";

interface FakeStageInit {
  width: number;
  height: number;
  scale?: number;
  x?: number;
  y?: number;
  image?: { x: number; y: number; width: number; height: number } | null;
}

function fakeStage(init: FakeStageInit): Konva.Stage {
  const image = init.image ?? null;
  return {
    width: () => init.width,
    height: () => init.height,
    scaleX: () => init.scale ?? 1,
    x: () => init.x ?? 0,
    y: () => init.y ?? 0,
    findOne: (selector: string) =>
      selector === `.${BASE_IMAGE_NODE_NAME}` && image
        ? {
            x: () => image.x,
            y: () => image.y,
            width: () => image.width,
            height: () => image.height,
          }
        : undefined,
  } as unknown as Konva.Stage;
}

// A tall photo contain-fitted into a wide stage: the image occupies x 100..300 only.
const TALL = { width: 400, height: 300, image: { x: 100, y: 0, width: 200, height: 300 } };

describe("visibleImageCenter", () => {
  it("is null before the stage mounts", () => {
    expect(visibleImageCenter(null)).toBeNull();
  });

  it("is the image centre when the whole image is in view", () => {
    expect(visibleImageCenter(fakeStage(TALL))).toEqual({ x: 200, y: 150 });
  });

  it("is the centre of the visible part when zoomed and panned", () => {
    // scale 2, panned so stage-space x 100..300, y 0..150 is in view
    const stage = fakeStage({ ...TALL, scale: 2, x: -200, y: 0 });
    expect(visibleImageCenter(stage)).toEqual({ x: 200, y: 75 });
  });

  it("falls back to the viewport centre with no image, or the image panned out of view", () => {
    expect(visibleImageCenter(fakeStage({ width: 400, height: 300, image: null }))).toEqual({
      x: 200,
      y: 150,
    });
    const away = fakeStage({ ...TALL, x: 1000 }); // viewport x -1000..-600: no overlap
    expect(visibleImageCenter(away)).toEqual({ x: -800, y: 150 });
  });
});

describe("measureTextBox (no 2D context in jsdom → 0.6em per character)", () => {
  it("uses the longest line and one font size per line", () => {
    expect(measureTextBox("abcd\nab", "sans-serif", 10)).toEqual({ width: 24, height: 20 });
  });
});

// ─── Integration: the editor places new overlays from the canvas stage ──

const canvas = vi.hoisted(() => ({
  stage: null as unknown,
  props: null as null | Record<string, unknown>,
}));

vi.mock("../parts/lazy-editor-canvas", () => ({
  default: function StubCanvas(props: Record<string, unknown>) {
    canvas.props = props;
    const onStageReady = props.onStageReady as ((s: unknown) => void) | undefined;
    React.useEffect(() => {
      onStageReady?.(canvas.stage);
    }, [onStageReady]);
    return null;
  },
}));

const SOURCE_BLOB = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });
let originalCreate: typeof URL.createObjectURL;
let originalRevoke: typeof URL.revokeObjectURL;
beforeEach(() => {
  originalCreate = URL.createObjectURL;
  originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = () => "blob:media-editor-test";
  URL.revokeObjectURL = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  canvas.stage = fakeStage(TALL);
  canvas.props = null;
});
afterEach(() => {
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function EditStage(props: Partial<React.ComponentProps<typeof MediaEditor>>) {
  return (
    <MediaEditor
      presentation="inline"
      enabledModes={["photo"]}
      mediaSources={["upload"]}
      initialSource={{ kind: "blob", blob: SOURCE_BLOB, mode: "photo" }}
      {...props}
    />
  );
}

const chip = (tool: string) => document.querySelector<HTMLElement>(`[data-tool="${tool}"]`)!;
type Overlay = { x: number; y: number; text: string; fontFamily: string; fontSize: number };
type Placed = { x: number; y: number };

describe("new overlays start centred on the visible image", () => {
  it("the Text tool's first overlay is centred on the image, not at x:100,y:200", async () => {
    render(<EditStage />);
    await screen.findByLabelText("Back to capture");
    fireEvent.click(chip("text"));
    const overlays = () => (canvas.props?.textOverlays ?? []) as Overlay[];
    await vi.waitFor(() => expect(overlays()).toHaveLength(1));
    const o = overlays()[0]!;
    const box = measureTextBox(o.text, o.fontFamily, o.fontSize);
    expect(o.x + box.width / 2).toBeCloseTo(200);
    expect(o.y + box.height / 2).toBeCloseTo(150);
  });

  it("a sticker picked from the tray is centred on the image", async () => {
    render(<EditStage />);
    await screen.findByLabelText("Back to capture");
    fireEvent.click(chip("stickers"));
    fireEvent.click((await screen.findAllByLabelText("Smile"))[0]!);
    const stickers = () => (canvas.props?.stickers ?? []) as Placed[];
    await vi.waitFor(() => expect(stickers()).toHaveLength(1));
    expect(stickers()[0]).toMatchObject({ x: 200, y: 150 });
  });

  it("handle.addSticker() places it centred on the visible part when zoomed", async () => {
    canvas.stage = fakeStage({ ...TALL, scale: 2, x: -200, y: 0 });
    const ref = React.createRef<MediaEditorHandle>();
    render(<EditStage ref={ref} />);
    await screen.findByLabelText("Back to capture");
    await act(async () => {
      ref.current!.addSticker({ id: "smile", src: "data:,", alt: "Smile" });
    });
    const stickers = () => (canvas.props?.stickers ?? []) as Placed[];
    await vi.waitFor(() => expect(stickers()).toHaveLength(1));
    expect(stickers()[0]).toMatchObject({ x: 200, y: 75 });
  });
});
