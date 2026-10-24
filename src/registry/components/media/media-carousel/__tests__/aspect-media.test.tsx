/**
 * I1, I2, R1 — frame ratio (fixed classes, `natural-clamped`) and built-in <img> attributes.
 */
import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import type { MediaItem } from "../types";
import { mockMatchMedia } from "../../../../../../tests/helpers";
import { frameOf, images, ratioOf, setupEmbla } from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

let restore: () => void;
beforeEach(() => {
  restore = setupEmbla(3);
});
afterEach(() => restore());

const sized = (width: number, height: number, n = 3): MediaItem[] =>
  images(n).map((it) => ({ ...it, width, height }) as MediaItem);

const firstFrame = (c: HTMLElement) => frameOf(c.querySelector("img") as HTMLImageElement);

/** Give an <img> a loaded natural size, then fire `load`. */
function loadImage(img: HTMLImageElement, naturalWidth: number, naturalHeight: number) {
  Object.defineProperty(img, "naturalWidth", { configurable: true, value: naturalWidth });
  Object.defineProperty(img, "naturalHeight", { configurable: true, value: naturalHeight });
  fireEvent.load(img);
}

describe("I2: natural-clamped from item width/height", () => {
  for (const variant of ["gallery", "linear"] as const) {
    it(`${variant}: 3:4 portrait is clamped up to 4:5 (0.8)`, () => {
      const { container } = render(
        <MediaCarousel items={sized(300, 400)} variant={variant} aspect="natural-clamped" />,
      );
      expect(ratioOf(firstFrame(container))).toBeCloseTo(0.8, 5);
    });

    it(`${variant}: 16:9 stays 16:9`, () => {
      const { container } = render(
        <MediaCarousel items={sized(1600, 900)} variant={variant} aspect="natural-clamped" />,
      );
      expect(ratioOf(firstFrame(container))).toBeCloseTo(16 / 9, 5);
    });

    it(`${variant}: 3:1 panorama is clamped down to 1.91`, () => {
      const { container } = render(
        <MediaCarousel items={sized(900, 300)} variant={variant} aspect="natural-clamped" />,
      );
      expect(ratioOf(firstFrame(container))).toBeCloseTo(1.91, 5);
    });
  }

  it("a single item follows the same rule (3:4 -> 0.8, 3:1 -> 1.91, 16:9 stays)", () => {
    for (const [w, h, expected] of [
      [300, 400, 0.8],
      [900, 300, 1.91],
      [1600, 900, 16 / 9],
    ] as const) {
      const { container, unmount } = render(
        <MediaCarousel items={sized(w, h, 1)} variant="linear" aspect="natural-clamped" />,
      );
      expect(ratioOf(firstFrame(container))).toBeCloseTo(expected, 5);
      unmount();
    }
  });

  it("every gallery slide uses the first item's clamped ratio", () => {
    const items = images(3).map((it, i) => ({ ...it, width: i === 0 ? 300 : 900, height: i === 0 ? 400 : 300 }) as MediaItem);
    const { container } = render(<MediaCarousel items={items} variant="gallery" aspect="natural-clamped" />);
    const ratios = Array.from(container.querySelectorAll("img")).map((img) => ratioOf(frameOf(img)));
    expect(ratios).toHaveLength(3);
    for (const r of ratios) expect(r).toBeCloseTo(0.8, 5);
  });

  it("minRatio / maxRatio override the clamp bounds", () => {
    const { container } = render(
      <MediaCarousel items={sized(300, 400)} variant="linear" aspect="natural-clamped" minRatio={0.5} maxRatio={2} />,
    );
    expect(ratioOf(firstFrame(container))).toBeCloseTo(0.75, 5);
  });

  it("a video item's declared size feeds the ratio too", () => {
    const items: MediaItem[] = [{ id: "v", type: "video", url: "https://example.test/v.mp4", width: 1600, height: 900 }];
    const restoreMq = mockMatchMedia();
    const { container } = render(<MediaCarousel items={items} variant="linear" aspect="natural-clamped" />);
    restoreMq();
    const frame = container.querySelector("video")!.parentElement!.parentElement!;
    expect(ratioOf(frame)).toBeCloseTo(16 / 9, 5);
  });
});

