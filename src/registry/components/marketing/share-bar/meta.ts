import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "share-bar",
  name: "Share Bar",
  category: "marketing",

  description:
    "Social share button row — nine built-in platforms, custom targets, and copy-link with success feedback.",
  context:
    "Reach for it on news article footers, blog post footers, product page social rows, video player share clusters, doc page share affordances. Built-in URL templates for Twitter / Facebook / LinkedIn / Reddit / WhatsApp / Telegram / Email / Threads / Bluesky. Copy-link button uses navigator.clipboard with an execCommand fallback when it is missing or writeText rejects; success/error feedback is visual (icon flip) + audible (aria-live). Custom targets via 'kind: custom' with arbitrary onClick. Native share sheet via 'kind: native' (client-only, after mount). Analytics hook via onShare(targetKind). SSR-safe — window.location.href read at click time, not render time.",
  features: [
    "9 built-in platforms with URL templates (Twitter / Facebook / LinkedIn / Reddit / WhatsApp / Telegram / Email / Threads / Bluesky)",
    "Copy-link button with success/error feedback (icon flip + aria-live)",
    "Clipboard fallback to document.execCommand for older / insecure browsers",
    "Custom targets via 'kind: custom' (arbitrary icon + onClick)",
    "Native share sheet as a target kind (kind: native) — rendered only after mount where navigator.share exists; onShareError for real failures, dismissal is silent",
    "Analytics hook via onShare(targetKind)",
    "labels.targets: localizable accessible name (aria-label + title) for every platform, copy and native; defaultShareBarLabels exported",
    "disabled / hidden on every target",
    "role=group named by the heading (or labels.heading); RTL-safe",
    "Configurable URL / title / text / via / hashtags",
    "Optional section heading (h2 / h3 / h4) with i18n labels",
    "Optional top divider (`pt-8 border-t border-border`)",
    "External links use target=_blank rel=noopener,noreferrer",
    "Memoized; SSR-safe; <ul>/<li> semantics",
  ],
  tags: [
    "share-bar",
    "share",
    "social",
    "copy-link",
    "twitter",
    "facebook",
    "linkedin",
    "marketing",
  ],

  version: "0.3.0",
  status: "alpha",
  artifactBudgetKB: 25,
  createdAt: "2026-05-02",
  updatedAt: "2026-10-25",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["article-meta", "newsletter-signup", "author-card"],
};
