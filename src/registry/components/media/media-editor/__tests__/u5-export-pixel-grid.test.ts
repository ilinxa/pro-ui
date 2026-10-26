// @vitest-environment jsdom
/**
 * media-editor 0.6.0 U5 W4: `region: "media"` must not resample when the scale
 * is the natural one. Konva sizes its canvas with floor(size * pixelRatio);
 * geometry rounds. `309 * (3000 / 309)` is 2999.9999999999995, so the Konva
 * canvas came out 2999 wide and the whole picture was stretched to 3000.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Konva from "konva";
import { renderPhoto, snapPixelRatio } from "../lib/export-blob";
import { computeExportGeometry } from "../lib/export-geometry";

let draws: unknown[][];
beforeEach(() => {
  draws = [];
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => ({
    fillRect() {},
    drawImage: (...a: unknown[]) => draws.push(a.slice(1)),
  })) as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    cb: BlobCallback,
  ) {
    cb(new Blob(["x"]));
  } as never);
});
afterEach(() => vi.restoreAllMocks());

/** A stage whose toCanvas sizes the canvas the way Konva does: floor(size * ratio). */
function konvaLikeStage(override?: { width: number; height: number }) {
  const toCanvas = vi.fn((cfg: { width: number; height: number; pixelRatio: number }) => {
    const c = document.createElement("canvas");
    c.width = override?.width ?? Math.floor(cfg.width * cfg.pixelRatio);
    c.height = override?.height ?? Math.floor(cfg.height * cfg.pixelRatio);
    return c;
  });
  return { stage: { toCanvas, width: () => 400, height: () => 300 } as unknown as Konva.Stage, toCanvas };
}

// [naturalW, naturalH, mediaW, mediaH] - float pairs where floor lands one px short.
const FAILING: Array<[number, number, number, number]> = [
  [3000, 2000, 309, 206],
  [3000, 2250, 309, 231.75],
  [4000, 3000, 304, 228],
  [1600, 1200, 305, 228.75],
];

describe("W4: natural-scale media export keeps the pixel grid", () => {
  for (const [nw, nh, mw, mh] of FAILING) {
    it(`${nw}x${nh} photo shown at ${mw}x${mh}: output is exact and nothing is rescaled`, async () => {
      const media = { x: 12.5, y: 7, width: mw, height: mh };
      const g = computeExportGeometry({
        stage: { width: 400, height: 300 },
        media,
        crop: null,
        naturalWidth: nw,
        opts: { region: "media" },
      });
      expect([g.width, g.height]).toEqual([nw, nh]);
      const { stage, toCanvas } = konvaLikeStage();
      const out = await renderPhoto({
        stage,
        rect: g.rect,
        pixelRatio: g.pixelRatio,
        width: g.width,
        height: g.height,
      });
      expect([out.width, out.height]).toEqual([nw, nh]);
      expect(toCanvas.mock.calls[0][0]).toMatchObject({ width: mw, height: mh });
      // the Konva canvas was already the target: encoded as-is, no second canvas
      expect(draws).toHaveLength(0);
    });
  }

  it("snapPixelRatio only nudges a product that sits just under its integer", () => {
    const raw = 3000 / 309;
    expect(Math.floor(309 * raw)).toBe(2999); // the bug, in plain arithmetic
    const r = snapPixelRatio({ width: 309, height: 206 }, raw);
    expect(Math.floor(309 * r)).toBe(3000);
    expect(Math.floor(206 * r)).toBe(2000);
    expect(r / raw).toBeCloseTo(1, 10);
    expect(snapPixelRatio({ width: 300.4, height: 200 }, 2)).toBe(2); // 600.8: not near an integer
  });

  it("a Konva canvas one pixel off the target is copied 1:1, not resampled", async () => {
    const { stage } = konvaLikeStage({ width: 2999, height: 2000 });
    const out = await renderPhoto({
      stage,
      rect: { x: 0, y: 0, width: 309.5, height: 206 },
      pixelRatio: 3000 / 309.5,
      width: 3000,
      height: 2000,
    });
    expect([out.width, out.height]).toEqual([3000, 2000]);
    expect(draws).toHaveLength(1);
    const [sx, sy, sw, sh, dx, dy, dw, dh] = draws[0] as number[];
    expect([sx, sy, dx, dy]).toEqual([0, 0, 0, 0]);
    expect([sw, sh]).toEqual([dw, dh]); // same size both sides: no scaling
    expect([sw, sh]).toEqual([2999, 2000]);
  });

  it("a bigger mismatch still resamples to the requested size", async () => {
    const { stage } = konvaLikeStage({ width: 1500, height: 1000 });
    await renderPhoto({
      stage,
      rect: { x: 0, y: 0, width: 300, height: 200 },
      pixelRatio: 5,
      width: 3000,
      height: 2000,
    });
    expect(draws).toHaveLength(1);
    expect(draws[0]).toEqual([0, 0, 1500, 1000, 0, 0, 3000, 2000]);
  });
});
