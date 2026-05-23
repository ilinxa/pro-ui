import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "rich-sidebar",
  name: "Rich Sidebar",
  category: "navigation",

  description:
    "Registry-portable, framework-agnostic app-shell sidebar with mobile-drawer mode, 12-slot composition, 4 prefab parts, and a headless state hook.",
  context:
    "App-shell navigation for SaaS dashboards, social products, and developer tools. Single source of truth for the collapsible-left-sidebar pattern: built-in collapse + mobile drawer (Sheet) + tooltips-on-collapsed + sections + separators + permissions + localStorage persist + CSS-variable theme surface. Replaces the per-app reinvention of these 30 affordances. Sibling-of bottom-tab-bar-01 (shares NavBadge part + NavItem schema via cross-procomp relative imports). Migration origin: kasder's SocialSidebar.tsx.",
  features: [
    "Collapsible (uncontrolled / controlled / headless-via-hook)",
    "Mobile-drawer mode via shadcn Sheet (CSS-gated render path; no SSR flash)",
    "<RichSidebarTrigger> companion for hamburger button outside sidebar subtree",
    "Items discriminated union: NavItem | NavSection | NavSeparator",
    "v0.2 — topSlot above brand zone for AccountSwitcher / context widgets",
    "v0.2 — {key} href template substitution + resolveHref callback escape hatch",
    "v0.2 — ownerOnly + minMembers gates (three-gate intersection: permission ∩ ownerOnly ∩ minMembers)",
    "v0.2 — bypassFiltering at BOTH section + item levels for personal-context / debug views",
    "v0.2 — exported NavContext discriminated union (type-only)",
    "v0.2 — exported useFilteredNavSections hook (works standalone, not coupled to <RichSidebar>)",
    "v0.3 — renderItem slot wraps consumer-supplied content in a single <li> (fixes v0.2.x double-nest bug)",
    "v0.3 — onMobileOpenChange.reason discriminator correctly fires trigger / item-click / outside-click / escape / imperative",
    "v0.3 — openMobile / closeMobile / toggleMobile accept optional reason? param",
    "v0.3 — NavUserMenuItem.onClick widened to Event | React.MouseEvent (exported as NavUserMenuItemSelectEvent)",
    "Active-route detection: currentPath + isActive predicate + per-item match",
    "linkComponent abstraction (router-agnostic — Next.js, React Router, TanStack)",
    "13 slots (named + render-prop, incl. v0.2 topSlot) + 4 prefab parts (NavBadge, NavBrand, NavPrimaryAction, NavUser)",
    "5 active-state variants (fill / left-bar / right-bar / outline / subtle)",
    "CSS-variable theme surface (--ilinxa-sidebar-*) for any-scope theming",
    "Section auto-expand when active item inside + auto-scroll into view",
    "Permissions membership gating + diff-based onPermissionDenied",
    "localStorage opt-in persist for collapse + collapsed-sections",
    "Full WAI-ARIA pattern, keyboard nav, skip-link, reduced-motion respect",
    "F-cross-13 defensive: Tooltip + Sheet + DropdownMenu callbacks pre-emptively widened",
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

  version: "0.3.0",
  status: "alpha",
  createdAt: "2026-05-22",
  updatedAt: "2026-05-23",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["tooltip", "sheet", "avatar", "button", "dropdown-menu"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["account-switcher-01", "todo-tree", "todo-rich-card"],
};
