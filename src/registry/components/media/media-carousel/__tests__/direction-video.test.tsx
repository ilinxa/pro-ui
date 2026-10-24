/**
 * I5 / R2 — direction (prop, deprecated `rtl`, ancestor); I4 / R4 — only the active, in-view
 * slide's video can play; K1 — `renderItem` gets `{ isActive, inView, index }`.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import type { RenderItemContext } from "../types";
import { installMediaElementStubs, mockMatchMedia } from "../../../../../../tests/helpers";
import {
  embla,
  images,
  installControllableIO,
  lastOptions,
  setupEmbla,
  slidesOf,
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
const region = () => screen.getByRole("region", { name: "Media carousel" });

describe("I5 / R2: direction", () => {
  it("ancestor dir=rtl without a prop: Embla rtl after mount, keys mirrored, no dir written on the region", async () => {
    render(
      <div dir="rtl">
        <MediaCarousel items={items} variant="gallery" />
      </div>,
    );
    await waitFor(() => expect(lastOptions().direction).toBe("rtl"));
    expect(region()).not.toHaveAttribute("dir");

    fireEvent.keyDown(region(), { key: "ArrowLeft" });
    expect(embla.api!.scrollNext).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(region(), { key: "ArrowRight" });
    expect(embla.api!.scrollPrev).toHaveBeenCalledTimes(1);
  });

  it("no prop, no rtl ancestor: ltr; ArrowRight goes next", () => {
    render(<MediaCarousel items={items} variant="gallery" />);
    expect(lastOptions().direction).toBe("ltr");
    expect(region()).not.toHaveAttribute("dir");
    fireEvent.keyDown(region(), { key: "ArrowRight" });
    expect(embla.api!.scrollNext).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(region(), { key: "ArrowLeft" });
    expect(embla.api!.scrollPrev).toHaveBeenCalledTimes(1);
  });

  it('dir="rtl" prop writes dir="rtl" on the region and drives Embla + keys', () => {
    render(<MediaCarousel items={items} variant="gallery" dir="rtl" />);
    expect(region()).toHaveAttribute("dir", "rtl");
    expect(lastOptions().direction).toBe("rtl");
    fireEvent.keyDown(region(), { key: "ArrowLeft" });
    expect(embla.api!.scrollNext).toHaveBeenCalledTimes(1);
  });

  it("the deprecated rtl prop still works", () => {
    render(<MediaCarousel items={items} variant="gallery" rtl />);
    expect(lastOptions().direction).toBe("rtl");
    fireEvent.keyDown(region(), { key: "ArrowRight" });
    expect(embla.api!.scrollPrev).toHaveBeenCalledTimes(1);
  });

  it("K5: rtl={false} forces ltr even inside an rtl ancestor", async () => {
    render(
      <div dir="rtl">
        <MediaCarousel items={items} variant="gallery" rtl={false} />
      </div>,
    );
    expect(lastOptions().direction).toBe("ltr");
    await act(async () => {});
    expect(embla.options.some((o) => o.direction === "rtl")).toBe(false);
    fireEvent.keyDown(region(), { key: "ArrowRight" });
    expect(embla.api!.scrollNext).toHaveBeenCalledTimes(1);
  });

  it("dir beats rtl (both ways)", () => {
    const { unmount } = render(<MediaCarousel items={items} variant="gallery" dir="ltr" rtl />);
    expect(lastOptions().direction).toBe("ltr");
    expect(region()).toHaveAttribute("dir", "ltr");
    unmount();
    render(<MediaCarousel items={items} variant="gallery" dir="rtl" rtl={false} />);
    expect(lastOptions().direction).toBe("rtl");
  });

  it("an explicit dir=ltr inside an rtl ancestor stays ltr", () => {
    render(
      <div dir="rtl">
        <MediaCarousel items={items} variant="gallery" dir="ltr" />
      </div>,
    );
    expect(embla.options.some((o) => o.direction === "rtl")).toBe(false);
  });

  it("logical layout: nav buttons sit at start/end and chevrons flip; peek margins are inline-logical", () => {
    const { container } = render(<MediaCarousel items={items} variant="gallery" dir="rtl" loop={false} />);
    const prev = screen.getByRole("button", { name: "Previous slide" });
    const next = screen.getByRole("button", { name: "Next slide" });
    expect(prev.className).toContain("start-2");
    expect(next.className).toContain("end-2");
    expect(prev.className).toContain("rtl:rotate-180");
    const slides = slidesOf(container);
    expect(slides[0]!.style.marginInlineStart).toBe("7.5%");
    expect(slides[0]!.style.marginLeft).toBe("");
    expect(slides[4]!.style.marginInlineEnd).toBe("7.5%");
    expect(slides[4]!.style.marginRight).toBe("");
    // edge fades are logical too
    const fades = container.querySelectorAll('[aria-hidden="true"].pointer-events-none');
    expect(Array.from(fades).some((f) => f.className.includes("start-0") && f.className.includes("rtl:bg-linear-to-l"))).toBe(true);
    expect(Array.from(fades).some((f) => f.className.includes("end-0") && f.className.includes("rtl:bg-linear-to-r"))).toBe(true);
  });
});

describe("I4 / R4: video plays only when active and in view", () => {
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

  const videoAt = (c: HTMLElement, i: number) => slidesOf(c)[i]!.querySelector("video") as HTMLVideoElement;

  it("R4: scrolling the carousel below 50% visible pauses the playing video", async () => {
    const { container } = render(<MediaCarousel items={videos(3)} variant="gallery" />);
    const video = videoAt(container, 0);
    await act(async () => {
      await video.play();
    });
    expect(video.paused).toBe(false);

    io.report(0.2);
    expect(video.paused).toBe(true);
  });

  it("stays playing while at least half is visible; coming back does not auto-resume", async () => {
    const { container } = render(<MediaCarousel items={videos(3)} variant="gallery" />);
    const video = videoAt(container, 0);
    await act(async () => {
      await video.play();
    });
    io.report(0.7);
    expect(video.paused).toBe(false);
    io.report(0.1);
    expect(video.paused).toBe(true);
    io.report(1);
    expect(video.paused).toBe(true); // no autoplay: the viewer starts playback
  });

  it("an off-screen intersection report (isIntersecting false) also pauses", async () => {
    const { container } = render(<MediaCarousel items={videos(3)} variant="gallery" />);
    const video = videoAt(container, 0);
    await act(async () => {
      await video.play();
    });
    io.report(0);
    expect(video.paused).toBe(true);
  });

  it("inactive slides never play: leaving a slide pauses its video; all start paused", async () => {
    const { container } = render(<MediaCarousel items={videos(3)} variant="gallery" />);
    for (let i = 0; i < 3; i++) expect(videoAt(container, i).paused).toBe(true);
    const first = videoAt(container, 0);
    await act(async () => {
      await first.play();
    });
    expect(first.paused).toBe(false);
    embla.api!.swipe(1);
    expect(first.paused).toBe(true);
  });

  it("the single-item video pauses off-screen too", async () => {
    const { container } = render(<MediaCarousel items={videos(1)} variant="linear" />);
    const video = container.querySelector("video") as HTMLVideoElement;
    await act(async () => {
      await video.play();
    });
    io.report(0.2);
    expect(video.paused).toBe(true);
  });

  it("K1: renderItem receives { isActive, inView, index } and inView flips without changing isActive", () => {
    const seen: Array<RenderItemContext> = [];
    render(
      <MediaCarousel
        items={items}
        variant="gallery"
        renderItem={(item, ctx) => {
          seen.push(ctx);
          return <span data-testid={`slide-${ctx.index}`}>{item.id}</span>;
        }}
      />,
    );
    const latest = (i: number) => [...seen].reverse().find((c) => c.index === i)!;
    expect(latest(0)).toEqual({ isActive: true, inView: true, index: 0 });
    expect(latest(1)).toEqual({ isActive: false, inView: true, index: 1 });

    io.report(0.2);
    expect(latest(0)).toEqual({ isActive: true, inView: false, index: 0 });
    expect(latest(1)).toEqual({ isActive: false, inView: false, index: 1 });

    io.report(0.9);
    embla.api!.swipe(1);
    expect(latest(0)).toEqual({ isActive: false, inView: true, index: 0 });
    expect(latest(1)).toEqual({ isActive: true, inView: true, index: 1 });
  });

  it("a half-scrolled post does not dim its active slide or make it inert", () => {
    const { container } = render(<MediaCarousel items={items} variant="gallery" />);
    io.report(0.2);
    const active = slidesOf(container)[0]!;
    expect(active).not.toHaveAttribute("aria-hidden");
    expect(active.firstElementChild).not.toHaveAttribute("inert");
  });
});

describe("without IntersectionObserver", () => {
  let original: typeof IntersectionObserver | undefined;
  beforeEach(() => {
    original = globalThis.IntersectionObserver;
    // @ts-expect-error simulate an environment without IntersectionObserver
    delete globalThis.IntersectionObserver;
  });
  afterEach(() => {
    if (original) globalThis.IntersectionObserver = original;
  });

  it("inView stays true", () => {
    const seen: RenderItemContext[] = [];
    render(
      <MediaCarousel
        items={items}
        variant="gallery"
        renderItem={(_item, ctx) => {
          seen.push(ctx);
          return null;
        }}
      />,
    );
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((c) => c.inView)).toBe(true);
  });
});
