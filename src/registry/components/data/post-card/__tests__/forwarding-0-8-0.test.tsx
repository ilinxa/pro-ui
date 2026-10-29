/**
 * post-card 0.8.0 follows media-carousel 0.4.0: the inline `PostMediaItem` copy carries `caption`,
 * `mediaProps.aspect` takes "W:H", and the caption / video options reach the carousel.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { MediaCarouselAspect, MediaCarouselLabels, MediaItem } from "../../../media/media-carousel/types";
import type { PostMediaItem, PostMediaProps } from "../types";
import { card, installDomStubs, makePost } from "./support";

const rec = vi.hoisted(() => ({ carousel: [] as Record<string, unknown>[] }));

vi.mock("@/registry/components/media/media-carousel/media-carousel", () => ({
  MediaCarousel: (props: Record<string, unknown>) => {
    rec.carousel.push(props);
    return <div data-testid="carousel" />;
  },
}));

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
  rec.carousel.length = 0;
});
afterEach(() => restore());

const media: PostMediaItem[] = [
  { id: "m1", type: "image", url: "https://x.test/a.jpg", alt: "a", caption: "First caption" },
  { id: "m2", type: "video", url: "https://x.test/b.mp4", alt: "clip", caption: "Second caption" },
];
const last = () => rec.carousel[rec.carousel.length - 1]!;

describe("type guard: the inline copy follows media-carousel (compile-time, checked by tsc)", () => {
  it("both directions assign, including caption and the W:H aspect", () => {
    const toCarousel: MediaItem[] = media;
    const toPost: PostMediaItem[] = toCarousel;
    const aspect: PostMediaProps["aspect"] = "4:5" satisfies MediaCarouselAspect;
    const labels: MediaCarouselLabels = {
      captionShowMore: "m",
      captionShowLess: "l",
      video: { play: "p" },
    } satisfies NonNullable<PostMediaProps["labels"]>;
    expect([toPost.length, aspect, labels.captionShowMore]).toEqual([2, "4:5", "m"]);
  });
});

describe("0.8.0 forwarding", () => {
  it("items keep their caption and alt when handed to the carousel", () => {
    render(card({ post: makePost({ media }) }));
    expect(last().items).toEqual(media);
  });

  it("forwards aspect W:H, captionLines, captionClassName and the new label keys", () => {
    const labels = { captionShowMore: "Daha fazla", captionShowLess: "Daha az", video: { play: "Oynat" } };
    render(
      card({
        post: makePost({ media }),
        mediaProps: { aspect: "1.91:1", captionLines: 3, captionClassName: "text-xs", labels },
      }),
    );
    expect(last().aspect).toBe("1.91:1");
    expect(last().captionLines).toBe(3);
    expect(last().captionClassName).toBe("text-xs");
    expect(last().labels).toEqual(labels);
  });
});
