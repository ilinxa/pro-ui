/**
 * content-composer: a carousel video's poster object URL is released like its media URL —
 * revoked when the composer unmounts, and tombstoned when an edit displaces it from the live cache.
 * The carousel itself is stubbed (it runs with revokeOnUnmount={false} here, so the host owns cleanup).
 */
import { createRef, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

type Item = { id: string; kind: "image" | "video"; url: string; posterUrl?: string };
let emit: ((items: Item[]) => void) | null = null;

vi.mock("@/registry/components/media/carousel-composer/carousel-composer", () => ({
  CarouselComposer: function StubCarousel(props: { onChange?: (items: Item[]) => void }) {
    useEffect(() => {
      emit = props.onChange ?? null;
    });
    return null;
  },
}));
vi.mock("@/registry/components/media/media-editor/media-editor", () => ({
  MediaEditor: () => null,
}));

import { ContentComposer } from "../content-composer";
import {
  CarouselLiveCacheContext,
  MediaCarouselSubstrateMount,
  carouselDisplacedUrls,
} from "../parts/media-carousel-substrate";
import type { ComposerConfig, MediaCarouselSlotValue, SlotHandle } from "../types";

const config: ComposerConfig = {
  id: "post",
  version: "1.0.0",
  title: "Post",
  adapterId: "none",
  presentation: "inline",
  publishModes: ["draft"],
  steps: [
    {
      id: "media",
      title: "Media",
      slot: "mediaCarouselSlot",
      slotConfig: { fieldName: "media" },
    },
  ],
};

const first: Item = { id: "v", kind: "video", url: "blob:v1", posterUrl: "blob:p1" };

let revoke: ReturnType<typeof vi.fn>;
beforeEach(() => {
  emit = null;
  revoke = vi.fn();
  URL.revokeObjectURL = revoke as unknown as typeof URL.revokeObjectURL;
});
afterEach(() => vi.restoreAllMocks());

describe("carousel poster URLs", () => {
  it("revokes a cached item's poster URL as well as its media URL on unmount", () => {
    const { unmount } = render(<ContentComposer config={config} />);
    act(() => emit!([first]));
    unmount();
    const revoked = revoke.mock.calls.map((c) => c[0]);
    expect(revoked).toContain("blob:v1");
    expect(revoked).toContain("blob:p1");
  });

  it("tombstones a displaced poster URL like a displaced media URL", () => {
    const cache = { current: new Map() };
    render(
      <CarouselLiveCacheContext.Provider value={cache}>
        <MediaCarouselSubstrateMount
          slotConfig={{ fieldName: "media" }}
          value={{ items: [] } as MediaCarouselSlotValue}
          onChange={() => {}}
          ctx={{ stepId: "media" } as never}
          handleRef={createRef<SlotHandle<MediaCarouselSlotValue>>()}
        />
      </CarouselLiveCacheContext.Provider>,
    );
    act(() => emit!([first]));
    act(() => emit!([{ id: "v", kind: "video", url: "blob:v2", posterUrl: "blob:p2" }]));
    const tombs = carouselDisplacedUrls(cache.current);
    expect([...tombs].sort()).toEqual(["blob:p1", "blob:v1"]);
  });
});
