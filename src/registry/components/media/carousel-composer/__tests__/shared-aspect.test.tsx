/**
 * CC-1 (0.4.0): one shared aspect, any ratio. Resolution, controlled / uncontrolled pair,
 * the aspect switch, frames, the panel's props and `export()` crops.
 */
import { createRef, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { CarouselComposer } from "../carousel-composer";
import type {
  CarouselComposerHandle,
  CarouselEditorPanelProps,
  MediaCarouselItem,
} from "../types";
import { centredCropRect, resolveAspect, thumbWidthRem } from "../lib/aspect";
import { mockResizeObserver } from "../../../../../../tests/helpers";

const photo = (id: string, width?: number, height?: number): MediaCarouselItem => ({
  id,
  kind: "image",
  url: `https://example.test/${id}.jpg`,
  width,
  height,
});
const LANDSCAPE = [photo("a", 4000, 3000), photo("b", 1000, 1000)];

let panel: CarouselEditorPanelProps | null;
function Panel(props: CarouselEditorPanelProps) {
  useEffect(() => {
    panel = props;
  });
  return <div data-testid="my-panel" />;
}

let warn: MockInstance<typeof console.warn>;
let restoreRo: () => void;
beforeEach(() => {
  panel = null;
  restoreRo = mockResizeObserver();
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  restoreRo();
  vi.restoreAllMocks();
});

const warned = (needle: string) =>
  warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes(needle));
const OPTIONS = ["original", "1:1", "4:5", "1.91:1"] as const;
const thumb = (id: string) => document.querySelector(`[data-thumb-select="${id}"]`) as HTMLElement;
const switchGroup = () => screen.queryByRole("group", { name: "Aspect ratio" });
// The main preview's frame is the parent of its first <img>; thumbs are buttons.
const previewFrame = () =>
  document.querySelector("img:not([data-thumb-select] img)")!.parentElement as HTMLElement;

describe("resolveAspect", () => {
  it("passes W:H and named values through, free has no ratio", () => {
    expect(resolveAspect([], "1.91:1")).toMatchObject({ aspect: "1.91:1", ratio: 1.91, invalid: false });
    expect(resolveAspect([], "free")).toMatchObject({ aspect: "free", ratio: null });
  });
  it("invalid W:H falls back to 1:1 and is flagged", () => {
    for (const bad of ["abc", "0:5", "3:", "-1:2", "1:2:3"]) {
      expect(resolveAspect([], bad as never)).toMatchObject({ aspect: "1:1", invalid: true });
    }
  });
  it("auto snaps to the nearest option, else the four standard ratios; 1:1 until known", () => {
    expect(resolveAspect([photo("a")], "auto").aspect).toBe("1:1");
    const wide = [photo("a", 1900, 1000)];
    expect(resolveAspect(wide, "auto", ["1:1", "4:5", "1.91:1"]).aspect).toBe("1.91:1");
    expect(resolveAspect(wide, "auto").aspect).toBe("16:9");
    expect(resolveAspect([photo("a", 1000, 1200)], "auto", ["original", "free", "1:1", "16:9"]).aspect).toBe("1:1");
  });
  it("original is item 1's own ratio as W:H, 1:1 until known", () => {
    expect(resolveAspect([photo("a", 4000, 3000)], "original")).toMatchObject({ aspect: "4000:3000", ratio: 4 / 3 });
    expect(resolveAspect([photo("a")], "original")).toMatchObject({ aspect: "1:1", ratio: 1 });
  });
});

describe("centredCropRect", () => {
  it("is the largest centred rect of the ratio, in integers", () => {
    expect(centredCropRect(4000, 3000, 1)).toEqual({ x: 500, y: 0, width: 3000, height: 3000 });
    expect(centredCropRect(1000, 1500, 4 / 5)).toEqual({ x: 0, y: 125, width: 1000, height: 1250 });
  });
  it("is the full rect when the ratio already matches within rounding", () => {
    expect(centredCropRect(1080, 1350, 4 / 5)).toEqual({ x: 0, y: 0, width: 1080, height: 1350 });
    expect(centredCropRect(1081, 1350, 4 / 5)).toEqual({ x: 0, y: 0, width: 1081, height: 1350 });
  });
  it("thumb width follows the ratio and is clamped", () => {
    expect(thumbWidthRem(1)).toBe(4);
    expect(thumbWidthRem(9 / 16)).toBe(2.25);
    expect(thumbWidthRem(3)).toBe(7.5);
  });
});

