/**
 * MC-3 (0.4.0) - `locale` and `labels.video` reach every built-in VideoPlayer; a video item's
 * `alt` names its player and wins over `labels.video.videoLabel`.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import type { MediaItem } from "../types";
import { loadMetadata, setupPlayerEnv, type PlayerEnv } from "../../video-player/__tests__/support";
import { setupEmbla, slidesOf, videos } from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

let restoreEmbla: () => void;
let env: PlayerEnv;
beforeEach(() => {
  restoreEmbla = setupEmbla(3);
  env = setupPlayerEnv();
});
afterEach(() => {
  env.restore();
  restoreEmbla();
});

const TR = { play: "Oynat", mute: "Sessiz", videoLabel: "Video (varsayilan)", seek: "Ara" };
const videoOf = (el: HTMLElement) => el.querySelector("video") as HTMLVideoElement;

describe("I9: video labels + locale", () => {
  it("a Turkish labels.video reaches every built-in player (gallery, all slides)", () => {
    const { container } = render(<MediaCarousel items={videos(3)} variant="gallery" labels={{ video: TR }} />);
    for (const slide of slidesOf(container)) {
      expect(videoOf(slide).getAttribute("aria-label")).toBe("Video (varsayilan)");
    }
    expect(screen.getAllByRole("button", { name: "Oynat", hidden: true }).length).toBeGreaterThan(0);
  });

  it("a video item's alt wins over labels.video.videoLabel", () => {
    const items = videos(2).map((v, i) => (i === 0 ? { ...v, alt: "Kampus turu" } : v)) as MediaItem[];
    const { container } = render(<MediaCarousel items={items} variant="linear" labels={{ video: TR }} />);
    const [a, b] = slidesOf(container);
    expect(videoOf(a!).getAttribute("aria-label")).toBe("Kampus turu");
    expect(videoOf(b!).getAttribute("aria-label")).toBe("Video (varsayilan)");
  });

  it("a single video item gets labels and alt too", () => {
    const [v] = videos(1);
    const { container } = render(
      <MediaCarousel items={[{ ...v!, alt: "Tek video" } as MediaItem]} variant="linear" labels={{ video: TR }} />,
    );
    expect(videoOf(container).getAttribute("aria-label")).toBe("Tek video");
    expect(screen.getByRole("button", { name: "Oynat" })).toBeInTheDocument();
  });

  it("locale reaches the player's time text (Arabic-Indic digits)", () => {
    const { container } = render(<MediaCarousel items={videos(1)} variant="linear" locale="ar-EG" />);
    loadMetadata(videoOf(container), 125);
    expect(container.textContent).toMatch(/[٠-٩]/);
  });

  it("without labels.video the English defaults stay", () => {
    const { container } = render(<MediaCarousel items={videos(1)} variant="linear" />);
    expect(videoOf(container).getAttribute("aria-label")).toBe("Video");
  });
});
