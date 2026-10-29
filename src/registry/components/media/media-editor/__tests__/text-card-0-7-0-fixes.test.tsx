// @vitest-environment jsdom
import * as React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportTextCardBlob,
  fitFontSize,
  type TextCardExportOptions,
} from "../lib/text-card-export";
import { TextOnlyCanvas, TEXT_CARD_FLOOR_PX } from "../parts/text-only-canvas";

// ─── T13: binary search keeps the linear result ───────────────────────

function linearFit(base: number, floor: number, fits: (p: number) => boolean) {
  const b = Math.max(floor, Math.floor(base));
  for (let px = b; px > floor; px--) if (fits(px)) return px;
  return floor;
}

describe("fitFontSize (T13)", () => {
  it("equals the linear search and probes far fewer sizes", () => {
    for (const [base, floor, limit] of [
      [48, 14, 30],
      [48, 14, 48],
      [48, 14, 5],
      [27.3, 14, 20],
      [14, 14, 99],
      [10, 14, 99],
      [48, 14, 15],
    ] as const) {
      const fits = (p: number) => p <= limit;
      expect(fitFontSize({ base, floor, fits })).toBe(linearFit(base, floor, fits));
    }
    const probe = vi.fn((p: number) => p <= 15);
    fitFontSize({ base: 48, floor: 14, fits: probe });
    expect(probe.mock.calls.length).toBeLessThanOrEqual(7);
  });
});

// ─── Export (mocked 2D context) ───────────────────────────────────────

type Call = [string, ...unknown[]];
let log: Call[];
let fonts: string[];

