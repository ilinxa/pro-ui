// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportTextCardBlob, type TextCardExportOptions } from "../lib/text-card-export";

type Call = [string, ...unknown[]];

let log: Call[];
let canvasSize: { width: number; height: number };
let toBlobArgs: { type?: string; quality?: unknown } | null;

function makeCtx() {
  const ctx = {
    scale: (...a: unknown[]) => log.push(["scale", ...a]),
    fillRect: (...a: unknown[]) => log.push(["fillRect", ...a]),
    fillText: (...a: unknown[]) => log.push(["fillText", ...a]),
    measureText: (t: string) => ({ width: t.length * 10 }),
    createLinearGradient: (...a: unknown[]) => {
      log.push(["createLinearGradient", ...a]);
      return {
        addColorStop: (...s: unknown[]) => log.push(["addColorStop", ...s]),
      };
    },
  } as Record<string, unknown>;
  for (const prop of ["fillStyle", "font", "textAlign", "textBaseline", "direction", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY"]) {
    Object.defineProperty(ctx, prop, {
      set: (v) => log.push(["set:" + prop, v]),
      get: () => undefined,
    });
  }
  return ctx;
}

beforeEach(() => {
  log = [];
  toBlobArgs = null;
  canvasSize = { width: 0, height: 0 };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => {
    return makeCtx();
  }) as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    cb: BlobCallback,
    type?: string,
    quality?: unknown,
  ) {
    canvasSize = { width: this.width, height: this.height };
    toBlobArgs = { type, quality };
    cb(new Blob(["x"], { type: type ?? "image/png" }));
  } as never);
});
afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, "fonts");
});

const FONTS = [{ id: "sans", label: "Sans", family: "Onest, sans-serif" }];

function opts(over: Partial<TextCardExportOptions> = {}): TextCardExportOptions {
  return {
    textOnly: { text: "Hello", fontFamily: "Onest, sans-serif", textColor: "white", gradientId: "g" },
    background: { id: "g", label: "G", background: "linear-gradient(135deg, red 0%, blue 100%)" },
    fonts: FONTS,
    width: 400,
    height: 300,
    ...over,
  };
}

const named = (n: string) => log.filter((c) => c[0] === n);

