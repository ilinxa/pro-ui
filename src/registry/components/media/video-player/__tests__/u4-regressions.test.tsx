/**
 * U4 adversarial-review regressions (video-player 0.3.0): F5 focus / menu pin, F9 pointer
 * passthrough on the fade group + error panel, F12 always-mounted status region.
 * `:focus-visible` is stubbed on `Element.prototype.matches` (jsdom does not model it).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "../video-player";
import { VideoPlayerSeekBar as VideoPlayerSeekBarProbe } from "../parts/seek-bar";
import { fireMedia } from "../../../../../../tests/helpers";
import {
  getVideo,
  installClock,
  loadMetadata,
  setupPlayerEnv,
  startPlaying,
  stubTextTracks,
  TRACKS,
  type PlayerEnv,
} from "./support";

let env: PlayerEnv;
let clock: ReturnType<typeof installClock> | undefined;
let tracks: ReturnType<typeof stubTextTracks> | undefined;
let restoreMatches: (() => void) | undefined;
beforeEach(() => {
  env = setupPlayerEnv();
});
afterEach(() => {
  restoreMatches?.();
  restoreMatches = undefined;
  tracks?.restore();
  tracks = undefined;
  clock?.restore();
  clock = undefined;
  env.restore();
});

/** Make `el.matches(":focus-visible")` answer `visible` for every element. */
function stubFocusVisible(visible: boolean) {
  const original = Element.prototype.matches;
  Element.prototype.matches = function (this: Element, selector: string) {
    if (selector === ":focus-visible") return visible;
    return original.call(this, selector);
  };
  restoreMatches = () => {
    Element.prototype.matches = original;
  };
}

const bottomGroup = () => screen.getByRole("button", { name: /mute/i }).parentElement as HTMLElement;
const isHidden = (el: HTMLElement) => el.className.includes("opacity-0");
const isShown = (el: HTMLElement) => el.className.includes("opacity-100");

function playing(props: Partial<React.ComponentProps<typeof VideoPlayer>> = {}) {
  clock = installClock();
  const utils = render(<VideoPlayer src="/a.mp4" {...props} />);
  const video = getVideo();
  startPlaying(video);
  loadMetadata(video, 100);
  return { ...utils, video };
}

