/**
 * VP4 / R4 — buffering spinner, error overlay, `onMediaError` ask-once refresh, resume at the
 * old time (and play state) after the source changes, Retry.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "../video-player";
import { fireMedia } from "../../../../../../tests/helpers";
import {
  fireBare,
  getVideo,
  loadMetadata,
  setupPlayerEnv,
  startPlaying,
  timeUpdate,
  type PlayerEnv,
} from "./support";

let env: PlayerEnv;
beforeEach(() => {
  env = setupPlayerEnv();
});
afterEach(() => env.restore());

const NEW = "https://example.test/refreshed.mp4";
const flush = () => act(async () => {});

const spinner = () => document.querySelector("[data-video-player-spinner]");

describe("VP4: buffering", () => {
  it("VP4: waiting shows the spinner and announces labels.buffering; playing hides it", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    startPlaying(video);
    // The live region is always mounted (U4 F12) — only its text changes.
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(spinner()).toBeNull();
    act(() => fireMedia(video, "waiting"));
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(spinner()).not.toBeNull();
    act(() => fireMedia(video, "playing"));
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(spinner()).toBeNull();
  });

  it("VP4: stalled shows it too and canplay clears it", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    fireBare(video, "stalled");
    expect(spinner()).not.toBeNull();
    act(() => fireMedia(video, "canplay"));
    expect(spinner()).toBeNull();
  });

  it("VP4: labels.buffering is what the status region announces", () => {
    render(<VideoPlayer src="/a.mp4" labels={{ buffering: "Yükleniyor" }} />);
    act(() => fireMedia(getVideo(), "waiting"));
    expect(screen.getByRole("status")).toHaveTextContent("Yükleniyor");
  });

  it("VP4: the spinner respects reduced motion (animate-spin is motion-safe)", () => {
    render(<VideoPlayer src="/a.mp4" />);
    act(() => fireMedia(getVideo(), "waiting"));
    const icon = spinner()!.querySelector("svg")!;
    expect(icon.getAttribute("class")).toContain("motion-safe:animate-spin");
    expect(icon.getAttribute("class")).not.toMatch(/(^|\s)animate-spin/);
  });
});

describe("VP4: onMediaError — refresh once, resume", () => {
  function setup(onMediaError: (src: string) => Promise<string | void> | string | void) {
    const utils = render(<VideoPlayer src="/old.mp4" onMediaError={onMediaError} />);
    const video = getVideo();
    startPlaying(video);
    loadMetadata(video, 100);
    timeUpdate(env, video, 30);
    return { ...utils, video };
  }

  it("VP4: error asks the hook once with the failed src; the <video> src becomes the new URL", async () => {
    const hook = vi.fn(async () => NEW);
    const { video } = setup(hook);
    act(() => fireMedia(video, "error"));
    await flush();
    expect(hook).toHaveBeenCalledTimes(1);
    expect(hook).toHaveBeenCalledWith("/old.mp4");
    expect(getVideo()).toHaveAttribute("src", NEW);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("VP4: while the refresh is pending the player shows buffering, not the error overlay", async () => {
    let resolve!: (url: string) => void;
    const hook = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const { video } = setup(hook);
    act(() => fireMedia(video, "error"));
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await act(async () => resolve(NEW));
    expect(getVideo()).toHaveAttribute("src", NEW);
  });

  it("VP4: after loadedmetadata currentTime equals the value before the error and it resumes playing", async () => {
    const { video } = setup(async () => NEW);
    act(() => fireMedia(video, "error"));
    await flush();
    // a real browser reloads the element on the new src: time 0, paused
    video.currentTime = 0;
    video.pause();
    const play = vi.spyOn(video, "play");
    act(() => fireMedia(video, "loadedmetadata", { duration: 100 }));
    expect(video.currentTime).toBe(30);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("VP4: a player that was paused at the error does not start playing after the refresh", async () => {
    render(<VideoPlayer src="/old.mp4" onMediaError={async () => NEW} />);
    const video = getVideo();
    loadMetadata(video, 100);
    timeUpdate(env, video, 30);
    act(() => fireMedia(video, "error"));
    await flush();
    const play = vi.spyOn(video, "play");
    video.currentTime = 0;
    act(() => fireMedia(video, "loadedmetadata", { duration: 100 }));
    expect(video.currentTime).toBe(30);
    expect(play).not.toHaveBeenCalled();
    // U4 F4 regression: no `playing` / `canplay` will come — the loading state must not stick
    // (it also hid the centre Play button).
    expect(spinner()).toBeNull();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("F4: Retry on a paused player drops the overlay without a stuck spinner", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    loadMetadata(video, 100);
    act(() => fireMedia(video, "error"));
    const play = vi.spyOn(video, "play");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(spinner()).toBeNull();
    expect(play).not.toHaveBeenCalled();
  });

  it("VP4: a second error shows the overlay (role alert + Retry) and the hook is NOT called again", async () => {
    const hook = vi.fn(async () => NEW);
    const { video } = setup(hook);
    act(() => fireMedia(video, "error"));
    await flush();
    act(() => fireMedia(getVideo(), "error"));
    await flush();
    expect(hook).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent("This video can't be played.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("VP4: without onMediaError the overlay shows at once", () => {
    render(<VideoPlayer src="/a.mp4" />);
    act(() => fireMedia(getVideo(), "error"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("VP4: onError keeps firing for every element error", async () => {
    const onError = vi.fn();
    render(<VideoPlayer src="/a.mp4" onError={onError} onMediaError={async () => NEW} />);
    act(() => fireMedia(getVideo(), "error"));
    await flush();
    act(() => fireMedia(getVideo(), "error"));
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it("VP4: a rejected hook shows the overlay and does not retry", async () => {
    const hook = vi.fn(() => Promise.reject(new Error("refresh failed")));
    const { video } = setup(hook);
    act(() => fireMedia(video, "error"));
    await flush();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(getVideo()).toHaveAttribute("src", "/old.mp4");
    act(() => fireMedia(getVideo(), "error"));
    expect(hook).toHaveBeenCalledTimes(1);
  });

  it("VP4: a void answer (sync and async) shows the overlay", async () => {
    const sync = setup(vi.fn(() => undefined));
    act(() => fireMedia(sync.video, "error"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    sync.unmount();

    const async_ = setup(vi.fn(async () => undefined));
    act(() => fireMedia(async_.video, "error"));
    await flush();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("VP4: a throwing hook shows the overlay and never asks again", () => {
    const hook = vi.fn(() => {
      throw new Error("boom");
    });
    const { video } = setup(hook);
    expect(() => act(() => fireMedia(video, "error"))).not.toThrow();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => fireMedia(getVideo(), "error"));
    expect(hook).toHaveBeenCalledTimes(1);
  });

  it("VP4: the same URL returned is not a refresh — overlay", async () => {
    const { video } = setup(async () => "/old.mp4");
    act(() => fireMedia(video, "error"));
    await flush();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("VP4: a new host src resets the budget — the hook may be asked again for it", async () => {
    const hook = vi.fn(async () => undefined);
    const { rerender, video } = setup(hook);
    act(() => fireMedia(video, "error"));
    await flush();
    expect(hook).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(<VideoPlayer src="/next.mp4" onMediaError={hook} />);
    expect(getVideo()).toHaveAttribute("src", "/next.mp4");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    act(() => fireMedia(getVideo(), "error"));
    await flush();
    expect(hook).toHaveBeenCalledTimes(2);
    expect(hook).toHaveBeenLastCalledWith("/next.mp4");
  });

  // U4 F6 regression: a resume recorded for A must not carry into a different video B.
  it("F6: a different host src after an error starts at 0, idle — no resume, no autoplay", () => {
    const { rerender, video } = setup(vi.fn());
    act(() => fireMedia(video, "error")); // hook returns void -> overlay, resume target recorded
    const play = vi.spyOn(video, "play");
    rerender(<VideoPlayer src="/other-video.mp4" />);
    video.currentTime = 0;
    act(() => fireMedia(video, "loadedmetadata", { duration: 100 }));
    expect(video.currentTime).toBe(0);
    expect(play).not.toHaveBeenCalled();
  });

  it("R4: the host writing the refreshed URL into src while the refresh is pending still resumes (media-carousel's echo)", async () => {
    let answer!: (url: string) => void;
    const hook = vi.fn(() => new Promise<string>((r) => (answer = r)));
    const { rerender, video } = setup(hook);
    act(() => fireMedia(video, "error"));
    // The host's own state lands first: it echoes the new URL into `src` before the player's answer.
    rerender(<VideoPlayer src={NEW} onMediaError={hook} />);
    await act(async () => answer(NEW));
    expect(getVideo()).toHaveAttribute("src", NEW);
    video.currentTime = 0;
    act(() => fireMedia(video, "loadedmetadata", { duration: 100 }));
    expect(video.currentTime).toBe(30);
  });
});

describe("VP4: Retry", () => {
  it("VP4: Retry calls load(), hides the overlay and resumes where it stopped", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    startPlaying(video);
    loadMetadata(video, 100);
    timeUpdate(env, video, 42);
    act(() => fireMedia(video, "error"));
    const load = vi.spyOn(video, "load");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(load).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // It was playing: Retry also calls play() (which loads even under preload="none" — U4 F4).
    expect(video.paused).toBe(false);
    video.currentTime = 0; // load() resets the element
    act(() => fireMedia(video, "loadedmetadata", { duration: 100 }));
    expect(video.currentTime).toBe(42);
  });

  it("VP4: labels.error and labels.retry override the overlay copy", () => {
    render(<VideoPlayer src="/a.mp4" labels={{ error: "Oynatılamadı", retry: "Tekrar dene" }} />);
    act(() => fireMedia(getVideo(), "error"));
    expect(screen.getByRole("alert")).toHaveTextContent("Oynatılamadı");
    expect(screen.getByRole("button", { name: "Tekrar dene" })).toBeInTheDocument();
  });
});
