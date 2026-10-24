/**
 * R5 + I7 — `onMediaError`: once per item + URL, a resolved string replaces the URL and
 * retries once, a second failure / void / reject / throw never asks again.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import type { MediaItem } from "../types";
import { fireMedia, installMediaElementStubs, mockMatchMedia } from "../../../../../../tests/helpers";
import { images, setupEmbla } from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

let restore: () => void;
beforeEach(() => {
  restore = setupEmbla(3);
});
afterEach(() => restore());

const NEW_URL = "https://example.test/refreshed.jpg";
const imgOf = (c: HTMLElement) => c.querySelector("img") as HTMLImageElement;
const flush = () => act(async () => {});

const srcSetItems = (): MediaItem[] =>
  images(1, { srcSet: "https://example.test/a.jpg 1x, https://example.test/a2.jpg 2x", sizes: "100vw" });

describe("R5: image errors", () => {
  it("calls onMediaError(item) once and swaps in the resolved URL (srcSet dropped)", async () => {
    const onMediaError = vi.fn(async () => NEW_URL);
    const items = srcSetItems();
    const { container } = render(<MediaCarousel items={items} variant="linear" onMediaError={onMediaError} />);
    expect(imgOf(container)).toHaveAttribute("srcset");

    fireEvent.error(imgOf(container));
    await flush();

    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(onMediaError).toHaveBeenCalledWith(items[0]);
    expect(imgOf(container)).toHaveAttribute("src", NEW_URL);
    expect(imgOf(container)).not.toHaveAttribute("srcset");
    expect(imgOf(container)).not.toHaveAttribute("sizes");
  });

  it("works in a gallery too (the failing slide only)", async () => {
    const onMediaError = vi.fn(async () => NEW_URL);
    const items = images(3);
    const { container } = render(<MediaCarousel items={items} variant="gallery" onMediaError={onMediaError} />);
    const all = container.querySelectorAll("img");
    fireEvent.error(all[1] as HTMLImageElement);
    await flush();
    expect(onMediaError).toHaveBeenCalledWith(items[1]);
    expect(all[1]).toHaveAttribute("src", NEW_URL);
    expect(all[0]).toHaveAttribute("src", items[0]!.url);
  });

  it("accepts a synchronous string result", () => {
    const onMediaError = vi.fn(() => NEW_URL);
    const { container } = render(<MediaCarousel items={images(1)} variant="linear" onMediaError={onMediaError} />);
    fireEvent.error(imgOf(container));
    expect(imgOf(container)).toHaveAttribute("src", NEW_URL);
  });

  it("the replacement failing too does not call again", async () => {
    const onMediaError = vi.fn(async () => NEW_URL);
    const { container } = render(<MediaCarousel items={images(1)} variant="linear" onMediaError={onMediaError} />);
    fireEvent.error(imgOf(container));
    await flush();
    fireEvent.error(imgOf(container));
    fireEvent.error(imgOf(container));
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(imgOf(container)).toHaveAttribute("src", NEW_URL);
  });

  it("a resolved void keeps the URL and never retries", async () => {
    const onMediaError = vi.fn(async () => undefined);
    const items = images(1);
    const { container } = render(<MediaCarousel items={items} variant="linear" onMediaError={onMediaError} />);
    fireEvent.error(imgOf(container));
    await flush();
    fireEvent.error(imgOf(container));
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(imgOf(container)).toHaveAttribute("src", items[0]!.url);
  });

  it("a rejected promise: no retry, no second call, no unhandled rejection", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      const onMediaError = vi.fn(() => Promise.reject(new Error("refresh failed")));
      const items = images(1);
      const { container } = render(<MediaCarousel items={items} variant="linear" onMediaError={onMediaError} />);
      fireEvent.error(imgOf(container));
      await flush();
      await new Promise((r) => setTimeout(r, 0));
      fireEvent.error(imgOf(container));
      await flush();
      expect(onMediaError).toHaveBeenCalledTimes(1);
      expect(imgOf(container)).toHaveAttribute("src", items[0]!.url);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });

  it("a throwing handler is a failed recovery: no crash, no second call", async () => {
    const onMediaError = vi.fn(() => {
      throw new Error("boom");
    });
    const items = images(1);
    const { container } = render(<MediaCarousel items={items} variant="linear" onMediaError={onMediaError} />);
    expect(() => fireEvent.error(imgOf(container))).not.toThrow();
    fireEvent.error(imgOf(container));
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(imgOf(container)).toHaveAttribute("src", items[0]!.url);
  });

  it("the host changing item.url resets it: a later error calls again", async () => {
    const onMediaError = vi.fn(async () => undefined);
    const first = images(1);
    const { container, rerender } = render(
      <MediaCarousel items={first} variant="linear" onMediaError={onMediaError} />,
    );
    fireEvent.error(imgOf(container));
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);

    const second = [{ ...first[0]!, url: "https://example.test/host-refreshed.jpg" }] as MediaItem[];
    rerender(<MediaCarousel items={second} variant="linear" onMediaError={onMediaError} />);
    expect(imgOf(container)).toHaveAttribute("src", "https://example.test/host-refreshed.jpg");
    fireEvent.error(imgOf(container));
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(2);
    expect(onMediaError).toHaveBeenLastCalledWith(second[0]);
  });

  it("without onMediaError an error is a no-op", () => {
    const items = images(1);
    const { container } = render(<MediaCarousel items={items} variant="linear" />);
    expect(() => fireEvent.error(imgOf(container))).not.toThrow();
    expect(imgOf(container)).toHaveAttribute("src", items[0]!.url);
  });
});

describe("R5: video errors", () => {
  let restoreMedia: () => void;
  let restoreMq: () => void;
  beforeEach(() => {
    restoreMq = mockMatchMedia();
    restoreMedia = installMediaElementStubs();
  });
  afterEach(() => {
    restoreMedia();
    restoreMq();
  });

  const videoItems: MediaItem[] = [
    { id: "v", type: "video", url: "https://example.test/old.mp4", poster: "https://example.test/p.jpg" },
  ];

  it("a <video> error event calls onMediaError once and replaces the src", async () => {
    const onMediaError = vi.fn(async () => "https://example.test/new.mp4");
    const { container } = render(<MediaCarousel items={videoItems} variant="linear" onMediaError={onMediaError} />);
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video).toHaveAttribute("src", "https://example.test/old.mp4");

    act(() => fireMedia(video, "error"));
    await flush();

    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(onMediaError).toHaveBeenCalledWith(videoItems[0]);
    expect(container.querySelector("video")).toHaveAttribute("src", "https://example.test/new.mp4");

    // the replacement failing does not ask again
    act(() => fireMedia(container.querySelector("video") as HTMLVideoElement, "error"));
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
  });

  it("a gallery video slide recovers the same way", async () => {
    const items: MediaItem[] = [...images(2), ...videoItems];
    const onMediaError = vi.fn(async () => "https://example.test/new.mp4");
    const { container } = render(<MediaCarousel items={items} variant="gallery" onMediaError={onMediaError} />);
    act(() => fireMedia(container.querySelector("video") as HTMLVideoElement, "error"));
    await flush();
    expect(onMediaError).toHaveBeenCalledWith(items[2]);
    expect(container.querySelector("video")).toHaveAttribute("src", "https://example.test/new.mp4");
  });
});
