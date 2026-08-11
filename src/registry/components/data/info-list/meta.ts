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
    "Compact variant intentionally ignores secondary + action (documented limitation)",
  ],
  tags: ["info-list", "details", "info", "list", "sidebar"],

  version: "0.2.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["thumbnail-list", "schedule-list", "article-meta"],
};
