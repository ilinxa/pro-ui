/**
 * VP2 — fullscreen (opt-in, container API or iOS webkit) and VP3 — captions (toggle for one
 * track, menu for several, `crossOrigin` pass-through).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "../video-player";
import { VideoPlayerFullscreenButton } from "../parts/fullscreen-button";
import {
  TRACKS,
  getVideo,
  rootOf,
  setupPlayerEnv,
  startPlaying,
  stubTextTracks,
  type PlayerEnv,
} from "./support";

let env: PlayerEnv;
beforeEach(() => {
  env = setupPlayerEnv();
});
afterEach(() => env.restore());

/** Define (or remove, with `undefined`) an own prototype member; returns the undo. */
function defineOnProto(proto: object, key: string, value: unknown): () => void {
  const original = Object.getOwnPropertyDescriptor(proto, key);
  if (value === undefined) delete (proto as Record<string, unknown>)[key];
  else Object.defineProperty(proto, key, { configurable: true, writable: true, value });
  return () => {
    if (original) Object.defineProperty(proto, key, original);
    else delete (proto as Record<string, unknown>)[key];
  };
}

describe("VP2: fullscreen", () => {
  const restores: Array<() => void> = [];
  afterEach(() => {
    while (restores.length) restores.pop()!();
  });

  it("VP2: showFullscreen + container requestFullscreen — the click calls it on the container", () => {
    const request = vi.fn(() => Promise.resolve());
    restores.push(defineOnProto(HTMLElement.prototype, "requestFullscreen", request));
    render(<VideoPlayer src="/a.mp4" showFullscreen />);
    startPlaying(getVideo());
    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.contexts[0]).toBe(rootOf(getVideo()));
  });

  it("VP2: only video.webkitEnterFullscreen — that is called", () => {
    restores.push(defineOnProto(HTMLElement.prototype, "requestFullscreen", undefined));
    const enter = vi.fn();
    restores.push(defineOnProto(HTMLMediaElement.prototype, "webkitEnterFullscreen", enter));
    render(<VideoPlayer src="/a.mp4" showFullscreen />);
    startPlaying(getVideo());
    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));
    expect(enter).toHaveBeenCalledTimes(1);
    expect(enter.mock.contexts[0]).toBe(getVideo());
  });

  it("VP2: neither API — no button", () => {
    restores.push(defineOnProto(HTMLElement.prototype, "requestFullscreen", undefined));
    restores.push(defineOnProto(HTMLMediaElement.prototype, "webkitEnterFullscreen", undefined));
    render(<VideoPlayer src="/a.mp4" showFullscreen />);
    startPlaying(getVideo());
    expect(screen.queryByRole("button", { name: "Full screen" })).not.toBeInTheDocument();
  });

  it("VP2: default (no showFullscreen) — no button even when the API exists", () => {
    restores.push(defineOnProto(HTMLElement.prototype, "requestFullscreen", vi.fn(() => Promise.resolve())));
    render(<VideoPlayer src="/a.mp4" />);
    startPlaying(getVideo());
    expect(screen.queryByRole("button", { name: /full screen/i })).not.toBeInTheDocument();
  });

  it("VP2: the button exposes aria-pressed and flips its label with fullscreenchange", () => {
    restores.push(defineOnProto(HTMLElement.prototype, "requestFullscreen", vi.fn(() => Promise.resolve())));
    render(<VideoPlayer src="/a.mp4" showFullscreen />);
    startPlaying(getVideo());
    expect(screen.getByRole("button", { name: "Full screen" })).toHaveAttribute("aria-pressed", "false");
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => rootOf(getVideo()) });
    try {
      fireEvent(document, new Event("fullscreenchange"));
      expect(screen.getByRole("button", { name: "Exit full screen" })).toHaveAttribute("aria-pressed", "true");
    } finally {
      delete (document as unknown as Record<string, unknown>).fullscreenElement;
    }
  });

  it("VP2: the flat part works inside renderControls and the labels are overridable", () => {
    restores.push(defineOnProto(HTMLElement.prototype, "requestFullscreen", vi.fn(() => Promise.resolve())));
    render(
      <VideoPlayer
        src="/a.mp4"
        labels={{ fullscreen: "Tam ekran" }}
        renderControls={() => <VideoPlayerFullscreenButton />}
      />,
    );
    expect(screen.getByRole("button", { name: "Tam ekran" })).toBeInTheDocument();
  });
});

