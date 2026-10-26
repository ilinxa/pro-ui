import { describe, expect, it } from "vitest";
import {
  computeExportGeometry,
  MAX_OUTPUT_PIXELS,
  NATURAL_MAX_EDGE,
  type ExportGeometryInput,
} from "../lib/export-geometry";

const stage = { width: 400, height: 300 };
const media = { x: 0, y: 50, width: 400, height: 200 };

function geo(over: Partial<ExportGeometryInput> = {}) {
  return computeExportGeometry({ stage, media, crop: null, opts: {}, ...over });
}

describe("computeExportGeometry", () => {
  it("default: whole stage at pixelRatio 2", () => {
    expect(geo()).toEqual({ rect: { x: 0, y: 0, width: 400, height: 300 }, pixelRatio: 2, width: 800, height: 600 });
  });

  it("stage region uses the crop frame", () => {
    const g = geo({ crop: { x: 10, y: 20, width: 100, height: 50 } });
    expect(g.rect).toEqual({ x: 10, y: 20, width: 100, height: 50 });
    expect([g.width, g.height]).toEqual([200, 100]);
  });

  it("media region: photo only, at the photo's own resolution", () => {
    const g = geo({ naturalWidth: 2000, opts: { region: "media" } });
    expect(g.rect).toEqual(media);
    expect(g.pixelRatio).toBe(5);
    expect([g.width, g.height]).toEqual([2000, 1000]);
  });

  it("media region intersects the crop frame", () => {
    const g = geo({ naturalWidth: 800, crop: { x: 100, y: 0, width: 400, height: 100 }, opts: { region: "media" } });
    expect(g.rect).toEqual({ x: 100, y: 50, width: 300, height: 50 });
    expect([g.width, g.height]).toEqual([600, 100]);
  });

  it("media region without naturalWidth falls back to 2", () => {
    expect(geo({ opts: { region: "media" } }).pixelRatio).toBe(2);
  });

  it("explicit pixelRatio wins over the media default", () => {
    const g = geo({ naturalWidth: 2000, opts: { region: "media", pixelRatio: 1 } });
    expect([g.width, g.height]).toEqual([400, 200]);
  });

  it("width alone: height follows the aspect", () => {
    const g = geo({ opts: { width: 200 } });
    expect([g.width, g.height]).toEqual([200, 150]);
    expect(g.pixelRatio).toBeCloseTo(0.5);
  });

  it("height alone: width follows the aspect", () => {
    const g = geo({ opts: { height: 90 } });
    expect([g.width, g.height]).toEqual([120, 90]);
  });

  it("width + height: region is centre-trimmed to that aspect", () => {
    const wide = geo({ opts: { width: 100, height: 100 } }); // 400x300 -> 300x300 centred
    expect(wide.rect).toEqual({ x: 50, y: 0, width: 300, height: 300 });
    expect([wide.width, wide.height]).toEqual([100, 100]);
    const tall = geo({ opts: { width: 400, height: 100 } }); // 400x300 -> 400x100 centred
    expect(tall.rect).toEqual({ x: 0, y: 100, width: 400, height: 100 });
  });

  it("size options win over maxEdge and pixelRatio", () => {
    const g = geo({ opts: { width: 1000, maxEdge: 10, pixelRatio: 1 } });
    expect(g.width).toBe(1000);
  });

  it("maxEdge caps the longer edge and never scales up", () => {
    const capped = geo({ opts: { maxEdge: 400 } });
    expect([capped.width, capped.height]).toEqual([400, 300]);
    expect(capped.pixelRatio).toBeCloseTo(1);
    const big = geo({ opts: { maxEdge: 5000 } });
    expect([big.width, big.height]).toEqual([800, 600]);
  });

  it("returns integers >= 1", () => {
    const g = geo({ crop: { x: 0, y: 0, width: 0.2, height: 0.2 }, opts: { pixelRatio: 1 } });
    expect([g.width, g.height]).toEqual([1, 1]);
    const f = geo({ stage: { width: 333, height: 211 }, opts: { pixelRatio: 1.37 } });
    expect(Number.isInteger(f.width) && Number.isInteger(f.height)).toBe(true);
  });

  it("throws RangeError for an empty region", () => {
    expect(() => geo({ media: null, opts: { region: "media" } })).toThrow(RangeError);
    expect(() => geo({ stage: { width: 0, height: 10 } })).toThrow(RangeError);
    expect(() =>
      geo({ crop: { x: 0, y: 0, width: 100, height: 40 }, opts: { region: "media" } }),
    ).toThrow(RangeError);
    expect(() => geo({ crop: { x: 0, y: 0, width: 0, height: 5 } })).toThrow(RangeError);
  });
});

describe("size caps (R3)", () => {
  it("caps the natural-resolution default at 4096 px on the longer edge", () => {
    // 48 MP photo: 8000 x 6000 natural, shown 400 x 300
    const g = computeExportGeometry({
      stage: { width: 400, height: 300 },
      media: { x: 0, y: 0, width: 400, height: 300 },
      crop: null,
      naturalWidth: 8000,
      opts: { region: "media" },
    });
    expect(g.width).toBe(NATURAL_MAX_EDGE);
    expect(g.height).toBe(3072);
    expect(g.pixelRatio).toBeCloseTo(4096 / 400);
  });

  it("does not touch a natural size under the cap", () => {
    const g = geo({ naturalWidth: 2000, opts: { region: "media" } });
    expect([g.width, g.height]).toEqual([2000, 1000]);
  });

  it("an explicit pixelRatio is not subject to the 4096 edge cap (only the pixel cap)", () => {
    const g = geo({ stage: { width: 2000, height: 100 }, media: { x: 0, y: 0, width: 2000, height: 100 }, opts: { region: "media", pixelRatio: 3 } });
    expect([g.width, g.height]).toEqual([6000, 300]);
  });

  it("caps every result at 16.7 MP, uniformly, integers >= 1", () => {
    const g = computeExportGeometry({
      stage: { width: 4000, height: 3000 },
      media: null,
      crop: null,
      opts: { pixelRatio: 2 }, // 8000 x 6000 = 48 MP
    });
    expect(g.width * g.height).toBeLessThanOrEqual(MAX_OUTPUT_PIXELS);
    expect(g.width * g.height).toBeGreaterThan(MAX_OUTPUT_PIXELS * 0.99);
    expect(g.width / g.height).toBeCloseTo(8000 / 6000, 2);
    expect(Number.isInteger(g.width) && Number.isInteger(g.height)).toBe(true);
    expect(g.pixelRatio).toBeLessThan(2);
  });

  it("caps explicit width/height too", () => {
    const g = geo({ opts: { width: 10000, height: 10000 } });
    expect(g.width * g.height).toBeLessThanOrEqual(MAX_OUTPUT_PIXELS);
    expect(g.width).toBe(g.height);
  });

  it("leaves a result exactly at the limit alone", () => {
    const g = geo({ opts: { width: 4096, height: 4096 } });
    expect([g.width, g.height]).toEqual([4096, 4096]);
  });
});
