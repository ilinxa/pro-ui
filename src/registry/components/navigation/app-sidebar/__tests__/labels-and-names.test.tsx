/**
 * I5 (AS4/C2) - every rendered string comes from `labels`.
 * R5/I6 (AS5) - badge-aware accessible names.
 * AS6/AS7 (C1) - presence dots, brand tone, activeTone.
 * C3 - formatBadgeCount.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "../app-sidebar";
import { AppSidebarContext } from "../contexts/sidebar-nav-context";
import { DEFAULT_APP_SIDEBAR_LABELS } from "../lib/labels";
import { SidebarEmptyState } from "../parts/sidebar-empty-state";
import { AppSidebarTrigger } from "../parts/sidebar-nav-trigger";
import type {
  AppSidebarEmptyReason,
  AppSidebarLabels,
  AppSidebarProps,
  NavEntry,
  NavItem,
} from "../types";

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = vi.fn();
});
afterEach(() => vi.restoreAllMocks());

const nav = (c: HTMLElement) => c.querySelector<HTMLElement>('nav[data-component="app-sidebar"]')!;

/* ------------------------------------------------------------------ I5 -- */

const REASONS: AppSidebarEmptyReason[] = [
  "no-items",
  "all-filtered-by-permission",
  "all-hidden",
  "all-filtered-by-loading",
];

/** Every label replaced by a sentinel; functions return sentinels too. */
const SENTINEL: AppSidebarLabels = {
  navigation: "@@navigation",
  expandSidebar: "@@expandSidebar",
  collapseSidebar: "@@collapseSidebar",
  openNavigation: "@@openNavigation",
  closeNavigation: "@@closeNavigation",
  skipToContent: "@@skipToContent",
  loading: "@@loading",
  userMenu: (name) => `@@userMenu(${name})`,
  itemWithBadge: (label, value) => `@@itemWithBadge(${label},${value})`,
  itemWithIndicator: (label) => `@@itemWithIndicator(${label})`,
  emptyState: {
    "no-items": { title: "@@empty.no-items.title", body: "@@empty.no-items.body" },
    "all-filtered-by-permission": { title: "@@empty.perm.title", body: "@@empty.perm.body" },
    "all-hidden": { title: "@@empty.hidden.title", body: "@@empty.hidden.body" },
    "all-filtered-by-loading": { title: "@@empty.loading.title", body: "@@empty.loading.body" },
  },
};

/** English fragments that must never survive an override. Computed from the defaults. */
function forbiddenFragments(): string[] {
  const d = DEFAULT_APP_SIDEBAR_LABELS;
  const out: string[] = [
    d.navigation,
    d.expandSidebar,
    d.collapseSidebar,
    d.openNavigation,
    d.closeNavigation,
    d.skipToContent,
    d.loading,
  ];
  // function labels: call with a token and keep the surrounding fixed text
  const T = "\u0001";
  out.push(d.userMenu(T).replace(T, ""));
  out.push(d.itemWithIndicator(T).replace(T, ""));
  for (const reason of REASONS) {
    out.push(d.emptyState[reason].title);
    const body = d.emptyState[reason].body;
    if (body) out.push(body);
  }
  return out.filter((f) => f.trim().length > 0);
}

/** Text nodes + aria-label / title / placeholder / alt of everything in the document. */
function renderedStrings(): string[] {
  const out: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = (n.textContent ?? "").trim();
    if (t) out.push(t);
  }
  for (const el of document.body.querySelectorAll("*")) {
    for (const attr of ["aria-label", "title", "placeholder", "alt"]) {
      const v = el.getAttribute(attr);
      if (v) out.push(v);
    }
  }
  return out;
}

function expectNoDefaultEnglish() {
  const strings = renderedStrings();
  for (const fragment of forbiddenFragments()) {
    const hits = strings.filter((s) => s.includes(fragment));
    expect(hits, `default English "${fragment}" leaked`).toEqual([]);
  }
  return strings;
}

const WITH_BADGES: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Home", href: "/home" },
  { id: "inbox", label: "Inbox", href: "/inbox", badge: 5 },
  { id: "alerts", label: "Alerts", href: "/alerts", badge: { value: 1, variant: "dot" } },
];

const CHROME: Partial<AppSidebarProps> = {
  labels: SENTINEL,
  skipLinkTarget: "#main",
  brand: { label: "Acme" },
  headerSlot: <AppSidebarTrigger />,
  footer: { user: { name: "Ada Lovelace" }, menuItems: [] },
};

