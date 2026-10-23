import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "app-sidebar",
  name: "App Sidebar",
  category: "navigation",

  description:
    "App-shell sidebar with a full-label mobile drawer, labels for every string, ancestor-overridable CSS variables, RTL, and a headless state hook.",
  context:
    "App-shell navigation for SaaS dashboards, social products, and developer tools. Single source of truth for the collapsible-sidebar pattern: built-in collapse + mobile drawer (Sheet) + tooltips-on-collapsed + sections + separators + permissions + localStorage persist + CSS-variable theme surface. Replaces the per-app reinvention of these 30 affordances. Migration origin: kasder's SocialSidebar.tsx.",
  features: [
    "Collapsible (uncontrolled / controlled / headless-via-hook) — v0.5: a controlled toggle requests `!isCollapsed` from the rendered value, and `storageKey` never reads/writes `collapsed` while controlled (server-cookie pattern; no first-paint flip)",
    "v0.5 — `labels` covers every rendered string (nav name, toggle, trigger, drawer close, skip link, loading, user menu, empty states) incl. badge-aware accessible names `itemWithBadge(label, value)` / `itemWithIndicator(label)` for collapsed AND expanded rows",
    "v0.5 — drawer always renders full labels (nested context: collapsed=false, mode=mobile); `topSlot` may be a function of `{ mode, isCollapsed }`; `useAppSidebarMode()`; `drawerClassName` / `drawerStyle`",
    "v0.5 — CSS variables are ancestor-overridable (defaults live at the read site, inline only for passed props) and reach the portalled drawer; `APP_SIDEBAR_CSS_VARS` lists them; row height / gap / padding / indent variables wired",
    "v0.5 — RTL: `side` / `mobileDrawerSide` accept `start` / `end` (default `start`), `dir` prop or computed direction, logical classes, mirrored arrow keys / tooltips / icons",
    "v0.5 — presence dots and a `brand` badge tone (+ `activeTone`) on semantic tokens shipped via `cssVars.theme`; `formatBadgeCount`; `null` badge = withheld (renders nothing); keyboard handler ignores editable targets",
    "Mobile-drawer mode via shadcn Sheet (CSS-gated render path; no SSR flash)",
    "<AppSidebarTrigger> companion — inside the subtree it resolves the sidebar from context; outside, pass `controls={ref}` (and its `aria-label`, since it cannot read `labels`)",
    "Items discriminated union: NavItem | NavSection | NavSeparator",
    "v0.2 — topSlot above brand zone for AccountSwitcher / context widgets",
    "v0.2 — {key} href template substitution + resolveHref callback escape hatch",
    "v0.2 — ownerOnly + minMembers gates (three-gate intersection: permission ∩ ownerOnly ∩ minMembers)",
    "v0.2 — bypassFiltering at BOTH section + item levels for personal-context / debug views",
    "v0.2 — exported NavContext discriminated union (type-only)",
    "v0.2 — exported useFilteredNavSections hook (works standalone, not coupled to <AppSidebar>)",
    "v0.3 — renderItem slot wraps consumer-supplied content in a single <li> (fixes v0.2.x double-nest bug)",
    "v0.3 — onMobileOpenChange.reason discriminator correctly fires trigger / item-click / outside-click / escape / imperative",
    "v0.3 — openMobile / closeMobile / toggleMobile accept optional reason? param",
    "v0.3 — NavUserMenuItem.onClick widened to Event | React.MouseEvent (exported as NavUserMenuItemSelectEvent)",
    "v0.3.2 (2026-08-11) — F-cross-13 path-b sweep: zero asChild on shadcn primitives (NavUser trigger IS the DropdownMenuTrigger; href menu rows nest the anchor inside the item; NavPrimaryAction href path uses buttonVariants on the link); collapsed-rail tooltip reimplemented locally — delay honored cross-backend, no Radix-only delayDuration. Zero public-API change.",
    "Active-route detection: currentPath + isActive predicate + per-item match",
    "linkComponent abstraction (router-agnostic — Next.js, React Router, TanStack)",
    "13 slots (named + render-prop, incl. v0.2 topSlot) + 4 prefab parts (NavBadge, NavBrand, NavPrimaryAction, NavUser)",
    "5 active-state variants (fill / left-bar / right-bar / outline / subtle)",
    "CSS-variable theme surface (--ilinxa-sidebar-*) for any-scope theming",
    "Section auto-expand when active item inside + auto-scroll into view",
    "Permissions membership gating + diff-based onPermissionDenied",
    "localStorage opt-in persist for collapse + collapsed-sections",
    "Full WAI-ARIA pattern, keyboard nav, skip-link, reduced-motion respect",
    "v0.4.1 — `onItemHover` / `onItemFocus` / `onActiveItemChange` / `onMount` / `onUnmount` are wired and emit; they were declared on the props surface but connected to nothing until now. Hover/focus stay silent on disabled rows; `onActiveItemChange` fires from derived state when the host's path commits, never from the click handler",
    "F-cross-13 defensive: Sheet + DropdownMenu callbacks pre-emptively widened (Tooltip primitive dropped in v0.3.2 — local implementation)",
  ],
  tags: [
    "sidebar",
    "navigation",
    "app-shell",
    "collapsible",
    "drawer",
    "mobile",
    "headless",
    "controlled-uncontrolled",
    "permissions",
    "theming",
  ],

  version: "0.5.0",
  status: "alpha",
  artifactBudgetKB: 230,
  createdAt: "2026-05-22",
  updatedAt: "2026-10-23",

  author: { name: "ilinxa" },

  dependencies: {
    // v0.3.2: "tooltip" dropped — collapsed-rail tooltips are a local
    // implementation now (F-cross-13 path-b; see parts/tooltip-wrapper.tsx).
    shadcn: ["sheet", "avatar", "button", "dropdown-menu"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["account-switcher", "task-tree", "task-card"],
};
