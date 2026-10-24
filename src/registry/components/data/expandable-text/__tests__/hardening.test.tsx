/**
 * expandable-text 0.3.0 — request ET1 (rich children + re-measure) / ET2 (`dir="auto"`) and the U0 findings
 * (R1–R7 in docs/procomps/expandable-text-procomp/expandable-text-loop.md). jsdom has no layout: each test
 * sets `scrollHeight` / the computed line-height itself; `layout.height` can change mid-test.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExpandableText } from "../expandable-text";
import { DEFAULT_EXPANDABLE_TEXT_LABELS, defaultExpandableTextLabels } from "../types";
import { mockResizeObserver } from "../../../../../../tests/helpers";

const layout = { height: 200, lineHeight: "20px" as string, fontSize: "16px" };
let restore: Array<() => void> = [];

beforeEach(() => {
  layout.height = 200;
  layout.lineHeight = "20px";
  const sh = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => layout.height });
  const gcs = window.getComputedStyle;
  window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
    const style = gcs.call(window, el, pseudo);
    return new Proxy(style, {
      get: (target, prop) => {
        if (prop === "lineHeight") return layout.lineHeight;
        if (prop === "fontSize") return layout.fontSize;
        const value = Reflect.get(target, prop);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  }) as typeof window.getComputedStyle;
  restore = [
    mockResizeObserver(),
    () => {
      window.getComputedStyle = gcs;
    },
    () => {
      if (sh) Object.defineProperty(HTMLElement.prototype, "scrollHeight", sh);
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight;
    },
  ];
});
afterEach(() => {
  restore.forEach((r) => r());
  restore = [];
});

const LONG = "A long post body that spans more than three lines once it is laid out in a narrow card.";
const toggle = () => screen.queryByRole("button", { name: /show (more|less)/i });

describe("ET1 — rich children", () => {
  it("R1: link children render, are clickable, and the clamp + toggle work", () => {
    const onClick = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <ExpandableText maxLines={3}>
        <span>
          Hello <a href="/u/ayse" onClick={onClick}>@ayse</a> and <a href="/t/news">#news</a>
        </span>
      </ExpandableText>,
    );
    const link = screen.getByRole("link", { name: "@ayse" });
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    const body = link.closest("[id]") as HTMLElement;
    expect(body.style.overflow).toBe("hidden");
    fireEvent.click(toggle()!);
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(body.style.overflow).toBe("visible");
  });

  it("children render in a <div> (block children are valid); content stays a <p>", () => {
    const { container, rerender } = render(
      <ExpandableText>
        <p>First paragraph.</p>
        <p>Second paragraph.</p>
      </ExpandableText>,
    );
    const body = screen.getByText("First paragraph.").parentElement!;
    expect(body.tagName).toBe("DIV");
    expect(container.querySelectorAll("p p")).toHaveLength(0);
    rerender(<ExpandableText content={LONG} />);
    expect(screen.getByText(LONG).tagName).toBe("P");
  });

  it("children win over content", () => {
    render(
      <ExpandableText content="plain text">
        <span>rich text</span>
      </ExpandableText>,
    );
    expect(screen.getByText("rich text")).toBeInTheDocument();
    expect(screen.queryByText("plain text")).not.toBeInTheDocument();
  });

  it("R2: changing measureKey re-measures (the box did not resize)", () => {
    layout.height = 40; // fits in 3 × 20px
    const { rerender } = render(
      <ExpandableText maxLines={3} measureKey={1}>
        <span>short</span>
      </ExpandableText>,
    );
    expect(toggle()).toBeNull();
    layout.height = 200;
    rerender(
      <ExpandableText maxLines={3} measureKey={2}>
        <span>short</span>
      </ExpandableText>,
    );
    expect(toggle()).not.toBeNull();
  });

  it("R2: a DOM change inside rich children re-measures without measureKey (MutationObserver)", async () => {
    layout.height = 40;
    function Host({ more }: { more: boolean }) {
      return (
        <ExpandableText maxLines={3}>
          <span>start</span>
          {more && <span> and much more text</span>}
        </ExpandableText>
      );
    }
    const { rerender } = render(<Host more={false} />);
    expect(toggle()).toBeNull();
    layout.height = 200;
    rerender(<Host more />);
    await act(async () => {}); // MutationObserver callbacks are microtasks
    expect(toggle()).not.toBeNull();
  });

  it("I5: renders nothing with no content and no renderable children; renders with children only", () => {
    const { container, rerender } = render(<ExpandableText content="" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ExpandableText>{null}</ExpandableText>);
    expect(container).toBeEmptyDOMElement();
    rerender(<ExpandableText>{[false, "", null]}</ExpandableText>);
    expect(container).toBeEmptyDOMElement();
    rerender(<ExpandableText content={null}>{0}</ExpandableText>);
    expect(container).not.toBeEmptyDOMElement();
    rerender(
      <ExpandableText>
        <span>only children</span>
      </ExpandableText>,
    );
    expect(screen.getByText("only children")).toBeInTheDocument();
  });
});

describe("ET2 — direction", () => {
  it("R3 / I4: the content element has dir=auto by default; the prop overrides", () => {
    const { rerender } = render(<ExpandableText content={LONG} />);
    expect(screen.getByText(LONG)).toHaveAttribute("dir", "auto");
    rerender(<ExpandableText content={LONG} dir="rtl" />);
    expect(screen.getByText(LONG)).toHaveAttribute("dir", "rtl");
    rerender(
      <ExpandableText>
        <span>rich</span>
      </ExpandableText>,
    );
    expect(screen.getByText("rich").parentElement).toHaveAttribute("dir", "auto");
  });
});

describe("U0 findings", () => {
  it("R4: the server markup is clamped (no full-text flash) and hydrates without warnings", async () => {
    const html = renderToString(<ExpandableText content={LONG} maxLines={3} />);
    expect(html).toMatch(/-webkit-line-clamp:\s*3/);
    expect(html).toMatch(/overflow:\s*hidden/);
    expect(html).not.toContain("Show more"); // the toggle waits for a measurement
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable = vi.fn();
    await act(async () => {
      hydrateRoot(host, <ExpandableText content={LONG} maxLines={3} />, { onRecoverableError: recoverable });
    });
    expect(errors).not.toHaveBeenCalled();
    expect(recoverable).not.toHaveBeenCalled();
    errors.mockRestore();
    host.remove();
  });

  it("I-neg: text that fits is unclamped after the first measurement, with no toggle", () => {
    layout.height = 40;
    render(<ExpandableText content="short" maxLines={3} />);
    expect(screen.getByText("short").style.overflow).toBe("visible");
    expect(toggle()).toBeNull();
  });

  it("I-neg: post-card detail's maxLines={999} never shows a toggle for normal text", () => {
    render(<ExpandableText content={LONG} maxLines={999} />);
    expect(toggle()).toBeNull();
  });

  it("R5: labels with an undefined key keep the default; the old constant name still works", () => {
    render(<ExpandableText content={LONG} labels={{ showMore: undefined, showLess: "Daha az" }} />);
    expect(toggle()).toHaveTextContent("Show more");
    expect(DEFAULT_EXPANDABLE_TEXT_LABELS).toBe(defaultExpandableTextLabels);
  });

  it("U4 F1: clamped rich children are also bounded by maxLines × line-height (block children ignore line-clamp)", () => {
    const { rerender } = render(
      <ExpandableText maxLines={3}>
        <p>One.</p>
        <p>Two.</p>
      </ExpandableText>,
    );
    const body = screen.getByText("One.").parentElement!;
    expect(body.style.maxHeight).toBe("3lh");
    fireEvent.click(toggle()!);
    expect(body.style.maxHeight).toBe("");
    rerender(<ExpandableText content={LONG} maxLines={3} />);
    expect(screen.getByText(LONG).style.maxHeight).toBe("");
  });

  it("U4 F4: no usable line height → measured, not truncated, unclamped (never cut off without a toggle)", () => {
    layout.lineHeight = "";
    layout.fontSize = "";
    render(<ExpandableText content={LONG} maxLines={3} />);
    expect(screen.getByText(LONG).style.overflow).toBe("visible");
    expect(toggle()).toBeNull();
    layout.fontSize = "16px";
  });

  it("U4 F4: print and no-script unclamp (no toggle can run there)", () => {
    render(<ExpandableText content={LONG} maxLines={3} />);
    const cls = screen.getByText(LONG).className;
    expect(cls).toContain("print:overflow-visible!");
    expect(cls).toContain("[@media(scripting:none)]:[-webkit-line-clamp:unset]!");
  });

  it("R6: line-height: normal still measures (≈ 1.2 × font size)", () => {
    layout.lineHeight = "normal";
    render(<ExpandableText content={LONG} maxLines={3} />);
    expect(toggle()).not.toBeNull();
  });

  describe("R7: keyboard focus into clamped text", () => {
    const original = Element.prototype.matches;
    const stubFocusVisible = (visible: boolean) => {
      Element.prototype.matches = function (this: Element, selector: string) {
        if (selector === ":focus-visible") return visible;
        return original.call(this, selector);
      };
    };
    const originalRect = Element.prototype.getBoundingClientRect;
    /** The link's bottom edge (px) vs the clamped content box ending at 60px. */
    const placeLink = (bottom: number) => {
      Element.prototype.getBoundingClientRect = function (this: Element) {
        const b = this.tagName === "A" ? bottom : 60;
        return { top: 0, bottom: b, left: 0, right: 100, width: 100, height: b, x: 0, y: 0, toJSON() {} } as DOMRect;
      };
    };
    beforeEach(() => placeLink(100)); // below the clamp by default
    afterEach(() => {
      Element.prototype.matches = original;
      Element.prototype.getBoundingClientRect = originalRect;
    });

    // U5 (Chrome): the browser scrolls the clipped box to the focused link BEFORE `focus` fires, so the
    // link's rect is already inside the box — the scrolled box is the signal.
    it("U5: a box the browser scrolled to reveal the link expands (and scrolls back)", () => {
      stubFocusVisible(true);
      placeLink(40); // geometry says "visible" after the browser's scroll
      render(<Body />);
      const link = screen.getByRole("link");
      const box = link.closest("[id]") as HTMLElement;
      box.scrollTop = 46;
      act(() => link.focus());
      expect(toggle()).toHaveAttribute("aria-expanded", "true");
      expect(box.scrollTop).toBe(0);
    });

    it("U4 F3: a link on a VISIBLE line does not expand", () => {
      stubFocusVisible(true);
      placeLink(40);
      render(<Body />);
      act(() => screen.getByRole("link").focus());
      expect(toggle()).toHaveAttribute("aria-expanded", "false");
    });

    const Body = (props: Partial<React.ComponentProps<typeof ExpandableText>>) => (
      <ExpandableText maxLines={3} {...props}>
        <span>
          start <a href="/later">a link below the clamp</a>
        </span>
      </ExpandableText>
    );

    it("expands (uncontrolled) so focus never sits on hidden text", () => {
      stubFocusVisible(true);
      render(<Body />);
      act(() => screen.getByRole("link").focus());
      expect(toggle()).toHaveAttribute("aria-expanded", "true");
    });

    it("asks the parent when controlled (the prop still wins)", () => {
      stubFocusVisible(true);
      const onExpandedChange = vi.fn();
      render(<Body expanded={false} onExpandedChange={onExpandedChange} />);
      act(() => screen.getByRole("link").focus());
      expect(onExpandedChange).toHaveBeenCalledWith(true);
      expect(toggle()).toHaveAttribute("aria-expanded", "false");
    });

    it("pointer focus (a click on a visible link) does not expand", () => {
      stubFocusVisible(false);
      render(<Body />);
      act(() => screen.getByRole("link").focus());
      expect(toggle()).toHaveAttribute("aria-expanded", "false");
    });
  });
});