function makeCtx() {
  const ctx = {
    scale: () => {},
    fillRect: () => {},
    fillText: (...a: unknown[]) => log.push(["fillText", ...a]),
    measureText: (t: string) => ({ width: t.length * 10 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
  } as Record<string, unknown>;
  for (const prop of ["fillStyle", "textAlign", "textBaseline", "direction", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY"]) {
    Object.defineProperty(ctx, prop, { set: () => {}, get: () => undefined });
  }
  Object.defineProperty(ctx, "font", { set: (v: string) => fonts.push(v), get: () => "" });
  return ctx;
}

function opts(text: string, over: Partial<TextCardExportOptions> = {}): TextCardExportOptions {
  return {
    textOnly: { text, fontFamily: "x", textColor: "white", gradientId: "g" },
    background: { id: "g", label: "G", background: "#336699" },
    fonts: [],
    width: 400,
    height: 600,
    ...over,
  };
}

const sizeOf = (f: string) => parseFloat(/(\d+(?:\.\d+)?)px/.exec(f)![1]);
const texts = () => log.filter((c) => c[0] === "fillText").map((c) => c[1] as string);

describe("exportTextCardBlob (T12a / T12f)", () => {
  beforeEach(() => {
    log = [];
    fonts = [];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => makeCtx()) as never);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (cb: BlobCallback) {
      cb(new Blob(["x"]));
    } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  it("T12a: keeps the trailing space of the last line, like the preview", async () => {
    await exportTextCardBlob(opts("hi ", { fontSizePx: 25, lineHeightPx: 30 }));
    expect(texts()).toEqual(["hi "]);
  });

  it("T12f: fallback wraps at min(width - 64, 640), not 320", async () => {
    // 10 px per char: 90 chars on a 1000 px card wrap at 640 -> 64 chars/line.
    const text = Array.from({ length: 15 }, () => "abcdef").join(" "); // 90 chars
    await exportTextCardBlob(opts(text, { width: 1000, height: 1000 }));
    const widest = Math.max(...texts().map((t) => t.trimEnd().length));
    expect(widest).toBeGreaterThan(32); // the old 320 px cap allowed 32
    expect(widest).toBeLessThanOrEqual(64);
  });

  it("T12f: fallback wraps narrower on a narrow card (width - 64)", async () => {
    const text = Array.from({ length: 15 }, () => "abcdef").join(" ");
    await exportTextCardBlob(opts(text, { width: 200, height: 2000 }));
    expect(Math.max(...texts().map((t) => t.trimEnd().length))).toBeLessThanOrEqual(13);
  });

  it("T12f: fallback steps the font down to fit like the preview", async () => {
    const many = Array.from({ length: 12 }, (_, i) => `line ${i}`).join("\n");
    await exportTextCardBlob(opts(many, { width: 400, height: 400 }));
    // available = max(400 - 176, 160) = 224; 12 lines x px x 1.2 <= 224 -> 15
    expect(sizeOf(fonts[fonts.length - 1]!)).toBe(15);
    await exportTextCardBlob(opts("hi", { width: 400, height: 400 }));
    // short text keeps the base: 7 % of 400 = 28
    expect(sizeOf(fonts[fonts.length - 1]!)).toBe(28);
  });
});

// ─── TextOnlyCanvas fit (jsdom cannot lay out: stub the geometry) ─────

const CARD_W = 390;
let cardH = 600;
let barH = 0;

function stubGeometry() {
  Object.defineProperty(HTMLDivElement.prototype, "clientWidth", { configurable: true, get: () => CARD_W });
  Object.defineProperty(HTMLDivElement.prototype, "clientHeight", { configurable: true, get: () => cardH });
  Object.defineProperty(HTMLDivElement.prototype, "offsetHeight", {
    configurable: true,
    get(this: HTMLDivElement) {
      return this.classList.contains("z-20") ? barH : 0;
    },
  });
  Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", {
    configurable: true,
    get(this: HTMLTextAreaElement) {
      const fs = parseFloat(this.style.getPropertyValue("--tc-fs")) || 48;
      return this.value.split("\n").length * fs * 1.2;
    },
  });
}

function unstubGeometry() {
  Reflect.deleteProperty(HTMLDivElement.prototype, "clientWidth");
  Reflect.deleteProperty(HTMLDivElement.prototype, "clientHeight");
  Reflect.deleteProperty(HTMLDivElement.prototype, "offsetHeight");
  Reflect.deleteProperty(HTMLTextAreaElement.prototype, "scrollHeight");
}

function makeLabels(placeholder = "Type") {
  return {
    textPlaceholder: placeholder,
    textBackground: "Background",
    textFontFamily: "Font",
    drawColor: "Colour",
    colorHex: "Hex",
    colorSwatch: (c: string) => c,
  } as never;
}

const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i + 1}`).join("\n");

function mount(text: string, placeholder?: string) {
  const view = render(
    <TextOnlyCanvas
      gradients={[{ id: "g", label: "G", background: "#000" }]}
      fonts={[]}
      colorPresets={["#fff"]}
      labels={makeLabels(placeholder)}
      value={{ text, fontFamily: "sans-serif", textColor: "#fff", gradientId: "g" }}
      onChange={() => {}}
    />,
  );
  const input = () => view.container.querySelector<HTMLTextAreaElement>('[data-slot="textcard-input"]')!;
  const fs = () => parseFloat(input().style.getPropertyValue("--tc-fs"));
  return { view, input, fs };
}

describe("TextOnlyCanvas 0.7.0 fixes", () => {
  beforeEach(() => {
    cardH = 600;
    barH = 0;
    stubGeometry();
  });
  afterEach(() => {
    cleanup();
    unstubGeometry();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, "fonts");
  });

  it("T6: re-fits when a later font load finishes (document.fonts loadingdone) and detaches on unmount", () => {
    const target = new EventTarget();
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: Object.assign(target, { ready: Promise.resolve() }),
    });
    const { view, input, fs } = mount(lines(14));
    const before = fs();
    // Simulate the font changing the metrics: only the listener can re-fit.
    cardH = 300;
    expect(fs()).toBe(before);
    act(() => {
      target.dispatchEvent(new Event("loadingdone"));
    });
    expect(fs()).toBeLessThan(before);
    expect(parseFloat(input().style.height)).toBeLessThanOrEqual(124);
    view.unmount();
    // The listener is gone after unmount (no throw on a detached card).
    expect(() => target.dispatchEvent(new Event("loadingdone"))).not.toThrow();
  });

  it("T6: absence of document.fonts is tolerated", () => {
    expect(() => mount("hi")).not.toThrow();
  });

  it("T7: reserves the bar's real height and re-fits when the picker opens", () => {
    barH = 60; // closed bar -> reserve 60 + 28 = 88 -> available 424
    const { view, input, fs } = mount(lines(14));
    const closed = fs();
    expect(closed).toBe(25); // 14 x 25 x 1.2 = 420 <= 424
    barH = 132; // gradient picker open -> bottom 160, top 88 (capped) -> available 352
    fireEvent.click(view.getByRole("button", { name: /Background/ }));
    expect(fs()).toBe(20); // 14 x 20 x 1.2 = 336 <= 352
    expect(parseFloat(input().style.height)).toBeLessThanOrEqual(352);
    expect(fs()).toBeLessThan(closed);
  });

  it("F1 (browser): the input is centred above the bar, so an open picker never covers it", () => {
    barH = 132;
    const { view, input } = mount(lines(3));
    fireEvent.click(view.getByRole("button", { name: /Background/ }));
    // The card's padding reserves the bar (bottom) and the top chrome, and the grid
    // centres the input in what is left — not on the whole card.
    const card = input().parentElement as HTMLElement;
    expect(card.style.paddingBottom).toBe("160px");
    expect(card.style.paddingTop).toBe("88px");
    expect(parseFloat(input().style.height)).toBeLessThanOrEqual(600 - 160 - 88);
  });

  it("T8: an empty card is sized for its wrapped placeholder, value stays empty", () => {
    const { input } = mount("", "line a\nline b\nline c");
    // base = 27; 3 placeholder lines x 27 x 1.2 = 97.2 (not one row = 32.4)
    expect(parseFloat(input().style.height)).toBeCloseTo(97.2, 5);
    expect(input().value).toBe("");
  });

  it("T13: floor still holds for very long text", () => {
    const { input, fs } = mount(lines(100));
    expect(fs()).toBe(TEXT_CARD_FLOOR_PX);
    expect(input().style.height).toBe("424px");
  });
});
