import type { Metadata } from "next";
import { SITE_URL } from "@/lib/registry-constants";

/**
 * Shared metadata fragments for the docs site.
 *
 * Next.js merges parent/child `metadata` exports SHALLOWLY: a route that
 * declares its own `openGraph` object replaces the layout's ENTIRE
 * `openGraph` — siteName/type/locale included (see Next docs,
 * generate-metadata § merging). Every route-level `openGraph` must
 * therefore spread `OG_BASE` first, then add its per-page fields.
 */

export const SITE_NAME = "ilinxa pro-ui";

export const SITE_DESCRIPTION =
  "Professional, fully-composed components built on shadcn/ui and Tailwind CSS v4.";

export const OG_BASE = {
  siteName: SITE_NAME,
  type: "website",
  locale: "en_US",
  // Explicit shared OG image (public asset) rather than the app-dir
  // opengraph-image.png file convention: R5 verified the file convention
  // does NOT cascade to child segments on this Next version — only "/"
  // received og:image. One explicit mechanism, uniform on every route.
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "ilinxa pro-ui — professional components built on shadcn/ui, distributed via shadcn-registry from ui.ilinxa.com",
    },
  ],
} satisfies NonNullable<Metadata["openGraph"]>;

export { SITE_URL };
