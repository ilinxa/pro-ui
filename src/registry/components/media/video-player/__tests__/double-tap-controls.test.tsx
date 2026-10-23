/**
 * B3 — a click on an interactive control must never count toward a double tap.
 *
 * Before 0.2.1 the wrapper's `onClick={handleDoubleTap}` caught every click that
 * bubbled up from the default controls, so two quick taps on the mute button
 * fired `onDoubleTap` (an accidental "like"). The guard lives in the shared
 * `useDoubleTap`, so these tests cover both the hook and the player.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useDoubleTap } from "../hooks/use-double-tap";
import { VideoPlayer } from "../video-player";

beforeEach(() => {
  // jsdom does not implement media playback.
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  HTMLMediaElement.prototype.load = vi.fn();
  window.matchMedia =
    window.matchMedia ??
    ((q: string) =>
      ({
        matches: false,
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList);
});

describe("VideoPlayer onDoubleTap", () => {
  it("never fires for two quick clicks on a control button", () => {
    const onDoubleTap = vi.fn();
    const { container } = render(
      <VideoPlayer src="/a.mp4" onDoubleTap={onDoubleTap} />,
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      fireEvent.click(b);
      fireEvent.click(b);
    }
    expect(onDoubleTap).not.toHaveBeenCalled();
  });

  it("still fires for two quick clicks on the video area", () => {
    const onDoubleTap = vi.fn();
    const { container } = render(
      <VideoPlayer src="/a.mp4" onDoubleTap={onDoubleTap} />,
    );
    const video = container.querySelector("video")!;
    fireEvent.click(video);
    fireEvent.click(video);
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
  });

  it("a control click between two video taps does not arm or break the window", () => {
    const onDoubleTap = vi.fn();
    const { container } = render(
      <VideoPlayer src="/a.mp4" onDoubleTap={onDoubleTap} />,
    );
    const video = container.querySelector("video")!;
    const button = container.querySelector("button")!;
    fireEvent.click(button);
    fireEvent.click(video); // arms
    fireEvent.click(button); // ignored
    fireEvent.click(video); // second video tap -> fires
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
  });
});

describe("useDoubleTap (shared by media-carousel)", () => {
  function Harness({ onDoubleTap }: { onDoubleTap: () => void }) {
    const handler = useDoubleTap(onDoubleTap);
    return (
      <div data-testid="area" onClick={handler}>
        <button type="button">btn</button>
        <a href="#x">link</a>
        <div role="button" tabIndex={0}>
          rb
        </div>
        <div role="slider" aria-valuenow={1} tabIndex={0}>
          sl
        </div>
        <span data-testid="plain">plain</span>
      </div>
    );
  }

  it("ignores button / a / role=button / role=slider targets", () => {
    const fn = vi.fn();
    render(<Harness onDoubleTap={fn} />);
    for (const el of [
      screen.getByText("btn"),
      screen.getByText("link"),
      screen.getByText("rb"),
      screen.getByText("sl"),
    ]) {
      fireEvent.click(el);
      fireEvent.click(el);
    }
    expect(fn).not.toHaveBeenCalled();
  });

  it("fires for two clicks on a non-interactive child", () => {
    const fn = vi.fn();
    render(<Harness onDoubleTap={fn} />);
    fireEvent.click(screen.getByTestId("plain"));
    fireEvent.click(screen.getByTestId("plain"));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
