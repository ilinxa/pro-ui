/**
 * C5 / I8 — `muted` + `onMutedChange`: with the callback the prop wins on every render; without
 * it `muted` behaves as in 0.2.2 (story-viewer passes `muted={isMuted}`).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "../video-player";
import { fireBare, getVideo, setupPlayerEnv, type PlayerEnv } from "./support";

let env: PlayerEnv;
beforeEach(() => {
  env = setupPlayerEnv();
});
afterEach(() => env.restore());

describe("C5: controlled muted", () => {
  it("C5: clicking mute calls onMutedChange with the opposite and changes nothing until the parent adopts it", () => {
    const onMutedChange = vi.fn();
    render(<VideoPlayer src="/a.mp4" muted onMutedChange={onMutedChange} />);
    const video = getVideo();
    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));
    expect(onMutedChange).toHaveBeenCalledTimes(1);
    expect(onMutedChange).toHaveBeenCalledWith(false);
    expect(video.muted).toBe(true);
    expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
  });

  it("C5: the parent adopting the request unmutes the element and flips the label", () => {
    const { rerender } = render(<VideoPlayer src="/a.mp4" muted onMutedChange={() => {}} />);
    rerender(<VideoPlayer src="/a.mp4" muted={false} onMutedChange={() => {}} />);
    expect(getVideo().muted).toBe(false);
    expect(screen.getByRole("button", { name: "Mute" })).toBeInTheDocument();
  });

  it("C5: from unmuted the request is muted=true", () => {
    const onMutedChange = vi.fn();
    render(<VideoPlayer src="/a.mp4" muted={false} onMutedChange={onMutedChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    expect(onMutedChange).toHaveBeenCalledWith(true);
    expect(getVideo().muted).toBe(false);
  });

  it("C5: the M key asks too, and an element-side change (browser UI) is pulled back to the prop", () => {
    const onMutedChange = vi.fn();
    render(<VideoPlayer src="/a.mp4" muted onMutedChange={onMutedChange} />);
    const video = getVideo();
    fireEvent.keyDown(video, { key: "m" });
    expect(onMutedChange).toHaveBeenCalledWith(false);
    video.muted = false;
    fireBare(video, "volumechange");
    expect(video.muted).toBe(true);
    expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
  });

  it("C5: the handle's toggleMute asks as well", () => {
    const onMutedChange = vi.fn();
    const ref = { current: null as import("../types").VideoPlayerHandle | null };
    render(<VideoPlayer src="/a.mp4" muted onMutedChange={onMutedChange} ref={ref} />);
    act(() => ref.current!.toggleMute());
    expect(onMutedChange).toHaveBeenCalledWith(false);
  });
});

describe("I8: without onMutedChange — 0.2.2 behaviour", () => {
  it("I8: the user's toggle applies to the element and the label", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    expect(video.muted).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));
    expect(video.muted).toBe(false);
    expect(screen.getByRole("button", { name: "Mute" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    expect(video.muted).toBe(true);
  });

  it("I8: a prop change applies (story-viewer's muted={isMuted})", () => {
    const { rerender } = render(<VideoPlayer src="/a.mp4" muted={false} />);
    expect(getVideo().muted).toBe(false);
    expect(screen.getByRole("button", { name: "Mute" })).toBeInTheDocument();
    rerender(<VideoPlayer src="/a.mp4" muted />);
    expect(getVideo().muted).toBe(true);
    fireBare(getVideo(), "volumechange"); // browsers fire it when `muted` is written; jsdom does not
    expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
  });

  it("I8: the element's own volumechange (browser UI) updates the label", () => {
    render(<VideoPlayer src="/a.mp4" />);
    const video = getVideo();
    video.muted = false;
    fireBare(video, "volumechange");
    expect(screen.getByRole("button", { name: "Mute" })).toBeInTheDocument();
  });
});
