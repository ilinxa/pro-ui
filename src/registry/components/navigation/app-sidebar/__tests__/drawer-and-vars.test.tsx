/**
 * R2/I3 (AS2) - the drawer is never "collapsed".
 * R3/I4 (AS3) - CSS variables: inline only for passed props, ancestors win,
 *               the portalled drawer inherits them, `drawerClassName` / `drawerStyle`.
 */
import { Plus } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { act, fireEvent, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "../app-sidebar";
import { useAppSidebarMode } from "../contexts/sidebar-nav-context";
import { readInheritedCssVars } from "../lib/derive-css-vars";
import type { AppSidebarProps, NavEntry } from "../types";

const ITEMS: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Home", href: "/home" },
  { id: "inbox", label: "Inbox", href: "/inbox", badge: 5 },
];

const nav = (c: HTMLElement) => c.querySelector<HTMLElement>('nav[data-component="app-sidebar"]')!;
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

function renderSidebar(props: Partial<AppSidebarProps> = {}, wrap?: (n: ReactNode) => ReactNode) {
  const el = <AppSidebar items={ITEMS} currentPath="/home" {...props} />;
  return render(<>{wrap ? wrap(el) : el}</>);
}

const FULL: Partial<AppSidebarProps> = {
  isCollapsed: true,
  isMobileOpen: true,
  brand: { label: "Acme", logo: <span>L</span> },
  primaryAction: { icon: Plus, label: "Create post", onClick: () => {} },
  footer: { user: { name: "Ada Lovelace", handle: "@ada" }, menuItems: [] },
};

describe("R2/I3: drawer renders the full (non-collapsed) chrome while the rail is collapsed", () => {
  it("R2/I3: user name, brand label and primary-action label are visible text inside the drawer", async () => {
    const { container } = renderSidebar(FULL);
    await flush();
    expect(nav(container)).toHaveAttribute("data-collapsed", "true");

    const d = within(panel());
    expect(d.getByText("Ada Lovelace")).toBeVisible();
    expect(d.getByText("@ada")).toBeVisible();
    expect(d.getByText("Acme")).toBeVisible();
    expect(d.getByText("Create post")).toBeVisible();
  });

  it("R2/I3: the collapsed rail (same render) keeps the icon-only variants - proves the drawer difference is real", async () => {
    const { container } = renderSidebar(FULL);
    await flush();
    const rail = within(nav(container));
    expect(rail.queryByText("Ada Lovelace")).toBeNull();
    expect(rail.queryByText("Acme")).toBeNull();
    // icon-only controls fall back to aria-labels (the label survives only in the
    // hidden tooltip, never as the button's own text)
    const action = rail.getByRole("button", { name: "Create post", hidden: true });
    expect(action.textContent).toBe("");
    expect(rail.getByRole("button", { name: "Ada Lovelace — open menu", hidden: true })).toBeInTheDocument();
  });

  it("R2/I3: the badge is inline-end in the drawer but a corner badge on the collapsed rail", async () => {
    const { container } = renderSidebar(FULL);
    await flush();
    const drawerBadge = within(panel()).getByText("5");
    expect(drawerBadge.className).not.toContain("absolute");
    expect(drawerBadge.className).toContain("relative");
    const railBadge = within(nav(container)).getByText("5");
    expect(railBadge.className).toContain("absolute");
    expect(railBadge.className).toContain("-top-2");
  });

  it("R2/I3: renderItem receives isCollapsed:false for drawer rows and true for rail rows", async () => {
    const renderItem = vi.fn(({ item, isCollapsed, defaultRender }) => (
      <div data-testid={`ri-${item.id}`} data-arg={String(isCollapsed)}>
        {defaultRender}
      </div>
    ));
    const { container } = renderSidebar({ ...FULL, renderItem });
    await flush();

    const drawerRows = panel().querySelectorAll<HTMLElement>('[data-testid^="ri-"]');
    const railRows = nav(container).querySelectorAll<HTMLElement>('[data-testid^="ri-"]');
    expect(drawerRows).toHaveLength(2);
    expect(railRows).toHaveLength(2);
    for (const r of drawerRows) expect(r.dataset.arg).toBe("false");
    for (const r of railRows) expect(r.dataset.arg).toBe("true");
    // and the callback itself was invoked with both values
    const seen = new Set(renderItem.mock.calls.map((c) => c[0].isCollapsed));
    expect(seen).toEqual(new Set([true, false]));
  });

  it("R2/I3: a topSlot function receives {mode:'mobile', isCollapsed:false} for the drawer and {mode:'desktop', isCollapsed:true} for the rail", async () => {
    const topSlot = vi.fn(({ mode }: { mode: string }) => <div data-testid={`top-${mode}`}>{mode}</div>);
    const { container } = renderSidebar({ ...FULL, topSlot });
    await flush();

    const calls = topSlot.mock.calls.map((c) => c[0]);
    expect(calls).toContainEqual({ mode: "mobile", isCollapsed: false });
    expect(calls).toContainEqual({ mode: "desktop", isCollapsed: true });
    expect(within(panel()).getByTestId("top-mobile")).toBeInTheDocument();
    expect(within(nav(container)).getByTestId("top-desktop")).toBeInTheDocument();
  });

  it("R2/I3: a static topSlot node is still rendered in both places (function form is additive)", async () => {
    const { container } = renderSidebar({ ...FULL, topSlot: <div data-testid="static-top" /> });
    await flush();
    expect(within(panel()).getByTestId("static-top")).toBeInTheDocument();
    expect(within(nav(container)).getByTestId("static-top")).toBeInTheDocument();
  });

  it("R2/I3: useAppSidebarMode() inside footerSlot is 'mobile' in the drawer and 'desktop' on the rail", async () => {
    function Mode() {
      return <span data-testid="mode">{String(useAppSidebarMode())}</span>;
    }
    const { container } = renderSidebar({ ...FULL, footer: undefined, footerSlot: <Mode /> });
    await flush();
    expect(within(panel()).getByTestId("mode")).toHaveTextContent("mobile");
    expect(within(nav(container)).getByTestId("mode")).toHaveTextContent("desktop");
  });

  it("R2/I3: useAppSidebarMode() is null outside any AppSidebar", () => {
    function Mode() {
      return <span data-testid="mode">{String(useAppSidebarMode())}</span>;
    }
    const { getByTestId } = render(<Mode />);
    expect(getByTestId("mode")).toHaveTextContent("null");
  });
});

