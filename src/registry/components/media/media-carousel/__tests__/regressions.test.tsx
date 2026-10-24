/**
 * U4 regressions F1-F7: Embla re-init keeps the slide (F1), StrictMode mount silence (F6),
 * tall-element in-view rule (F2), already-complete / failed-before-hydration images (F3, F4),
 * explicit direction vs `rtl:` descendants (F5), single-item `dir` (F7).
 */
import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import type { MediaItem, RenderItemContext } from "../types";
import { installMediaElementStubs, mockMatchMedia } from "../../../../../../tests/helpers";
import {
  embla,
  frameOf,
  images,
  installControllableIO,
  ratioOf,
  setupEmbla,
  slidesOf,
  stubImages,
  videos,
} from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

let restore: () => void;
beforeEach(() => {
  restore = setupEmbla(5);
});
afterEach(() => restore());

const items = images(5);
const dot = (n: number) => screen.getByRole("button", { name: `Go to slide ${n}` });
const shown = () => [1, 2, 3, 4, 5].filter((n) => dot(n).getAttribute("aria-current") === "true");
const region = () => screen.getByRole("region", { name: "Media carousel" });
const flush = () => act(async () => {});
const rect = (height: number) => ({ height }) as DOMRectReadOnly;

describe("F1: an Embla re-init keeps the slide", () => {
  it("uncontrolled on slide 3 -> loop changes -> still slide 3, active slide intact, no callbacks", () => {
    const onSlideChange = vi.fn();
    const onIndexChange = vi.fn();
    const seen: RenderItemContext[] = [];
    const renderItem = (_i: MediaItem, ctx: RenderItemContext) => {
      seen.push(ctx);
      return null;
    };
    const props = { items, variant: "gallery" as const, onSlideChange, onIndexChange, renderItem };
    const { rerender, container } = render(<MediaCarousel {...props} loop />);
    embla.api!.swipe(3);
    expect(shown()).toEqual([4]);
    onSlideChange.mockClear();
    onIndexChange.mockClear();
    seen.length = 0;

    rerender(<MediaCarousel {...props} loop={false} />);
    // the re-init really happened (the fake reset the snap to startIndex 0, then the hook jumped back)
    expect(embla.options[embla.options.length - 1]!.loop).toBe(false);
    expect(embla.api!.scrollTo).toHaveBeenCalledWith(3, true);
    expect(embla.api!.snap).toBe(3);
    expect(shown()).toEqual([4]);
    expect(slidesOf(container)[3]).not.toHaveAttribute("aria-hidden");
    expect(seen.filter((c) => c.index === 3).every((c) => c.isActive)).toBe(true);
    expect(seen.filter((c) => c.index === 0).every((c) => !c.isActive)).toBe(true);
    expect(onSlideChange).not.toHaveBeenCalled();
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("variant and dir changes re-init too and keep the slide", () => {
    const onSlideChange = vi.fn();
    const { rerender } = render(<MediaCarousel items={items} variant="gallery" onSlideChange={onSlideChange} />);
    embla.api!.swipe(2);
    onSlideChange.mockClear();
    rerender(<MediaCarousel items={items} variant="linear" onSlideChange={onSlideChange} />);
    expect(shown()).toEqual([3]);
    rerender(<MediaCarousel items={items} variant="linear" dir="rtl" onSlideChange={onSlideChange} />);
    expect(shown()).toEqual([3]);
    expect(onSlideChange).not.toHaveBeenCalled();
  });

  it("controlled index=3 -> options change -> still 3, no onIndexChange", () => {
    const onIndexChange = vi.fn();
    const onSlideChange = vi.fn();
    const props = { items, variant: "gallery" as const, onIndexChange, onSlideChange };
    const { rerender } = render(<MediaCarousel {...props} index={0} loop />);
    rerender(<MediaCarousel {...props} index={3} loop />);
    expect(shown()).toEqual([4]);
    onIndexChange.mockClear();
    onSlideChange.mockClear();

    // `startIndex` is read once (0), so the re-init resets Embla to 0 - the prop must win again
    rerender(<MediaCarousel {...props} index={3} loop={false} />);
    expect(embla.api!.snap).toBe(3);
    expect(shown()).toEqual([4]);
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("defaultIndex=2, user moves to 4, options change -> stays on 4", () => {
    const onSlideChange = vi.fn();
    const props = { items, variant: "gallery" as const, defaultIndex: 2, onSlideChange };
    const { rerender } = render(<MediaCarousel {...props} loop />);
    expect(shown()).toEqual([3]);
    embla.api!.swipe(4);
    onSlideChange.mockClear();
    rerender(<MediaCarousel {...props} loop={false} />);
    expect(embla.api!.snap).toBe(4);
    expect(shown()).toEqual([5]);
    expect(onSlideChange).not.toHaveBeenCalled();
  });
});

describe("F6: StrictMode mount is silent", () => {
  it("no onSlideChange / onIndexChange on mount; a real move notifies once", () => {
    const onSlideChange = vi.fn();
    const onIndexChange = vi.fn();
    render(
      <StrictMode>
        <MediaCarousel
          items={items}
          variant="gallery"
          defaultIndex={1}
          onSlideChange={onSlideChange}
          onIndexChange={onIndexChange}
        />
      </StrictMode>,
    );
    expect(onSlideChange).not.toHaveBeenCalled();
    expect(onIndexChange).not.toHaveBeenCalled();
    embla.api!.swipe(3);
    expect(onSlideChange).toHaveBeenCalledTimes(1);
    expect(onSlideChange).toHaveBeenCalledWith(3);
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(3);
  });
});

describe("F2: tall carousels count as in view", () => {
  let restoreMedia: () => void;
  let restoreMq: () => void;
  let io: ReturnType<typeof installControllableIO>;
  beforeEach(() => {
    restoreMq = mockMatchMedia();
    restoreMedia = installMediaElementStubs();
    io = installControllableIO();
  });
  afterEach(() => {
    io.restore();
    restoreMedia();
    restoreMq();
  });
  const playing = async () => {
    const { container } = render(<MediaCarousel items={videos(3)} variant="gallery" />);
    const video = slidesOf(container)[0]!.querySelector("video") as HTMLVideoElement;
    await act(async () => {
      await video.play();
    });
    return video;
  };

  it("ratio 0.3 but the visible part covers >= half of the viewport: keeps playing", async () => {
    const video = await playing();
    io.reportRaw({ isIntersecting: true, intersectionRatio: 0.3, intersectionRect: rect(600), rootBounds: rect(1000) });
    expect(video.paused).toBe(false);
  });

  it("ratio 0.3 with a small visible part: pauses", async () => {
    const video = await playing();
    io.reportRaw({ isIntersecting: true, intersectionRatio: 0.3, intersectionRect: rect(100), rootBounds: rect(1000) });
    expect(video.paused).toBe(true);
  });

  it("not intersecting never counts, even with a large rect", async () => {
    const video = await playing();
    io.reportRaw({ isIntersecting: false, intersectionRatio: 0, intersectionRect: rect(900), rootBounds: rect(1000) });
    expect(video.paused).toBe(true);
  });

  it("an entry without intersectionRect / rootBounds still works (ratio only)", async () => {
    const video = await playing();
    io.report(0.3);
    expect(video.paused).toBe(true);
  });

  it("ctx.inView follows the tall-element rule", () => {
    const seen: RenderItemContext[] = [];
    render(
      <MediaCarousel
        items={items}
        variant="gallery"
        renderItem={(_i, ctx) => {
          seen.push(ctx);
          return null;
        }}
      />,
    );
    io.reportRaw({ isIntersecting: true, intersectionRatio: 0.3, intersectionRect: rect(600), rootBounds: rect(1000) });
    expect(seen[seen.length - 1]!.inView).toBe(true);
    io.reportRaw({ isIntersecting: true, intersectionRatio: 0.3, intersectionRect: rect(100), rootBounds: rect(1000) });
    expect(seen[seen.length - 1]!.inView).toBe(false);
  });

  it("observes with fine threshold steps (21)", () => {
    render(<MediaCarousel items={items} variant="gallery" />);
    const t = io.instances[io.instances.length - 1]!.options!.threshold as number[];
    expect(t).toHaveLength(21);
    expect(t[0]).toBe(0);
    expect(t[20]).toBe(1);
  });
});

describe("F3 / F4: images that finished before the handlers saw them", () => {
  let restoreImg: (() => void) | undefined;
  afterEach(() => restoreImg?.());

  it("F3: an already-complete image resolves natural-clamped without a load event", () => {
    restoreImg = stubImages(() => ({ complete: true, width: 600, height: 800 }));
    const { container } = render(<MediaCarousel items={images(1)} variant="linear" aspect="natural-clamped" />);
    expect(ratioOf(frameOf(container.querySelector("img")!))).toBeCloseTo(0.8, 5);
  });

  it("F3: same for a gallery's first slide", () => {
    restoreImg = stubImages(() => ({ complete: true, width: 1600, height: 900 }));
    const { container } = render(<MediaCarousel items={images(3)} variant="gallery" aspect="natural-clamped" />);
    expect(ratioOf(frameOf(container.querySelector("img")!))).toBeCloseTo(16 / 9, 5);
  });

  it("F3: an incomplete image waits for its load event", () => {
    restoreImg = stubImages(() => ({ complete: false, width: 0, height: 0 }));
    const { container } = render(<MediaCarousel items={images(1)} variant="linear" aspect="natural-clamped" />);
    expect(frameOf(container.querySelector("img")!).className).toContain("aspect-square");
  });

  it("F3: complete + width 0 + decode rejects -> onMediaError once (and not again on the error event)", async () => {
    restoreImg = stubImages(() => ({ complete: true, width: 0, height: 0, decode: "reject" }));
    const onMediaError = vi.fn(async () => undefined);
    const its = images(1);
    const { container } = render(<MediaCarousel items={its} variant="linear" onMediaError={onMediaError} />);
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(onMediaError).toHaveBeenCalledWith(its[0]);
    fireEvent.error(container.querySelector("img")!);
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
  });

  it("F3: complete + width 0 + decode resolves (e.g. an SVG without intrinsic size) -> not an error", async () => {
    restoreImg = stubImages(() => ({ complete: true, width: 0, height: 0, decode: "resolve" }));
    const onMediaError = vi.fn(async () => undefined);
    render(<MediaCarousel items={images(1)} variant="linear" onMediaError={onMediaError} />);
    await flush();
    expect(onMediaError).not.toHaveBeenCalled();
  });

  it("F3: no decode() support -> no error either", async () => {
    restoreImg = stubImages(() => ({ complete: true, width: 0, height: 0 }));
    const onMediaError = vi.fn(async () => undefined);
    render(<MediaCarousel items={images(1)} variant="linear" onMediaError={onMediaError} />);
    await flush();
    expect(onMediaError).not.toHaveBeenCalled();
  });

  const bySrc = (img: HTMLImageElement) =>
    img.getAttribute("src")!.includes("photo-0")
      ? { complete: true, width: 300, height: 400 }
      : { complete: true, width: 1600, height: 900 };

  it("F4: [A, B] -> [B]: the frame follows B's ratio (gallery)", () => {
    restoreImg = stubImages(bySrc);
    const [a, b] = images(2);
    const { container, rerender } = render(
      <MediaCarousel items={[a!, b!]} variant="gallery" aspect="natural-clamped" />,
    );
    expect(ratioOf(frameOf(container.querySelector("img")!))).toBeCloseTo(0.8, 5);
    rerender(<MediaCarousel items={[b!]} variant="gallery" aspect="natural-clamped" />);
    expect(ratioOf(frameOf(container.querySelector("img")!))).toBeCloseTo(16 / 9, 5);
  });

  it("F4: A -> B as a single item: the frame follows B's ratio", () => {
    restoreImg = stubImages(bySrc);
    const [a, b] = images(2);
    const { container, rerender } = render(<MediaCarousel items={[a!]} variant="linear" aspect="natural-clamped" />);
    expect(ratioOf(frameOf(container.querySelector("img")!))).toBeCloseTo(0.8, 5);
    rerender(<MediaCarousel items={[b!]} variant="linear" aspect="natural-clamped" />);
    expect(ratioOf(frameOf(container.querySelector("img")!))).toBeCloseTo(16 / 9, 5);
  });
});

describe("F5: an explicit dir wins over an rtl ancestor (attributes: jsdom cannot evaluate Tailwind)", () => {
  it('dir="ltr" inside an rtl ancestor: data-dir="ltr", group class, override classes on chevrons and fades', () => {
    const { container } = render(
      <div dir="rtl">
        <MediaCarousel items={items} variant="gallery" dir="ltr" />
      </div>,
    );
    expect(region()).toHaveAttribute("data-dir", "ltr");
    expect(region().className).toContain("group/media-carousel");
    for (const name of ["Previous slide", "Next slide"]) {
      const cls = screen.getByRole("button", { name }).className;
      expect(cls).toContain("rtl:rotate-180");
      expect(cls).toContain("group-data-[dir=ltr]/media-carousel:rotate-0");
    }
    const fades = Array.from(container.querySelectorAll('[aria-hidden="true"].pointer-events-none'));
    expect(fades.some((f) => f.className.includes("group-data-[dir=ltr]/media-carousel:bg-linear-to-r"))).toBe(true);
    expect(fades.some((f) => f.className.includes("group-data-[dir=ltr]/media-carousel:bg-linear-to-l"))).toBe(true);
  });

  it("no prop: no data-dir", () => {
    render(<MediaCarousel items={items} variant="gallery" />);
    expect(region()).not.toHaveAttribute("data-dir");
  });

  it('dir="rtl": data-dir="rtl"', () => {
    render(<MediaCarousel items={items} variant="gallery" dir="rtl" />);
    expect(region()).toHaveAttribute("data-dir", "rtl");
  });
});

describe("F7: the single item writes an explicit direction", () => {
  const group = () => screen.getByRole("group", { name: "Media carousel" });

  it("dir prop", () => {
    render(<MediaCarousel items={images(1)} variant="linear" dir="rtl" />);
    expect(group()).toHaveAttribute("dir", "rtl");
  });

  it("deprecated rtl prop (true and false)", () => {
    const { unmount } = render(<MediaCarousel items={images(1)} variant="linear" rtl />);
    expect(group()).toHaveAttribute("dir", "rtl");
    unmount();
    render(<MediaCarousel items={images(1)} variant="linear" rtl={false} />);
    expect(group()).toHaveAttribute("dir", "ltr");
  });

  it("no prop: no dir attribute", () => {
    render(
      <div dir="rtl">
        <MediaCarousel items={images(1)} variant="linear" />
      </div>,
    );
    expect(group()).not.toHaveAttribute("dir");
  });
});
