/**
 * VP1 — seek bar + time (C2, C3, C4): thumb position, keys, pointer, RTL, aria-valuetext, locale
 * and duration formatting, the idle duration badge, and the opt-outs.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { VideoPlayer } from "../video-player";
import {
  getVideo,
  loadMetadata,
  pointer,
  setupPlayerEnv,
  startPlaying,
  stubBuffered,
  stubRect,
  timeUpdate,
  type PlayerEnv,
} from "./support";

let env: PlayerEnv;
beforeEach(() => {
  env = setupPlayerEnv();
});
afterEach(() => env.restore());

/** Render, start playback, load a 120 s video and put it at `at` seconds. */
function playing(props: Partial<React.ComponentProps<typeof VideoPlayer>> = {}, at = 30, duration = 120) {
  const utils = render(<VideoPlayer src="/a.mp4" {...props} />);
  const video = getVideo();
  startPlaying(video);
  loadMetadata(video, duration);
  timeUpdate(env, video, at);
  return { ...utils, video, slider: screen.queryByRole("slider", { name: "Seek" }) as HTMLElement };
}

describe("VP1: seek bar position", () => {
  it("VP1: timeupdate at 30 of 120 puts the thumb at 25 %", () => {
    const { slider } = playing();
    expect(slider).toHaveAttribute("aria-valuenow", "30");
    expect(slider).toHaveAttribute("aria-valuemax", "120");
    expect(slider.querySelector('[style*="width: 25%"]')).not.toBeNull();
  });

  it("VP1: aria-valuetext equals the label function output (custom position)", () => {
    const { slider } = playing({
      labels: { position: (c, t, f) => `${f.current} sur ${f.total} (${c}/${t})` },
    });
    expect(slider).toHaveAttribute("aria-valuetext", "0:30 sur 2:00 (30/120)");
  });

  it("VP1: default aria-valuetext reads elapsed of total", () => {
    const { slider } = playing();
    expect(slider).toHaveAttribute("aria-valuetext", "0:30 of 2:00");
  });

  it("VP1: buffered ranges are drawn behind the fill", () => {
    const { video, slider } = playing();
    stubBuffered(video, [[0, 60]]);
    act(() => {
      video.dispatchEvent(new Event("progress"));
    });
    expect(slider.querySelector('[style*="width: 50%"]')).not.toBeNull();
  });
});

