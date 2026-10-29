/**
 * Release 8 fix wave (M1-M5, M9): loop flips re-init, focusable disabled ends, caption height
 * tracking (items change / first paint / no ResizeObserver), peekRatio validation, "W:H" parsing.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import type { MediaItem } from "../types";
import { mockResizeObserver } from "../../../../../../tests/helpers";
import { embla, frameOf, images, ratioOf, setupEmbla, slidesOf } from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

let restore: () => void;
beforeEach(() => {
  restore = setupEmbla(2);
});
afterEach(() => {
  restore();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const prev = () => screen.getByRole("button", { name: "Previous slide" });
const next = () => screen.getByRole("button", { name: "Next slide" });

describe("M1: effective loop false -> true re-inits", () => {
  it("2 items (engine drops the loop) -> 4 items (engine loops) calls reInit again", () => {
    embla.api!.engineLoop = false;
    const { rerender } = render(<MediaCarousel items={images(2)} variant="gallery" />);
    expect(embla.api!.reInit).toHaveBeenCalledTimes(1);
    embla.api!.engineLoop = true;
    rerender(<MediaCarousel items={images(4)} variant="gallery" />);
    // Embla's own wrapper re-inits on the items change and emits "reInit".
    act(() => embla.api!.emit("reInit"));
    expect(embla.api!.reInit).toHaveBeenCalledTimes(2);
    // No loop: a re-init that lands on the same value does not re-init again.
    act(() => embla.api!.emit("reInit"));
    expect(embla.api!.reInit).toHaveBeenCalledTimes(2);
  });
});

describe("M2: disabled ends stay focusable", () => {
  it("Next keeps focus at the end, is aria-disabled, and a click does nothing", () => {
    embla.api!.engineLoop = false;
    render(<MediaCarousel items={images(2)} variant="gallery" />);
    next().focus();
    expect(document.activeElement).toBe(next());
    fireEvent.click(next());
    expect(embla.api!.scrollNext).toHaveBeenCalledTimes(1);
    expect(embla.api!.snap).toBe(1);
    expect(document.activeElement).toBe(next());
    expect(next().getAttribute("aria-disabled")).toBe("true");
    expect(next().hasAttribute("disabled")).toBe(false);
    fireEvent.click(next());
    expect(embla.api!.scrollNext).toHaveBeenCalledTimes(1);
    expect(prev().getAttribute("aria-disabled")).toBeNull();
  });
});

/** Stub layout: a slide is 100 + 200 x (its image's `data-h` / 100); its frame is 30 px shorter. */
function stubHeights(slideOf: (img: HTMLImageElement | null) => number): () => void {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      const img = this.querySelector("img");
      if (this.hasAttribute("data-media-carousel-slide")) return slideOf(img);
      if (this.parentElement?.hasAttribute("data-media-carousel-slide")) return slideOf(img) - 30;
      return 0;
    },
  });
  return () => {
    if (original) Object.defineProperty(HTMLElement.prototype, "offsetHeight", original);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetHeight;
  };
}

const captioned = (alt: string, prefix: string): MediaItem[] =>
  images(3, { caption: "A caption", alt }).map((it, i) => ({ ...it, id: `${prefix}-${i}` }) as MediaItem);

const viewport = (container: HTMLElement) => container.querySelector<HTMLElement>(".overflow-hidden")!;

describe("M3: viewport height follows the items", () => {
  it("replacing the active item re-subscribes and updates the height", () => {
    const restoreRO = mockResizeObserver();
    const restoreH = stubHeights((img) => (img?.getAttribute("alt") === "New" ? 500 : 300));
    try {
      const { container, rerender } = render(
        <MediaCarousel items={captioned("Old", "a")} variant="linear" />,
      );
      expect(viewport(container).style.height).toBe("300px");
      rerender(<MediaCarousel items={captioned("New", "b")} variant="linear" />);
      expect(viewport(container).style.height).toBe("500px");
    } finally {
      restoreH();
      restoreRO();
    }
  });
});

describe("M4: first paint and no-ResizeObserver path", () => {
  it("reads the slide height once per shown slide without ResizeObserver; nav centres on the frame", () => {
    expect(typeof ResizeObserver).toBe("undefined");
    const restoreH = stubHeights(() => 400);
    try {
      const { container } = render(<MediaCarousel items={captioned("x", "c")} variant="linear" />);
      expect(viewport(container).style.height).toBe("400px");
      expect(next().style.top).toBe("185px");
    } finally {
      restoreH();
    }
  });
});

describe("M5: peekRatio validation", () => {
  const flex = (peek: number) => {
    const { container, unmount } = render(<MediaCarousel items={images(3)} variant="gallery" peekRatio={peek} />);
    const value = slidesOf(container)[0]!.style.flex;
    unmount();
    return value;
  };

  it("clamps to [0, 0.45]; non-finite -> 0.075; 0 is valid", () => {
    expect(flex(0.5)).toBe("0 0 10%");
    expect(flex(-1)).toBe("0 0 100%");
    expect(flex(Number.NaN)).toBe("0 0 85%");
    expect(flex(0)).toBe("0 0 100%");
  });

  it("warns once per bad value in dev, never for a valid one", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    flex(0.31);
    flex(0.31);
    expect(warn).not.toHaveBeenCalled();
    flex(0.77);
    flex(0.77);
    expect(warn).toHaveBeenCalledTimes(1);
    flex(Number.POSITIVE_INFINITY);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

describe("M9: W:H parsing matches media-editor", () => {
  const ratio = (aspect: string) => {
    const { container, unmount } = render(
      <MediaCarousel items={images(2)} variant="linear" aspect={aspect as "square"} />,
    );
    const frame = frameOf(container.querySelector("img") as HTMLImageElement);
    const out = frame.style.aspectRatio ? ratioOf(frame) : null;
    unmount();
    return out;
  };

  it('accepts ".5:1", "1920:1080", "4:5"', () => {
    expect(ratio(".5:1")).toBeCloseTo(0.5, 5);
    expect(ratio("1920:1080")).toBeCloseTo(16 / 9, 5);
    expect(ratio("4:5")).toBeCloseTo(0.8, 5);
  });

  it("rejects surrounding whitespace in a part and extra colons (falls back to square)", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const bad of [" 4 : 5", "4 :5", "4: 5", "1:2:3", ":5", "0:1", "1e999:1"]) {
      expect(ratio(bad)).toBeNull();
    }
  });
});
