/**
 * U4 review-fix regressions (ids U4-A .. U4-H; U4-I lives in sidebar-reducer.test.ts).
 */
import { createPortal } from "react-dom";
import { act, fireEvent, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "../app-sidebar";
import { APP_SIDEBAR_CSS_VARS } from "../lib/derive-css-vars";
import type { AppSidebarProps, NavEntry } from "../types";

const ITEMS: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Home", href: "/home" },
  { id: "inbox", label: "Inbox", href: "/inbox" },
  { id: "docs", label: "Docs", href: "/docs" },
];

const nav = (c: HTMLElement) => c.querySelector<HTMLElement>('nav[data-component="app-sidebar"]')!;
const panel = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const focusedIn = (root: Element) =>
  root.querySelector<HTMLElement>('[data-focused="true"]')?.dataset.navId ?? null;

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = vi.fn();
  window.localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

function renderSidebar(props: Partial<AppSidebarProps> = {}) {
  return render(<AppSidebar items={ITEMS} currentPath="/elsewhere" {...props} />);
}

describe("U4-A: drawer width survives the primitive's own width classes", () => {
  it("U4-A: panel carries the var() width for both sides and none of the primitive's w-3/4", async () => {
    renderSidebar({ isMobileOpen: true });
    await flush();
    const cls = panel().className;
    expect(cls).toContain("data-[side=left]:w-(--ilinxa-sidebar-drawer-w,18rem)");
    expect(cls).toContain("data-[side=right]:w-(--ilinxa-sidebar-drawer-w,18rem)");
    expect(cls).not.toContain("w-3/4");
    expect(cls).not.toContain("data-[side=left]:w-3/4");
    expect(cls).not.toContain("data-[side=right]:w-3/4");
  });
});

describe("U4-B: roving focus inside the open drawer", () => {
  it("U4-B: ArrowDown from a drawer row focuses the NEXT row inside the drawer panel, not the hidden rail's copy", async () => {
    const { container } = renderSidebar({ isMobileOpen: true });
    await flush();
    const drawerHome = panel().querySelector<HTMLElement>('a[data-nav-id="home"]')!;
    drawerHome.focus();

    fireEvent.keyDown(drawerHome, { key: "ArrowDown" }); // -> first entry (home)
    fireEvent.keyDown(document.activeElement ?? drawerHome, { key: "ArrowDown" }); // -> inbox

    const active = document.activeElement as HTMLElement;
    expect(panel().contains(active)).toBe(true);
    expect(nav(container).contains(active)).toBe(false);
    expect(active.dataset.navId).toBe("inbox");
    expect(focusedIn(panel())).toBe("inbox");
  });

  it("U4-B: with the drawer closed, focus still goes to the rail", async () => {
    const { container } = renderSidebar();
    fireEvent.keyDown(nav(container), { key: "ArrowDown" });
    const active = document.activeElement as HTMLElement;
    expect(nav(container).contains(active)).toBe(true);
    expect(active.dataset.navId).toBe("home");
  });
});

