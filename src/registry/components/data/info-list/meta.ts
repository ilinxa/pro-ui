import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "info-list",
  name: "Info List",
  category: "data",

  description:
    "Card-framed list of icon-prefixed rows — primary and secondary text, optional actions, per-row links, comfortable and compact variants.",
  context:
    "Use for sidebar info cards on detail pages — Event Details, Contact, Address, Account Settings, Product Specs, Restaurant Info, Listing Attributes. Comfortable variant: stacked primary/secondary/action rows with separators (kasder Etkinlik Bilgileri pattern). Compact variant: inline single-line rows, no separators (kasder İletişim pattern). Migration origin: kasder kas-social-front-v0 events/[id]/page.tsx Etkinlik Bilgileri + İletişim sidebar cards.",
  features: [
    "Two variants — comfortable (stacked, separators, w-5 primary icon) and compact (inline, no separators, w-4 muted icon)",
    "Required icon + primary; optional secondary + action + href per item",
    "Polymorphic per-row link via linkComponent (default 'a') — works with tel: / mailto: / etc.",
    "Frame toggle (framed=true card chrome / framed=false bare)",
    "Separator toggle (auto-defaults per variant; overridable)",
    "Custom renderItem slot for full row takeover",
    "Optional section heading with configurable level (h2/h3/h4)",
    "Soft-failure on optional fields",
    "Empty state slot + labels.emptyText fallback",
    "i18n via labels object",
    "<ul role='list'> semantics + section aria-labelledby",
    "Compact rows truncate by default with the full value as a native title; `wrap` opts in to wrapping long values (`item.title` supplies the text for node-valued primary)",
    "Compact variant ignores secondary + action, with a one-time dev warning (use comfortable or renderItem for richer rows)",
    "renderItem rows honour itemClassName and, when separated is passed, the separators",
    "labels.emptyText: an undefined value keeps the default; defaultInfoListLabels exported (DEFAULT_INFO_LIST_LABELS kept as a deprecated alias)",
    "Logical (RTL-safe) utilities only; RTL demo tab with Arabic rows",
  ],
  tags: ["info-list", "details", "info", "list", "sidebar"],

  version: "0.3.0",
  status: "alpha",
  artifactBudgetKB: 15,
  createdAt: "2026-05-02",
  updatedAt: "2026-10-25",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["thumbnail-list", "schedule-list", "article-meta"],
};
