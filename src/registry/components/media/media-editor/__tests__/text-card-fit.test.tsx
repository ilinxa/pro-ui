// @vitest-environment jsdom
import * as React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportTextCardBlob,
  fitFontSize,
  textBlockTop,
  type TextCardExportOptions,
} from "../lib/text-card-export";
import { TextOnlyCanvas, TEXT_CARD_FLOOR_PX } from "../parts/text-only-canvas";

// ─── Pure layout math ─────────────────────────────────────────────────

describe("fitFontSize", () => {
  it("returns the base when it fits", () => {
    expect(fitFontSize({ base: 30, floor: 14, fits: () => true })).toBe(30);
  });
  it("steps down 1 px until the text fits", () => {
    expect(fitFontSize({ base: 30, floor: 14, fits: (p) => p <= 20 })).toBe(20);
  });
  it("stops at the floor when nothing fits", () => {
    expect(fitFontSize({ base: 30, floor: 14, fits: () => false })).toBe(14);
  });
});

describe("textBlockTop", () => {
  it("uses the live input top while the block stays on the card", () => {
    expect(textBlockTop({ cardHeight: 600, lineCount: 6, lineHeight: 30, textTopPx: 100 })).toBe(100);
  });
  it("centres the block with no measurement (one line is centred, not parked in a 3-row block)", () => {
    expect(textBlockTop({ cardHeight: 600, lineCount: 1, lineHeight: 30 })).toBe(285);
  });
  it("centres a block that would run off the card", () => {
    expect(textBlockTop({ cardHeight: 300, lineCount: 12, lineHeight: 30, textTopPx: 100 })).toBe(-30);
  });
});

// ─── Export placement (mocked 2D context) ─────────────────────────────

type Call = [string, ...unknown[]];
let log: Call[];

