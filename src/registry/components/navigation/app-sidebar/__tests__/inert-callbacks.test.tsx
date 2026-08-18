/**
 * The five callbacks `AppSidebar` declared and never called — v0.3.1.
 *
 * `onItemHover`, `onItemFocus`, `onActiveItemChange`, `onMount` and `onUnmount`
 * were all in `AppSidebarProps`, all documented in the description, and not one
 * of them was referenced by a single line of implementation. The plan doc even
 * carries a High review finding (P2) correcting `onActiveItemChange`'s *timing*
 * — a careful argument about a callback wired to nothing.
 *
 * `NavLinkProps` had declared `onMouseEnter`/`onFocus` from the start too, with
 * nothing ever passing them: the seam was designed, then left unconnected.
 *
 * Each test asserts the callback actually fires with the documented payload, so
 * each fails if the prop goes back to being decorative.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AppSidebar } from "../app-sidebar";
import type { NavEntry } from "../types";

beforeEach(() => {
  // AppSidebar auto-scrolls the active row into view on mount. jsdom has no
  // layout engine and does not implement scrollIntoView, so every render throws
  // without this stub — a gap that went unnoticed because this component had
  // no component-tier tests at all before now.
  (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView =
    vi.fn();
});

afterEach(() => cleanup());

const ITEMS: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Home", href: "/home" },
  { id: "inbox", label: "Inbox", href: "/inbox" },
  { id: "off", label: "Disabled", href: "/off", disabled: true },
];

function renderSidebar(props: Record<string, unknown> = {}, currentPath = "/home") {
  return render(<AppSidebar items={ITEMS} currentPath={currentPath} {...props} />);
}

describe("onItemHover", () => {
  it("fires with the hovered item", () => {
    const onItemHover = vi.fn();
    renderSidebar({ onItemHover });

    fireEvent.mouseEnter(screen.getByText("Inbox").closest("a")!);

    expect(onItemHover).toHaveBeenCalledTimes(1);
    expect(onItemHover.mock.calls[0][0].item.id).toBe("inbox");
    expect(onItemHover.mock.calls[0][0].event).toBeTruthy();
  });

  it("stays silent for a disabled row", () => {
    const onItemHover = vi.fn();
    renderSidebar({ onItemHover });

    fireEvent.mouseEnter(screen.getByText("Disabled").closest("a")!);

    // A row the user cannot activate should not report interest in it — a
    // consumer using hover to prefetch would warm unreachable routes.
    expect(onItemHover).not.toHaveBeenCalled();
  });
});

describe("onItemFocus", () => {
  it("fires with the focused item", () => {
    const onItemFocus = vi.fn();
    renderSidebar({ onItemFocus });

    fireEvent.focus(screen.getByText("Inbox").closest("a")!);

    expect(onItemFocus).toHaveBeenCalledTimes(1);
    expect(onItemFocus.mock.calls[0][0].item.id).toBe("inbox");
  });

  it("stays silent for a disabled row", () => {
    const onItemFocus = vi.fn();
    renderSidebar({ onItemFocus });

    fireEvent.focus(screen.getByText("Disabled").closest("a")!);

    expect(onItemFocus).not.toHaveBeenCalled();
  });
});

describe("onMount / onUnmount", () => {
  it("fires onMount once, with the state at mount", () => {
    const onMount = vi.fn();
    const { rerender } = renderSidebar({ onMount });

    expect(onMount).toHaveBeenCalledTimes(1);
    const { initialState } = onMount.mock.calls[0][0];
    expect(initialState.activeItemId).toBe("home");
    expect(typeof initialState.toggleCollapse).toBe("function");

    // Re-rendering is not a second mount.
    rerender(<AppSidebar items={ITEMS} currentPath="/inbox" onMount={onMount} />);
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it("fires onUnmount exactly once when the sidebar goes away", () => {
    const onUnmount = vi.fn();
    const { unmount } = renderSidebar({ onUnmount });

    expect(onUnmount).not.toHaveBeenCalled();
    unmount();
    expect(onUnmount).toHaveBeenCalledTimes(1);
  });
});

describe("onActiveItemChange", () => {
  it("fires when currentPath moves the active item, with both sides", () => {
    const onActiveItemChange = vi.fn();
    const { rerender } = render(
      <AppSidebar items={ITEMS} currentPath="/home" onActiveItemChange={onActiveItemChange} />,
    );

    // The initial value is delivered by onMount's initialState — not a "change".
    expect(onActiveItemChange).not.toHaveBeenCalled();

    rerender(
      <AppSidebar items={ITEMS} currentPath="/inbox" onActiveItemChange={onActiveItemChange} />,
    );

    expect(onActiveItemChange).toHaveBeenCalledTimes(1);
    const args = onActiveItemChange.mock.calls[0][0];
    expect(args.item?.id).toBe("inbox");
    expect(args.previousItem?.id).toBe("home");
  });

  it("does not emit a phantom transition when the path re-renders unchanged", () => {
    const onActiveItemChange = vi.fn();
    const { rerender } = render(
      <AppSidebar items={ITEMS} currentPath="/home" onActiveItemChange={onActiveItemChange} />,
    );

    // Fresh inline callback + fresh items identity, same active id.
    rerender(
      <AppSidebar
        items={[...ITEMS]}
        currentPath="/home"
        onActiveItemChange={onActiveItemChange}
      />,
    );

    expect(onActiveItemChange).not.toHaveBeenCalled();
  });
});