describe("aspect setting", () => {
  it("uncontrolled: starts at defaultAspect, switching changes it and fires onAspectChange", () => {
    const onAspectChange = vi.fn();
    const ref = createRef<CarouselComposerHandle>();
    render(
      <CarouselComposer ref={ref} defaultValue={LANDSCAPE} defaultAspect="4:5" aspectOptions={[...OPTIONS]} onAspectChange={onAspectChange} />,
    );
    expect(ref.current!.getAspect()).toEqual({ aspect: "4:5", ratio: 0.8 });
    fireEvent.click(screen.getByRole("button", { name: "1.91:1" }));
    expect(onAspectChange).toHaveBeenCalledWith("1.91:1");
    expect(ref.current!.getAspect().aspect).toBe("1.91:1");
  });
  it("controlled: the pick calls onAspectChange and waits for the parent", () => {
    const onAspectChange = vi.fn();
    const ref = createRef<CarouselComposerHandle>();
    const { rerender } = render(
      <CarouselComposer ref={ref} defaultValue={LANDSCAPE} aspect="1:1" aspectOptions={[...OPTIONS]} onAspectChange={onAspectChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "4:5" }));
    expect(onAspectChange).toHaveBeenCalledWith("4:5");
    expect(ref.current!.getAspect().aspect).toBe("1:1");
    rerender(
      <CarouselComposer ref={ref} defaultValue={LANDSCAPE} aspect="4:5" aspectOptions={[...OPTIONS]} onAspectChange={onAspectChange} />,
    );
    expect(ref.current!.getAspect().aspect).toBe("4:5");
  });
  it("auto (default) resolves from item 1; getAspect reports original as W:H", () => {
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} defaultValue={[photo("a", 1900, 1000)]} />);
    expect(ref.current!.getAspect().aspect).toBe("16:9");
    const ref2 = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref2} defaultValue={LANDSCAPE} aspect="original" onAspectChange={() => {}} />);
    expect(ref2.current!.getAspect()).toEqual({ aspect: "4000:3000", ratio: 4 / 3 });
  });
  it("invalid aspect: 1:1 and one dev warning", () => {
    const ref = createRef<CarouselComposerHandle>();
    const { rerender } = render(<CarouselComposer ref={ref} defaultValue={LANDSCAPE} aspect={"x:y" as never} onAspectChange={() => {}} />);
    rerender(<CarouselComposer ref={ref} defaultValue={LANDSCAPE} aspect={"x:y" as never} onAspectChange={() => {}} />);
    expect(ref.current!.getAspect()).toEqual({ aspect: "1:1", ratio: 1 });
    expect(warned("not a ratio")).toHaveLength(1);
  });
});

