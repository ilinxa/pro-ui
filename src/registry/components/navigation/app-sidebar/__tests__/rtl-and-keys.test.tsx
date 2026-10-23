/**
 * I7 (AS8/C4) - RTL: keys, border, tooltip side, drawer side.
 * C9 - the roving-focus handler ignores editable targets.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "../app-sidebar";
import { isEditableTarget } from "../lib/keyboard-handler";
import type { AppSidebarProps, NavEntry } from "../types";

const ITEMS: ReadonlyArray<NavEntry> = [
  {
    kind: "section",
    id: "sec",
    title: "Projects",
    collapsible: true,
    items: [
      { id: "p1", label: "Alpha", href: "/p1" },
      { id: "p2", label: "Beta", href: "/p2" },
    ],
  },
  { id: "home", label: "Home", href: "/home" },
  { id: "inbox", label: "Inbox", href: "/inbox" },
];

const nav = (c: HTMLElement) => c.querySelector<HTMLElement>('nav[data-component="app-sidebar"]')!;
const focusedId = (c: HTMLElement) =>
  nav(c).querySelector<HTMLElement>('[data-focused="true"]')?.dataset.navId ?? null;
const header = (c: HTMLElement) => nav(c).querySelector<HTMLElement>('button[data-nav-id="sec"]')!;
const panel = () => document.querySelector<HTMLElement>('[role="dialog"]')!;

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = vi.fn();
});
afterEach(() => vi.restoreAllMocks());

function renderSidebar(props: Partial<AppSidebarProps> = {}) {
  return render(<AppSidebar items={ITEMS} currentPath="/elsewhere" {...props} />);
}

/** Put roving focus on the collapsible section header via the real key path. */
function focusHeader(container: HTMLElement) {
  fireEvent.keyDown(nav(container), { key: "ArrowDown" });
  expect(focusedId(container)).toBe("sec");
  return header(container);
}

describe("I7: horizontal arrows mirror in RTL", () => {
  it("I7: LTR - ArrowLeft collapses an expanded section, ArrowRight re-expands it", () => {
    const { container } = renderSidebar({ dir: "ltr" });
    const h = focusHeader(container);
    expect(h).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(h, { key: "ArrowLeft" });
    expect(h).toHaveAttribute("aria-expanded", "false");
    fireEvent.keyDown(h, { key: "ArrowRight" });
    expect(h).toHaveAttribute("aria-expanded", "true");
  });

  it("I7: LTR - the 'wrong' arrow is inert (ArrowRight on an EXPANDED section does nothing)", () => {
    const { container } = renderSidebar({ dir: "ltr" });
    const h = focusHeader(container);
    const notPrevented = fireEvent.keyDown(h, { key: "ArrowRight" });
    expect(h).toHaveAttribute("aria-expanded", "true");
    expect(notPrevented).toBe(true);
  });

  it("I7: RTL (dir prop) - ArrowRight collapses an expanded section, ArrowLeft expands it", () => {
    const { container } = renderSidebar({ dir: "rtl" });
    const h = focusHeader(container);
    expect(h).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(h, { key: "ArrowRight" });
    expect(h).toHaveAttribute("aria-expanded", "false");
    fireEvent.keyDown(h, { key: "ArrowLeft" });
    expect(h).toHaveAttribute("aria-expanded", "true");
  });

  it("I7: RTL - ArrowLeft on an expanded section does nothing", () => {
    const { container } = renderSidebar({ dir: "rtl" });
    const h = focusHeader(container);
    fireEvent.keyDown(h, { key: "ArrowLeft" });
    expect(h).toHaveAttribute("aria-expanded", "true");
  });

  it("I7: an ancestor <div dir=rtl> WITHOUT the prop resolves rtl after mount (keys mirror)", async () => {
    const { container } = render(
      <div dir="rtl">
        <AppSidebar items={ITEMS} currentPath="/elsewhere" />
      </div>,
    );
    await act(async () => {});
    const h = focusHeader(container);
    fireEvent.keyDown(h, { key: "ArrowRight" });
    expect(h).toHaveAttribute("aria-expanded", "false");
  });

  it("I7: with no rtl ancestor the direction stays ltr", async () => {
    const { container } = renderSidebar();
    await act(async () => {});
    const h = focusHeader(container);
    fireEvent.keyDown(h, { key: "ArrowRight" });
    expect(h).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(h, { key: "ArrowLeft" });
    expect(h).toHaveAttribute("aria-expanded", "false");
  });
});