describe("I2: natural-clamped from the loaded image", () => {
  it("square placeholder until load; then the clamped natural ratio (gallery)", () => {
    const { container } = render(<MediaCarousel items={images(3)} variant="gallery" aspect="natural-clamped" />);
    const img = container.querySelector("img") as HTMLImageElement;
    expect(frameOf(img).className).toContain("aspect-square");
    expect(frameOf(img).style.aspectRatio).toBe("");
    loadImage(img, 600, 800);
    expect(ratioOf(frameOf(img))).toBeCloseTo(0.8, 5);
    expect(frameOf(img).className).not.toContain("aspect-square");
  });

  it("single item: same load rule, 3:1 natural -> 1.91", () => {
    const { container } = render(<MediaCarousel items={images(1)} variant="linear" aspect="natural-clamped" />);
    const img = container.querySelector("img") as HTMLImageElement;
    expect(frameOf(img).className).toContain("aspect-square");
    loadImage(img, 3000, 1000);
    expect(ratioOf(frameOf(img))).toBeCloseTo(1.91, 5);
  });

  it("declared width/height win; a later load does not change the ratio", () => {
    const { container } = render(<MediaCarousel items={sized(1600, 900)} variant="linear" aspect="natural-clamped" />);
    const img = container.querySelector("img") as HTMLImageElement;
    loadImage(img, 300, 400);
    expect(ratioOf(frameOf(img))).toBeCloseTo(16 / 9, 5);
  });

  it("only the first item's load counts", () => {
    const { container } = render(<MediaCarousel items={images(3)} variant="gallery" aspect="natural-clamped" />);
    const imgs = container.querySelectorAll("img");
    loadImage(imgs[1] as HTMLImageElement, 300, 400);
    expect(frameOf(imgs[0] as HTMLImageElement).className).toContain("aspect-square");
  });

  it("a new first item id resets to the square placeholder", () => {
    const { container, rerender } = render(
      <MediaCarousel items={images(3)} variant="gallery" aspect="natural-clamped" />,
    );
    loadImage(container.querySelector("img") as HTMLImageElement, 600, 800);
    expect(ratioOf(firstFrame(container))).toBeCloseTo(0.8, 5);

    const next = images(3).map((it, i) => ({ ...it, id: `other-${i}` }));
    rerender(<MediaCarousel items={next} variant="gallery" aspect="natural-clamped" />);
    expect(firstFrame(container).className).toContain("aspect-square");
    expect(firstFrame(container).style.aspectRatio).toBe("");
  });
});

describe("R1 + I1: fixed aspects", () => {
  it("R1: a single item with variant=linear aspect=video is 16:9 (was square)", () => {
    const { container } = render(<MediaCarousel items={images(1)} variant="linear" aspect="video" />);
    expect(firstFrame(container).className).toContain("aspect-video");
    expect(firstFrame(container).className).not.toContain("aspect-square");
  });

  it("no aspect -> aspect-square in every path (gallery, linear, single)", () => {
    for (const [n, variant] of [
      [3, "gallery"],
      [3, "linear"],
      [1, "linear"],
      [1, "gallery"],
    ] as const) {
      const { container, unmount } = render(<MediaCarousel items={images(n)} variant={variant} />);
      for (const img of Array.from(container.querySelectorAll("img"))) {
        expect(frameOf(img).className).toContain("aspect-square");
      }
      unmount();
    }
  });

  it("video / portrait / auto map to their frame", () => {
    const cases = [
      ["video", "aspect-video"],
      ["portrait", "aspect-[3/4]"],
    ] as const;
    for (const [aspect, cls] of cases) {
      const { container, unmount } = render(<MediaCarousel items={images(3)} variant="gallery" aspect={aspect} />);
      expect(firstFrame(container).className).toContain(cls);
      unmount();
    }
    const { container } = render(<MediaCarousel items={images(3)} variant="gallery" aspect="auto" />);
    expect(firstFrame(container).className).not.toMatch(/aspect-/);
  });
});

describe("built-in <img> attributes (C8)", () => {
  it("gets width/height/srcSet/sizes, decoding=async, loading=lazy", () => {
    const items = images(2, {
      width: 640,
      height: 480,
      srcSet: "https://example.test/a-320.jpg 320w, https://example.test/a-640.jpg 640w",
      sizes: "(min-width: 768px) 640px, 100vw",
    });
    const { container } = render(<MediaCarousel items={items} variant="gallery" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("width", "640");
    expect(img).toHaveAttribute("height", "480");
    expect(img).toHaveAttribute("srcset", expect.stringContaining("a-320.jpg 320w"));
    expect(img).toHaveAttribute("sizes", "(min-width: 768px) 640px, 100vw");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("the single-item path gets the same attributes", () => {
    const items = images(1, { width: 10, height: 20, srcSet: "https://example.test/a.jpg 1x", sizes: "50vw" });
    const { container } = render(<MediaCarousel items={items} variant="linear" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("width", "10");
    expect(img).toHaveAttribute("srcset");
    expect(img).toHaveAttribute("sizes", "50vw");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("without the optional fields none of them is written (except decoding/loading)", () => {
    const { container } = render(<MediaCarousel items={images(2)} variant="gallery" />);
    const img = container.querySelector("img")!;
    expect(img).not.toHaveAttribute("width");
    expect(img).not.toHaveAttribute("height");
    expect(img).not.toHaveAttribute("srcset");
    expect(img).not.toHaveAttribute("sizes");
  });
});
