/**
 * axe-core over three rendered states of AppSidebar: expanded, collapsed and
 * drawer-open. Only `color-contrast` is disabled: jsdom has no layout/computed
 * colour engine, so that rule cannot be evaluated there. Everything else runs
 * at axe defaults.
 */
import axe from "axe-core";
import { Plus } from "lucide-react";
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "../app-sidebar";
import { AppSidebarTrigger } from "../parts/sidebar-nav-trigger";
import type { AppSidebarProps, NavEntry } from "../types";

const ITEMS: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Home", href: "/home" },
  { id: "inbox", label: "Inbox", href: "/inbox", badge: 5 },
  { id: "alerts", label: "Alerts", href: "/alerts", badge: { value: 1, variant: "dot" } },
  { id: "quiet", label: "Quiet", href: "/quiet", badge: { value: 0 } },
  { kind: "separator" },
  {
    kind: "section",
    id: "projects",
    title: "Projects",
    collapsible: true,
    items: [
      { id: "p1", label: "Alpha", href: "/p1" },
      { id: "p2", label: "Beta", href: "/p2", disabled: true },
    ],
  },
  {
    kind: "section",
    id: "static",
    title: "Resources",
    items: [{ id: "docs", label: "Docs", href: "/docs", badge: "new" }],
  },
];

const FULL: Partial<AppSidebarProps> = {
  skipLinkTarget: "#main",
  brand: { label: "Acme", logo: <span aria-hidden="true">A</span>, href: "/" },
  headerSlot: <AppSidebarTrigger />,
  primaryAction: { icon: Plus, label: "Create post", onClick: () => {} },
  footer: { user: { name: "Ada Lovelace", handle: "@ada", status: "online" }, menuItems: [] },
};

async function violationsOf(root: Element) {
  const results = await axe.run(root, { rules: { "color-contrast": { enabled: false } } });
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(",")}`);
}

/** Rule ids only, sorted - used to pin the known shipped defects exactly. */
async function ruleIdsOf(root: Element) {
  const results = await axe.run(root, { rules: { "color-contrast": { enabled: false } } });
  return results.violations.map((v) => v.id).sort();
}

/*
 * Regression guard for two defects this suite surfaced at v0.5.0 (fixed in
 * parts/sidebar-nav-section.tsx):
 *  - axe `listitem`: the section body was `<ul role="group">`; the explicit
 *    role removed list semantics and orphaned every `<li>` row.
 *  - axe `heading-order`: a non-collapsible section title was an `<h6>`,
 *    skipping levels after the drawer's `<h2>` title.
 * Every state below must report ZERO violations.
 */


beforeEach(() => {
  (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = vi.fn();
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("axe: app-sidebar", () => {
  async function renderExpanded() {
    const r = render(<AppSidebar items={ITEMS} currentPath="/home" {...FULL} />);
    await flush();
    expect(r.container.querySelectorAll("a[data-nav-id]").length).toBeGreaterThanOrEqual(6);
    expect(r.container.querySelector('a[aria-label="Inbox, 5"]')).not.toBeNull();
    expect(r.container.querySelector("button[aria-expanded]")).not.toBeNull();
    return r;
  }

  async function renderCollapsed() {
    const r = render(<AppSidebar items={ITEMS} currentPath="/home" defaultCollapsed {...FULL} />);
    await flush();
    expect(r.container.querySelector("nav")).toHaveAttribute("data-collapsed", "true");
    // every icon-only row has a non-empty accessible name
    for (const a of r.container.querySelectorAll("a[data-nav-id]")) {
      expect((a.getAttribute("aria-label") ?? a.textContent ?? "").trim()).not.toBe("");
    }
    return r;
  }

  async function renderDrawer() {
    const r = await renderCollapsed();
    fireEvent.click(r.container.querySelector('button[aria-haspopup="dialog"]')!);
    await flush();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog).toHaveAccessibleName("Main navigation");
    return r;
  }
  it("expanded sidebar has zero violations", async () => {
    const { container } = await renderExpanded();
    expect(await violationsOf(container)).toEqual([]);
  });
  it("expanded sidebar: no rule ids at all (listitem regression)", async () => {
    const { container } = await renderExpanded();
    expect(await ruleIdsOf(container)).toEqual([]);
  });
  it("collapsed sidebar has zero violations", async () => {
    const { container } = await renderCollapsed();
    expect(await violationsOf(container)).toEqual([]);
  });
  it("collapsed sidebar: no rule ids at all (listitem regression)", async () => {
    const { container } = await renderCollapsed();
    expect(await ruleIdsOf(container)).toEqual([]);
  });
  it("drawer-open sidebar has zero violations", async () => {
    await renderDrawer();
    // axe over the whole body so the portalled panel + the aria-hidden rail are both judged
    expect(await violationsOf(document.body)).toEqual([]);
  });
  it("drawer-open sidebar: no rule ids at all (listitem + heading-order regressions)", async () => {
    await renderDrawer();
    expect(await ruleIdsOf(document.body)).toEqual([]);
  });

  it("drawer-open: the portalled panel itself has no violation (name + close button OK)", async () => {
    await renderDrawer();
    const panel = document.querySelector('[role="dialog"]')!;
    expect(panel.querySelector('button[aria-label="Close navigation"]')).not.toBeNull();
    expect(await ruleIdsOf(panel)).toEqual([]);
  });

  it("sidebar without sections has zero violations in all three states", async () => {
    const flat: ReadonlyArray<NavEntry> = ITEMS.filter((e) => e.kind !== "section");
    const expanded = render(<AppSidebar items={flat} currentPath="/home" {...FULL} />);
    await flush();
    expect(await violationsOf(expanded.container)).toEqual([]);
    expanded.unmount();

    const collapsed = render(<AppSidebar items={flat} currentPath="/home" defaultCollapsed {...FULL} />);
    await flush();
    expect(await violationsOf(collapsed.container)).toEqual([]);
    fireEvent.click(collapsed.container.querySelector('button[aria-haspopup="dialog"]')!);
    await flush();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(await violationsOf(document.body)).toEqual([]);
  });

  it("loading and empty states have zero violations", async () => {
    const loading = render(<AppSidebar items={ITEMS} currentPath="/home" loading />);
    await flush();
    expect(loading.container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(await violationsOf(loading.container)).toEqual([]);
    loading.unmount();

    const empty = render(<AppSidebar items={[]} currentPath="/home" />);
    await flush();
    expect(empty.container.querySelector('[role="status"]')).not.toBeNull();
    expect(await violationsOf(empty.container)).toEqual([]);
  });
  it("RTL expanded sidebar has zero violations", async () => {
    const { container } = render(<AppSidebar items={ITEMS} currentPath="/home" dir="rtl" {...FULL} />);
    await flush();
    expect(await violationsOf(container)).toEqual([]);
  });
  it("RTL expanded sidebar: no rule ids at all (listitem regression)", async () => {
    const { container } = render(<AppSidebar items={ITEMS} currentPath="/home" dir="rtl" {...FULL} />);
    await flush();
    expect(await ruleIdsOf(container)).toEqual([]);
  });
});
