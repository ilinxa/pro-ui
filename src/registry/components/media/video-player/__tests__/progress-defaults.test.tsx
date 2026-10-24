/**
 * VP8 — `onProgress` (media time + buffered), the `loop` rule when `onEnded` is passed, the
 * unchanged `preload` default, and the lifecycle callbacks.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "../video-player";
import { fireMedia } from "../../../../../../tests/helpers";
import {
  fireBare,
  getVideo,
  loadMetadata,
  setupPlayerEnv,
  startPlaying,
  stubBuffered,
  timeUpdate,
  type PlayerEnv,
} from "./support";

let env: PlayerEnv;
beforeEach(() => {
  env = setupPlayerEnv();
});
afterEach(() => env.restore());

describe("VP8: onProgress", () => {
  it("VP8: reports the stubbed currentTime / duration and a buffered array", () => {
    const onProgress = vi.fn();
    render(<VideoPlayer src="/a.mp4" onProgress={onProgress} />);
    const video = getVideo();
    loadMetadata(video, 100);
    stubBuffered(video, [
      [0, 40],
      [60, 75],
    ]);
    timeUpdate(env, video, 12);
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith({
      currentTime: 12,
      duration: 100,
      buffered: [
        { start: 0, end: 40 },
        { start: 60, end: 75 },
      ],
    });
  });

  it("VP8: also fires on the progress event (buffering ahead without playback)", () => {
    const onProgress = vi.fn();
    render(<VideoPlayer src="/a.mp4" onProgress={onProgress} />);
    const video = getVideo();
    loadMetadata(video, 100);
    stubBuffered(video, [[0, 20]]);
    fireBare(video, "progress");
    expect(onProgress).toHaveBeenCalledWith({
      currentTime: 0,
      duration: 100,
      buffered: [{ start: 0, end: 20 }],
    });
  });

  it("VP8: is rAF-throttled — many timeupdates in one frame report once", () => {
    const onProgress = vi.fn();
    const onTimeUpdate = vi.fn();
    render(<VideoPlayer src="/a.mp4" onProgress={onProgress} onTimeUpdate={onTimeUpdate} />);
    const video = getVideo();
    loadMetadata(video, 100);
    act(() => {
      fireMedia(video, "timeupdate", { currentTime: 1 });
      fireMedia(video, "timeupdate", { currentTime: 2 });
      fireMedia(video, "timeupdate", { currentTime: 3 });
    });
    env.flush();
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress.mock.calls[0]![0].currentTime).toBe(3);
    expect(onTimeUpdate).toHaveBeenCalledWith(3, 100);
  });

  it("VP8: no buffered support (jsdom default) reports an empty array, not a throw", () => {
    const onProgress = vi.fn();
    render(<VideoPlayer src="/a.mp4" onProgress={onProgress} />);
    const video = getVideo();
    expect(() => timeUpdate(env, video, 5, 50)).not.toThrow();
    expect(onProgress.mock.calls[0]![0].buffered).toEqual([]);
  });
});

describe("VP8: loop and onEnded", () => {
  it("VP8: onEnded without loop — the <video> has no loop attribute and ended calls onEnded", () => {
    const onEnded = vi.fn();
    render(<VideoPlayer src="/a.mp4" onEnded={onEnded} />);
    const video = getVideo();
    expect(video).not.toHaveAttribute("loop");
    startPlaying(video);
    act(() => fireMedia(video, "ended"));
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it("VP8: no onEnded — loop attribute present (today's default)", () => {
    render(<VideoPlayer src="/a.mp4" />);
    expect(getVideo()).toHaveAttribute("loop");
  });

  it("VP8: explicit loop wins with onEnded", () => {
    render(<VideoPlayer src="/a.mp4" loop onEnded={() => {}} />);
    expect(getVideo()).toHaveAttribute("loop");
  });

  it("VP8: explicit loop={false} wins without onEnded", () => {
    render(<VideoPlayer src="/a.mp4" loop={false} />);
    expect(getVideo()).not.toHaveAttribute("loop");
  });

  it("VP8: ended resets the play state and the position", () => {
    render(<VideoPlayer src="/a.mp4" onEnded={() => {}} />);
    const video = getVideo();
    startPlaying(video);
    loadMetadata(video, 100);
    timeUpdate(env, video, 99);
    act(() => fireMedia(video, "ended"));
    expect(video.paused).toBe(true);
  });
});

describe("VP8: preload default", () => {
  it('VP8: preload defaults to "metadata", even with a poster', () => {
    render(<VideoPlayer src="/a.mp4" poster="/p.jpg" />);
    expect(getVideo()).toHaveAttribute("preload", "metadata");
    expect(getVideo()).toHaveAttribute("poster", "/p.jpg");
  });

  it('VP8: preload="none" is honoured when passed', () => {
    render(<VideoPlayer src="/a.mp4" poster="/p.jpg" preload="none" />);
    expect(getVideo()).toHaveAttribute("preload", "none");
  });

  it("VP8: other defaults are unchanged (muted, playsInline, no autoplay)", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute("playsinline");
    expect(video).not.toHaveAttribute("autoplay");
  });
});

describe("lifecycle callbacks", () => {
  it("onPlay / onPause / onLoadedMetadata fire from the element's events", () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();
    const onLoadedMetadata = vi.fn();
    render(<VideoPlayer src="/a.mp4" onPlay={onPlay} onPause={onPause} onLoadedMetadata={onLoadedMetadata} />);
    const video = getVideo();
    loadMetadata(video, 77);
    startPlaying(video);
    act(() => video.pause());
    expect(onLoadedMetadata).toHaveBeenCalledWith(77);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledTimes(1);
  });
});
