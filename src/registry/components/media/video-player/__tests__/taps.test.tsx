/**
 * VP7 / R3 — double tap: with `onDoubleTap` a single tap waits out the 300 ms window; without
 * it a tap toggles at once; `useDoubleTap` is unchanged unless `onSingleTap` is given.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "../video-player";
import { useDoubleTap } from "../hooks/use-double-tap";
import { getVideo, installClock, setupPlayerEnv, startPlaying, type PlayerEnv } from "./support";

let env: PlayerEnv;
let clock: ReturnType<typeof installClock>;
beforeEach(() => {
  env = setupPlayerEnv();
  clock = installClock();
});
afterEach(() => {
  clock.restore();
  env.restore();
});

describe("VP7: VideoPlayer taps", () => {
  it("R3: two clicks within 300 ms call onDoubleTap once and leave the play state unchanged", () => {
    const onDoubleTap = vi.fn();
    render(<VideoPlayer src="/a.mp4" onDoubleTap={onDoubleTap} />);
    const video = getVideo();
    const play = vi.spyOn(video, "play");
    fireEvent.click(video);
    clock.advance(100);
    fireEvent.click(video);
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
    clock.advance(1000);
    expect(video.paused).toBe(true);
    expect(play).not.toHaveBeenCalled();
  });

  it("VP7: the same on a playing video — it keeps playing", () => {
    const onDoubleTap = vi.fn();
    render(<VideoPlayer src="/a.mp4" onDoubleTap={onDoubleTap} />);
    const video = getVideo();
    startPlaying(video);
    fireEvent.click(video);
    fireEvent.click(video);
    clock.advance(1000);
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
    expect(video.paused).toBe(false);
  });

  it("VP7: one click toggles playback only after 300 ms", () => {
    render(<VideoPlayer src="/a.mp4" onDoubleTap={() => {}} />);
    const video = getVideo();
    fireEvent.click(video);
    clock.advance(299);
    expect(video.paused).toBe(true);
    clock.advance(1);
    expect(video.paused).toBe(false);
  });

  it("VP7: after a double tap nothing is toggled later", () => {
    const onDoubleTap = vi.fn();
    render(<VideoPlayer src="/a.mp4" onDoubleTap={onDoubleTap} />);
    const video = getVideo();
    fireEvent.click(video);
    fireEvent.click(video);
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
    clock.advance(1000);
    expect(video.paused).toBe(true);
  });

  it("VP7: without onDoubleTap one click toggles immediately", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    fireEvent.click(video);
    expect(video.paused).toBe(false);
    fireEvent.click(video);
    expect(video.paused).toBe(true);
  });

  it("VP7: a click on a control never counts as a tap (mute twice does not double-tap)", () => {
    const onDoubleTap = vi.fn();
    render(<VideoPlayer src="/a.mp4" onDoubleTap={onDoubleTap} />);
    const video = getVideo();
    const mute = screen.getByRole("button", { name: "Unmute" });
    fireEvent.click(mute);
    fireEvent.click(mute);
    clock.advance(1000);
    expect(onDoubleTap).not.toHaveBeenCalled();
    expect(video.paused).toBe(true);
  });

  it("VP7: unmounting with a deferred tap pending does not toggle afterwards", () => {
    const { unmount } = render(<VideoPlayer src="/a.mp4" onDoubleTap={() => {}} />);
    const video = getVideo();
    const play = vi.spyOn(video, "play");
    fireEvent.click(video);
    unmount();
    clock.advance(1000);
    expect(play).not.toHaveBeenCalled();
  });
});

describe("VP7: useDoubleTap", () => {
  function Harness({
    onDoubleTap,
    onSingleTap,
  }: {
    onDoubleTap: () => void;
    onSingleTap?: () => void;
  }) {
    const tap = useDoubleTap(onDoubleTap, onSingleTap ? { onSingleTap } : undefined);
    return (
      <div data-testid="area" onClick={tap}>
        area
      </div>
    );
  }

  it("without onSingleTap the timing is unchanged — a single tap arms no timer and is silent", () => {
    const onDoubleTap = vi.fn();
    render(<Harness onDoubleTap={onDoubleTap} />);
    fireEvent.click(screen.getByTestId("area"));
    expect(vi.getTimerCount()).toBe(0);
    clock.advance(1000);
    expect(onDoubleTap).not.toHaveBeenCalled();
  });

  it("without onSingleTap two clicks still fire onDoubleTap once", () => {
    const onDoubleTap = vi.fn();
    render(<Harness onDoubleTap={onDoubleTap} />);
    fireEvent.click(screen.getByTestId("area"));
    clock.advance(100);
    fireEvent.click(screen.getByTestId("area"));
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
  });

  it("with onSingleTap a lone tap fires it once, after the window", () => {
    const onSingleTap = vi.fn();
    render(<Harness onDoubleTap={() => {}} onSingleTap={onSingleTap} />);
    fireEvent.click(screen.getByTestId("area"));
    expect(vi.getTimerCount()).toBe(1);
    clock.advance(299);
    expect(onSingleTap).not.toHaveBeenCalled();
    clock.advance(1);
    expect(onSingleTap).toHaveBeenCalledTimes(1);
  });

  it("with onSingleTap a double tap cancels the pending single tap", () => {
    const onSingleTap = vi.fn();
    const onDoubleTap = vi.fn();
    render(<Harness onDoubleTap={onDoubleTap} onSingleTap={onSingleTap} />);
    fireEvent.click(screen.getByTestId("area"));
    clock.advance(120);
    fireEvent.click(screen.getByTestId("area"));
    clock.advance(1000);
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
    expect(onSingleTap).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  // Regression (found by this suite, fixed in 0.3.0): `lastTapRef` started at 0 and `performance.now()`
  // counts from navigation start, so a first tap in the page's first 300 ms read as a double tap.
  it("a lone first tap when performance.now() < 300 does not fire onDoubleTap", () => {
    vi.mocked(performance.now).mockReturnValue(100);
    const onDoubleTap = vi.fn();
    render(<Harness onDoubleTap={onDoubleTap} />);
    fireEvent.click(screen.getByTestId("area"));
    expect(onDoubleTap).not.toHaveBeenCalled();
  });
});
