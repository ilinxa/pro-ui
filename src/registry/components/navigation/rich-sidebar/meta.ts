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
    "Active-route detection: currentPath + isActive predicate + per-item match",
    "linkComponent abstraction (router-agnostic — Next.js, React Router, TanStack)",
    "12 slots (named + render-prop) + 4 prefab parts (NavBadge, NavBrand, NavPrimaryAction, NavUser)",
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

  version: "0.1.1",
  status: "alpha",
  createdAt: "2026-05-22",
  updatedAt: "2026-05-22",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["tooltip", "sheet", "avatar", "button", "dropdown-menu"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["todo-tree", "todo-rich-card"],
};
