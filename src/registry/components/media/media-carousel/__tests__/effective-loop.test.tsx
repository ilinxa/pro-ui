/**
 * MC-2 (0.4.0) - the counter chip lives inside the active slide's frame; Embla's EFFECTIVE loop
 * (it rebuilds with loop off when the slides can't fill it) drives the edge margins and Prev / Next
 * at the ends; slide width = 1 - 2 x peekRatio; "W:H" aspect.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import { embla, frameOf, images, ratioOf, setupEmbla, slidesOf } from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

let restore: () => void;
beforeEach(() => {
  restore = setupEmbla(2);
});
afterEach(() => restore());

const prev = () => screen.getByRole("button", { name: "Previous slide" }) as HTMLButtonElement;
const next = () => screen.getByRole("button", { name: "Next slide" }) as HTMLButtonElement;

describe("I8: counter chip", () => {
  for (const variant of ["gallery", "linear"] as const) {
    it(`${variant}: sits inside the active slide's frame box and moves with the slide`, () => {
      const { container } = render(<MediaCarousel items={images(2)} variant={variant} showCounter />);
      const chips = () => container.querySelectorAll<HTMLElement>("[aria-hidden='true'].tabular-nums");
      expect(chips()).toHaveLength(1);
      const slides = slidesOf(container);
      // slide > media box (first child) > chip
      expect(slides[0]!.firstElementChild!.contains(chips()[0]!)).toBe(true);
      expect(chips()[0]!.textContent).toBe("1/2");
      act(() => embla.api!.swipe(1));
      expect(chips()).toHaveLength(1);
      expect(slidesOf(container)[1]!.firstElementChild!.contains(chips()[0]!)).toBe(true);
      expect(chips()[0]!.textContent).toBe("2/2");
    });
  }

  it("no chip without showCounter", () => {
    const { container } = render(<MediaCarousel items={images(2)} variant="gallery" />);
    expect(container.querySelector(".tabular-nums")).toBeNull();
  });
});

describe("I8: Embla dropped the loop (2 slides at 85 %)", () => {
  beforeEach(() => {
    embla.api!.engineLoop = false;
  });

  it("gives the first / last slide the edge margins and re-measures once", () => {
    const { container } = render(<MediaCarousel items={images(2)} variant="gallery" />);
    const [first, last] = slidesOf(container);
    expect(first!.style.marginInlineStart).toBe("7.5%");
    expect(last!.style.marginInlineEnd).toBe("7.5%");
    expect(embla.api!.reInit).toHaveBeenCalledTimes(1);
  });

  it("Prev is disabled at the first slide, Next at the last", () => {
    render(<MediaCarousel items={images(2)} variant="gallery" />);
    expect(prev().getAttribute("aria-disabled")).toBe("true");
    expect(next().getAttribute("aria-disabled")).toBeNull();
    act(() => embla.api!.swipe(1));
    expect(prev().getAttribute("aria-disabled")).toBeNull();
    expect(next().getAttribute("aria-disabled")).toBe("true");
  });

  it("a real loop keeps both buttons enabled and adds no margins", () => {
    embla.api!.engineLoop = null;
    const { container } = render(<MediaCarousel items={images(2)} variant="gallery" />);
    expect(prev().getAttribute("aria-disabled")).toBeNull();
    expect(next().getAttribute("aria-disabled")).toBeNull();
    expect(slidesOf(container)[0]!.style.marginInlineStart).toBe("");
    expect(embla.api!.reInit).not.toHaveBeenCalled();
  });

  it("an explicit loop={false} behaves the same (disabled ends)", () => {
    embla.api!.engineLoop = null;
    render(<MediaCarousel items={images(2)} variant="linear" loop={false} />);
    expect(prev().getAttribute("aria-disabled")).toBe("true");
    expect(next().getAttribute("aria-disabled")).toBeNull();
  });

  it("a disabled Prev does not scroll", () => {
    render(<MediaCarousel items={images(2)} variant="gallery" />);
    fireEvent.click(prev());
    expect(embla.api!.scrollPrev).not.toHaveBeenCalled();
  });
});

describe("slide width = 1 - 2 x peekRatio", () => {
  it("default 0.075 keeps 85 %", () => {
    const { container } = render(<MediaCarousel items={images(3)} variant="gallery" />);
    expect(slidesOf(container)[0]!.style.flex).toBe("0 0 85%");
  });

  it("peekRatio 0.1 -> 80 %", () => {
    const { container } = render(<MediaCarousel items={images(3)} variant="gallery" peekRatio={0.1} />);
    expect(slidesOf(container)[0]!.style.flex).toBe("0 0 80%");
  });
});

describe("I10: aspect W:H", () => {
  const frameRatio = (aspect: string, variant: "gallery" | "linear" = "linear") => {
    const { container } = render(
      <MediaCarousel items={images(2)} variant={variant} aspect={aspect as "square"} />,
    );
    return frameOf(container.querySelector("img") as HTMLImageElement);
  };

  it("4:5 renders an 0.8 frame", () => {
    expect(ratioOf(frameRatio("4:5"))).toBeCloseTo(0.8, 5);
  });

  it("1.91:1 renders a 1.91 frame (gallery)", () => {
    expect(ratioOf(frameRatio("1.91:1", "gallery"))).toBeCloseTo(1.91, 5);
  });

  it("a single item follows too", () => {
    const { container } = render(<MediaCarousel items={images(1)} variant="gallery" aspect="4:5" />);
    expect(ratioOf(frameOf(container.querySelector("img") as HTMLImageElement))).toBeCloseTo(0.8, 5);
  });

  it("an invalid ratio falls back to square", () => {
    for (const bad of ["0:5", "abc", "4:", "-1:2"]) {
      const frame = frameRatio(bad);
      expect(frame.className).toContain("aspect-square");
      expect(frame.style.aspectRatio).toBe("");
    }
  });
});