describe("roving focus keys (direction independent)", () => {
  it.each(["ltr", "rtl"] as const)("I7: ArrowDown/ArrowUp/Home/End move focus (%s)", (dir) => {
    const { container } = renderSidebar({ dir });
    fireEvent.keyDown(nav(container), { key: "ArrowDown" });
    expect(focusedId(container)).toBe("sec");
    fireEvent.keyDown(nav(container), { key: "ArrowDown" });
    expect(focusedId(container)).toBe("p1");
    fireEvent.keyDown(nav(container), { key: "ArrowDown" });
    expect(focusedId(container)).toBe("p2");
    fireEvent.keyDown(nav(container), { key: "ArrowUp" });
    expect(focusedId(container)).toBe("p1");
    fireEvent.keyDown(nav(container), { key: "End" });
    expect(focusedId(container)).toBe("inbox");
    fireEvent.keyDown(nav(container), { key: "Home" });
    expect(focusedId(container)).toBe("sec");
    // DOM focus follows the roving id
    expect(document.activeElement).toBe(header(container));
  });

  it("I7: ArrowDown wraps from the last entry to the first, ArrowUp from the first to the last", () => {
    const { container } = renderSidebar();
    fireEvent.keyDown(nav(container), { key: "End" });
    expect(focusedId(container)).toBe("inbox");
    fireEvent.keyDown(nav(container), { key: "ArrowDown" });
    expect(focusedId(container)).toBe("sec");
    fireEvent.keyDown(nav(container), { key: "ArrowUp" });
    expect(focusedId(container)).toBe("inbox");
  });
});

describe("C9: editable targets keep their keys", () => {
  it("C9: a keydown from an <input> inside topSlot does not move focus and is not prevented", () => {
    const { container, getByTestId } = renderSidebar({
      topSlot: <input data-testid="search" aria-label="Search" />,
    });
    // control: from a non-editable target the same key IS handled
    const handled = fireEvent.keyDown(nav(container), { key: "ArrowDown" });
    expect(handled).toBe(false);
    expect(focusedId(container)).toBe("sec");

    const input = getByTestId("search");
    input.focus();
    const notPrevented = fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(notPrevented).toBe(true);
    expect(focusedId(container)).toBe("sec");
    // the input keeps DOM focus: roving focus did not steal it
    expect(document.activeElement).toBe(input);
  });

  it("C9: Home/End and horizontal arrows from the input are also left alone", () => {
    const { container, getByTestId } = renderSidebar({
      topSlot: <input data-testid="search" aria-label="Search" />,
    });
    const h = focusHeader(container);
    const input = getByTestId("search");
    for (const key of ["Home", "End", "ArrowLeft", "ArrowRight", "ArrowUp"]) {
      expect(fireEvent.keyDown(input, { key })).toBe(true);
    }
    expect(focusedId(container)).toBe("sec");
    expect(h).toHaveAttribute("aria-expanded", "true");
  });
});

describe("isEditableTarget (C9)", () => {
  const make = (tag: string, attrs: Record<string, string> = {}) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };

  it.each([["input"], ["textarea"], ["select"]])("<%s> is editable", (tag) => {
    expect(isEditableTarget(make(tag))).toBe(true);
  });

  it.each([["textbox"], ["combobox"], ["listbox"], ["slider"], ["spinbutton"], ["searchbox"]])(
    "role=%s is editable",
    (role) => {
      expect(isEditableTarget(make("div", { role }))).toBe(true);
    },
  );

  it("contenteditable is editable", () => {
    const el = make("div", { contenteditable: "true" });
    // jsdom does not implement `isContentEditable`; supply what a browser reports.
    Object.defineProperty(el, "isContentEditable", { value: true });
    expect(isEditableTarget(el)).toBe(true);
  });

  it("a button, a link and a plain div are not editable", () => {
    expect(isEditableTarget(make("button"))).toBe(false);
    expect(isEditableTarget(make("a", { href: "/x" }))).toBe(false);
    expect(isEditableTarget(make("div"))).toBe(false);
  });

  it("role=menuitem / role=button are not editable", () => {
    expect(isEditableTarget(make("div", { role: "menuitem" }))).toBe(false);
    expect(isEditableTarget(make("div", { role: "button" }))).toBe(false);
  });

  it("non-element targets are not editable", () => {
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget(window)).toBe(false);
  });
});