describe("I5: sentinel walk - no default English string survives full label override", () => {
  it("I5: expanded", async () => {
    render(<AppSidebar items={WITH_BADGES} currentPath="/home" {...CHROME} />);
    await flush();
    const strings = expectNoDefaultEnglish();
    // positive controls: the sentinels really are what rendered
    expect(strings).toContain("@@navigation");
    expect(strings).toContain("@@collapseSidebar");
    expect(strings).toContain("@@skipToContent");
    expect(strings).toContain("@@openNavigation");
    expect(strings).toContain("@@itemWithBadge(Inbox,5)");
    expect(strings).toContain("@@itemWithIndicator(Alerts)");
  });

  it("I5 (negative control): WITHOUT overrides the walker does find the default English - the check can fail", async () => {
    render(
      <AppSidebar items={WITH_BADGES} currentPath="/home" skipLinkTarget="#main" loading={false} />,
    );
    await flush();
    const strings = renderedStrings();
    const leaked = forbiddenFragments().filter((f) => strings.some((s) => s.includes(f)));
    expect(leaked).toContain("Main navigation");
    expect(leaked).toContain("Collapse sidebar");
    expect(leaked).toContain("Skip to content");
  });

  it("I5: collapsed", async () => {
    render(<AppSidebar items={WITH_BADGES} currentPath="/home" defaultCollapsed {...CHROME} />);
    await flush();
    const strings = expectNoDefaultEnglish();
    expect(strings).toContain("@@expandSidebar");
    expect(strings).toContain("@@userMenu(Ada Lovelace)");
    expect(strings).toContain("@@itemWithBadge(Inbox,5)");
  });

  it("I5: drawer open (rail collapsed underneath)", async () => {
    render(<AppSidebar items={WITH_BADGES} currentPath="/home" isMobileOpen {...CHROME} />);
    await flush();
    const strings = expectNoDefaultEnglish();
    expect(strings).toContain("@@closeNavigation");
    // the drawer title is the (overridden) navigation label
    expect(document.querySelector('[role="dialog"]')).toHaveAccessibleName("@@navigation");
  });

  it("I5: loading", async () => {
    render(<AppSidebar items={WITH_BADGES} currentPath="/home" loading {...CHROME} />);
    await flush();
    const strings = expectNoDefaultEnglish();
    expect(strings).toContain("@@loading");
  });

  it.each([
    ["no-items", [] as NavEntry[], "@@empty.no-items.title", "@@empty.no-items.body", undefined],
    [
      "all-filtered-by-permission",
      [{ id: "a", label: "A", href: "/a", permission: "x" }] as NavEntry[],
      "@@empty.perm.title",
      "@@empty.perm.body",
      new Set<string>(),
    ],
    [
      "all-hidden",
      [{ id: "a", label: "A", href: "/a", hidden: true }] as NavEntry[],
      "@@empty.hidden.title",
      "@@empty.hidden.body",
      undefined,
    ],
  ])("I5: empty state reason %s", async (_reason, items, title, body, permissions) => {
    render(<AppSidebar items={items} currentPath="/x" permissions={permissions} {...CHROME} />);
    await flush();
    const strings = expectNoDefaultEnglish();
    expect(strings).toContain(title);
    expect(strings).toContain(body);
  });

  it("I5: empty state reason all-filtered-by-loading (not emitted by AppSidebar itself; rendered through the labels context)", () => {
    // AppSidebar never selects this reason, but the part is public-shaped and
    // reads copy from the context labels - so check it the same way.
    render(
      <AppSidebarContext.Provider value={{ labels: SENTINEL } as never}>
        <SidebarEmptyState reason="all-filtered-by-loading" />
      </AppSidebarContext.Provider>,
    );
    const strings = expectNoDefaultEnglish();
    expect(strings).toContain("@@empty.loading.title");
    expect(strings).toContain("@@empty.loading.body");
  });

  it("I5: legacy `aria-label` / `skipLinkLabel` props still override the labels", async () => {
    const { container } = render(
      <AppSidebar
        items={WITH_BADGES}
        currentPath="/home"
        {...CHROME}
        aria-label="Legacy nav"
        skipLinkLabel="Legacy skip"
      />,
    );
    await flush();
    expect(nav(container)).toHaveAttribute("aria-label", "Legacy nav");
    expect(container.querySelector("[data-sidebar-skip-link]")).toHaveTextContent("Legacy skip");
  });

  it("I5: a partial `labels` keeps the remaining defaults", async () => {
    const { container } = render(
      <AppSidebar items={WITH_BADGES} currentPath="/home" labels={{ navigation: "Menu" }} />,
    );
    await flush();
    expect(nav(container)).toHaveAttribute("aria-label", "Menu");
    expect(container.querySelector('button[aria-label="Collapse sidebar"]')).not.toBeNull();
  });
});

