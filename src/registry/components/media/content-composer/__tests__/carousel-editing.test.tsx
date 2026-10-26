/**
 * content-composer 0.3.3: the carousel step wires the carousel-composer-editing add-on, so an
 * image still shows Edit. media-editor is mocked so Konva never loads.
 */
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/registry/components/media/media-editor/media-editor", () => ({
  MediaEditor: () => <div data-testid="mock-editor" />,
}));

import { MediaCarouselSubstrateMount } from "../parts/media-carousel-substrate";
import type { MediaCarouselSlotValue, SlotHandle } from "../types";

describe("mediaCarouselSlot editing", () => {
  it("shows the Edit button for an image", () => {
    const value: MediaCarouselSlotValue = {
      items: [{ id: "a", kind: "image", exportedUrl: "https://example.test/a.jpg" }],
    };
    render(
      <MediaCarouselSubstrateMount
        slotConfig={{ fieldName: "media" }}
        value={value}
        onChange={() => {}}
        ctx={{ stepId: "media" } as never}
        handleRef={createRef<SlotHandle<MediaCarouselSlotValue>>()}
      />,
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