describe("R3/I4: CSS variables", () => {
  it("R3/I4: the <nav> has NO inline --ilinxa-* style when no sizing prop was passed", () => {
    const { container } = renderSidebar();
    const n = nav(container);
    expect(n.style.length).toBe(0);
    expect(n.getAttribute("style") ?? "").not.toContain("--ilinxa");
  });

  it("R3/I4: collapsedWidth alone sets exactly that one var inline", () => {
    const { container } = renderSidebar({ collapsedWidth: "4rem" });
    const n = nav(container);
    expect(n.style.getPropertyValue("--ilinxa-sidebar-w-collapsed")).toBe("4rem");
    expect(n.style.length).toBe(1);
  });

  it("R3/I4: `style` reaches the nav and merges after the derived vars", () => {
    const { container } = renderSidebar({
      collapsedWidth: "4rem",
      style: { minWidth: "123px", "--ilinxa-nav-active-bg": "blue" } as CSSProperties,
    });
    const n = nav(container);
    expect(n.style.minWidth).toBe("123px");
    expect(n.style.getPropertyValue("--ilinxa-nav-active-bg")).toBe("blue");
    expect(n.style.getPropertyValue("--ilinxa-sidebar-w-collapsed")).toBe("4rem");
  });

  it("R3/I4: drawerClassName and drawerStyle reach the drawer panel", async () => {
    renderSidebar({
      isMobileOpen: true,
      drawerClassName: "my-drawer-class",
      drawerStyle: { "--ilinxa-sidebar-drawer-w": "22rem" } as CSSProperties,
    });
    await flush();
    expect(panel().classList.contains("my-drawer-class")).toBe(true);
    expect(panel().style.getPropertyValue("--ilinxa-sidebar-drawer-w")).toBe("22rem");
  });

  it("R3/I4: the panel reads the drawer width through var() with the 18rem default as fallback", async () => {
    renderSidebar({ isMobileOpen: true });
    await flush();
    expect(panel().className).toContain("w-(--ilinxa-sidebar-drawer-w,18rem)");
  });

  it("R3/I4: an ancestor-declared --ilinxa-nav-active-bg reaches the portalled drawer panel when it opens", async () => {
    // jsdom's getComputedStyle propagates custom properties from ancestors; if
    // this assertion ever fails because of a jsdom change, test
    // `readInheritedCssVars` directly (next test) rather than weakening this one.
    function Host() {
      return (
        <div style={{ "--ilinxa-nav-active-bg": "red" } as CSSProperties}>
          <AppSidebar items={ITEMS} currentPath="/home" isMobileOpen onMobileOpenChange={() => {}} />
        </div>
      );
    }
    render(<Host />);
    await flush();
    expect(panel().style.getPropertyValue("--ilinxa-nav-active-bg")).toBe("red");
    // vars nobody declared are NOT copied (read-site fallbacks still apply)
    expect(panel().style.getPropertyValue("--ilinxa-sidebar-bg")).toBe("");
  });

  it("R3/I4: readInheritedCssVars returns only declared variables", () => {
    const outer = document.createElement("div");
    outer.style.setProperty("--ilinxa-nav-badge-size", "2rem");
    const inner = document.createElement("div");
    outer.appendChild(inner);
    document.body.appendChild(outer);
    try {
      const got = readInheritedCssVars(inner) as Record<string, string>;
      // jsdom inherits custom properties (proven by the portalled-drawer test above).
      expect(got).toEqual({ "--ilinxa-nav-badge-size": "2rem" });
      const own = readInheritedCssVars(outer) as Record<string, string>;
      expect(own).toEqual({ "--ilinxa-nav-badge-size": "2rem" });
    } finally {
      outer.remove();
    }
  });

  it("R3/I4: prop-passed values still win - drawerStyle overrides the inherited ancestor value on the panel", async () => {
    function Host() {
      return (
        <div style={{ "--ilinxa-nav-active-bg": "red" } as CSSProperties}>
          <AppSidebar
            items={ITEMS}
            currentPath="/home"
            isMobileOpen
            drawerStyle={{ "--ilinxa-nav-active-bg": "blue" } as CSSProperties}
          />
        </div>
      );
    }
    render(<Host />);
    await flush();
    expect(panel().style.getPropertyValue("--ilinxa-nav-active-bg")).toBe("blue");
  });

  it("R3/I4: the nav's own inline value (collapsedWidth) beats an ancestor declaration", () => {
    function Host() {
      return (
        <div style={{ "--ilinxa-sidebar-w-collapsed": "1rem" } as CSSProperties}>
          <AppSidebar items={ITEMS} currentPath="/home" collapsedWidth="4rem" />
        </div>
      );
    }
    const { container } = render(<Host />);
    expect(nav(container).style.getPropertyValue("--ilinxa-sidebar-w-collapsed")).toBe("4rem");
  });

  it("R4: the previously inert row vars are READ by the rendered rows (var(--ilinxa-sidebar-row-h, default))", () => {
    const { container } = renderSidebar();
    const link = within(nav(container)).getByRole("link", { name: "Home" });
    expect(link.className).toContain("min-h-(--ilinxa-sidebar-row-h,2.75rem)");
    expect(link.className).toContain("px-(--ilinxa-sidebar-px,0.75rem)");
  });
});

