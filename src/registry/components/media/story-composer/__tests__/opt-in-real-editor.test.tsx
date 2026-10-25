import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { StoryComposer } from "../story-composer";
// The capture slice is imported by the TEST only, to prove the opt-in path.
import { mediaCapture } from "../../media-editor/features/capture";

// Against the REAL MediaEditor: what a default install actually renders.
describe("camera opt-in against the real editor", () => {
  const getUserMedia = vi.fn(async () => {
    throw new DOMException("blocked", "NotAllowedError");
  });
  const MediaRecorderSpy = vi.fn();

  beforeEach(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia, enumerateDevices: async () => [] },
    });
    vi.stubGlobal("MediaRecorder", MediaRecorderSpy);
  });
  afterEach(() => {
    cleanup();
    getUserMedia.mockClear();
    MediaRecorderSpy.mockClear();
    vi.unstubAllGlobals();
  });

  async function mount(extra: Partial<React.ComponentProps<typeof StoryComposer>> = {}) {
    await act(async () => {
      render(
        <StoryComposer
          isOpen
          onClose={() => {}}
          onPublished={() => {}}
          presentation="modal"
          {...extra}
        />,
      );
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
  }

  it("without `capture` it is upload-only: gallery intake, no camera, no recorder", async () => {
    await mount();
    expect(screen.getByRole("button", { name: "Choose from gallery" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Connect to camera" })).toBeNull();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(MediaRecorderSpy).not.toHaveBeenCalled();
  });

  it("with capture={mediaCapture} the camera is offered (I1)", async () => {
    await mount({ capture: mediaCapture });
    expect(screen.getByRole("button", { name: "Connect to camera" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Choose from gallery" })).toBeNull();
  });
});