function makeCtx() {
  const ctx = {
    scale: () => {},
    fillRect: () => {},
    fillText: (...a: unknown[]) => log.push(["fillText", ...a]),
    measureText: (t: string) => ({ width: t.length * 10 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
  } as Record<string, unknown>;
  for (const prop of ["fillStyle", "font", "textAlign", "textBaseline", "direction", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY"]) {
    Object.defineProperty(ctx, prop, { set: () => {}, get: () => undefined });
  }
  return ctx;
}

function opts(text: string, over: Partial<TextCardExportOptions> = {}): TextCardExportOptions {
  return {
    textOnly: { text, fontFamily: "x", textColor: "white", gradientId: "g" },
    background: { id: "g", label: "G", background: "#336699" },
    fonts: [],
    width: 400,
    height: 600,
    fontSizePx: 25,
    lineHeightPx: 30,
    ...over,
  };
}

describe("exportTextCardBlob placement", () => {
  beforeEach(() => {
    log = [];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => makeCtx()) as never);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (cb: BlobCallback) {
      cb(new Blob(["x"]));
    } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  const ys = () => log.filter((c) => c[0] === "fillText").map((c) => c[3] as number);

  it("draws all 6 lines from the live input top at the live line height", async () => {
    await exportTextCardBlob(opts("1\n2\n3\n4\n5\n6", { textTopPx: 100 }));
    expect(ys()).toEqual([115, 145, 175, 205, 235, 265]);
  });

  it("without a measurement a single line sits at the card centre", async () => {
    await exportTextCardBlob(opts("hi", { textTopPx: undefined }));
    expect(ys()).toEqual([300]);
  });

  it("without a measurement 6 lines are one centred block", async () => {
    await exportTextCardBlob(opts("1\n2\n3\n4\n5\n6", { textTopPx: undefined }));
    // top = (600 - 6*30)/2 = 210
    expect(ys()).toEqual([225, 255, 285, 315, 345, 375]);
  });
});

// ─── Auto-grow + fit (jsdom cannot lay out: stub the geometry) ────────

const CARD_W = 390;
let cardH = 600;
let lineSpacing = 1.2;

function stubGeometry() {
  Object.defineProperty(HTMLDivElement.prototype, "clientWidth", {
    configurable: true,
    get: () => CARD_W,
  });
  Object.defineProperty(HTMLDivElement.prototype, "clientHeight", {
    configurable: true,
    get: () => cardH,
  });
  // scrollHeight = lines x font size x line-height, at the font the fit set.
  Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", {
    configurable: true,
    get(this: HTMLTextAreaElement) {
      const fs = parseFloat(this.style.getPropertyValue("--tc-fs")) || 48;
      return this.value.split("\n").length * fs * lineSpacing;
    },
  });
}

function unstubGeometry() {
  Reflect.deleteProperty(HTMLDivElement.prototype, "clientWidth");
  Reflect.deleteProperty(HTMLDivElement.prototype, "clientHeight");
  Reflect.deleteProperty(HTMLTextAreaElement.prototype, "scrollHeight");
}

const labels = {
  textPlaceholder: "Type",
  textBackground: "Background",
  textFontFamily: "Font",
  drawColor: "Colour",
  colorHex: "Hex",
  colorSwatch: (c: string) => c,
} as never;

const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i + 1}`).join("\n");

function mount(text: string) {
  const state = (t: string) => ({ text: t, fontFamily: "sans-serif", textColor: "#fff", gradientId: "g" });
  const view = render(
    <TextOnlyCanvas
      gradients={[{ id: "g", label: "G", background: "#000" }]}
      fonts={[]}
      colorPresets={["#fff"]}
      labels={labels}
      value={state(text)}
      onChange={() => {}}
    />,
  );
  const input = () => view.container.querySelector<HTMLTextAreaElement>('[data-slot="textcard-input"]')!;
  return {
    input,
    setText: (t: string) =>
      view.rerender(
        <TextOnlyCanvas
          gradients={[{ id: "g", label: "G", background: "#000" }]}
          fonts={[]}
          colorPresets={["#fff"]}
          labels={labels}
          value={state(t)}
          onChange={() => {}}
        />,
      ),
  };
}

describe("TextOnlyCanvas auto-grow + fit", () => {
  beforeEach(() => {
    cardH = 600;
    lineSpacing = 1.2;
    stubGeometry();
  });
  afterEach(() => {
    cleanup();
    unstubGeometry();
    vi.unstubAllGlobals();
  });

  it("starts one row tall and grows to show all 6 lines at the base size", () => {
    const { input } = mount(lines(6));
    expect(input().rows).toBe(1);
    // base = 7 % of 390 = 27.3 -> 27 px; 6 lines x 27 x 1.2 = 194.4
    expect(input().style.getPropertyValue("--tc-fs")).toBe("27px");
    expect(parseFloat(input().style.height)).toBeCloseTo(194.4, 5);
  });

  it("grows when lines are added", () => {
    const { input, setText } = mount(lines(2));
    const before = parseFloat(input().style.height);
    setText(lines(6));
    expect(parseFloat(input().style.height)).toBeGreaterThan(before);
  });

  it("steps the font down until every line fits the card", () => {
    // available = 600 - 176 = 424; 20 lines x fs x 1.2 <= 424 -> fs 17
    const { input } = mount(lines(20));
    expect(input().style.getPropertyValue("--tc-fs")).toBe("17px");
    expect(parseFloat(input().style.height)).toBeLessThanOrEqual(424);
  });

  it("stops at the floor and keeps the available height (scrolls)", () => {
    const { input } = mount(lines(100));
    expect(input().style.getPropertyValue("--tc-fs")).toBe(`${TEXT_CARD_FLOOR_PX}px`);
    expect(input().style.height).toBe("424px");
  });

  it("re-fits when the card resizes", () => {
    let notify: () => void = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          notify = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { input } = mount(lines(10));
    const roomy = parseFloat(input().style.getPropertyValue("--tc-fs"));
    cardH = 300; // available = max(300 - 176, 120) = 124
    act(() => notify());
    expect(parseFloat(input().style.getPropertyValue("--tc-fs"))).toBeLessThan(roomy);
    expect(parseFloat(input().style.height)).toBeLessThanOrEqual(124);
  });

  it("sizes the card as a container, with no viewport units", () => {
    const { input } = mount("hi");
    const card = input().parentElement!;
    expect(card.getAttribute("style") ?? "").toMatch(/container-type:\s*size/);
    expect(input().getAttribute("style") ?? "").not.toMatch(/\d(vw|vh)\b/);
  });
});
