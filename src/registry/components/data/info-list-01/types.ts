import type { ComponentType, ElementType, ReactNode } from "react";

export type InfoList01Variant = "comfortable" | "compact";

export interface InfoListItem {
  /** Stable identifier. Used for React keys. */
  id: string;
  /** Lucide-style icon component. Required — info-list IS icon-prefixed by definition. */
  icon: ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
  /** Primary content (bold in comfortable, plain in compact). Required. */
  primary: ReactNode;
  /** Secondary content (muted, smaller). Optional — comfortable only renders it; compact ignores. */
  secondary?: ReactNode;
  /** Optional action element (e.g., a link Button) — renders below secondary in comfortable. Ignored in compact. */
  action?: ReactNode;
  /** Optional URL — when supplied + `linkComponent` provided, `primary` wraps in the polymorphic link. */
  href?: string;
}

export interface InfoList01Labels {
  /** Default: "No information." Used when `items` is empty AND `emptyState` not provided. */
  emptyText?: string;
}

export interface InfoList01Props {
  /** Items to render in display order. */
  items: InfoListItem[];

  /** Visual variant. Default: 'comfortable'. */
  variant?: InfoList01Variant;

  /** Insert top-border separators between items. Default: true for comfortable, false for compact. */
  separated?: boolean;

  /** Wrap in card chrome (`bg-card rounded-2xl p-6 border`). Default: true. */
  framed?: boolean;

  // ─── Heading ─────────────────────────────────────────────────────
  /** Optional section heading. */
  heading?: string;
  /** Heading semantic level. Default: 'h3'. */
  headingAs?: "h2" | "h3" | "h4";

  // ─── Polymorphic link ────────────────────────────────────────────
  /** Element used when `item.href` is supplied. Default: 'a'. */
  linkComponent?: ElementType;

  // ─── Customization ───────────────────────────────────────────────
  /** Custom per-item renderer — bypasses the default row layout entirely. */
  renderItem?: (item: InfoListItem) => ReactNode;

  /** Localized labels. Defaults are English. */
  labels?: InfoList01Labels;

  /** Empty-state slot. Wins over `labels.emptyText` when provided. */
  emptyState?: ReactNode;

  /** Override classes for the root <section>. */
  className?: string;
  /** Override classes for the heading. */
  headingClassName?: string;
  /** Override classes per row. */
  itemClassName?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_INFO_LIST_LABELS: Required<InfoList01Labels> = {
  emptyText: "No information.",
};
