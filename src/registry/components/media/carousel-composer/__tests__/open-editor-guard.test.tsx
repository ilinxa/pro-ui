/**
 * B4 — `openEditor` must refuse non-image items. A video reaching the EditPanel
 * would go through media-editor `export()` and be re-encoded.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCarouselState } from "../hooks/use-carousel-state";
import type { MediaCarouselItem } from "../types";

const ITEMS: MediaCarouselItem[] = [
  { id: "img", kind: "image", url: "https://example.test/a.jpg" },
  { id: "vid", kind: "video", url: "https://example.test/b.mp4" },
];

afterEach(() => vi.restoreAllMocks());

describe("openEditor", () => {
  it("is a no-op (with a dev warning) for a video item", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onEditOpen = vi.fn();
    const { result } = renderHook(() =>
      useCarouselState({ defaultValue: ITEMS, maxItems: 10, onEditOpen }),
    );

    act(() => result.current.openEditor("vid"));

    expect(result.current.editingId).toBeNull();
    expect(result.current.editingItem).toBeNull();
    expect(onEditOpen).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("only image items");
  });

  it("is a no-op (with a dev warning) for an image the canEdit predicate refuses", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onEditOpen = vi.fn();
    const { result } = renderHook(() =>
      useCarouselState({
        defaultValue: ITEMS,
        maxItems: 10,
        onEditOpen,
        canEdit: (it) => it.id !== "img",
      }),
    );

    act(() => result.current.openEditor("img"));

    expect(result.current.editingId).toBeNull();
    expect(onEditOpen).not.toHaveBeenCalled();
    expect(String(warn.mock.calls[0][0])).toContain("canEditItem");
  });

  it("still opens the editor for an image item", () => {
    const onEditOpen = vi.fn();
    const { result } = renderHook(() =>
      useCarouselState({ defaultValue: ITEMS, maxItems: 10, onEditOpen }),
    );

    act(() => result.current.openEditor("img"));

    expect(result.current.editingId).toBe("img");
    expect(onEditOpen).toHaveBeenCalledWith("img");
  });
});
