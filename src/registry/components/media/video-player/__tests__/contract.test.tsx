/**
 * C11 — the consumer-contract kit for VideoPlayer, plus axe over the states the kit cannot reach
 * with props alone (playing, buffering, error, captions menu open).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { VideoPlayer } from "../video-player";
import { describeContract, expectNoAxeViolations, fireMedia } from "../../../../../../tests/helpers";
import {
  TRACKS,
  getVideo,
  loadMetadata,
  setupPlayerEnv,
  startPlaying,
  stubTextTracks,
  timeUpdate,
  type PlayerEnv,
} from "./support";

let env: PlayerEnv;
// `region` is a page-level rule (content inside landmarks): a component cannot satisfy it, the host page does.
const axe = (el: Element) => expectNoAxeViolations(el, { disable: ["color-contrast", "region"] });
const video = (s: typeof screen) => s.getByLabelText("Video") as HTMLVideoElement;

describeContract("VideoPlayer", {
  render: (props) => <VideoPlayer src="/a.mp4" {...props} />,
  setup: () => {
    env = setupPlayerEnv();
    return () => env.restore();
  },
  renders: (s) => {
    expect(video(s).tagName).toBe("VIDEO");
    expect(s.getByRole("button", { name: "Play" })).toBeInTheDocument();
  },
  labels: {
    props: { labels: { play: "Oynat", videoLabel: "Video oynatıcı" } },
    expect: (s) => {
      expect(s.getByRole("button", { name: "Oynat" })).toBeInTheDocument();
      expect(s.getByLabelText("Video oynatıcı")).toBeInTheDocument();
    },
  },
  controlled: {
    initial: { muted: true },
    next: { muted: false },
    callback: "onMutedChange",
    expectInitial: (s) => {
      expect(s.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
      expect(video(s).muted).toBe(true);
    },
    expectNext: (s) => {
      expect(s.getByRole("button", { name: "Mute" })).toBeInTheDocument();
      expect(video(s).muted).toBe(false);
    },
    request: (user, s) => user.click(s.getByRole("button", { name: "Unmute" })),
  },
  rtl: {
    expect: (s) => {
      // Real RTL behaviour: after playback starts, ArrowRight on the seek bar seeks BACKWARD.
      const v = video(s);
      startPlaying(v);
      loadMetadata(v, 100);
      timeUpdate(env, v, 50);
      const slider = s.getByRole("slider", { name: "Seek" });
      act(() => {
        slider.focus();
      });
      fireEvent.keyDown(slider, { key: "ArrowRight" });
      expect(v.currentTime).toBe(45);
    },
  },
  keyboard: {
    run: async (user) => {
      await user.tab(); // the focusable <video> is first in the tab order
      await user.keyboard(" ");
      await user.keyboard("m");
    },
    expect: (s) => {
      const v = video(s);
      expect(v).toHaveFocus();
      expect(v.paused).toBe(false); // Space started playback
      expect(v.muted).toBe(false); // M unmuted it
      expect(s.getByRole("button", { name: "Mute" })).toBeInTheDocument();
    },
  },
  axeStates: [{ tracks: TRACKS }, { poster: "/p.jpg", durationHint: 90 }, { controls: false }],
});

describe("VideoPlayer — axe over runtime states (C11)", () => {
  beforeEach(() => {
    env = setupPlayerEnv();
  });
  afterEach(() => env.restore());

  it("idle", async () => {
    render(<VideoPlayer src="/a.mp4" durationHint={125} />);
    await axe(document.body);
  });

  it("playing (seek bar, time, mute)", async () => {
    render(<VideoPlayer src="/a.mp4" showFullscreen tracks={TRACKS.slice(0, 1)} />);
    const v = getVideo();
    startPlaying(v);
    loadMetadata(v, 120);
    timeUpdate(env, v, 30);
    expect(screen.getByRole("slider")).toBeInTheDocument();
    await axe(document.body);
  });

  it("buffering", async () => {
    render(<VideoPlayer src="/a.mp4" />);
    const v = getVideo();
    startPlaying(v);
    act(() => fireMedia(v, "waiting"));
    expect(screen.getByRole("status")).toBeInTheDocument();
    await axe(document.body);
  });

  it("error (alert + Retry)", async () => {
    render(<VideoPlayer src="/a.mp4" />);
    act(() => fireMedia(getVideo(), "error"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await axe(document.body);
  });

  it("captions menu open with several tracks (container and document.body)", async () => {
    const tracks = stubTextTracks(2);
    try {
      const user = userEvent.setup();
      const { container } = render(<VideoPlayer src="/a.mp4" tracks={TRACKS} />);
      startPlaying(getVideo());
      await user.click(screen.getByRole("button", { name: "Subtitles and captions" }));
      expect(screen.getByRole("menu")).toBeInTheDocument();
      await axe(container);
      await axe(document.body);
    } finally {
      tracks.restore();
    }
  });
});