describe("I7: layout mirrors", () => {
  it("I7: side='start' puts the border on the inline-end edge (border-e) in either direction", () => {
    for (const dir of ["ltr", "rtl"] as const) {
      const { container, unmount } = renderSidebar({ side: "start", dir });
      expect(nav(container).className).toContain("border-e");
      expect(nav(container).className).not.toContain("border-s");
      expect(nav(container)).toHaveAttribute("dir", dir);
      unmount();
    }
  });

  it("I7: side='end' -> border-s; physical side='left' keeps border-r with the rtl: override", () => {
    const end = renderSidebar({ side: "end" });
    expect(nav(end.container).className).toContain("border-s");
    end.unmount();
    const left = renderSidebar({ side: "left" });
    expect(nav(left.container).className).toContain("border-r");
    expect(nav(left.container).className).toContain("rtl:border-x-0");
  });

  it("I7: side='start' + dir=rtl -> the drawer opens from the RIGHT; ltr -> LEFT", async () => {
    const rtl = renderSidebar({ side: "start", dir: "rtl", isMobileOpen: true });
    await flush();
    expect(panel()).toHaveAttribute("data-side", "right");
    expect(panel().className).toContain("data-[side=right]:right-0");
    expect(panel()).toHaveAttribute("dir", "rtl");
    rtl.unmount();

    const ltr = renderSidebar({ side: "start", dir: "ltr", isMobileOpen: true });
    await flush();
    expect(panel()).toHaveAttribute("data-side", "left");
    ltr.unmount();
  });

  it("I7: side='end' + ltr -> right; mobileDrawerSide overrides side for the drawer only", async () => {
    const a = renderSidebar({ side: "end", dir: "ltr", isMobileOpen: true });
    await flush();
    expect(panel()).toHaveAttribute("data-side", "right");
    a.unmount();

    const b = renderSidebar({ side: "start", dir: "ltr", mobileDrawerSide: "end", isMobileOpen: true });
    await flush();
    expect(panel()).toHaveAttribute("data-side", "right");
    b.unmount();
  });

  it("I7: an ancestor <div dir=rtl> (no prop) also mirrors the drawer side", async () => {
    render(
      <div dir="rtl">
        <AppSidebar items={ITEMS} currentPath="/elsewhere" isMobileOpen />
      </div>,
    );
    await flush();
    expect(panel()).toHaveAttribute("data-side", "right");
  });

  it("I7: collapsed-row tooltips open toward the content - 'right' in LTR, 'left' in RTL", () => {
    const sideOf = (container: HTMLElement) =>
      nav(container).querySelector<HTMLElement>('[role="tooltip"]')?.dataset.side;

    const ltr = renderSidebar({ defaultCollapsed: true, dir: "ltr" });
    expect(sideOf(ltr.container)).toBe("right");
    ltr.unmount();

    const rtl = renderSidebar({ defaultCollapsed: true, dir: "rtl" });
    expect(sideOf(rtl.container)).toBe("left");
    rtl.unmount();

    // a rail placed on the end edge of an LTR page opens its tooltips to the left
    const end = renderSidebar({ defaultCollapsed: true, dir: "ltr", side: "end" });
    expect(sideOf(end.container)).toBe("left");
  });

  it("I7: the collapse glyph is mirrored for a right-edge rail only", () => {
    const left = renderSidebar({ dir: "ltr" });
    expect(nav(left.container).querySelector('button[aria-label="Collapse sidebar"] svg')!.getAttribute("class")).not.toContain("-scale-x-100");
    left.unmount();
    const right = renderSidebar({ dir: "ltr", side: "end" });
    expect(nav(right.container).querySelector('button[aria-label="Collapse sidebar"] svg')!.getAttribute("class")).toContain("-scale-x-100");
  });

  it("I7: the active bar and badge anchor use logical classes (no physical left/right pair)", () => {
    const { container } = render(
      <AppSidebar
        items={[{ id: "home", label: "Home", href: "/home", badge: 3 }]}
        currentPath="/home"
        activeVariant="left-bar"
        defaultCollapsed
      />,
    );
    const link = nav(container).querySelector<HTMLElement>('a[data-nav-id="home"]')!;
    expect(link.className).toContain("before:start-0");
    expect(link.className).not.toMatch(/before:(left|right)-0/);
    expect(link.querySelector(".rounded-full")!.className).toContain("-end-2");
  });
});
