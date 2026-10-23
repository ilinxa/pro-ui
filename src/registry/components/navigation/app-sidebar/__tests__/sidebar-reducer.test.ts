/**
 * Pure-logic tier for app-sidebar v0.5.0: reducer, labels merge, css-var
 * derivation, physical-side table, badge formatting. Node environment, no DOM.
 * (`isEditableTarget` needs real elements, so it is covered in
 * rtl-and-keys.test.tsx.)
 */
import { describe, expect, it } from "vitest";
import { createInitialState, sidebarReducer } from "../lib/sidebar-reducer";
import { DEFAULT_APP_SIDEBAR_LABELS, resolveLabels } from "../lib/labels";
import { deriveCssVars, APP_SIDEBAR_CSS_VARS } from "../lib/derive-css-vars";
import { resolvePhysicalSide } from "../hooks/use-direction";
import { formatBadgeValue } from "../lib/badge-format";
import { deriveAvatarFallback } from "../lib/derive-avatar-fallback";

const fresh = (o?: Parameters<typeof createInitialState>[0]) => createInitialState(o);

describe("sidebarReducer", () => {
  it("SET_COLLAPSED to the current value returns the SAME state object (no-op identity)", () => {
    const s = fresh();
    expect(sidebarReducer(s, { type: "SET_COLLAPSED", collapsed: false })).toBe(s);
  });

  it("SET_COLLAPSED to a new value changes only collapsed", () => {
    const s = fresh();
    const next = sidebarReducer(s, { type: "SET_COLLAPSED", collapsed: true });
    expect(next).not.toBe(s);
    expect(next.collapsed).toBe(true);
    expect(next.mobileOpen).toBe(false);
  });

  it("TOGGLE_COLLAPSED flips both ways", () => {
    const a = sidebarReducer(fresh(), { type: "TOGGLE_COLLAPSED" });
    expect(a.collapsed).toBe(true);
    expect(sidebarReducer(a, { type: "TOGGLE_COLLAPSED" }).collapsed).toBe(false);
  });

  it("SET_MOBILE_OPEN records the reason; a duplicate dispatch keeps the original reason (identity)", () => {
    const opened = sidebarReducer(fresh(), { type: "SET_MOBILE_OPEN", open: true, reason: "trigger" });
    expect(opened.mobileOpen).toBe(true);
    expect(opened.lastMobileOpenReason).toBe("trigger");
    const dup = sidebarReducer(opened, { type: "SET_MOBILE_OPEN", open: true, reason: "escape" });
    expect(dup).toBe(opened);
    expect(dup.lastMobileOpenReason).toBe("trigger");
  });

  it("TOGGLE_MOBILE defaults the reason to 'imperative' and honours an explicit one", () => {
    const a = sidebarReducer(fresh(), { type: "TOGGLE_MOBILE" });
    expect(a.mobileOpen).toBe(true);
    expect(a.lastMobileOpenReason).toBe("imperative");
    const b = sidebarReducer(a, { type: "TOGGLE_MOBILE", reason: "escape" });
    expect(b.mobileOpen).toBe(false);
    expect(b.lastMobileOpenReason).toBe("escape");
  });

  it("SET_SECTION_COLLAPSED is idempotent (identity on no-op) and adds/removes ids", () => {
    const s = fresh();
    expect(sidebarReducer(s, { type: "SET_SECTION_COLLAPSED", sectionId: "x", collapsed: false })).toBe(s);
    const c = sidebarReducer(s, { type: "SET_SECTION_COLLAPSED", sectionId: "x", collapsed: true });
    expect(c.collapsedSectionIds.has("x")).toBe(true);
    expect(sidebarReducer(c, { type: "SET_SECTION_COLLAPSED", sectionId: "x", collapsed: true })).toBe(c);
    expect(
      sidebarReducer(c, { type: "SET_SECTION_COLLAPSED", sectionId: "x", collapsed: false })
        .collapsedSectionIds.has("x"),
    ).toBe(false);
  });

  it("TOGGLE_SECTION does not mutate the previous Set", () => {
    const s = fresh();
    const a = sidebarReducer(s, { type: "TOGGLE_SECTION", sectionId: "x" });
    expect(a.collapsedSectionIds.has("x")).toBe(true);
    expect(s.collapsedSectionIds.has("x")).toBe(false);
    expect(sidebarReducer(a, { type: "TOGGLE_SECTION", sectionId: "x" }).collapsedSectionIds.size).toBe(0);
  });

  it("EXPAND_ALL_SECTIONS clears the set, and is identity when already empty", () => {
    const s = fresh();
    expect(sidebarReducer(s, { type: "EXPAND_ALL_SECTIONS" })).toBe(s);
    const c = fresh({ defaultCollapsedSectionIds: ["a", "b"] });
    expect(sidebarReducer(c, { type: "EXPAND_ALL_SECTIONS" }).collapsedSectionIds.size).toBe(0);
  });

  it("COLLAPSE_ALL_SECTIONS REPLACES the set; an identical payload is identity", () => {
    const c = fresh({ defaultCollapsedSectionIds: ["a", "b"] });
    expect(sidebarReducer(c, { type: "COLLAPSE_ALL_SECTIONS", allSectionIds: ["b", "a"] })).toBe(c);
    const r = sidebarReducer(c, { type: "COLLAPSE_ALL_SECTIONS", allSectionIds: ["z"] });
    expect([...r.collapsedSectionIds]).toEqual(["z"]);
  });

  it("FOCUS_ITEM is identity for the same id", () => {
    const f = sidebarReducer(fresh(), { type: "FOCUS_ITEM", itemId: "a" });
    expect(f.focusedItemId).toBe("a");
    expect(sidebarReducer(f, { type: "FOCUS_ITEM", itemId: "a" })).toBe(f);
  });

  it("EXTERNAL_SYNC short-circuits (identity) when the payload equals the last-synced snapshot", () => {
    const s = fresh();
    expect(sidebarReducer(s, { type: "EXTERNAL_SYNC", collapsed: false, mobileOpen: false })).toBe(s);
  });

  it("EXTERNAL_SYNC applies a change, mints a NEW snapshot object, and resets the mobile reason only when mobileOpen changed", () => {
    const s = sidebarReducer(fresh(), { type: "SET_MOBILE_OPEN", open: true, reason: "trigger" });
    const snapBefore = s.lastSyncedSnapshot;
    // collapsed-only change keeps the reason
    const a = sidebarReducer(s, { type: "EXTERNAL_SYNC", collapsed: true, mobileOpen: true });
    expect(a.collapsed).toBe(true);
    expect(a.lastSyncedSnapshot).not.toBe(snapBefore);
    expect(a.lastMobileOpenReason).toBe("trigger");
    // mobileOpen change resets to imperative
    const b = sidebarReducer(a, { type: "EXTERNAL_SYNC", collapsed: true, mobileOpen: false });
    expect(b.mobileOpen).toBe(false);
    expect(b.lastMobileOpenReason).toBe("imperative");
  });

  it("internal transitions never move the EXTERNAL_SYNC anchor snapshot", () => {
    const s = fresh();
    const t = sidebarReducer(s, { type: "TOGGLE_COLLAPSED" });
    expect(t.lastSyncedSnapshot).toBe(s.lastSyncedSnapshot);
  });

  it("REPLACE_STATE returns the supplied state object", () => {
    const other = fresh({ defaultCollapsed: true });
    expect(sidebarReducer(fresh(), { type: "REPLACE_STATE", state: other })).toBe(other);
  });
});

