/**
 * VP5 — autoplay in view (opt-in): plays muted when visible, pauses when it leaves, one player
 * per `autoplayGroup`, never under reduced motion or while `isActive` is false.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "../video-player";
import { installControllableIO, setupPlayerEnv, startPlaying, type PlayerEnv } from "./support";

let env: PlayerEnv;
let io: ReturnType<typeof installControllableIO> | undefined;
afterEach(() => {
  io?.restore();
  io = undefined;
  env.restore();
});

const videos = () => Array.from(document.querySelectorAll("video")) as HTMLVideoElement[];

/** Environment with a controllable IntersectionObserver. */
function controllable(opts: Parameters<typeof setupPlayerEnv>[0] = {}) {
  env = setupPlayerEnv({ ...opts, visible: null });
  io = installControllableIO();
  return io;
}

describe("VP5: autoplay in view", () => {
  it("VP5: entering view plays the video, muted", () => {
    const ctl = controllable();
    render(<VideoPlayer src="/a.mp4" autoPlayInView muted={false} />);
    const [video] = videos();
    expect(video!.paused).toBe(true);
    expect(video!.muted).toBe(false);
    ctl.report(1);
    expect(video!.paused).toBe(false);
    expect(video!.muted).toBe(true);
  });

  it("VP5: leaving view pauses; coming back plays again", () => {
    const ctl = controllable();
    render(<VideoPlayer src="/a.mp4" autoPlayInView />);
    const [video] = videos();
    ctl.report(1);
    expect(video!.paused).toBe(false);
    ctl.report(0);
    expect(video!.paused).toBe(true);
    ctl.report(0.9);
    expect(video!.paused).toBe(false);
  });

  it("VP5: below autoPlayThreshold is not 'in view' (default 0.5; custom 0.8)", () => {
    const ctl = controllable();
    render(<VideoPlayer src="/a.mp4" autoPlayInView autoPlayThreshold={0.8} />);
    const [video] = videos();
    ctl.report(0.6);
    expect(video!.paused).toBe(true);
    ctl.report(0.85);
    expect(video!.paused).toBe(false);
  });

  it("VP5: a controlled muted={false} (onMutedChange) is not forced to muted", () => {
    const ctl = controllable();
    render(<VideoPlayer src="/a.mp4" autoPlayInView muted={false} onMutedChange={() => {}} />);
    const [video] = videos();
    ctl.report(1);
    expect(video!.paused).toBe(false);
    expect(video!.muted).toBe(false);
  });

  it("VP5: a rejected play() (autoplay policy) is ignored", async () => {
    env = setupPlayerEnv({ visible: null, playError: new Error("NotAllowedError") });
    io = installControllableIO();
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      render(<VideoPlayer src="/a.mp4" autoPlayInView />);
      io.report(1);
      await act(async () => {});
      await new Promise((r) => setTimeout(r, 0));
      expect(videos()[0]!.paused).toBe(true);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });

  it("VP5: with the observer reporting visible at once (kit mock) it plays on mount", () => {
    env = setupPlayerEnv({ visible: true });
    render(<VideoPlayer src="/a.mp4" autoPlayInView />);
    expect(videos()[0]!.paused).toBe(false);
  });

  it("VP5: off by default — a visible player does not play", () => {
    env = setupPlayerEnv({ visible: true });
    render(<VideoPlayer src="/a.mp4" />);
    expect(videos()[0]!.paused).toBe(true);
  });

  it("VP5: no IntersectionObserver in the environment — renders, never plays on its own", () => {
    env = setupPlayerEnv({ visible: null });
    const original = globalThis.IntersectionObserver;
    // @ts-expect-error simulate an environment without IntersectionObserver
    delete globalThis.IntersectionObserver;
    try {
      render(<VideoPlayer src="/a.mp4" autoPlayInView />);
      expect(videos()[0]!.paused).toBe(true);
    } finally {
      if (original) globalThis.IntersectionObserver = original;
    }
  });
});

describe("VP5: autoplayGroup", () => {
  it("VP5: a second player starting pauses the first in the same group", () => {
    env = setupPlayerEnv();
    render(
      <>
        <VideoPlayer src="/a.mp4" autoplayGroup="feed" />
        <VideoPlayer src="/b.mp4" autoplayGroup="feed" />
      </>,
    );
    const [first, second] = videos();
    startPlaying(first!);
    expect(first!.paused).toBe(false);
    startPlaying(second!);
    expect(second!.paused).toBe(false);
    expect(first!.paused).toBe(true);
  });

  it("VP5: players in other groups (or none) are left alone", () => {
    env = setupPlayerEnv();
    render(
      <>
        <VideoPlayer src="/a.mp4" autoplayGroup="one" />
        <VideoPlayer src="/b.mp4" autoplayGroup="two" />
        <VideoPlayer src="/c.mp4" />
      </>,
    );
    const [a, b, c] = videos();
    startPlaying(a!);
    startPlaying(b!);
    startPlaying(c!);
    expect([a!.paused, b!.paused, c!.paused]).toEqual([false, false, false]);
  });

  it("VP5: an unmounted player leaves the group (no pause call into a dead element)", () => {
    env = setupPlayerEnv();
    const { rerender } = render(
      <>
        <VideoPlayer src="/a.mp4" autoplayGroup="g" />
        <VideoPlayer src="/b.mp4" autoplayGroup="g" />
      </>,
    );
    const [, second] = videos();
    rerender(<VideoPlayer src="/b.mp4" autoplayGroup="g" />);
    expect(() => startPlaying(videos()[0]!)).not.toThrow();
    expect(second).toBeDefined();
  });

  it("VP5: autoplay-in-view players in one group — the one that enters view last wins", () => {
    const ctl = controllable();
    render(
      <>
        <VideoPlayer src="/a.mp4" autoPlayInView autoplayGroup="feed" />
        <VideoPlayer src="/b.mp4" autoPlayInView autoplayGroup="feed" />
      </>,
    );
    const [a, b] = videos();
    ctl.report(1, 0);
    expect(a!.paused).toBe(false);
    ctl.report(1, 1);
    expect(b!.paused).toBe(false);
    expect(a!.paused).toBe(true);
  });
});

describe("VP5: never plays when it must not", () => {
  it("VP5: reduced motion — never plays", () => {
    env = setupPlayerEnv({ reducedMotion: true, visible: true });
    render(<VideoPlayer src="/a.mp4" autoPlayInView />);
    expect(videos()[0]!.paused).toBe(true);
  });

  it("VP5: isActive={false} — never plays", () => {
    const ctl = controllable();
    render(<VideoPlayer src="/a.mp4" autoPlayInView isActive={false} />);
    ctl.report(1);
    expect(videos()[0]!.paused).toBe(true);
  });

  it("VP5: isActive flipping false pauses a playing video; flipping true starts it again in view", () => {
    const ctl = controllable();
    const { rerender } = render(<VideoPlayer src="/a.mp4" autoPlayInView />);
    ctl.report(1);
    expect(videos()[0]!.paused).toBe(false);
    rerender(<VideoPlayer src="/a.mp4" autoPlayInView isActive={false} />);
    expect(videos()[0]!.paused).toBe(true);
    rerender(<VideoPlayer src="/a.mp4" autoPlayInView isActive />);
    expect(videos()[0]!.paused).toBe(false);
  });
});
