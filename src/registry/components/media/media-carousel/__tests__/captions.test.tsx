/**
 * MC-1 (0.4.0) - per-slide captions: under the frame, inside the slide's group, read once, inert
 * on inactive slides; gallery / linear / single-item / renderItem paths; dots in flow only when a
 * caption exists (0.3.1 layout otherwise).
 */
import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import type { MediaItem } from "../types";
import { expectNoAxeViolations, mockLayout, mockResizeObserver } from "../../../../../../tests/helpers";
import { embla, images, setupEmbla, slidesOf } from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

let restore: () => void;
let restoreLayout: () => void;
let restoreObserver: () => void;
beforeEach(() => {
  restore = setupEmbla(3);
  // Every element reports a tall scrollHeight: a 2-line clamp is exceeded, so Show more renders.
  restoreLayout = mockLayout({ scrollHeight: 200, lineHeight: "20px" });
  restoreObserver = mockResizeObserver();
});
afterEach(() => {
  restoreObserver();
  restoreLayout();
  restore();
});

const withCaptions = (n = 3): MediaItem[] =>
  images(n).map((it, i) => (i === 1 ? it : ({ ...it, caption: `Caption number ${i + 1}` } as MediaItem)));

describe("I7: captions", () => {
  for (const variant of ["gallery", "linear"] as const) {
    describe(variant, () => {
      it("renders the caption inside its slide group, outside the frame", () => {
        const { container } = render(<MediaCarousel items={withCaptions()} variant={variant} />);
        const first = slidesOf(container)[0]!;
        const caption = within(first).getByText("Caption number 1");
        const frame = first.querySelector("img")!.parentElement!;
        expect(first.getAttribute("role")).toBe("group");
        expect(frame.contains(caption)).toBe(false);
      });

      it("an item without a caption renders no caption box (takes no space)", () => {
        const { container } = render(<MediaCarousel items={withCaptions()} variant={variant} />);
        const second = slidesOf(container)[1]!;
        // Only the media wrapper: no caption node, no empty spacer.
        expect(second.children).toHaveLength(1);
      });

      it("inactive slides keep aria-hidden and their caption (and toggle) is inert", () => {
        const { container } = render(<MediaCarousel items={withCaptions()} variant={variant} />);
        const [first, , third] = slidesOf(container);
        expect(third!.getAttribute("aria-hidden")).toBe("true");
        const inertBox = within(third!).getByText("Caption number 3").closest("[inert]");
        expect(inertBox).not.toBeNull();
        expect(first!.getAttribute("aria-hidden")).toBeNull();
        expect(within(first!).getByText("Caption number 1").closest("[inert]")).toBeNull();
        expect(within(first!).getByRole("button", { name: "Show more" })).toBeInTheDocument();
        // Nothing focusable outside inert under aria-hidden.
        const toggle = within(third!).getByRole("button", { name: "Show more", hidden: true });
        expect(toggle.closest("[inert]")).not.toBeNull();
      });

      it("swiping moves the readable caption to the new active slide", () => {
        const { container } = render(<MediaCarousel items={withCaptions()} variant={variant} />);
        act(() => embla.api!.swipe(2));
        const slides = slidesOf(container);
        expect(within(slides[2]!).getByText("Caption number 3").closest("[inert]")).toBeNull();
        expect(within(slides[0]!).getByText("Caption number 1").closest("[inert]")).not.toBeNull();
        expect(slides[0]!.getAttribute("aria-hidden")).toBe("true");
      });

      it("keeps alt on the image and adds no aria-describedby", () => {
        const { container } = render(<MediaCarousel items={withCaptions()} variant={variant} />);
        const first = slidesOf(container)[0]!;
        expect(first.querySelector("img")!.getAttribute("alt")).toBe("Photo 1");
        expect(first.querySelector("[aria-describedby]")).toBeNull();
      });

      it("is axe clean", async () => {
        const { container } = render(<MediaCarousel items={withCaptions()} variant={variant} showCounter />);
        await expectNoAxeViolations(container);
      });
    });
  }

  it("labels reach the toggle (Turkish) and captionLines reaches the clamp", () => {
    const { container } = render(
      <MediaCarousel
        items={withCaptions()}
        variant="linear"
        captionLines={4}
        labels={{ captionShowMore: "Daha fazla", captionShowLess: "Daha az" }}
        captionClassName="text-xs"
      />,
    );
    const first = slidesOf(container)[0]!;
    expect(within(first).getByRole("button", { name: "Daha fazla" })).toBeInTheDocument();
    const text = within(first).getByText("Caption number 1");
    expect(text.style.webkitLineClamp || text.getAttribute("style") || "").toContain("4");
    expect(text.className).toContain("text-xs");
    expect(text.getAttribute("dir")).toBe("auto");
  });

  it("default clamp is 2 lines", () => {
    const { container } = render(<MediaCarousel items={withCaptions()} variant="linear" />);
    const text = within(slidesOf(container)[0]!).getByText("Caption number 1");
    expect(text.getAttribute("style") ?? "").toMatch(/line-clamp:\s*2/);
  });

  it("a single item renders its caption inside the group, under the frame", () => {
    const [one] = withCaptions(1);
    const { container } = render(<MediaCarousel items={[one!]} variant="gallery" />);
    const group = container.querySelector<HTMLElement>('[role="group"]')!;
    const caption = within(group).getByText("Caption number 1");
    expect(group.querySelector("img")!.parentElement!.contains(caption)).toBe(false);
    expect(within(group).getByRole("button", { name: "Show more" })).toBeInTheDocument();
  });

  it("the renderItem path renders captions too", () => {
    const { container } = render(
      <MediaCarousel
        items={withCaptions()}
        variant="linear"
        renderItem={(item) => <div data-testid={`custom-${item.id}`}>custom</div>}
      />,
    );
    const first = slidesOf(container)[0]!;
    expect(within(first).getByTestId("custom-img-0")).toBeInTheDocument();
    expect(within(first).getByText("Caption number 1")).toBeInTheDocument();
  });

  it("dots render in flow (not overlaid) when any item has a caption", () => {
    render(<MediaCarousel items={withCaptions()} variant="gallery" />);
    const dot = screen.getByRole("button", { name: "Go to slide 1" });
    expect(dot.parentElement!.className).not.toContain("absolute");
  });

  it("I-neg: without captions the dots stay overlaid and no caption node exists", () => {
    const { container } = render(<MediaCarousel items={images(3)} variant="gallery" />);
    const dot = screen.getByRole("button", { name: "Go to slide 1" });
    expect(dot.parentElement!.className).toContain("absolute");
    for (const slide of slidesOf(container)) expect(slide.children).toHaveLength(1);
  });
});
