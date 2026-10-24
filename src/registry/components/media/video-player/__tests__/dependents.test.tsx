/**
 * I9 + the surfaces dependents rely on: `controls={false}` (story-viewer), the imperative handle
 * (no element getter), flat parts inside `renderControls` and their clear error outside.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "../video-player";
import {
  VideoPlayerCaptionsButton,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBar,
  VideoPlayerStatus,
  VideoPlayerTime,
  defaultVideoPlayerLabels,
  DEFAULT_VIDEO_PLAYER_LABELS,
} from "../index";
import type { VideoPlayerHandle } from "../types";
import { fireMedia } from "../../../../../../tests/helpers";
import { getVideo, loadMetadata, setupPlayerEnv, startPlaying, timeUpdate, type PlayerEnv } from "./support";

let env: PlayerEnv;
beforeEach(() => {
  env = setupPlayerEnv();
});
afterEach(() => env.restore());

describe("I9: controls={false}", () => {
  it("I9: renders no buttons, spinner or overlay — even on waiting and error", () => {
    render(<VideoPlayer src="/a.mp4" controls={false} />);
    const video = getVideo();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    act(() => fireMedia(video, "waiting"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    act(() => fireMedia(video, "error"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("I9: ArrowRight / ArrowLeft on the <video> are NOT defaultPrevented (a host's own handling stays intact)", () => {
    render(<VideoPlayer src="/a.mp4" controls={false} />);
    const video = getVideo();
    loadMetadata(video, 100);
    timeUpdate(env, video, 50);
    expect(fireEvent.keyDown(video, { key: "ArrowRight" })).toBe(true);
    expect(fireEvent.keyDown(video, { key: "ArrowLeft" })).toBe(true);
    expect(video.currentTime).toBe(50);
  });

  it("I9: Space still toggles play and M still toggles mute", () => {
    render(<VideoPlayer src="/a.mp4" controls={false} />);
    const video = getVideo();
    expect(fireEvent.keyDown(video, { key: " " })).toBe(false);
    expect(video.paused).toBe(false);
    fireEvent.keyDown(video, { key: " " });
    expect(video.paused).toBe(true);
    fireEvent.keyDown(video, { key: "m" });
    expect(video.muted).toBe(false);
  });

  it("I9: with controls the same arrow key IS handled (contrast)", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    expect(fireEvent.keyDown(video, { key: "ArrowRight" })).toBe(false);
  });

  it("I9: story-viewer style props — loop off, autoPlay, controlled mute, isActive, onEnded", () => {
    const onEnded = vi.fn();
    const { rerender } = render(
      <VideoPlayer src="/a.mp4" controls={false} loop={false} autoPlay muted={false} isActive onEnded={onEnded} />,
    );
    const video = getVideo();
    expect(video).not.toHaveAttribute("loop");
    expect(video).toHaveAttribute("autoplay");
    expect(video.muted).toBe(false);
    startPlaying(video);
    rerender(
      <VideoPlayer src="/a.mp4" controls={false} loop={false} autoPlay muted isActive={false} onEnded={onEnded} />,
    );
    expect(video.paused).toBe(true);
    expect(video.muted).toBe(true);
    act(() => fireMedia(video, "ended"));
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it("I9: renderControls is ignored when controls={false}", () => {
    render(<VideoPlayer src="/a.mp4" controls={false} renderControls={() => <button type="button">custom</button>} />);
    expect(screen.queryByRole("button", { name: "custom" })).not.toBeInTheDocument();
  });
});

describe("handle", () => {
  it("exposes play / pause / seek / toggleMute / toggleFullscreen and NO element getter", () => {
    const ref = createRef<VideoPlayerHandle>();
    render(<VideoPlayer src="/a.mp4" ref={ref} />);
    expect(Object.keys(ref.current!).sort()).toEqual(["pause", "play", "seek", "toggleFullscreen", "toggleMute"]);
    for (const key of ["video", "element", "videoElement", "getVideo", "ref"]) {
      expect(ref.current).not.toHaveProperty(key);
    }
  });

  it("play() starts, pause() stops, seek() moves (clamped), toggleMute() flips", async () => {
    const ref = createRef<VideoPlayerHandle>();
    render(<VideoPlayer src="/a.mp4" ref={ref} />);
    const video = getVideo();
    loadMetadata(video, 100);
    await act(async () => {
      await ref.current!.play();
    });
    expect(video.paused).toBe(false);
    act(() => ref.current!.pause());
    expect(video.paused).toBe(true);
    act(() => ref.current!.seek(40));
    expect(video.currentTime).toBe(40);
    act(() => ref.current!.seek(500));
    expect(video.currentTime).toBe(100);
    act(() => ref.current!.seek(-5));
    expect(video.currentTime).toBe(0);
    act(() => ref.current!.toggleMute());
    expect(video.muted).toBe(false);
  });

  it("play() swallows a browser refusal", async () => {
    env.restore();
    env = setupPlayerEnv({ playError: new Error("NotAllowedError") });
    const ref = createRef<VideoPlayerHandle>();
    render(<VideoPlayer src="/a.mp4" ref={ref} />);
    await expect(ref.current!.play()).resolves.toBeUndefined();
  });

  it("toggleFullscreen() asks the container", () => {
    const request = vi.fn(() => Promise.resolve());
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "requestFullscreen");
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { configurable: true, writable: true, value: request });
    try {
      const ref = createRef<VideoPlayerHandle>();
      render(<VideoPlayer src="/a.mp4" ref={ref} />);
      act(() => ref.current!.toggleFullscreen());
      expect(request).toHaveBeenCalledTimes(1);
    } finally {
      if (original) Object.defineProperty(HTMLElement.prototype, "requestFullscreen", original);
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>).requestFullscreen;
    }
  });
});

describe("flat parts", () => {
  it.each([
    ["VideoPlayerSeekBar", VideoPlayerSeekBar],
    ["VideoPlayerPlayButton", VideoPlayerPlayButton],
    ["VideoPlayerMuteButton", VideoPlayerMuteButton],
    ["VideoPlayerTime", VideoPlayerTime],
    ["VideoPlayerCaptionsButton", VideoPlayerCaptionsButton],
    ["VideoPlayerStatus", VideoPlayerStatus],
  ])("%s outside a player throws a clear error", (_name, Part) => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Part />)).toThrow(/must render inside <VideoPlayer>/);
    } finally {
      spy.mockRestore();
    }
  });

  it("inside renderControls a lone SeekBar renders a slider and nothing else", () => {
    render(<VideoPlayer src="/a.mp4" renderControls={() => <VideoPlayerSeekBar />} />);
    expect(screen.getByRole("slider", { name: "Seek" })).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("a composed overlay (SeekBar + MuteButton) is driven by the same state", () => {
    render(
      <VideoPlayer
        src="/a.mp4"
        renderControls={() => (
          <>
            <VideoPlayerSeekBar />
            <VideoPlayerMuteButton />
            <VideoPlayerTime />
          </>
        )}
      />,
    );
    const video = getVideo();
    loadMetadata(video, 120);
    timeUpdate(env, video, 30);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "30");
    expect(screen.getByText("0:30 / 2:00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));
    expect(video.muted).toBe(false);
  });

  it("renderControls receives the state with the dispatchers", () => {
    const seen: Array<{ togglePlay: unknown; seek: unknown; dir: string; isPlaying: boolean }> = [];
    render(
      <VideoPlayer
        src="/a.mp4"
        dir="rtl"
        renderControls={(state) => {
          seen.push(state);
          return null;
        }}
      />,
    );
    const last = seen[seen.length - 1]!;
    expect(typeof last.togglePlay).toBe("function");
    expect(typeof last.seek).toBe("function");
    expect(last.dir).toBe("rtl");
    expect(last.isPlaying).toBe(false);
  });
});

describe("labels", () => {
  it("DEFAULT_VIDEO_PLAYER_LABELS stays as an alias of defaultVideoPlayerLabels", () => {
    expect(DEFAULT_VIDEO_PLAYER_LABELS).toBe(defaultVideoPlayerLabels);
  });

  it("an undefined label value never erases a default", () => {
    render(<VideoPlayer src="/a.mp4" labels={{ play: undefined, mute: undefined, unmute: "Sesi aç" }} />);
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sesi aç" })).toBeInTheDocument();
  });
});
