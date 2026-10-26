/**
 * media-editor 0.6.0 U5 W1: a `var()`-bearing font family never reaches a
 * canvas. Chromium rejects `ctx.font = "40px var(--x, Onest, sans-serif)"` and
 * keeps "10px sans-serif", so overlay text drew at 10 px whatever fontSize said.
 */
import * as React from "react";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorCanvas } from "../parts/editor-canvas";
import { resolveCanvasFontFamily } from "../lib/placement";

const h = vi.hoisted(() => ({ textProps: [] as Array<Record<string, unknown>> }));

vi.mock("react-konva", () => {
  const Box = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Nothing = () => null;
  const TextNode = (props: Record<string, unknown>) => {
    h.textProps.push(props);
    return null;
  };
  return { Stage: Box, Layer: Box, Image: Nothing, Line: Nothing, Text: TextNode, Transformer: Nothing };
});
vi.mock("../hooks/use-konva-stage-size", () => ({
  useKonvaStageSize: () => ({ width: 400, height: 300 }),
}));

const TOKEN = "var(--font-onest, Onest, sans-serif)";
const MONO = "var(--font-mono, 'JetBrains Mono', monospace)";

/** Like Chromium: a canvas `font` containing var() is rejected (value unchanged). */
function installRejectingCanvas() {
  const measured: string[] = [];
  let font = "10px sans-serif";
  const ctx = {
    get font() {
      return font;
    },
    set font(v: string) {
      if (!v.includes("var(")) font = v;
    },
    measureText(t: string) {
      measured.push(font);
      return { width: t.length * (font.startsWith("10px") ? 5 : 20) };
    },
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as never);
  return measured;
}

beforeEach(() => {
  h.textProps = [];
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("resolveCanvasFontFamily", () => {
  it("leaves a concrete family untouched", () => {
    expect(resolveCanvasFontFamily("Georgia, 'Times New Roman', serif")).toBe(
      "Georgia, 'Times New Roman', serif",
    );
  });

  it("resolves a token through computed style, cached per value", () => {
    const spy = vi
      .spyOn(window, "getComputedStyle")
      .mockReturnValue({ fontFamily: "Onest, sans-serif" } as CSSStyleDeclaration);
    expect(resolveCanvasFontFamily("var(--a-1, Onest, sans-serif)")).toBe("Onest, sans-serif");
    resolveCanvasFontFamily("var(--a-1, Onest, sans-serif)");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("falls back to the var() fallback list when computed style cannot resolve it", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ fontFamily: "" } as CSSStyleDeclaration);
    expect(resolveCanvasFontFamily("var(--b-2, Onest, sans-serif)")).toBe("Onest, sans-serif");
    expect(resolveCanvasFontFamily("var(--c-3, 'JetBrains Mono', monospace)")).toBe(
      "'JetBrains Mono', monospace",
    );
    expect(resolveCanvasFontFamily("var(--d-4)")).toBe("sans-serif");
  });
});

describe("Konva <Text> font family", () => {
  it("receives a resolved family, never a var()", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      fontFamily: "Onest, sans-serif",
    } as CSSStyleDeclaration);
    render(
      <EditorCanvas
        imageUrl={null}
        textOverlays={[
          { id: "t1", text: "Hi", x: 0, y: 0, fontFamily: TOKEN, fontSize: 40, fill: "#fff", align: "left", rotation: 0, scale: 1 },
        ]}
      />,
    );
    const p = h.textProps.at(-1)!;
    expect(p.fontFamily).toBe("Onest, sans-serif");
    expect(String(p.fontFamily)).not.toContain("var(");
    expect(p.fontSize).toBe(40);
  });
});

describe("measureTextBox", () => {
  it("measures with a font the canvas accepted (not the 10px default)", async () => {
    const measured = installRejectingCanvas();
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Chrome/130");
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      fontFamily: "'JetBrains Mono', monospace",
    } as CSSStyleDeclaration);
    const { measureTextBox } = await import("../lib/placement");
    const box = measureTextBox("abcd", MONO, 40);
    expect(measured[0]).toBe("40px 'JetBrains Mono', monospace");
    expect(box.width).toBe(80);
  });
});
