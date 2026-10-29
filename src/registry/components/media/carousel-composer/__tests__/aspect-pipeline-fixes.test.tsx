/**
 * Release 8 FX-A: aspect pipeline fixes A1 A2 A3 A4 A8 A12 A13 A14.
 * (A5 lives in media-editor/__tests__/canvas-placeholder-aspect.test.tsx.)
 */
import { forwardRef, useImperativeHandle } from "react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

const seen: Array<Record<string, unknown>> = [];
vi.mock("@/registry/components/media/media-editor/media-editor", () => ({
  MediaEditor: forwardRef(function MockMediaEditor(props: Record<string, unknown>, ref) {
    seen.push(props);
    useImperativeHandle(ref, () => ({ export: async () => null, getState: () => ({}), getSourceBlob: () => null, loadState: () => {} }));
    return <div data-testid="mock-editor" />;
  }),
}));

import { CarouselComposer } from "../carousel-composer";
import { CarouselEditPanel } from "../features/editing";
import type { MediaCarouselItem } from "../types";
import { centredCropRect, resolveAspect, thumbHeightRem, thumbWidthRem, aspectToCss, parseRatio } from "../lib/aspect";
import { formatNumber } from "../lib/format-number";
import { mockResizeObserver } from "../../../../../../tests/helpers";

const photo = (id: string, width?: number, height?: number): MediaCarouselItem => ({
  id,
  kind: "image",
  url: `https://example.test/${id}.jpg`,
  width,
  height,
});
const ITEMS = [photo("a", 4000, 3000), photo("b", 1000, 1000)];

let warn: MockInstance<typeof console.warn>;
let restoreRo: () => void;
beforeEach(() => {
  seen.length = 0;
  restoreRo = mockResizeObserver();
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  restoreRo();
  vi.restoreAllMocks();
});
const warned = (needle: string) =>
  warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes(needle));
const switchGroup = () => screen.queryByRole("group", { name: "Aspect ratio" });

describe("A1 edit panel wrapper", () => {
  it("has no aspect-ratio style and no clipping; media-editor still gets aspect + cropAspects", () => {
    const { container } = render(
      <CarouselEditPanel
        item={photo("a")}
        aspect="1.91:1"
        aspectRatio={1.91}
        labels={{ editDone: "Done", editCancel: "Cancel", editSaving: "Saving", editError: "Error" }}
        onApply={() => {}}
        onCancel={() => {}}
      />,
    );
    const wrapper = screen.getByTestId("mock-editor").parentElement as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe("");
    expect(wrapper.className).not.toContain("overflow-hidden");
    expect(container.querySelector("[style*='aspect-ratio']")).toBeNull();
    expect(seen.at(-1)!.aspect).toBe("1.91:1");
    expect(seen.at(-1)!.cropAspects).toEqual(["1.91:1"]);
  });
});

describe("A2 controlled aspect without onAspectChange", () => {
  it("warns once when a switch exists", () => {
    const { rerender } = render(<CarouselComposer defaultValue={ITEMS} aspect="1:1" aspectOptions={["1:1", "4:5"]} />);
    rerender(<CarouselComposer defaultValue={ITEMS} aspect="1:1" aspectOptions={["1:1", "4:5"]} />);
    expect(warned("onAspectChange")).toHaveLength(1);
  });
  it("is silent with a handler", () => {
    render(<CarouselComposer defaultValue={ITEMS} aspect="1:1" onAspectChange={() => {}} aspectOptions={["1:1", "4:5"]} />);
    expect(warned("onAspectChange")).toHaveLength(0);
  });
});

describe("A3 guarded number formatter", () => {
  it("falls back to en for an invalid tag and never groups", () => {
    expect(() => formatNumber(1920, "tr_TR")).not.toThrow();
    expect(formatNumber(1920, "tr_TR")).toBe("1920");
    expect(formatNumber(1.91, "en")).toBe("1.91");
    expect(formatNumber(1.123456, "en")).toBe("1.1235");
  });
  it("renders with an invalid locale and ungrouped aspect names", () => {
    render(<CarouselComposer defaultValue={ITEMS} locale="tr_TR" aspectOptions={["1920:1080", "4:5"]} />);
    const group = within(switchGroup()!);
    expect(group.getByRole("button", { name: "1920:1080" })).toBeInTheDocument();
  });
});

describe("A4 rail thumb box", () => {
  const dims = (r: number) => [thumbWidthRem(r), thumbHeightRem(r)];
  it("keeps the exact ratio inside 7.5 x 4 rem", () => {
    expect(dims(1)).toEqual([4, 4]);
    expect(dims(9 / 16)).toEqual([2.25, 4]);
    const [w, h] = dims(21 / 9);
    expect(w).toBe(7.5);
    expect(w / h).toBeCloseTo(21 / 9);
    expect(h).toBeLessThanOrEqual(4);
  });
  it("applies width and height inline", () => {
    render(<CarouselComposer defaultValue={ITEMS} aspect="21:9" onAspectChange={() => {}} />);
    const t = document.querySelector("[data-thumb-select='a']") as HTMLElement;
    expect(t.style.width).toBe("7.5rem");
    expect(parseFloat(t.style.height)).toBeCloseTo(7.5 / (21 / 9));
  });
});

describe("A8 parse like media-editor", () => {
  it("rejects surrounding whitespace, accepts .5:1, normalises", () => {
    expect(parseRatio(" 4 : 5")).toBeNull();
    expect(parseRatio(".5:1")).toBe(0.5);
    expect(resolveAspect([], " 4 : 5")).toMatchObject({ aspect: "1:1", invalid: true });
    expect(resolveAspect([], "01.50:1").aspect).toBe("1.5:1");
    expect(aspectToCss("1.91:1" as never)).toBe("1.91 / 1");
  });
});

describe("A12 aspectOptions de-duplication", () => {
  it("counts after de-duplication and renders each option once", () => {
    const { rerender } = render(<CarouselComposer defaultValue={ITEMS} aspectOptions={["1:1", "1:1"]} />);
    expect(switchGroup()).toBeNull();
    rerender(<CarouselComposer defaultValue={ITEMS} aspectOptions={["1:1", "4:5", "1:1"]} />);
    expect(within(switchGroup()!).getAllByRole("button")).toHaveLength(2);
  });
});

describe("A13 re-picking the pressed option", () => {
  it("does not fire onAspectChange", () => {
    const onAspectChange = vi.fn();
    render(<CarouselComposer defaultValue={ITEMS} defaultAspect="1:1" onAspectChange={onAspectChange} aspectOptions={["1:1", "4:5"]} />);
    fireEvent.click(within(switchGroup()!).getByRole("button", { name: "1:1" }));
    expect(onAspectChange).not.toHaveBeenCalled();
    fireEvent.click(within(switchGroup()!).getByRole("button", { name: "4:5" }));
    expect(onAspectChange).toHaveBeenCalledWith("4:5");
  });
});

describe("A14 centredCropRect on tiny images", () => {
  it("trims 2 x 1 at ratio 1", () => {
    expect(centredCropRect(2, 1, 1)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
  it("still keeps a matching ratio whole", () => {
    expect(centredCropRect(1081, 1350, 4 / 5)).toEqual({ x: 0, y: 0, width: 1081, height: 1350 });
  });
});