describe("U4-C: menus and their triggers own their arrow keys", () => {
  it("U4-C: ArrowDown on an aria-haspopup=menu element inside the sidebar does not move roving focus or preventDefault", () => {
    const { container, getByTestId } = renderSidebar({
      topSlot: (
        <button type="button" aria-haspopup="menu" data-testid="hp">
          Switch
        </button>
      ),
    });
    const notPrevented = fireEvent.keyDown(getByTestId("hp"), { key: "ArrowDown" });
    expect(notPrevented).toBe(true);
    expect(focusedIn(nav(container))).toBeNull();
    // control: the same key from the nav chrome IS handled
    expect(fireEvent.keyDown(nav(container), { key: "ArrowDown" })).toBe(false);
    expect(focusedIn(nav(container))).toBe("home");
  });

  it("U4-C: aria-haspopup=false does not opt out", () => {
    const { container, getByTestId } = renderSidebar({
      topSlot: (
        <button type="button" aria-haspopup="false" data-testid="hp">
          x
        </button>
      ),
    });
    expect(fireEvent.keyDown(getByTestId("hp"), { key: "ArrowDown" })).toBe(false);
    expect(focusedIn(nav(container))).toBe("home");
  });

  it("U4-C: a keydown inside a [role=menu] portalled out of a footerSlot is ignored", () => {
    function PortalMenu() {
      return (
        <>
          <span>footer</span>
          {createPortal(
            <div role="menu" data-testid="menu">
              <button role="menuitem" type="button" data-testid="mi">
                Item
              </button>
            </div>,
            document.body,
          )}
        </>
      );
    }
    const { container, getByTestId } = renderSidebar({ footerSlot: <PortalMenu /> });
    const mi = getByTestId("mi");
    expect(nav(container).contains(mi)).toBe(false); // really portalled
    for (const key of ["ArrowDown", "ArrowUp", "Home", "End"]) {
      expect(fireEvent.keyDown(mi, { key })).toBe(true);
    }
    expect(focusedIn(nav(container))).toBeNull();
  });
});

describe("U4-D: names never announce a count nobody can see", () => {
  const row = (c: HTMLElement) => c.querySelector<HTMLElement>('a[data-nav-id="n"]')!;
  const N = { id: "n", label: "Notifications", href: "/n" } as const;

  it("U4-D: badge 5 suppressed by renderBadge={() => null} -> plain label when collapsed, no count in the name", () => {
    const { container } = renderSidebar({
      items: [{ ...N, badge: 5 }],
      renderBadge: () => null,
      defaultCollapsed: true,
    });
    expect(row(container)).toHaveAttribute("aria-label", "Notifications");
  });

  it("U4-D: same suppressed badge expanded -> no aria-label (content names the link)", () => {
    const { container } = renderSidebar({ items: [{ ...N, badge: 5 }], renderBadge: () => null });
    expect(row(container)).not.toHaveAttribute("aria-label");
  });

  it("U4-D: badge '' -> plain accessible name (collapsed: label; expanded: no aria-label)", () => {
    const c = renderSidebar({ items: [{ ...N, badge: "" }], defaultCollapsed: true });
    expect(row(c.container)).toHaveAttribute("aria-label", "Notifications");
    c.unmount();
    const e = renderSidebar({ items: [{ ...N, badge: "" }] });
    expect(row(e.container)).not.toHaveAttribute("aria-label");
  });

  it("U4-D: badge '' renders no badge pill", () => {
    for (const defaultCollapsed of [true, false]) {
      const { container, unmount } = renderSidebar({ items: [{ ...N, badge: "" }], defaultCollapsed });
      expect(row(container).querySelector(".rounded-full")).toBeNull();
      unmount();
    }
  });

  it("U4-D (control): a non-empty badge still produces the badge name", () => {
    const { container } = renderSidebar({ items: [{ ...N, badge: 5 }], defaultCollapsed: true });
    expect(row(container)).toHaveAttribute("aria-label", "Notifications, 5");
  });
});

describe("U4-E: a changed storageKey rehydrates from the NEW key", () => {
  const seed = (key: string, collapsed: boolean) =>
    window.localStorage.setItem(key, JSON.stringify({ v: 1, collapsed, collapsedSectionIds: [] }));

  it("U4-E: uncontrolled sidebar reads key B after rerender (B holds collapsed:true, A holds false)", async () => {
    seed("key-a", false);
    seed("key-b", true);
    const { container, rerender } = render(
      <AppSidebar items={ITEMS} currentPath="/x" storageKey="key-a" />,
    );
    await flush();
    expect(nav(container)).toHaveAttribute("data-collapsed", "false");

    rerender(<AppSidebar items={ITEMS} currentPath="/x" storageKey="key-b" />);
    await flush();
    expect(nav(container)).toHaveAttribute("data-collapsed", "true");
  });

  it("U4-E: the same key re-rendered does not re-read (a user toggle is not clobbered)", async () => {
    seed("key-a", false);
    const { container, rerender, getByRole } = render(
      <AppSidebar items={ITEMS} currentPath="/x" storageKey="key-a" />,
    );
    await flush();
    fireEvent.click(getByRole("button", { name: "Collapse sidebar" }));
    await flush();
    expect(nav(container)).toHaveAttribute("data-collapsed", "true");
    rerender(<AppSidebar items={ITEMS} currentPath="/y" storageKey="key-a" />);
    await flush();
    expect(nav(container)).toHaveAttribute("data-collapsed", "true");
  });
});

