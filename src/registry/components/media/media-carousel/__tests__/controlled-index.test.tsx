/**
 * I3 + K3 — controlled `index` / `onIndexChange` / `defaultIndex`; the prop wins every render.
 */
import { createRef, useState } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import type { MediaCarouselHandle } from "../types";
import { embla, images, lastOptions, setupEmbla } from "./support";

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
const dot = (n: number) => screen.getByRole("button", { name: `Go to slide ${n}` });
const shown = () =>
  [1, 2, 3, 4, 5].filter((n) => dot(n).getAttribute("aria-current") === "true");

describe("uncontrolled", () => {
  it("defaultIndex becomes Embla's startIndex and the active dot", () => {
    render(<MediaCarousel items={items} variant="gallery" defaultIndex={2} />);
    expect(lastOptions().startIndex).toBe(2);
    expect(shown()).toEqual([3]);
  });

  it("default start is slide 0; a swipe moves the shown index and fires both callbacks", () => {
    const onSlideChange = vi.fn();
    const onIndexChange = vi.fn();
    render(
      <MediaCarousel items={items} variant="gallery" onSlideChange={onSlideChange} onIndexChange={onIndexChange} />,
    );
    expect(lastOptions().startIndex).toBe(0);
    expect(shown()).toEqual([1]);
    embla.api!.swipe(3);
    expect(shown()).toEqual([4]);
    expect(onSlideChange).toHaveBeenCalledWith(3);
    expect(onIndexChange).toHaveBeenCalledWith(3);
  });

  it("onSlideChange does not fire on mount", () => {
    const onSlideChange = vi.fn();
    render(<MediaCarousel items={items} variant="gallery" defaultIndex={1} onSlideChange={onSlideChange} />);
    expect(onSlideChange).not.toHaveBeenCalled();
  });
});