describe("VP1: keyboard", () => {
  it("VP1: ArrowRight seeks +5 (the seekStep default)", () => {
    const { video, slider } = playing();
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(video.currentTime).toBe(35);
  });

  it("VP1: ArrowLeft seeks -5; seekStep={10} changes the step", () => {
    const first = playing({ seekStep: 10 });
    fireEvent.keyDown(first.slider, { key: "ArrowLeft" });
    expect(first.video.currentTime).toBe(20);
    fireEvent.keyDown(first.slider, { key: "ArrowRight" });
    // the seek updates the bar at once, so the next step starts from 20
    expect(first.video.currentTime).toBe(30);
  });

  it("VP1: RTL ArrowRight seeks -5 (and ArrowLeft +5)", () => {
    const { video, slider } = playing({ dir: "rtl" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(video.currentTime).toBe(25);
    timeUpdate(env, video, 25);
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(video.currentTime).toBe(30);
  });

  it("VP1: Home goes to 0 and End to the duration", () => {
    const { video, slider } = playing();
    fireEvent.keyDown(slider, { key: "End" });
    expect(video.currentTime).toBe(120);
    fireEvent.keyDown(slider, { key: "Home" });
    expect(video.currentTime).toBe(0);
  });

  it("VP1: a handled seek key is defaultPrevented (a carousel around the player ignores it)", () => {
    const { slider } = playing();
    expect(fireEvent.keyDown(slider, { key: "ArrowRight" })).toBe(false);
    expect(fireEvent.keyDown(slider, { key: "a" })).toBe(true);
  });

  it("VP1: ArrowRight on the focused <video> seeks +5 when controls render (RTL: -5)", () => {
    const first = playing();
    expect(fireEvent.keyDown(first.video, { key: "ArrowRight" })).toBe(false);
    expect(first.video.currentTime).toBe(35);
    first.unmount();
    const rtl = playing({ dir: "rtl" });
    fireEvent.keyDown(rtl.video, { key: "ArrowRight" });
    expect(rtl.video.currentTime).toBe(25);
  });
});

describe("VP1: pointer", () => {
  it("VP1: pointer down at 50 % of the bar sets currentTime to 60", () => {
    const { video, slider } = playing();
    stubRect(slider, { left: 0, width: 200 });
    pointer(slider, "pointerdown", 100);
    expect(video.currentTime).toBe(60);
    pointer(slider, "pointerup", 100);
  });

  it("VP1: dragging follows the pointer until it is released", () => {
    const { video, slider } = playing();
    stubRect(slider, { left: 0, width: 200 });
    pointer(slider, "pointerdown", 20);
    expect(video.currentTime).toBe(12);
    pointer(slider, "pointermove", 150);
    expect(video.currentTime).toBe(90);
    pointer(slider, "pointerup", 150);
    pointer(slider, "pointermove", 10);
    expect(video.currentTime).toBe(90);
  });

  it("VP1: RTL — 25 % from the left is 90 s (the bar fills from the right)", () => {
    const { video, slider } = playing({ dir: "rtl" });
    stubRect(slider, { left: 0, width: 200 });
    pointer(slider, "pointerdown", 50);
    expect(video.currentTime).toBe(90);
    pointer(slider, "pointerup", 50);
  });

  it("VP1: a bar before metadata is disabled and ignores the pointer", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    startPlaying(video);
    const slider = screen.getByRole("slider", { name: "Seek" });
    expect(slider).toHaveAttribute("aria-disabled", "true");
    stubRect(slider, { left: 0, width: 200 });
    pointer(slider, "pointerdown", 100);
    expect(video.currentTime).toBe(0);
  });
});

describe("VP1: time text (C3)", () => {
  it("VP1: elapsed / total reads m:ss", () => {
    playing();
    expect(screen.getByText("0:30 / 2:00")).toBeInTheDocument();
  });

  it("VP1: h:mm:ss from one hour", () => {
    playing({}, 3725, 7200);
    expect(screen.getByText("1:02:05 / 2:00:00")).toBeInTheDocument();
  });

  it('VP1: locale="ar-EG" renders locale digits', () => {
    playing({ locale: "ar-EG" });
    expect(screen.getByText("٠:٣٠ / ٢:٠٠")).toBeInTheDocument();
  });

  it('VP1: locale="tr" is passed to formatDuration and the text follows it', () => {
    const seen: string[] = [];
    playing({
      locale: "tr",
      formatDuration: (s, l) => {
        seen.push(l);
        return `${Math.round(s)} sn`;
      },
    });
    expect(screen.getByText("30 sn / 120 sn")).toBeInTheDocument();
    expect(new Set(seen)).toEqual(new Set(["tr"]));
  });

  it('VP1: locale="tr" with the default formatter keeps m:ss', () => {
    playing({ locale: "tr" });
    expect(screen.getByText("0:30 / 2:00")).toBeInTheDocument();
  });

  it('VP1: an invalid locale ("en_US") does not throw and falls back to English formatting', () => {
    expect(() => playing({ locale: "en_US" })).not.toThrow();
    expect(screen.getByText("0:30 / 2:00")).toBeInTheDocument();
  });

  it("VP1: labels.timeDisplay controls the visible text", () => {
    playing({ labels: { timeDisplay: (c, t) => `${c} · ${t}` } });
    expect(screen.getByText("0:30 · 2:00")).toBeInTheDocument();
  });
});

describe("VP1: idle duration badge", () => {
  it("VP1: shows the duration before play and disappears after play", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    loadMetadata(video, 125);
    expect(screen.getByText("Duration 2:05")).toBeInTheDocument();
    startPlaying(video);
    expect(screen.queryByText("Duration 2:05")).not.toBeInTheDocument();
  });

  it("VP1: durationHint shows the badge before metadata", () => {
    render(<VideoPlayer src="/a.mp4" preload="none" durationHint={90} />);
    expect(screen.getByText("Duration 1:30")).toBeInTheDocument();
  });

  it("VP1: no duration (no hint, no metadata) renders no badge", () => {
    render(<VideoPlayer src="/a.mp4" />);
    expect(screen.queryByText(/^Duration/)).not.toBeInTheDocument();
  });

  it("VP1: labels.durationBadge names the badge", () => {
    render(<VideoPlayer src="/a.mp4" durationHint={90} labels={{ durationBadge: (_t, f) => `Süre ${f}` }} />);
    expect(screen.getByText("Süre 1:30")).toBeInTheDocument();
  });
});

describe("VP1: opt-outs", () => {
  it("VP1: showSeekBar={false} removes the slider", () => {
    playing({ showSeekBar: false });
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.getByText("0:30 / 2:00")).toBeInTheDocument();
  });

  it("VP1: showTime={false} removes the time text", () => {
    playing({ showTime: false });
    expect(screen.queryByText("0:30 / 2:00")).not.toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("VP1: seek(seconds) clamps to the duration (ArrowRight at the end stays at the end)", () => {
    const { video, slider } = playing({}, 118);
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(video.currentTime).toBe(120);
  });
});
