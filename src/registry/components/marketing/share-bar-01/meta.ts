import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "share-bar-01",
  name: "Share Bar 01",
  category: "marketing",

  description:
    "Horizontal cluster of social-share buttons + copy-link with success-state feedback. 9 built-in platforms + custom targets.",
  context:
    "Reach for it on news article footers, blog post footers, product page social rows, video player share clusters, doc page share affordances. Built-in URL templates for Twitter / Facebook / LinkedIn / Reddit / WhatsApp / Telegram / Email / Threads / Bluesky. Copy-link button uses navigator.clipboard with execCommand fallback for older / insecure-context browsers; success/error feedback is visual (icon flip) + audible (aria-live). Custom targets via 'kind: custom' with arbitrary onClick. Analytics hook via onShare(targetKind). SSR-safe — window.location.href read at click time, not render time.",
  features: [
    "9 built-in platforms with URL templates (Twitter / Facebook / LinkedIn / Reddit / WhatsApp / Telegram / Email / Threads / Bluesky)",
    "Copy-link button with success/error feedback (icon flip + aria-live)",
    "Clipboard fallback to document.execCommand for older / insecure browsers",
    "Custom targets via 'kind: custom' (arbitrary icon + onClick)",
    "Analytics hook via onShare(targetKind)",
    "Configurable URL / title / text / via / hashtags",
    "Optional section heading (h2 / h3 / h4) with i18n labels",
    "Optional top divider (`pt-8 border-t border-border`)",
    "External links use target=_blank rel=noopener,noreferrer",
    "Memoized; SSR-safe; <ul>/<li> semantics",
  ],
  tags: [
    "share-bar-01",
    "share",
    "social",
    "copy-link",
    "twitter",
    "facebook",
    "linkedin",
    "marketing",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button"],
    npm: { "lucide-react": "^0.x" },
    internal: [],
  },

  related: ["article-meta-01", "newsletter-card-01", "author-card-01"],
};