/* -------------------------------------------------------------- R5 / I6 -- */

function rowOf(container: HTMLElement, id: string) {
  return container.querySelector<HTMLElement>(`a[data-nav-id="${id}"]`)!;
}

function renderRow(item: NavItem, extra: Partial<AppSidebarProps> = {}) {
  return render(
    <AppSidebar
      items={[{ id: "home", label: "Home", href: "/home" }, item]}
      currentPath="/home"
      {...extra}
    />,
  );
}

const NOTIF = { id: "n", label: "Notifications", href: "/n" } as const;

describe("R5/I6: badge-aware accessible names", () => {
  it("R5/I6: collapsed row with badge 5 is named labels.itemWithBadge(label, 5)", () => {
    const { container } = renderRow({ ...NOTIF, badge: 5 }, { defaultCollapsed: true });
    expect(rowOf(container, "n")).toHaveAttribute("aria-label", "Notifications, 5");
  });

  it("R5/I6: the same row EXPANDED has the same name (the badge is not lost when the label is visible)", () => {
    const { container } = renderRow({ ...NOTIF, badge: 5 });
    expect(rowOf(container, "n")).toHaveAttribute("aria-label", "Notifications, 5");
  });

  it("R5/I6: the name comes from labels.itemWithBadge, not a hard-coded format (both states)", () => {
    const labels = { itemWithBadge: (l: string, v: number | string) => `${l} (${v} unread)` };
    for (const defaultCollapsed of [true, false]) {
      const { container, unmount } = renderRow({ ...NOTIF, badge: 5 }, { labels, defaultCollapsed });
      expect(rowOf(container, "n")).toHaveAttribute("aria-label", "Notifications (5 unread)");
      unmount();
    }
  });

  it("R5/I6: the name uses the RAW value, not the capped visible text", () => {
    const { container } = renderRow({ ...NOTIF, badge: 120 });
    expect(rowOf(container, "n")).toHaveAttribute("aria-label", "Notifications, 120");
    expect(rowOf(container, "n")).toHaveTextContent("9+");
  });

  it("R5/I6: string badge value", () => {
    const { container } = renderRow({ ...NOTIF, badge: "new" });
    expect(rowOf(container, "n")).toHaveAttribute("aria-label", "Notifications, new");
  });

  it("R5/I6: a hidden zero badge -> plain label when collapsed, NO aria-label when expanded", () => {
    const c = renderRow({ ...NOTIF, badge: 0 }, { defaultCollapsed: true });
    expect(rowOf(c.container, "n")).toHaveAttribute("aria-label", "Notifications");
    c.unmount();
    const e = renderRow({ ...NOTIF, badge: 0 });
    expect(rowOf(e.container, "n")).not.toHaveAttribute("aria-label");
  });

  it("R5/I6: showZero makes the zero a shown badge with a badge name", () => {
    const { container } = renderRow({ ...NOTIF, badge: { value: 0, showZero: true } });
    expect(rowOf(container, "n")).toHaveAttribute("aria-label", "Notifications, 0");
  });

  it("R5/I6/C6: { value: null } renders NO badge element and keeps the plain name (both states)", () => {
    const e = renderRow({ ...NOTIF, badge: { value: null } });
    expect(rowOf(e.container, "n")).not.toHaveAttribute("aria-label");
    expect(rowOf(e.container, "n").querySelector(".rounded-full")).toBeNull();
    e.unmount();
    const c = renderRow({ ...NOTIF, badge: { value: null } }, { defaultCollapsed: true });
    expect(rowOf(c.container, "n")).toHaveAttribute("aria-label", "Notifications");
    expect(rowOf(c.container, "n").querySelector(".rounded-full")).toBeNull();
  });

  it("R5/I6: dot and pulse badges -> itemWithIndicator (collapsed and expanded)", () => {
    for (const variant of ["dot", "pulse"] as const) {
      for (const defaultCollapsed of [true, false]) {
        const { container, unmount } = renderRow(
          { ...NOTIF, badge: { value: 1, variant } },
          { defaultCollapsed },
        );
        expect(rowOf(container, "n")).toHaveAttribute("aria-label", "Notifications, new");
        unmount();
      }
    }
  });

  it("R5/I6: the visible badge is aria-hidden so the count is announced once", () => {
    const { container } = renderRow({ ...NOTIF, badge: 5 });
    const badge = rowOf(container, "n").querySelector("[aria-hidden='true']");
    expect(badge).not.toBeNull();
    expect(badge).toHaveTextContent("5");
  });

  it("R5/I6: a ReactNode badge value keeps the plain behaviour (no invented name)", () => {
    const { container } = renderRow({ ...NOTIF, badge: { value: <b>hot</b> } });
    expect(rowOf(container, "n")).not.toHaveAttribute("aria-label");
  });
});

