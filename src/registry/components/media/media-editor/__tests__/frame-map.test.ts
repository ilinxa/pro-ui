import { describe, expect, it } from "vitest";
import { mapToFrame, remapForCrop, type FrameMappable } from "../lib/frame-map";
import type { StateFrame } from "../types";

const base = (): FrameMappable => ({
  textOverlays: [
    { id: "t", text: "hi", x: 100, y: 60, rotation: 0, scale: 1.5, fontFamily: "x", fontSize: 20, fill: "red", align: "center" },
  ],
  stickers: [{ id: "s", stickerId: "a", x: 50, y: 40, rotation: 0, scale: 2 }],
  drawingStrokes: [{ id: "d", points: [10, 20, 30, 40], color: "red", brushSize: 4, mode: "draw" }],
  crop: { x: 20, y: 10, width: 100, height: 50 },
});

const FROM: StateFrame = { stageWidth: 400, stageHeight: 300, media: { x: 0, y: 50, width: 400, height: 200 } };

describe("mapToFrame", () => {
  it("returns the same reference for equal frames", () => {
    const s = base();
    expect(mapToFrame(s, FROM, { ...FROM, media: { ...FROM.media! } })).toBe(s);
  });

  it("returns the same reference for degenerate frames", () => {
    const s = base();
    expect(mapToFrame(s, { stageWidth: 0, stageHeight: 0 }, FROM)).toBe(s);
    expect(mapToFrame(s, FROM, { stageWidth: 400, stageHeight: 0 })).toBe(s);
    expect(mapToFrame(s, FROM, { ...FROM, media: { x: 0, y: 0, width: 0, height: 0 } })).toBe(s);
  });

  it("maps uniformly about the media rect when both frames have one", () => {
    const s = base();
    const to: StateFrame = { stageWidth: 200, stageHeight: 200, media: { x: 10, y: 20, width: 200, height: 100 } };
    const out = mapToFrame(s, FROM, to); // k = 0.5
    expect(out.textOverlays[0]).toMatchObject({ x: 10 + 50, y: 20 + (60 - 50) * 0.5, fontSize: 10, scale: 1.5 });
    expect(out.stickers[0]).toMatchObject({ x: 10 + 25, y: 20 + (40 - 50) * 0.5, scale: 1 });
    expect(out.drawingStrokes[0].points).toEqual([10 + 5, 20 + (20 - 50) * 0.5, 10 + 15, 20 + (40 - 50) * 0.5]);
    expect(out.drawingStrokes[0].brushSize).toBe(2);
    expect(out.crop).toEqual({ x: 10 + 10, y: 20 + (10 - 50) * 0.5, width: 50, height: 25 });
  });

  it("falls back to stage ratios (sizes by the smaller) without media", () => {
    const s = base();
    const out = mapToFrame(s, { stageWidth: 400, stageHeight: 300 }, { stageWidth: 800, stageHeight: 450 });
    expect(out.textOverlays[0]).toMatchObject({ x: 200, y: 90, fontSize: 30 }); // sx 2, sy 1.5, size 1.5
    expect(out.crop).toEqual({ x: 40, y: 15, width: 200, height: 75 });
  });

  it("does not mutate the input and keeps a null crop null", () => {
    const s = { ...base(), crop: null };
    const snapshot = JSON.stringify(s);
    const out = mapToFrame(s, FROM, { ...FROM, stageWidth: 800, media: { x: 0, y: 0, width: 800, height: 400 } });
    expect(JSON.stringify(s)).toBe(snapshot);
    expect(out.crop).toBeNull();
    expect(out).not.toBe(s);
  });
});

describe("remapForCrop", () => {
  it("shows the cropped region at the new media rect and clears the crop", () => {
    const s = base();
    // crop region x 100..200 / y 50..100 (100x50) now displayed at 0,0 400x200 -> k = 4
    const out = remapForCrop(s, { x: 100, y: 50, width: 100, height: 50 }, { x: 0, y: 0, width: 400, height: 200 });
    expect(out.crop).toBeNull();
    expect(out.textOverlays[0]).toMatchObject({ x: 0, y: 40, fontSize: 80 });
    expect(out.stickers[0]).toMatchObject({ x: -200, y: -40, scale: 8 });
    expect(out.drawingStrokes[0].points).toEqual([-360, -120, -280, -40]);
    expect(out.drawingStrokes[0].brushSize).toBe(16);
  });

  it("returns the same reference when nothing moves and no crop was set", () => {
    const s = { ...base(), crop: null };
    const r = { x: 0, y: 50, width: 400, height: 200 };
    expect(remapForCrop(s, r, { ...r })).toBe(s);
  });

  it("degenerate input only clears the crop", () => {
    const s = base();
    const out = remapForCrop(s, { x: 0, y: 0, width: 0, height: 0 }, { x: 0, y: 0, width: 10, height: 10 });
    expect(out.crop).toBeNull();
    expect(out.textOverlays).toBe(s.textOverlays);
  });
});