describe("exportTextCardBlob", () => {
  it("sizes the output to width/height x pixelRatio (default 2) and defaults to PNG", async () => {
    const r = await exportTextCardBlob(opts());
    expect([r.width, r.height]).toEqual([800, 600]);
    expect(canvasSize).toEqual({ width: 800, height: 600 });
    expect(toBlobArgs?.type).toBe("image/png");
    expect(toBlobArgs?.quality).toBeUndefined();
    expect(r.blob).toBeInstanceOf(Blob);
    expect(named("scale")[0]).toEqual(["scale", 2, 2]);
  });

  it("honours pixelRatio, mimeType and quality", async () => {
    const r = await exportTextCardBlob(opts({ pixelRatio: 1, mimeType: "image/jpeg", quality: 0.5 }));
    expect([r.width, r.height]).toEqual([400, 300]);
    expect(toBlobArgs).toEqual({ type: "image/jpeg", quality: 0.5 });
  });

  it("parses an angle gradient into the CSS gradient line", async () => {
    await exportTextCardBlob(opts());
    const [, x0, y0, x1, y1] = named("createLinearGradient")[0] as number[] & Call;
    expect(x0).toBeCloseTo(25);
    expect(y0).toBeCloseTo(-25);
    expect(x1).toBeCloseTo(375);
    expect(y1).toBeCloseTo(325);
    expect(named("addColorStop").map((c) => [c[1], c[2]])).toEqual([[0, "rgb(255, 0, 0)"], [1, "rgb(0, 0, 255)"]]);
    expect(named("fillRect")[0]).toEqual(["fillRect", 0, 0, 400, 300]);
  });

  it("parses side keywords", async () => {
    await exportTextCardBlob(opts({ background: { id: "g", label: "G", background: "linear-gradient(to right, red, blue)" } }));
    const [, x0, y0, x1, y1] = named("createLinearGradient")[0] as number[] & Call;
    expect([x0, y0, x1, y1].map((n) => Math.round(n) + 0)).toEqual([0, 150, 400, 150]);
  });

  it("parses corner keywords (perpendicular to the other diagonal)", async () => {
    await exportTextCardBlob(opts({ background: { id: "g", label: "G", background: "linear-gradient(to bottom right, red, blue)" } }));
    const [, x0, y0, x1, y1] = named("createLinearGradient")[0] as number[] & Call;
    expect(x0).toBeCloseTo(56);
    expect(y0).toBeCloseTo(-42);
    expect(x1).toBeCloseTo(344);
    expect(y1).toBeCloseTo(342);
  });

  it("defaults to 180deg and spreads missing stop positions, keeping function colours whole", async () => {
    await exportTextCardBlob(opts({ background: { id: "g", label: "G", background: "linear-gradient(rgb(1, 2, 3), red, blue 80%, green)" } }));
    const [, x0, y0, x1, y1] = named("createLinearGradient")[0] as number[] & Call;
    expect([x0, y0, x1, y1].map((n) => Math.round(n) + 0)).toEqual([200, 0, 200, 300]);
    const stops = named("addColorStop");
    expect(stops.map((c) => c[1])).toEqual([0, 0.4, 0.8, 1]);
    expect(stops[0][2]).toBe("rgb(1, 2, 3)");
  });

  it("fills a plain colour without a gradient", async () => {
    await exportTextCardBlob(opts({ background: { id: "g", label: "G", background: "#336699" } }));
    expect(named("createLinearGradient")).toHaveLength(0);
    const fills = named("set:fillStyle");
    expect(String(fills[0][1])).toMatch(/336699|rgb\(51, 102, 153\)/i);
  });

  it("uses the first parsable colour for gradients it cannot draw", async () => {
    await exportTextCardBlob(opts({ background: { id: "g", label: "G", background: "radial-gradient(circle, #ff0000, #00ff00)" } }));
    expect(named("createLinearGradient")).toHaveLength(0);
    expect(String(named("set:fillStyle")[0][1])).toMatch(/ff0000|rgb\(255, 0, 0\)/i);
  });

  it("falls back to black when the preset is missing", async () => {
    await exportTextCardBlob(opts({ background: null }));
    expect(String(named("set:fillStyle")[0][1])).toMatch(/^(black|rgb\(0, 0, 0\))$/);
  });

  it("wraps text to the 20rem box and centres each line", async () => {
    const words = Array.from({ length: 12 }, (_, i) => `word${i}`).join(" ");
    await exportTextCardBlob(opts({ textOnly: { text: words, fontFamily: "Onest, sans-serif", textColor: "white", gradientId: "g" } }));
    const lines = named("fillText").map((c) => c[1] as string);
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(l.length * 10).toBeLessThanOrEqual(320);
    expect(lines.join(" ")).toBe(words);
    for (const c of named("fillText")) expect(c[2]).toBe(200);
    expect(named("set:textAlign")[0][1]).toBe("center");
  });

  it("breaks over-long words and keeps explicit newlines", async () => {
    await exportTextCardBlob(opts({ textOnly: { text: "a".repeat(70) + "\nb", fontFamily: "x", textColor: "white", gradientId: "g" } }));
    const lines = named("fillText").map((c) => c[1] as string);
    expect(lines).toEqual(["a".repeat(33), "a".repeat(33), "a".repeat(4), "b"]); // fallback wrap = width 400 - 64 = 336 px
  });

  it("sets font (weight 600, clamped size), text colour and the on-screen shadow", async () => {
    await exportTextCardBlob(opts());
    expect(named("set:font")[0][1]).toBe("600 28px Onest, sans-serif");
    const order = log.map((c) => c[0]);
    const lastFill = log.filter((c, i) => c[0] === "set:fillStyle" && i < order.indexOf("fillText")).pop();
    expect(String(lastFill?.[1])).toMatch(/^(white|rgb\(255, 255, 255\))$/);
    expect(named("set:shadowBlur")[0][1]).toBe(16);
    expect(named("set:shadowOffsetY")[0][1]).toBe(4);
  });

  it("waits for the font before drawing", async () => {
    const load = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 5));
      log.push(["fonts.load"]);
      return [];
    });
    Object.defineProperty(document, "fonts", { value: { load }, configurable: true });
    await exportTextCardBlob(opts());
    expect(load).toHaveBeenCalledTimes(1);
    expect(String((load.mock.calls[0] as unknown[])[0])).toContain("600 28px");
    const names = log.map((c) => c[0]);
    expect(names.indexOf("fonts.load")).toBeGreaterThan(-1);
    expect(names.indexOf("fonts.load")).toBeLessThan(names.indexOf("fillRect"));
  });

  it("still draws when the font load rejects", async () => {
    Object.defineProperty(document, "fonts", { value: { load: () => Promise.reject(new Error("x")) }, configurable: true });
    await expect(exportTextCardBlob(opts())).resolves.toBeTruthy();
  });

  describe("live preview metrics (R5)", () => {
    it("fontSizePx replaces the width estimate", async () => {
      await exportTextCardBlob(opts({ fontSizePx: 40 }));
      expect(named("set:font")[0][1]).toBe("600 40px Onest, sans-serif");
    });

    it("keeps the estimate as the fallback (also for invalid values)", async () => {
      await exportTextCardBlob(opts({ fontSizePx: 0 }));
      expect(named("set:font")[0][1]).toBe("600 28px Onest, sans-serif");
    });

    it("textBoxWidth replaces the 320 px wrap width", async () => {
      const words = Array.from({ length: 12 }, (_, i) => `word${i}`).join(" ");
      const text = { text: words, fontFamily: "Onest, sans-serif", textColor: "white", gradientId: "g" };
      await exportTextCardBlob(opts({ textOnly: text, textBoxWidth: 100 }));
      const narrow = named("fillText").map((c) => c[1] as string);
      for (const l of narrow) expect(l.length * 10).toBeLessThanOrEqual(100);
      log.length = 0;
      await exportTextCardBlob(opts({ textOnly: text, textBoxWidth: 360 }));
      const wide = named("fillText").map((c) => c[1] as string);
      expect(wide.length).toBeLessThan(narrow.length);
      for (const l of wide) expect(l.length * 10).toBeLessThanOrEqual(360);
      expect(Math.max(...wide.map((l) => l.length)) * 10).toBeGreaterThan(320);
    });

    it("sets ctx.direction for rtl and keeps the text centred", async () => {
      await exportTextCardBlob(opts({ direction: "rtl" }));
      expect(named("set:direction")[0][1]).toBe("rtl");
      expect(named("set:textAlign")[0][1]).toBe("center");
      for (const c of named("fillText")) expect(c[2]).toBe(200);
    });

    it("leaves ctx.direction alone when not given", async () => {
      await exportTextCardBlob(opts());
      expect(named("set:direction")).toHaveLength(0);
    });
  });
});