describe("I3/C2: drawer close button", () => {
  it("I3: the drawer has a close button named by labels.closeNavigation (default) and no element with text 'Close'", async () => {
    renderSidebar({ isMobileOpen: true });
    await flush();
    const d = within(panel());
    expect(d.getByRole("button", { name: "Close navigation" })).toBeInTheDocument();
    expect(d.queryByText(/^Close$/)).toBeNull();
    expect(panel().querySelector(".sr-only:not(h2)")?.textContent ?? "").not.toBe("Close");
  });

  it("I3: a custom labels.closeNavigation names the close button", async () => {
    renderSidebar({ isMobileOpen: true, labels: { closeNavigation: "Dismiss menu" } });
    await flush();
    expect(within(panel()).getByRole("button", { name: "Dismiss menu" })).toBeInTheDocument();
    expect(within(panel()).queryByRole("button", { name: "Close navigation" })).toBeNull();
  });

  it("I3: clicking the close button requests close with onMobileOpenChange", async () => {
    const onMobileOpenChange = vi.fn();
    renderSidebar({ isMobileOpen: true, onMobileOpenChange });
    await flush();
    fireEvent.click(within(panel()).getByRole("button", { name: "Close navigation" }));
    await flush();
    expect(onMobileOpenChange).toHaveBeenCalledWith(expect.objectContaining({ open: false }));
  });
});
