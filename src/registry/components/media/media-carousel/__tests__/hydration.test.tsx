/**
 * C9 — server markup must match the first client render (no hydration mismatch) for a gallery
 * with a counter, `showNavButtons="fine-pointer"` and a non-zero `defaultIndex`.
 */
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaCarousel } from "../media-carousel";
import { mockMatchMedia } from "../../../../../../tests/helpers";
import { images, setupEmbla } from "./support";

vi.mock("embla-carousel-react", async () => {
  const s = await import("./support");
  return { default: (o: unknown) => s.embla.hook(o as never) };
});

let restore: () => void;
let restoreMq: () => void;
beforeEach(() => {
  restore = setupEmbla(5);
  restoreMq = mockMatchMedia({ pointer: "fine" });
});
afterEach(() => {
  restoreMq();
  restore();
  document.body.innerHTML = "";
});

const ui = (
  <MediaCarousel
    items={images(5)}
    variant="gallery"
    showCounter
    showNavButtons="fine-pointer"
    defaultIndex={2}
    locale="tr"
  />
);

describe("hydration", () => {
  it("the server renders the start slide and no fine-pointer buttons", () => {
    const html = renderToString(ui);
    expect(html).toContain("3/5");
    expect(html).not.toContain("Previous slide");
    expect(html).not.toContain("Next slide");
  });

  it("hydrating the server markup logs no mismatch and the fine-pointer buttons arrive after", async () => {
    const html = renderToString(ui);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable = vi.fn();
    await act(async () => {
      hydrateRoot(container, ui, { onRecoverableError: recoverable });
    });

    const mismatch = errors.mock.calls.filter((c) =>
      /hydrat|did not match|mismatch/i.test(c.map(String).join(" ")),
    );
    errors.mockRestore();
    expect(mismatch).toEqual([]);
    expect(recoverable).not.toHaveBeenCalled();
    expect(container.querySelector('[aria-label="Next slide"]')).not.toBeNull();
    expect(container.textContent).toContain("3/5");
  });

  it("F8: natural-clamped + onMediaError hydrates without a mismatch", async () => {
    const tree = (
      <MediaCarousel
        items={images(5)}
        variant="gallery"
        aspect="natural-clamped"
        onMediaError={async () => undefined}
        showCounter
        defaultIndex={1}
      />
    );
    const html = renderToString(tree);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable = vi.fn();
    await act(async () => {
      hydrateRoot(container, tree, { onRecoverableError: recoverable });
    });
    const mismatch = errors.mock.calls.filter((c) =>
      /hydrat|did not match|mismatch/i.test(c.map(String).join(" ")),
    );
    errors.mockRestore();
    expect(mismatch).toEqual([]);
    expect(recoverable).not.toHaveBeenCalled();
    expect(container.textContent).toContain("2/5");
  });
});