describe("resolveLabels (C2)", () => {
  it("returns the defaults object itself when there is no override", () => {
    expect(resolveLabels(undefined)).toBe(DEFAULT_APP_SIDEBAR_LABELS);
  });

  it("merges a partial override over the defaults", () => {
    const l = resolveLabels({ navigation: "Hauptmenue" });
    expect(l.navigation).toBe("Hauptmenue");
    expect(l.expandSidebar).toBe(DEFAULT_APP_SIDEBAR_LABELS.expandSidebar);
    expect(l.userMenu("A")).toBe("A — open menu");
  });

  it("an explicit `undefined` key keeps the default (conditional i18n must not erase a label)", () => {
    const l = resolveLabels({ closeNavigation: undefined, loading: "wait" });
    expect(l.closeNavigation).toBe("Close navigation");
    expect(l.loading).toBe("wait");
  });

  it("function labels are replaced by function overrides, siblings keep defaults", () => {
    const l = resolveLabels({ itemWithBadge: (a, b) => `${a}#${b}` });
    expect(l.itemWithBadge("Inbox", 3)).toBe("Inbox#3");
    expect(l.itemWithIndicator("Inbox")).toBe("Inbox, new");
  });

  it("a partial emptyState merges per reason and does not mutate the defaults", () => {
    const l = resolveLabels({
      emptyState: { "no-items": { title: "Leer" } } as unknown as typeof DEFAULT_APP_SIDEBAR_LABELS.emptyState,
    });
    expect(l.emptyState["no-items"]).toEqual({ title: "Leer" });
    expect(l.emptyState["all-hidden"]).toEqual(DEFAULT_APP_SIDEBAR_LABELS.emptyState["all-hidden"]);
    expect(DEFAULT_APP_SIDEBAR_LABELS.emptyState["no-items"].title).toBe("No items");
  });
});

