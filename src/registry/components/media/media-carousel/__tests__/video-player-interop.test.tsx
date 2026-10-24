/**
 * media-carousel 0.3.1 x video-player 0.3.0 (U1-1, R-06, R-03):
 *  - a single video post: double tap -> onDoubleTap once, play state unchanged;
 *  - ArrowRight from the video's seek bar / a focused slide button never moves the carousel,
 *    ArrowRight on the region itself still does;
 *  - a refreshed video URL asks once, swaps the src and resumes at the old time.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import type { MediaItem } from "../types";
import { fireMedia } from "../../../../../../tests/helpers";
import {
  installClock,
  loadMetadata,
  setupPlayerEnv,
  startPlaying,
  timeUpdate,
  type PlayerEnv,
} from "../../video-player/__tests__/support";
import { embla, setupEmbla, slidesOf, videos } from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

let restoreEmbla: () => void;
let env: PlayerEnv;
let clock: ReturnType<typeof installClock> | undefined;
beforeEach(() => {
  restoreEmbla = setupEmbla(3);
  env = setupPlayerEnv();
});
afterEach(() => {
  clock?.restore();
  clock = undefined;
  env.restore();
  restoreEmbla();
});

const videoIn = (root: ParentNode) => root.querySelector("video") as HTMLVideoElement;
const region = () => screen.getByRole("region", { name: "Media carousel" });
const flush = () => act(async () => {});

describe("U1-1: a single video post and the double tap", () => {
  it("U1-1: two clicks within 300 ms call onDoubleTap once (item, 0) and the play state is unchanged", () => {
    clock = installClock();
    const onDoubleTap = vi.fn();
    const items = videos(1);
    const { container } = render(<MediaCarousel items={items} variant="linear" onDoubleTap={onDoubleTap} />);
    const video = videoIn(container);
    const play = vi.spyOn(video, "play");
    fireEvent.click(video);
    clock.advance(100);
    fireEvent.click(video);
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
    expect(onDoubleTap).toHaveBeenCalledWith(items[0], 0);
    clock.advance(1000);
    expect(video.paused).toBe(true);
    expect(play).not.toHaveBeenCalled();
  });

  it("U1-1: a playing single video keeps playing through a double tap", () => {
    clock = installClock();
    const onDoubleTap = vi.fn();
    const { container } = render(<MediaCarousel items={videos(1)} variant="linear" onDoubleTap={onDoubleTap} />);
    const video = videoIn(container);
    startPlaying(video);
    fireEvent.click(video);
    fireEvent.click(video);
    clock.advance(1000);
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
    expect(video.paused).toBe(false);
  });

  it("U1-1: a lone click toggles playback only after the window", () => {
    clock = installClock();
    const { container } = render(<MediaCarousel items={videos(1)} variant="linear" onDoubleTap={() => {}} />);
    const video = videoIn(container);
    fireEvent.click(video);
    clock.advance(299);
    expect(video.paused).toBe(true);
    clock.advance(1);
    expect(video.paused).toBe(false);
  });

  it("U1-1: without onDoubleTap a click toggles at once", () => {
    const { container } = render(<MediaCarousel items={videos(1)} variant="linear" />);
    const video = videoIn(container);
    fireEvent.click(video);
    expect(video.paused).toBe(false);
  });

  it("U1-1: a single image post still double-taps on the wrapper", () => {
    clock = installClock();
    const onDoubleTap = vi.fn();
    const items: MediaItem[] = [{ id: "i", type: "image", url: "https://example.test/a.jpg", alt: "A" }];
    render(<MediaCarousel items={items} variant="linear" onDoubleTap={onDoubleTap} />);
    const img = screen.getByRole("img");
    fireEvent.click(img);
    fireEvent.click(img);
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
    expect(onDoubleTap).toHaveBeenCalledWith(items[0], 0);
  });
});

describe("R-06: arrow keys from the video's controls", () => {
  function gallery() {
    const utils = render(<MediaCarousel items={videos(3)} variant="gallery" />);
    const video = videoIn(slidesOf(utils.container)[0]!);
    startPlaying(video);
    loadMetadata(video, 100);
    timeUpdate(env, video, 30);
    return { ...utils, video };
  }

  it("R-06: ArrowRight from the seek bar seeks and does NOT move the carousel", () => {
    const { video } = gallery();
    const slider = screen.getByRole("slider", { name: "Seek" });
    const notPrevented = fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(notPrevented).toBe(false);
    expect(video.currentTime).toBe(35);
    expect(embla.api!.scrollNext).not.toHaveBeenCalled();
    expect(embla.api!.scrollPrev).not.toHaveBeenCalled();
  });

  it("R-06: ArrowLeft from the seek bar likewise", () => {
    const { video } = gallery();
    fireEvent.keyDown(screen.getByRole("slider", { name: "Seek" }), { key: "ArrowLeft" });
    expect(video.currentTime).toBe(25);
    expect(embla.api!.scrollPrev).not.toHaveBeenCalled();
    expect(embla.api!.scrollNext).not.toHaveBeenCalled();
  });

  it("R-06: ArrowRight on the focused <video> seeks and does not move the carousel", () => {
    const { video } = gallery();
    fireEvent.keyDown(video, { key: "ArrowRight" });
    expect(video.currentTime).toBe(35);
    expect(embla.api!.scrollNext).not.toHaveBeenCalled();
  });

  it("R-06: ArrowRight from a focused button inside a slide does not move the carousel", () => {
    const { container } = gallery();
    const button = slidesOf(container)[0]!.querySelector("button") as HTMLButtonElement;
    expect(button).not.toBeNull();
    fireEvent.keyDown(button, { key: "ArrowRight" });
    expect(embla.api!.scrollNext).not.toHaveBeenCalled();
  });

  it("R-06: ArrowRight on the region itself still moves the carousel", () => {
    gallery();
    fireEvent.keyDown(region(), { key: "ArrowRight" });
    expect(embla.api!.scrollNext).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(region(), { key: "ArrowLeft" });
    expect(embla.api!.scrollPrev).toHaveBeenCalledTimes(1);
  });

  it("R-06: Home / End from the seek bar jump the video, not the carousel", () => {
    const { video } = gallery();
    const slider = screen.getByRole("slider", { name: "Seek" });
    fireEvent.keyDown(slider, { key: "End" });
    expect(video.currentTime).toBe(100);
    fireEvent.keyDown(slider, { key: "Home" });
    expect(video.currentTime).toBe(0);
    expect(embla.api!.scrollTo).not.toHaveBeenCalled();
  });

  it("R-06: a single video post's seek bar is likewise self-contained", () => {
    const { container } = render(<MediaCarousel items={videos(1)} variant="linear" />);
    const video = videoIn(container);
    startPlaying(video);
    loadMetadata(video, 100);
    timeUpdate(env, video, 30);
    fireEvent.keyDown(screen.getByRole("slider", { name: "Seek" }), { key: "ArrowRight" });
    expect(video.currentTime).toBe(35);
  });
});

describe("R-03: a refreshed video URL", () => {
  const NEW = "https://example.test/refreshed.mp4";
  const item = (): MediaItem[] => [
    { id: "v", type: "video", url: "https://example.test/old.mp4", poster: "https://example.test/p.jpg" },
  ];

  it("R-03: asks once, the <video> gets the new src, and after loadedmetadata currentTime equals the time before the error", async () => {
    const onMediaError = vi.fn(async () => NEW);
    const items = item();
    const { container } = render(<MediaCarousel items={items} variant="linear" onMediaError={onMediaError} />);
    const video = videoIn(container);
    startPlaying(video);
    loadMetadata(video, 100);
    timeUpdate(env, video, 30);

    act(() => fireMedia(video, "error"));
    await flush();

    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(onMediaError).toHaveBeenCalledWith(items[0]);
    expect(videoIn(container)).toBe(video);
    expect(video).toHaveAttribute("src", NEW);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // the browser reloads the element for the new source
    video.currentTime = 0;
    const play = vi.spyOn(video, "play");
    act(() => fireMedia(video, "loadedmetadata", { duration: 100 }));
    expect(video.currentTime).toBe(30);
    expect(play).toHaveBeenCalledTimes(1); // it was playing, so it resumes
  });

  it("R-03: while the refresh is pending the player shows buffering, not its error overlay", async () => {
    let resolve!: (url: string) => void;
    const onMediaError = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const { container } = render(<MediaCarousel items={item()} variant="linear" onMediaError={onMediaError} />);
    const video = videoIn(container);
    startPlaying(video);
    act(() => fireMedia(video, "error"));
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await act(async () => resolve(NEW));
    expect(video).toHaveAttribute("src", NEW);
  });

  it("R-03: the replacement failing too shows the overlay and does not ask again", async () => {
    const onMediaError = vi.fn(async () => NEW);
    const { container } = render(<MediaCarousel items={item()} variant="linear" onMediaError={onMediaError} />);
    const video = videoIn(container);
    act(() => fireMedia(video, "error"));
    await flush();
    act(() => fireMedia(videoIn(container), "error"));
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("R-03: a void answer shows the overlay with Retry", async () => {
    const onMediaError = vi.fn(async () => undefined);
    const { container } = render(<MediaCarousel items={item()} variant="linear" onMediaError={onMediaError} />);
    act(() => fireMedia(videoIn(container), "error"));
    await flush();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("R-03: without onMediaError the overlay shows at once and nothing is asked", () => {
    const { container } = render(<MediaCarousel items={item()} variant="linear" />);
    act(() => fireMedia(videoIn(container), "error"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("R-03: a gallery video slide resumes the same way", async () => {
    const onMediaError = vi.fn(async () => NEW);
    const { container } = render(
      <MediaCarousel items={[...item(), ...videos(2)]} variant="gallery" onMediaError={onMediaError} />,
    );
    const video = videoIn(slidesOf(container)[0]!);
    startPlaying(video);
    loadMetadata(video, 100);
    timeUpdate(env, video, 45);
    act(() => fireMedia(video, "error"));
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(video).toHaveAttribute("src", NEW);
    video.currentTime = 0;
    act(() => fireMedia(video, "loadedmetadata", { duration: 100 }));
    expect(video.currentTime).toBe(45);
  });
});