describe("controlled (K3)", () => {
  it("starts on the prop; a prop change scrolls Embla to it", () => {
    const onIndexChange = vi.fn();
    const { rerender } = render(
      <MediaCarousel items={items} variant="gallery" index={1} onIndexChange={onIndexChange} />,
    );
    expect(lastOptions().startIndex).toBe(1);
    expect(shown()).toEqual([2]);
    expect(embla.api!.scrollTo).not.toHaveBeenCalled();

    rerender(<MediaCarousel items={items} variant="gallery" index={3} onIndexChange={onIndexChange} />);
    expect(embla.api!.scrollTo).toHaveBeenCalledWith(3);
    expect(shown()).toEqual([4]);
  });

  it("the prop-driven scroll does NOT call onIndexChange, but onSlideChange still fires", () => {
    const onIndexChange = vi.fn();
    const onSlideChange = vi.fn();
    const { rerender } = render(
      <MediaCarousel
        items={items}
        variant="gallery"
        index={0}
        onIndexChange={onIndexChange}
        onSlideChange={onSlideChange}
      />,
    );
    rerender(
      <MediaCarousel
        items={items}
        variant="gallery"
        index={3}
        onIndexChange={onIndexChange}
        onSlideChange={onSlideChange}
      />,
    );
    expect(onIndexChange).not.toHaveBeenCalled();
    expect(onSlideChange).toHaveBeenCalledWith(3);
  });

  it("a swipe the parent ignores: onIndexChange(new), shown index stays, settle snaps back silently", () => {
    const onIndexChange = vi.fn();
    const onSlideChange = vi.fn();
    render(
      <MediaCarousel
        items={items}
        variant="gallery"
        index={2}
        onIndexChange={onIndexChange}
        onSlideChange={onSlideChange}
      />,
    );
    embla.api!.swipe(4);
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(4);
    expect(shown()).toEqual([3]); // the prop wins every render

    // not yanked mid-drag: nothing scrolls until Embla settles
    expect(embla.api!.scrollTo).not.toHaveBeenCalled();
    embla.api!.settle();
    expect(embla.api!.scrollTo).toHaveBeenCalledTimes(1);
    expect(embla.api!.scrollTo).toHaveBeenCalledWith(2);
    expect(embla.api!.snap).toBe(2);

    // the settle-back is silent for onIndexChange; onSlideChange still reports every select
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onSlideChange.mock.calls.map((c) => c[0])).toEqual([4, 2]);
    expect(shown()).toEqual([3]);
  });

  it("a settle on the prop's own slide scrolls nothing", () => {
    render(<MediaCarousel items={items} variant="gallery" index={2} onIndexChange={() => {}} />);
    embla.api!.settle();
    expect(embla.api!.scrollTo).not.toHaveBeenCalled();
  });

  it("when the parent adopts the swipe, nothing snaps back", () => {
    function Host() {
      const [index, setIndex] = useState(0);
      return <MediaCarousel items={items} variant="gallery" index={index} onIndexChange={setIndex} />;
    }
    render(<Host />);
    embla.api!.swipe(3);
    expect(shown()).toEqual([4]);
    embla.api!.settle();
    expect(embla.api!.scrollTo).not.toHaveBeenCalled();
    expect(embla.api!.snap).toBe(3);
    expect(shown()).toEqual([4]);
  });

  it("a dot click is a request: onIndexChange(i) while the shown index stays the prop's", async () => {
    const onIndexChange = vi.fn();
    render(<MediaCarousel items={items} variant="gallery" index={0} onIndexChange={onIndexChange} />);
    act(() => dot(5).click());
    expect(onIndexChange).toHaveBeenCalledWith(4);
    expect(shown()).toEqual([1]);
  });

  it("index without onIndexChange is read-only (still controlled)", () => {
    render(<MediaCarousel items={items} variant="gallery" index={1} />);
    embla.api!.swipe(3);
    expect(shown()).toEqual([2]);
    embla.api!.settle();
    expect(embla.api!.scrollTo).toHaveBeenCalledWith(1);
  });

  it("an out-of-range index is clamped (startIndex, shown dot, scroll target)", () => {
    const { rerender } = render(<MediaCarousel items={items} variant="gallery" index={99} onIndexChange={() => {}} />);
    expect(lastOptions().startIndex).toBe(4);
    expect(shown()).toEqual([5]);
    rerender(<MediaCarousel items={items} variant="gallery" index={-3} onIndexChange={() => {}} />);
    expect(shown()).toEqual([1]);
    expect(embla.api!.scrollTo).toHaveBeenLastCalledWith(0);
  });

  it("controlled wins over defaultIndex", () => {
    render(<MediaCarousel items={items} variant="gallery" index={1} defaultIndex={4} onIndexChange={() => {}} />);
    expect(lastOptions().startIndex).toBe(1);
    expect(shown()).toEqual([2]);
  });
});

describe("handle.getCurrentIndex", () => {
  it("returns the shown index (controlled: the prop, even after an ignored swipe)", () => {
    const ref = createRef<MediaCarouselHandle>();
    render(<MediaCarousel ref={ref} items={items} variant="gallery" index={2} onIndexChange={() => {}} />);
    expect(ref.current!.getCurrentIndex()).toBe(2);
    embla.api!.swipe(4);
    expect(ref.current!.getCurrentIndex()).toBe(2);
  });

  it("uncontrolled: follows the swipe", () => {
    const ref = createRef<MediaCarouselHandle>();
    render(<MediaCarousel ref={ref} items={items} variant="gallery" defaultIndex={1} />);
    expect(ref.current!.getCurrentIndex()).toBe(1);
    embla.api!.swipe(3);
    expect(ref.current!.getCurrentIndex()).toBe(3);
  });

  it("scrollTo / scrollPrev / scrollNext reach Embla", () => {
    const ref = createRef<MediaCarouselHandle>();
    render(<MediaCarousel ref={ref} items={items} variant="gallery" />);
    act(() => ref.current!.scrollTo(2));
    expect(embla.api!.scrollTo).toHaveBeenCalledWith(2);
    act(() => ref.current!.scrollNext());
    act(() => ref.current!.scrollPrev());
    expect(embla.api!.scrollNext).toHaveBeenCalledTimes(1);
    expect(embla.api!.scrollPrev).toHaveBeenCalledTimes(1);
  });
});