describe("F5: auto-hide pauses under an open menu / keyboard focus", () => {
  it("F5a: an open captions menu keeps the bottom group visible past the timeout; closing it re-arms the hide", () => {
    stubFocusVisible(false);
    tracks = stubTextTracks(2);
    playing({ tracks: TRACKS });
    fireEvent.click(screen.getByRole("button", { name: "Subtitles and captions" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    clock!.advance(5000);
    expect(isShown(bottomGroup())).toBe(true);
    expect(isHidden(bottomGroup())).toBe(false);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    clock!.advance(2000);
    expect(isHidden(bottomGroup())).toBe(true);
  });

  it("F5b: keyboard (:focus-visible) focus on the mute button pins the controls; blur to outside unpins", () => {
    stubFocusVisible(true);
    playing();
    const mute = screen.getByRole("button", { name: /mute/i });
    act(() => mute.focus());
    clock!.advance(5000);
    expect(isShown(bottomGroup())).toBe(true);
    expect(isHidden(bottomGroup())).toBe(false);
    act(() => mute.blur());
    clock!.advance(2000);
    expect(isHidden(bottomGroup())).toBe(true);
  });

  it("F5c: pointer focus (not :focus-visible) does not pin — the controls still hide", () => {
    stubFocusVisible(false);
    playing();
    act(() => screen.getByRole("button", { name: /mute/i }).focus());
    clock!.advance(2000);
    expect(isHidden(bottomGroup())).toBe(true);
  });
});

describe("F9: only real controls take pointer input in the visible fade group", () => {
  it("F9: group class opts in buttons / sliders / menus, not every child; time chip + spacer have no pointer-events-auto", () => {
    const { video } = playing({ showSeekBar: false });
    act(() => fireMedia(video, "timeupdate", { currentTime: 10, duration: 100 }));
    env.flush();
    const group = bottomGroup();
    expect(isShown(group)).toBe(true);
    expect(group.className).toContain("[&_button]:pointer-events-auto");
    expect(group.className).toContain("[&_[role=slider]]:pointer-events-auto");
    expect(group.className).toContain("[&_[role=menu]]:pointer-events-auto");
    expect(group.className).not.toContain("[&>*]:pointer-events-auto");
    const chip = group.querySelector("span.tabular-nums") as HTMLElement;
    expect(chip).not.toBeNull();
    expect(chip.className).not.toContain("pointer-events-auto");
    const spacer = Array.from(group.children).find((c) => c.tagName === "DIV" && c.className === "flex-1") as HTMLElement;
    expect(spacer).toBeDefined();
    expect(spacer.className).not.toContain("pointer-events-auto");
  });

  it("F9: clicks on the error panel (not Retry) never toggle playback nor fire onDoubleTap", () => {
    clock = installClock();
    const onDoubleTap = vi.fn();
    render(<VideoPlayer src="/a.mp4" onDoubleTap={onDoubleTap} />);
    const video = getVideo();
    act(() => fireMedia(video, "error"));
    const panel = screen.getByRole("alert").parentElement as HTMLElement;
    const play = vi.spyOn(video, "play");
    fireEvent.click(panel);
    clock.advance(500);
    expect(play).not.toHaveBeenCalled();
    expect(video.paused).toBe(true);
    fireEvent.click(panel);
    fireEvent.click(panel);
    clock.advance(500);
    expect(onDoubleTap).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });
});

describe("F12: the status live region is always mounted", () => {
  it("F12: present and empty before buffering; text changes on waiting; the SAME node is reused", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");
    act(() => fireMedia(video, "waiting"));
    expect(screen.getByRole("status")).toBe(status);
    expect(status.textContent).toBe("Loading");
    act(() => fireMedia(video, "playing"));
    expect(screen.getByRole("status")).toBe(status);
    expect(status.textContent).toBe("");
  });
});

// U5 finding (production browser run): a server-rendered <video> loads metadata — or fails — before
// hydration attaches React's handlers, so those events were lost (no duration → disabled seek bar;
// an expired URL never reached onMediaError). The player reads the element once on mount.
describe("U5: events fired before hydration", () => {
  const proto = HTMLMediaElement.prototype;
  const keys = ["readyState", "duration", "error"] as const;
  let saved: Record<string, PropertyDescriptor | undefined> = {};
  function stubElement(fields: { readyState?: number; duration?: number; error?: { code: number } | null }) {
    saved = Object.fromEntries(keys.map((k) => [k, Object.getOwnPropertyDescriptor(proto, k)]));
    for (const k of keys) {
      if (fields[k] === undefined) continue;
      Object.defineProperty(proto, k, { configurable: true, get: () => fields[k] });
    }
  }
  afterEach(() => {
    for (const k of keys) {
      const d = saved[k];
      if (d) Object.defineProperty(proto, k, d);
      else delete (proto as unknown as Record<string, unknown>)[k];
    }
    saved = {};
  });

  it("metadata already loaded at mount → duration known without a loadedmetadata event", () => {
    stubElement({ readyState: 1, duration: 120 });
    const onLoadedMetadata = vi.fn();
    render(
      <VideoPlayer
        src="/ssr.mp4"
        onLoadedMetadata={onLoadedMetadata}
        renderControls={() => <VideoPlayerSeekBarProbe />}
      />,
    );
    expect(onLoadedMetadata).toHaveBeenCalledWith(120);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuemax", "120");
  });

  it("an error already raised at mount → onMediaError is still asked once", async () => {
    stubElement({ error: { code: 4 } });
    const onMediaError = vi.fn(async () => undefined);
    render(<VideoPlayer src="/expired.mp4" onMediaError={onMediaError} />);
    await act(async () => {});
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(onMediaError).toHaveBeenCalledWith("/expired.mp4");
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("U5: browser-run layout fixes", () => {
  it("no controls render over the error overlay (only Retry is a button)", () => {
    render(<VideoPlayer src="/a.mp4" />);
    act(() => fireMedia(getVideo(), "error"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Retry"]);
  });

  it("the bottom row reads --video-player-controls-bottom (default 0.75rem)", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    startPlaying(video);
    loadMetadata(video, 100);
    const row = screen.getByRole("slider").parentElement!;
    expect(row.className).toContain("bottom-(--video-player-controls-bottom,0.75rem)");
  });
});