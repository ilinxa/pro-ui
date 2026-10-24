/**
 * U4 adversarial-review regressions (media-carousel 0.3.1): F3 `watchDrag` skips sliders / menus,
 * F8 the carousel's own chevrons keep their arrow keys while slide-internal controls do not.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import { embla, images, lastOptions, setupEmbla, slidesOf } from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

let restore: () => void;
beforeEach(() => {
  restore = setupEmbla(5);
});
afterEach(() => restore());

type WatchDrag = (api: unknown, evt: MouseEvent | TouchEvent) => boolean;
const watchDragOf = () => (lastOptions() as unknown as { watchDrag: WatchDrag }).watchDrag;
const evtOn = (target: Element, type: "mousedown" | "touchstart" = "mousedown") => {
  const evt = new Event(type, { bubbles: true }) as unknown as MouseEvent;
  Object.defineProperty(evt, "target", { value: target });
  return evt;
};

describe("F3: watchDrag", () => {
  it("F3: false for a mousedown / touchstart inside a [role=slider] or [role=menu]; true for the video and a slide image", () => {
    const { container } = render(
      <MediaCarousel
        items={images(2)}
        variant="gallery"
        renderItem={(item) =>
          item.id === "img-0" ? (
            <div>
              <video data-testid="vid" />
              <div role="slider" aria-label="Seek" aria-valuenow={0} tabIndex={0}>
                <span data-testid="thumb" />
              </div>
              <div role="menu" aria-label="m">
                <button type="button" role="menuitemradio" aria-checked="false" data-testid="item" />
              </div>
            </div>
          ) : undefined
        }
      />,
    );
    const watchDrag = watchDragOf();
    expect(typeof watchDrag).toBe("function");
    expect(watchDrag(null, evtOn(screen.getByRole("slider")))).toBe(false);
    expect(watchDrag(null, evtOn(screen.getByTestId("thumb"), "touchstart"))).toBe(false);
    expect(watchDrag(null, evtOn(screen.getByTestId("item")))).toBe(false);
    expect(watchDrag(null, evtOn(screen.getByTestId("vid")))).toBe(true);
    expect(watchDrag(null, evtOn(slidesOf(container)[1]!.querySelector("img")!))).toBe(true);
  });
});

describe("F8: arrow keys from inside the region", () => {
  it("F8: ArrowRight on the carousel's own next chevron moves the carousel; from a button inside a slide it does not", () => {
    render(
      <MediaCarousel
        items={images(3)}
        variant="gallery"
        showNavButtons
        renderItem={(item) =>
          item.id === "img-0" ? <button type="button" data-testid="in-slide">x</button> : undefined
        }
      />,
    );
    const api = embla.api!;
    fireEvent.keyDown(screen.getByTestId("in-slide"), { key: "ArrowRight" });
    expect(api.scrollNext).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("button", { name: "Next slide" }), { key: "ArrowRight" });
    expect(api.scrollNext).toHaveBeenCalledTimes(1);
  });
});

describe("U5: indicator dots clearance", () => {
  it("with dots, the region lifts a video slide's control row (--video-player-controls-bottom)", () => {
    render(<MediaCarousel items={images(3)} variant="gallery" />);
    const region = screen.getByRole("region");
    expect(region.style.getPropertyValue("--video-player-controls-bottom")).toBe("1.75rem");
  });

  it("without dots, nothing is set", () => {
    render(<MediaCarousel items={images(3)} variant="gallery" showIndicators={false} />);
    expect(screen.getByRole("region").style.getPropertyValue("--video-player-controls-bottom")).toBe("");
  });
});