describe("VP3: captions", () => {
  let tracks: ReturnType<typeof stubTextTracks>;
  afterEach(() => tracks?.restore());

  it("VP3: one track — the toggle flips textTracks[0].mode showing <-> hidden", () => {
    tracks = stubTextTracks(1);
    render(<VideoPlayer src="/a.mp4" tracks={TRACKS.slice(0, 1)} />);
    startPlaying(getVideo());
    const toggle = screen.getByRole("button", { name: "Captions" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(tracks.list[0]!.mode).toBe("showing");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toggle);
    expect(tracks.list[0]!.mode).toBe("hidden");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("VP3: no tracks — no captions control", () => {
    tracks = stubTextTracks(0);
    render(<VideoPlayer src="/a.mp4" />);
    startPlaying(getVideo());
    expect(screen.queryByRole("button", { name: /captions|subtitles/i })).not.toBeInTheDocument();
  });

  it("VP3: several tracks — a menu with Off + the labels", async () => {
    tracks = stubTextTracks(2);
    const user = userEvent.setup();
    render(<VideoPlayer src="/a.mp4" tracks={TRACKS} />);
    startPlaying(getVideo());
    const trigger = screen.getByRole("button", { name: "Subtitles and captions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const items = screen.getAllByRole("menuitemradio");
    expect(items.map((i) => i.textContent)).toEqual(["Off", "English", "Türkçe"]);
    expect(items[0]).toHaveAttribute("aria-checked", "true");
  });

  it("VP3: ArrowDown moves through the items, Escape closes and returns focus to the trigger", async () => {
    tracks = stubTextTracks(2);
    const user = userEvent.setup();
    render(<VideoPlayer src="/a.mp4" tracks={TRACKS} />);
    startPlaying(getVideo());
    const trigger = screen.getByRole("button", { name: "Subtitles and captions" });
    await user.click(trigger);
    const [off, english, turkish] = screen.getAllByRole("menuitemradio");
    expect(off).toHaveFocus(); // opening focuses the checked item
    await user.keyboard("{ArrowDown}");
    expect(english).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(turkish).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(off).toHaveFocus(); // wraps
    await user.keyboard("{End}");
    expect(turkish).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("VP3: selecting an item sets the modes (and Off hides the showing one)", async () => {
    tracks = stubTextTracks(2);
    const user = userEvent.setup();
    render(<VideoPlayer src="/a.mp4" tracks={TRACKS} />);
    startPlaying(getVideo());
    await user.click(screen.getByRole("button", { name: "Subtitles and captions" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Türkçe" }));
    expect(tracks.list.map((t) => t.mode)).toEqual(["disabled", "showing"]);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Subtitles and captions" }));
    expect(screen.getByRole("menuitemradio", { name: "Türkçe" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("menuitemradio", { name: "English" }));
    expect(tracks.list.map((t) => t.mode)).toEqual(["showing", "hidden"]);

    await user.click(screen.getByRole("button", { name: "Subtitles and captions" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Off" }));
    expect(tracks.list.map((t) => t.mode)).toEqual(["hidden", "hidden"]);
  });

  it("VP3: labels override the menu strings", async () => {
    tracks = stubTextTracks(2);
    const user = userEvent.setup();
    render(
      <VideoPlayer
        src="/a.mp4"
        tracks={TRACKS}
        labels={{ captionsMenu: "Altyazılar", captionsOff: "Kapalı" }}
      />,
    );
    startPlaying(getVideo());
    await user.click(screen.getByRole("button", { name: "Altyazılar" }));
    expect(screen.getByRole("menuitemradio", { name: "Kapalı" })).toBeInTheDocument();
  });

  it("VP3: crossOrigin passes through to the <video>; unset by default", () => {
    const { rerender } = render(<VideoPlayer src="/a.mp4" tracks={TRACKS} crossOrigin="anonymous" />);
    expect(getVideo()).toHaveAttribute("crossorigin", "anonymous");
    rerender(<VideoPlayer src="/a.mp4" tracks={TRACKS} crossOrigin="use-credentials" />);
    expect(getVideo()).toHaveAttribute("crossorigin", "use-credentials");
    rerender(<VideoPlayer src="/a.mp4" tracks={TRACKS} />);
    expect(getVideo()).not.toHaveAttribute("crossorigin");
  });

  it("VP3: the <track> children render with their label and language", () => {
    render(<VideoPlayer src="/a.mp4" tracks={TRACKS} />);
    const rendered = getVideo().querySelectorAll("track");
    expect(Array.from(rendered, (t) => [t.getAttribute("srclang"), t.getAttribute("label")])).toEqual([
      ["en", "English"],
      ["tr", "Türkçe"],
    ]);
  });
});
