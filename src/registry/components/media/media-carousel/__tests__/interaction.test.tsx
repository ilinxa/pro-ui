/**
 * Note: inert hit-testing (an inert node is not a pointer target) and Embla's capture-phase click
 * guard (a click ending a drag never arrives) are browser-only behaviour, covered by the U5
 * Playwright run. These jsdom tests click the slide wrapper directly.
 *
 * I6 / R3 — neighbour click, inert/aria-hidden; nav buttons; counter + locale; slide names and
 * labels (functions, deprecated strings, role descriptions, `undefined` keeps the default).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import { DEFAULT_MEDIA_CAROUSEL_LABELS } from "../types";
import { mockMatchMedia } from "../../../../../../tests/helpers";
import { embla, images, setupEmbla, slidesOf } from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

let restore: () => void;
beforeEach(() => {
  restore = setupEmbla(5);
});
afterEach(() => restore());

const items = images(5);
const prevBtn = () => screen.queryByRole("button", { name: "Previous slide" });
const nextBtn = () => screen.queryByRole("button", { name: "Next slide" });

describe("I6 / R3: neighbour click", () => {
  for (const variant of ["gallery", "linear"] as const) {
    it(`${variant}: clicking an inactive slide scrolls to it`, () => {
      const { container } = render(<MediaCarousel items={items} variant={variant} />);
      const slides = slidesOf(container);
      fireEvent.click(slides[1]!);
      expect(embla.api!.scrollTo).toHaveBeenCalledTimes(1);
      expect(embla.api!.scrollTo).toHaveBeenCalledWith(1);
      fireEvent.click(slides[3]!);
      expect(embla.api!.scrollTo).toHaveBeenLastCalledWith(3);
    });

    it(`${variant}: inactive content is inert and the wrapper aria-hidden; the active slide neither`, () => {
      const { container } = render(<MediaCarousel items={items} variant={variant} defaultIndex={2} />);
      const slides = slidesOf(container);
      slides.forEach((slide, i) => {
        const content = slide.firstElementChild as HTMLElement;
        if (i === 2) {
          expect(slide).not.toHaveAttribute("aria-hidden");
          expect(content).not.toHaveAttribute("inert");
        } else {
          expect(slide).toHaveAttribute("aria-hidden", "true");
          expect(content).toHaveAttribute("inert");
        }
      });
    });
  }

  it("clicking the active slide does not scroll", () => {
    const { container } = render(<MediaCarousel items={items} variant="gallery" />);
    fireEvent.click(slidesOf(container)[0]!);
    expect(embla.api!.scrollTo).not.toHaveBeenCalled();
  });

  it("the active slide moves with a swipe, and so do inert / aria-hidden", () => {
    const { container } = render(<MediaCarousel items={items} variant="gallery" />);
    embla.api!.swipe(1);
    const slides = slidesOf(container);
    expect(slides[0]!).toHaveAttribute("aria-hidden", "true");
    expect(slides[1]!).not.toHaveAttribute("aria-hidden");
  });
});

describe("showNavButtons", () => {
  it("true (default) shows both; false hides both", () => {
    const { unmount } = render(<MediaCarousel items={items} variant="gallery" />);
    expect(prevBtn()).not.toBeNull();
    expect(nextBtn()).not.toBeNull();
    unmount();
    render(<MediaCarousel items={items} variant="gallery" showNavButtons={false} />);
    expect(prevBtn()).toBeNull();
    expect(nextBtn()).toBeNull();
  });

  it("buttons scroll prev / next", () => {
    render(<MediaCarousel items={items} variant="gallery" />);
    fireEvent.click(nextBtn()!);
    fireEvent.click(prevBtn()!);
    expect(embla.api!.scrollNext).toHaveBeenCalledTimes(1);
    expect(embla.api!.scrollPrev).toHaveBeenCalledTimes(1);
  });

  describe('"fine-pointer"', () => {
    let restoreMq: (() => void) | undefined;
    afterEach(() => restoreMq?.());

    it("shown under (pointer: fine)", () => {
      restoreMq = mockMatchMedia({ pointer: "fine" });
      render(<MediaCarousel items={items} variant="gallery" showNavButtons="fine-pointer" />);
      expect(prevBtn()).not.toBeNull();
      expect(nextBtn()).not.toBeNull();
    });

    it("hidden under a coarse pointer", () => {
      restoreMq = mockMatchMedia({ pointer: "coarse" });
      render(<MediaCarousel items={items} variant="gallery" showNavButtons="fine-pointer" />);
      expect(prevBtn()).toBeNull();
      expect(nextBtn()).toBeNull();
    });
  });
});

describe("showCounter + locale", () => {
  const counter = (c: HTMLElement) => c.querySelector('[aria-hidden="true"].tabular-nums') as HTMLElement | null;

  it("off by default", () => {
    const { container } = render(<MediaCarousel items={items} variant="gallery" />);
    expect(counter(container)).toBeNull();
  });

  it('renders "2/5" from labels.counter, follows the slide, and is aria-hidden', () => {
    const { container } = render(<MediaCarousel items={items} variant="gallery" showCounter defaultIndex={1} />);
    expect(counter(container)).toHaveTextContent("2/5");
    expect(counter(container)).toHaveAttribute("aria-hidden", "true");
    embla.api!.swipe(3);
    expect(counter(container)).toHaveTextContent("4/5");
  });

  it("a custom labels.counter gets (position, total, format)", () => {
    const { container } = render(
      <MediaCarousel
        items={items}
        variant="gallery"
        showCounter
        defaultIndex={2}
        labels={{ counter: (n, t, f) => `${f(n)} / ${f(t)} foto` }}
      />,
    );
    expect(counter(container)).toHaveTextContent("3 / 5 foto");
  });

  for (const locale of ["tr", "ar"]) {
    it(`locale="${locale}" formats the digits through Intl`, () => {
      const f = new Intl.NumberFormat(locale);
      const { container } = render(
        <MediaCarousel items={items} variant="gallery" showCounter defaultIndex={1} locale={locale} />,
      );
      expect(counter(container)).toHaveTextContent(`${f.format(2)}/${f.format(5)}`);
    });
  }

  it('an invalid locale ("en_US") does not throw and falls back to en', () => {
    expect(() => {
      const { container } = render(
        <MediaCarousel items={items} variant="gallery" showCounter defaultIndex={1} locale="en_US" />,
      );
      expect(counter(container)).toHaveTextContent("2/5");
    }).not.toThrow();
  });
});

describe("slide names and labels", () => {
  const slideLabels = (c: HTMLElement) => slidesOf(c).map((s) => s.getAttribute("aria-label"));
  const dotNames = () => screen.getAllByRole("button", { name: /\d$/ }).map((b) => b.getAttribute("aria-label"));

  it('default slide name is "Slide 2 of 5"', () => {
    const { container } = render(<MediaCarousel items={items} variant="gallery" />);
    expect(slideLabels(container)[1]).toBe("Slide 2 of 5");
    expect(slideLabels(container)[4]).toBe("Slide 5 of 5");
  });

  it('deprecated string template "Resim {index} / {total}" -> "Resim 2 / 5"', () => {
    const { container } = render(
      <MediaCarousel items={items} variant="gallery" labels={{ slideAriaLabel: "Resim {index} / {total}" }} />,
    );
    expect(slideLabels(container)[1]).toBe("Resim 2 / 5");
  });

  it("function slideAriaLabel", () => {
    const { container } = render(
      <MediaCarousel items={items} variant="gallery" labels={{ slideAriaLabel: (n, t) => `${n}. slayt, toplam ${t}` }} />,
    );
    expect(slideLabels(container)[2]).toBe("3. slayt, toplam 5");
  });

  it('goToSlide: string prefix "Git" -> "Git 3"; function form', () => {
    const { unmount } = render(<MediaCarousel items={items} variant="gallery" labels={{ goToSlide: "Git" }} />);
    expect(dotNames()).toContain("Git 3");
    expect(dotNames()).toHaveLength(5);
    unmount();
    render(<MediaCarousel items={items} variant="gallery" labels={{ goToSlide: (n) => `Slayta git: ${n}` }} />);
    expect(dotNames()).toContain("Slayta git: 3");
  });

  it("carouselRoleDescription / slideRoleDescription are applied", () => {
    const { container } = render(
      <MediaCarousel
        items={items}
        variant="gallery"
        labels={{ carouselRoleDescription: "galeri", slideRoleDescription: "slayt" }}
      />,
    );
    expect(screen.getByRole("region", { name: "Media carousel" })).toHaveAttribute("aria-roledescription", "galeri");
    const slides = slidesOf(container);
    expect(slides).toHaveLength(5);
    for (const s of slides) expect(s).toHaveAttribute("aria-roledescription", "slayt");
  });

  it("default role descriptions are carousel / slide", () => {
    const { container } = render(<MediaCarousel items={items} variant="gallery" />);
    expect(screen.getByRole("region", { name: "Media carousel" })).toHaveAttribute("aria-roledescription", "carousel");
    expect(slidesOf(container)[0]).toHaveAttribute("aria-roledescription", "slide");
  });

  it("an undefined label keeps the default (never erases it)", () => {
    const { container } = render(
      <MediaCarousel
        items={items}
        variant="gallery"
        labels={{
          carouselLabel: undefined,
          previousSlide: undefined,
          goToSlide: undefined,
          slideAriaLabel: undefined,
          counter: undefined,
          slideRoleDescription: undefined,
        }}
        showCounter
      />,
    );
    expect(screen.getByRole("region", { name: "Media carousel" })).toBeInTheDocument();
    expect(prevBtn()).not.toBeNull();
    expect(dotNames()).toContain("Go to slide 3");
    expect(slideLabels(container)[0]).toBe("Slide 1 of 5");
    expect(container.querySelector(".tabular-nums")).toHaveTextContent("1/5");
  });

  it("the deprecated DEFAULT_MEDIA_CAROUSEL_LABELS export is still accepted as labels", () => {
    const { container } = render(
      <MediaCarousel items={items} variant="gallery" labels={DEFAULT_MEDIA_CAROUSEL_LABELS} />,
    );
    expect(screen.getByRole("region", { name: "Media carousel" })).toBeInTheDocument();
    expect(slideLabels(container)[1]).toBe("Slide 2 of 5");
    expect(dotNames()).toContain("Go to slide 3");
    expect(prevBtn()).not.toBeNull();
  });
});

describe("I-neg", () => {
  it("0 items renders nothing", () => {
    const { container } = render(<MediaCarousel items={[]} variant="gallery" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("1 item: no region / dots / buttons; a labelled group (K6)", () => {
    const { container } = render(<MediaCarousel items={images(1)} variant="gallery" showCounter />);
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByRole("group", { name: "Media carousel" })).toBeInTheDocument();
    expect(container.querySelector(".tabular-nums")).toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(embla.options).toHaveLength(0); // Embla is bypassed
  });

  it("1 item with a custom carouselLabel names the group", () => {
    render(<MediaCarousel items={images(1)} variant="linear" labels={{ carouselLabel: "Galeri" }} />);
    expect(screen.getByRole("group", { name: "Galeri" })).toBeInTheDocument();
  });

  it("renderItem renders consumer content inside the frame (gallery and single)", () => {
    const { container, unmount } = render(
      <MediaCarousel
        items={items}
        variant="gallery"
        aspect="video"
        renderItem={(item) => <b data-testid={`c-${item.id}`}>{item.id}</b>}
      />,
    );
    expect(container.querySelectorAll("img")).toHaveLength(0);
    const node = screen.getAllByTestId(/^c-/)[0]!;
    expect(node.parentElement!.className).toContain("aspect-video");
    expect(screen.getAllByTestId(/^c-/)).toHaveLength(5);
    unmount();

    const single = render(
      <MediaCarousel
        items={images(1)}
        variant="linear"
        renderItem={(item) => <b data-testid="only">{item.id}</b>}
      />,
    );
    expect(screen.getByTestId("only").parentElement!.className).toContain("aspect-square");
    expect(single.container.querySelectorAll("img")).toHaveLength(0);
  });
});
