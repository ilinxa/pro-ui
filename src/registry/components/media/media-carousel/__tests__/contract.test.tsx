/**
 * C11 kit for MediaCarousel: the six contract checks (Embla is a controllable fake).
 */
import { fireEvent } from "@testing-library/react";
import { expect, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import { describeContract } from "../../../../../../tests/helpers";
import { embla, images, lastOptions, setupEmbla } from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

function renderCarousel(props: Record<string, unknown> = {}) {
  return <MediaCarousel items={images(5)} variant="gallery" {...props} />;
}

type S = typeof import("@testing-library/react").screen;
const dot = (s: S, n: number) => s.getByRole("button", { name: new RegExp(`^(Go to slide|Git|Slayt) ${n}$`) });

describeContract("MediaCarousel", {
  render: renderCarousel,
  setup: () => setupEmbla(5),
  renders: (s) => {
    expect(s.getByRole("region", { name: "Media carousel" })).toBeInTheDocument();
    expect(s.getByRole("button", { name: "Previous slide" })).toBeInTheDocument();
    expect(s.getByRole("button", { name: "Next slide" })).toBeInTheDocument();
    expect(s.getAllByRole("button", { name: /^Go to slide \d$/ })).toHaveLength(5);
  },
  labels: {
    props: {
      labels: {
        carouselLabel: "Galeri",
        previousSlide: "Onceki",
        nextSlide: "Sonraki",
        goToSlide: (n: number) => `Git ${n}`,
        slideAriaLabel: (n: number, t: number) => `Slayt ${n}/${t}`,
      },
    },
    expect: (s) => {
      expect(s.getByRole("region", { name: "Galeri" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "Onceki" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "Sonraki" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "Git 3" })).toBeInTheDocument();
      expect(s.getByRole("group", { name: "Slayt 1/5" })).toBeInTheDocument();
    },
  },
  controlled: {
    initial: { index: 0 },
    next: { index: 2 },
    callback: "onIndexChange",
    expectInitial: (s) => {
      expect(dot(s, 1)).toHaveAttribute("aria-current", "true");
      expect(dot(s, 3)).not.toHaveAttribute("aria-current");
      expect(s.getByRole("group", { name: "Slide 1 of 5" })).toBeInTheDocument();
    },
    expectNext: (s) => {
      expect(dot(s, 3)).toHaveAttribute("aria-current", "true");
      expect(dot(s, 1)).not.toHaveAttribute("aria-current");
      expect(s.getByRole("group", { name: "Slide 3 of 5" })).toBeInTheDocument();
    },
    request: async (user, s) => {
      await user.click(dot(s, 4));
    },
  },
  rtl: {
    expect: (s, root) => {
      expect(root).toHaveAttribute("dir", "rtl");
      expect(lastOptions().direction).toBe("rtl");
      const region = s.getByRole("region", { name: "Media carousel" });
      // inherited direction is never written onto the region
      expect(region).not.toHaveAttribute("dir");
      fireEvent.keyDown(region, { key: "ArrowLeft" });
      expect(embla.api!.scrollNext).toHaveBeenCalledTimes(1);
      expect(embla.api!.scrollPrev).not.toHaveBeenCalled();
    },
  },
  keyboard: {
    run: async (user, s) => {
      s.getByRole("region", { name: "Media carousel" }).focus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      await user.keyboard("{End}");
      await user.keyboard("{Home}");
      await user.keyboard("{ArrowRight}");
    },
    expect: (s) => {
      expect(embla.api!.scrollNext).toHaveBeenCalledTimes(3);
      expect(embla.api!.scrollTo).toHaveBeenCalledWith(4);
      expect(embla.api!.scrollTo).toHaveBeenCalledWith(0);
      // Home then ArrowRight lands on slide 2
      expect(dot(s, 2)).toHaveAttribute("aria-current", "true");
    },
  },
  axeStates: [
    { variant: "linear" },
    { items: images(1) },
    { showCounter: true },
    { variant: "linear", aspect: "natural-clamped", showCounter: true, showNavButtons: false },
  ],
});
