/**
 * VP6 / R1 / R2 / R7 — auto-hide, wake on pointer / focus / key, hidden controls take no
 * pointer input, no `window.matchMedia` is fine.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { VideoPlayer } from "../video-player";
import {
  getVideo,
  installClock,
  loadMetadata,
  rootOf,
  setupPlayerEnv,
  startPlaying,
  type PlayerEnv,
} from "./support";

let env: PlayerEnv;
let clock: ReturnType<typeof installClock> | undefined;
beforeEach(() => {
  env = setupPlayerEnv();
});
afterEach(() => {
  clock?.restore();
  clock = undefined;
  env.restore();
});

/** The auto-hiding bottom group is the mute button's parent once playback has started. */
const bottomGroup = () => screen.getByRole("button", { name: /mute/i }).parentElement as HTMLElement;
const isHidden = (el: HTMLElement) => el.className.includes("opacity-0") && !el.className.includes("pointer-events-auto");
const isShown = (el: HTMLElement) => el.className.includes("opacity-100") && el.className.includes("pointer-events-auto");

function playingWithClock(props: Partial<React.ComponentProps<typeof VideoPlayer>> = {}) {
  clock = installClock();
  const utils = render(<VideoPlayer src="/a.mp4" {...props} />);
  const video = getVideo();
  startPlaying(video);
  loadMetadata(video, 100);
  return { ...utils, video };
}

describe("VP6: auto-hide and wake", () => {
  it("VP6: while playing, after the auto-hide timeout the bottom group is hidden and not clickable", () => {
    playingWithClock();
    expect(isShown(bottomGroup())).toBe(true);
    clock!.advance(1999);
    expect(isShown(bottomGroup())).toBe(true);
    clock!.advance(1);
    expect(isHidden(bottomGroup())).toBe(true);
  });

  it("R1: a pointermove on the root shows the controls again", () => {
    const { video } = playingWithClock();
    clock!.advance(2000);
    expect(isHidden(bottomGroup())).toBe(true);
    fireEvent.pointerMove(rootOf(video));
    expect(isShown(bottomGroup())).toBe(true);
    // and the timer is re-armed
    clock!.advance(2000);
    expect(isHidden(bottomGroup())).toBe(true);
  });

  it("VP6: pointerdown (touch) and a key press also wake", () => {
    const { video } = playingWithClock();
    clock!.advance(2000);
    fireEvent.pointerDown(rootOf(video));
    expect(isShown(bottomGroup())).toBe(true);
    clock!.advance(2000);
    expect(isHidden(bottomGroup())).toBe(true);
    fireEvent.keyDown(video, { key: "Shift" });
    expect(isShown(bottomGroup())).toBe(true);
  });

  it("R2: while hidden, a click where the mute button sits reaches the <video> and does not toggle mute", () => {
    const { video } = playingWithClock();
    const mute = screen.getByRole("button", { name: "Unmute" });
    clock!.advance(2000);
    // The group (and so the button) is pointer-events-none: nothing in its chain accepts pointer input.
    for (let el: HTMLElement | null = mute; el && el !== rootOf(video); el = el.parentElement) {
      expect(el.className).not.toContain("pointer-events-auto");
    }
    // What the browser hits instead is the <video>.
    fireEvent.click(video);
    expect(video.muted).toBe(true);
    expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
  });

  it("VP6: focusing a control while hidden wakes the controls", () => {
    playingWithClock();
    clock!.advance(2000);
    expect(isHidden(bottomGroup())).toBe(true);
    const mute = screen.getByRole("button", { name: "Unmute" });
    act(() => {
      mute.focus();
    });
    expect(isShown(bottomGroup())).toBe(true);
  });

  it("VP6: after pause the controls are visible again (and stay)", () => {
    const { video } = playingWithClock();
    clock!.advance(2000);
    expect(isHidden(bottomGroup())).toBe(true);
    act(() => {
      video.pause();
    });
    expect(isShown(bottomGroup())).toBe(true);
    clock!.advance(10_000);
    expect(isShown(bottomGroup())).toBe(true);
  });

  it("VP6: resuming starts with visible controls, not stale hidden ones", () => {
    const { video } = playingWithClock();
    clock!.advance(2000);
    act(() => {
      video.pause();
    });
    act(() => {
      void video.play();
    });
    expect(isShown(bottomGroup())).toBe(true);
  });

  it("VP6: controlsAutoHideMs={0} never hides", () => {
    playingWithClock({ controlsAutoHideMs: 0 });
    clock!.advance(60_000);
    expect(isShown(bottomGroup())).toBe(true);
  });

  it("VP6: a custom controlsAutoHideMs is honoured", () => {
    playingWithClock({ controlsAutoHideMs: 500 });
    clock!.advance(499);
    expect(isShown(bottomGroup())).toBe(true);
    clock!.advance(1);
    expect(isHidden(bottomGroup())).toBe(true);
  });

  it("VP6: reduced motion keeps the controls visible", () => {
    env.restore();
    env = setupPlayerEnv({ reducedMotion: true });
    playingWithClock();
    clock!.advance(10_000);
    expect(isShown(bottomGroup())).toBe(true);
  });

  it("VP6: the hidden group keeps pointer-events-none on the group itself (no stale auto)", () => {
    playingWithClock();
    clock!.advance(2000);
    const group = bottomGroup();
    expect(group.className).toContain("pointer-events-none");
    expect(group.className).not.toContain("[&>*]:pointer-events-auto");
  });
});

describe("R7: no window.matchMedia", () => {
  it("R7: renders without throwing (motion treated as allowed)", () => {
    // jsdom has no matchMedia of its own; the shared stub is removed again so the component sees none.
    // @ts-expect-error simulate an environment without matchMedia
    delete window.matchMedia;
    expect(window.matchMedia).toBeUndefined();
    expect(() => render(<VideoPlayer src="/a.mp4" autoPlayInView />)).not.toThrow();
    startPlaying(getVideo());
    expect(screen.getByRole("button", { name: /mute/i })).toBeInTheDocument();
  });
});