describe("C3: formatBadgeCount", () => {
  it("C3: the visible text uses formatBadgeCount(value, max)", () => {
    const formatBadgeCount = vi.fn((v: number, max: number) => `<${v}/${max}>`);
    const { container } = renderRow({ ...NOTIF, badge: { value: 12, max: 20 } }, { formatBadgeCount });
    expect(rowOf(container, "n")).toHaveTextContent("<12/20>");
    expect(formatBadgeCount).toHaveBeenCalledWith(12, 20);
  });

  it("C3: without it the default caps at max ('9+')", () => {
    const { container } = renderRow({ ...NOTIF, badge: 12 });
    expect(rowOf(container, "n")).toHaveTextContent("9+");
  });

  it("C3: string values bypass the formatter", () => {
    const formatBadgeCount = vi.fn(() => "X");
    const { container } = renderRow({ ...NOTIF, badge: "hot" }, { formatBadgeCount });
    expect(formatBadgeCount).not.toHaveBeenCalled();
    expect(rowOf(container, "n")).toHaveTextContent("hot");
  });
});

describe("AS6/AS7 (C1): presence dots and badge tones", () => {
  const dotClass = (container: HTMLElement) =>
    container.querySelector("button[aria-haspopup] span[aria-hidden='true'].rounded-full")?.className ?? "";

  it.each([
    ["online", "bg-success"],
    ["offline", "bg-muted-foreground"],
    ["busy", "bg-destructive"],
    ["away", "bg-warning"],
  ] as const)("presence status %s -> %s", (status, cls) => {
    const { container } = render(
      <AppSidebar
        items={[{ id: "home", label: "Home", href: "/home" }]}
        currentPath="/home"
        footer={{ user: { name: "Ada", status }, menuItems: [] }}
      />,
    );
    const className = dotClass(container);
    expect(className).toContain(cls);
    // semantic tokens only - no raw palette colours
    expect(className).not.toMatch(/(green|red|yellow|gray|slate)-\d{2,3}/);
  });

  it("presence status 'invisible' renders no dot", () => {
    const { container } = render(
      <AppSidebar
        items={[{ id: "home", label: "Home", href: "/home" }]}
        currentPath="/home"
        footer={{ user: { name: "Ada", status: "invisible" }, menuItems: [] }}
      />,
    );
    expect(dotClass(container)).toBe("");
  });

  it("badge tone 'brand' -> bg-brand text-brand-foreground", () => {
    const { container } = renderRow({ ...NOTIF, badge: { value: 3, tone: "brand" } });
    const badge = rowOf(container, "n").querySelector(".rounded-full")!;
    expect(badge.className).toContain("bg-brand");
    expect(badge.className).toContain("text-brand-foreground");
  });

  it("activeTone replaces tone ONLY on the active row", () => {
    const item: NavItem = { ...NOTIF, badge: { value: 3, tone: "default", activeTone: "brand" } };
    const items: NavEntry[] = [item, { ...item, id: "m", label: "Mentions", href: "/m" }];
    const { container } = render(<AppSidebar items={items} currentPath="/n" />);
    const active = rowOf(container, "n").querySelector(".rounded-full")!;
    const inactive = rowOf(container, "m").querySelector(".rounded-full")!;
    expect(rowOf(container, "n")).toHaveAttribute("data-active", "true");
    expect(active.className).toContain("bg-brand");
    expect(active.className).not.toContain("bg-muted ");
    expect(inactive.className).toContain("bg-muted");
    expect(inactive.className).not.toContain("bg-brand");
  });
});
