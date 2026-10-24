/**
 * U4 F2 (media-library 0.2.3): the lightbox's ArrowLeft / ArrowRight navigation ignores keys that
 * come from the previewed content's own controls (a video, its seek bar) and already-handled keys.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilePreviewLightbox } from "../parts/preview-lightbox";
import type { MediaNode } from "../types";
import {
  getVideo,
  loadMetadata,
  setupPlayerEnv,
  startPlaying,
  type PlayerEnv,
} from "../../video-player/__tests__/support";
import { mockResizeObserver } from "../../../../../../tests/helpers";

let env: PlayerEnv;
let restoreRO: () => void;
beforeEach(() => {
  env = setupPlayerEnv();
  restoreRO = mockResizeObserver() as unknown as () => void;
});
afterEach(() => {
  env.restore();
  if (typeof restoreRO === "function") restoreRO();
});

const nodes: MediaNode[] = ["a", "b", "c"].map((id) => ({
  id,
  name: `${id}.mp4`,
  type: "file",
  ext: "mp4",
  mimeType: "video/mp4",
  url: `https://example.test/${id}.mp4`,
})) as unknown as MediaNode[];

async function open() {
  const onNavigate = vi.fn();
  render(<FilePreviewLightbox nodes={nodes} activeId="b" onClose={() => {}} onNavigate={onNavigate} />);
  const video = await vi.waitFor(() => {
    const v = getVideo();
    expect(v).not.toBeNull();
    return v;
  });
  startPlaying(video);
  loadMetadata(video, 100);
  return { onNavigate, video };
}

describe("F2: lightbox arrow keys vs the preview's own controls", () => {
  it("F2: ArrowRight from the video and from its seek bar does NOT navigate; on the dialog itself it does", async () => {
    const { onNavigate, video } = await open();
    fireEvent.keyDown(video, { key: "ArrowRight" });
    expect(onNavigate).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("slider", { name: "Seek" }), { key: "ArrowRight" });
    expect(onNavigate).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("c");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowLeft" });
    expect(onNavigate).toHaveBeenLastCalledWith("a");
  });

  it("F2: a keydown a descendant already handled (defaultPrevented) does not navigate", async () => {
    const { onNavigate } = await open();
    const title = screen.getByText("b.mp4", { selector: "p" });
    const handled = (e: Event) => e.preventDefault();
    title.addEventListener("keydown", handled);
    fireEvent.keyDown(title, { key: "ArrowRight" });
    title.removeEventListener("keydown", handled);
    expect(onNavigate).not.toHaveBeenCalled();
    fireEvent.keyDown(title, { key: "ArrowRight" });
    expect(onNavigate).toHaveBeenCalledWith("c");
  });
});