describe("U4-F: labels.emptyState may be partial (type-checked here)", () => {
  it("U4-F: a partial emptyState renders its override and leaves other reasons at defaults", async () => {
    const labels: NonNullable<AppSidebarProps["labels"]> = {
      emptyState: { "no-items": { title: "X" } },
    };
    const a = renderSidebar({ items: [], labels });
    await flush();
    expect(within(a.container).getByText("X")).toBeInTheDocument();
    a.unmount();

    const b = renderSidebar({
      items: [{ id: "h", label: "H", href: "/h", hidden: true }],
      labels,
    });
    await flush();
    expect(within(b.container).getByText("All items hidden")).toBeInTheDocument();
    expect(within(b.container).queryByText("X")).toBeNull();
  });
});

describe("U4-G: collapsed-section chevron points to the inline end in both directions", () => {
  it("U4-G: has -rotate-90 and rtl:rotate-90, and no rtl:-scale-x-100 mirror", () => {
    const { container } = renderSidebar({
      items: [
        {
          kind: "section",
          id: "s",
          title: "Projects",
          collapsible: true,
          defaultCollapsed: true,
          items: [{ id: "p", label: "P", href: "/p" }],
        },
      ],
      autoExpandActiveSection: false,
    });
    const btn = nav(container).querySelector<HTMLElement>('button[data-nav-id="s"]')!;
    expect(btn).toHaveAttribute("aria-expanded", "false");
    const cls = btn.querySelector("svg")!.getAttribute("class")!;
    expect(cls).toContain("-rotate-90");
    expect(cls).toContain("rtl:rotate-90");
    expect(cls).not.toContain("rtl:-scale-x-100");
  });

  it("U4-G: an expanded section's chevron is not rotated", () => {
    const { container } = renderSidebar({
      items: [
        {
          kind: "section",
          id: "s",
          title: "Projects",
          collapsible: true,
          items: [{ id: "p", label: "P", href: "/p" }],
        },
      ],
    });
    const cls = nav(container).querySelector('button[data-nav-id="s"] svg')!.getAttribute("class")!;
    expect(cls).not.toContain("-rotate-90");
  });
});

describe("U4-H: foreground and hover surfaces are variable-driven", () => {
  it("U4-H: an inactive row reads --ilinxa-sidebar-fg and --ilinxa-nav-hover-bg with fallbacks", () => {
    const { container } = renderSidebar();
    const cls = nav(container).querySelector<HTMLElement>('a[data-nav-id="home"]')!.className;
    expect(cls).toContain("text-(--ilinxa-sidebar-fg,var(--foreground))");
    expect(cls).toContain("hover:bg-(--ilinxa-nav-hover-bg,var(--muted))");
  });

  it("U4-H: APP_SIDEBAR_CSS_VARS documents both with their defaults", () => {
    expect(APP_SIDEBAR_CSS_VARS["--ilinxa-sidebar-fg"]).toBe("var(--foreground)");
    expect(APP_SIDEBAR_CSS_VARS["--ilinxa-nav-hover-bg"]).toBe("var(--muted)");
  });

  it("U4-H: the nav and the drawer panel read the fg variable too", async () => {
    renderSidebar({ isMobileOpen: true });
    await flush();
    expect(panel().className).toContain("text-(--ilinxa-sidebar-fg,var(--foreground))");
  });
});