describe("deriveCssVars (R3/I4)", () => {
  it("returns an EMPTY object when no width/duration prop was passed (no inline defaults)", () => {
    expect(deriveCssVars({})).toEqual({});
  });

  it("returns ONLY the vars for props that were passed", () => {
    expect(deriveCssVars({ collapsedWidth: "4rem" })).toEqual({ "--ilinxa-sidebar-w-collapsed": "4rem" });
    expect(deriveCssVars({ expandedWidth: "20rem", transitionDuration: "0ms" })).toEqual({
      "--ilinxa-sidebar-w-expanded": "20rem",
      "--ilinxa-sidebar-transition-duration": "0ms",
    });
  });

  it("the documented-default table is separate from what is derived inline", () => {
    expect(Object.keys(APP_SIDEBAR_CSS_VARS)).toContain("--ilinxa-sidebar-row-h");
    expect(Object.keys(deriveCssVars({}))).toHaveLength(0);
  });
});

describe("resolvePhysicalSide (AS8)", () => {
  it.each([
    ["start", "ltr", "left"],
    ["end", "ltr", "right"],
    ["start", "rtl", "right"],
    ["end", "rtl", "left"],
    ["left", "ltr", "left"],
    ["left", "rtl", "left"],
    ["right", "ltr", "right"],
    ["right", "rtl", "right"],
  ] as const)("side=%s dir=%s -> %s", (side, dir, expected) => {
    expect(resolvePhysicalSide(side, dir)).toBe(expected);
  });
});

describe("formatBadgeValue (C3 default)", () => {
  it("caps numbers above max as 'max+'", () => {
    expect(formatBadgeValue(10, 9)).toBe("9+");
    expect(formatBadgeValue(9, 9)).toBe("9");
    expect(formatBadgeValue(150, 99)).toBe("99+");
  });
  it("passes strings through", () => {
    expect(formatBadgeValue("new", 9)).toBe("new");
  });
});

describe("deriveAvatarFallback (U4-I)", () => {
  it("U4-I: an emoji initial is kept whole (code points, not UTF-16 units)", () => {
    expect(deriveAvatarFallback("\u{1F643} emoji")).toBe("\u{1F643}E");
  });
  it("U4-I: two words -> first letters, uppercased", () => {
    expect(deriveAvatarFallback("Ahmet Kaya")).toBe("AK");
  });
  it("U4-I: single word -> first two characters; empty -> '?'", () => {
    expect(deriveAvatarFallback("Slack")).toBe("SL");
    expect(deriveAvatarFallback("")).toBe("?");
    expect(deriveAvatarFallback(undefined)).toBe("?");
  });
});