describe("aspect switch", () => {
  it("shows for item 1 only, with aria-pressed and the labelled group", () => {
    render(<CarouselComposer defaultValue={LANDSCAPE} aspect="4:5" onAspectChange={() => {}} aspectOptions={[...OPTIONS]} />);
    const group = switchGroup()!;
    expect(group).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "4:5" })).toHaveAttribute("aria-pressed", "true");
    expect(within(group).getByRole("button", { name: "Original" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(thumb("b"));
    expect(switchGroup()).toBeNull();
    fireEvent.click(thumb("a"));
    expect(switchGroup()).not.toBeNull();
  });
  it("is hidden with fewer than two valid options; invalid entries are dropped with one warning", () => {
    const { rerender } = render(<CarouselComposer defaultValue={LANDSCAPE} aspectOptions={["1:1"]} />);
    expect(switchGroup()).toBeNull();
    rerender(<CarouselComposer defaultValue={LANDSCAPE} aspectOptions={["1:1", "nope" as never]} />);
    expect(switchGroup()).toBeNull();
    expect(warned("aspectOptions")).toHaveLength(1);
    rerender(<CarouselComposer defaultValue={LANDSCAPE} aspectOptions={["1:1", "4:5", "nope" as never]} />);
    expect(within(switchGroup()!).getAllByRole("button")).toHaveLength(2);
  });
  it("is hidden while an edit is open", () => {
    render(<CarouselComposer defaultValue={LANDSCAPE} editing={{ Panel }} aspectOptions={[...OPTIONS]} />);
    expect(switchGroup()).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByTestId("my-panel")).toBeInTheDocument();
    expect(switchGroup()).toBeNull();
  });
  it("uses labels.aspectSwitch and locale digits", () => {
    render(
      <CarouselComposer
        defaultValue={LANDSCAPE}
        locale="ar-EG"
        aspectOptions={["1:1", "4:5", "1.91:1"]}
        labels={{ aspectSwitch: "Oran" }}
      />,
    );
    const group = screen.getByRole("group", { name: "Oran" });
    const names = within(group).getAllByRole("button").map((b) => b.textContent);
    expect(names[0]).toMatch(/^[١]\S[١]$/);
    expect(names.every((n) => !/[0-9]/.test(n ?? ""))).toBe(true);
  });
  it("custom aspectOption label wins", () => {
    render(
      <CarouselComposer
        defaultValue={LANDSCAPE}
        aspectOptions={["original", "4:5"]}
        labels={{ aspectOption: (a) => (a === "original" ? "Orijinal" : `r-${a}`) }}
      />,
    );
    expect(screen.getByRole("button", { name: "Orijinal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "r-4:5" })).toBeInTheDocument();
  });
});

describe("frames follow the aspect", () => {
  it("main preview and rail thumbs reframe on a switch", () => {
    render(<CarouselComposer defaultValue={LANDSCAPE} defaultAspect="1:1" aspectOptions={[...OPTIONS]} />);
    expect(previewFrame().style.aspectRatio).toBe("1 / 1");
    expect(thumb("a").style.width).toBe("4rem");
    fireEvent.click(screen.getByRole("button", { name: "1.91:1" }));
    expect(previewFrame().style.aspectRatio).toBe("1.91 / 1");
    expect(thumb("a").style.width).toBe("7.5rem");
    expect(thumb("b").style.width).toBe("7.5rem");
    fireEvent.click(screen.getByRole("button", { name: "4:5" }));
    expect(previewFrame().style.aspectRatio).toBe("4 / 5");
    expect(thumb("a").style.width).toBe("3.2rem");
  });
  it("a video thumb takes the ratio too", () => {
    const items: MediaCarouselItem[] = [photo("a", 1000, 1000), { id: "v", kind: "video", url: "https://example.test/v.mp4" }];
    render(<CarouselComposer defaultValue={items} aspect="9:16" onAspectChange={() => {}} />);
    expect(thumb("v").style.width).toBe("2.25rem");
  });
});

describe("the edit panel and export()", () => {
  it("the panel gets the resolved aspect and ratio (original arrives as W:H)", () => {
    render(<CarouselComposer defaultValue={LANDSCAPE} editing={{ Panel }} aspect="original" onAspectChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(panel!.aspect).toBe("4000:3000");
    expect(panel!.aspectRatio).toBeCloseTo(4 / 3);
  });
  it("free passes aspectRatio null", () => {
    render(<CarouselComposer defaultValue={LANDSCAPE} editing={{ Panel }} aspect="free" onAspectChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(panel!.aspect).toBe("free");
    expect(panel!.aspectRatio).toBeNull();
  });
  it("export() adds a centred crop to images of known size, none for video / free / unknown", async () => {
    const items: MediaCarouselItem[] = [
      photo("a", 4000, 3000),
      photo("b"),
      { id: "v", kind: "video", url: "https://example.test/v.mp4", width: 1280, height: 720 },
    ];
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} defaultValue={items} aspect="1:1" onAspectChange={() => {}} />);
    const out = await ref.current!.export();
    expect(out[0].crop).toEqual({ x: 500, y: 0, width: 3000, height: 3000 });
    expect(out[1].crop).toBeUndefined();
    expect(out[2].crop).toBeUndefined();
    // getItems() stays crop-free: only export() fills it.
    expect(ref.current!.getItems()[0].crop).toBeUndefined();
    const free = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={free} defaultValue={items} aspect="free" onAspectChange={() => {}} />);
    expect((await free.current!.export())[0].crop).toBeUndefined();
  });
  it("export() follows a switch", async () => {
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} defaultValue={[photo("a", 4000, 3000)]} defaultAspect="1:1" aspectOptions={[...OPTIONS]} />);
    fireEvent.click(screen.getByRole("button", { name: "4:5" }));
    await act(async () => {});
    expect((await ref.current!.export())[0].crop).toEqual({ x: 800, y: 0, width: 2400, height: 3000 });
  });
});
