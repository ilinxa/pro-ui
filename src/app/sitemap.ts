import type { MetadataRoute } from "next";

import { getAllSlugs } from "@/registry/manifest";

const BASE = "https://ilinxa-proui.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE },
    { url: `${BASE}/components` },
    { url: `${BASE}/docs` },
    ...getAllSlugs().map((slug) => ({
      url: `${BASE}/components/${slug}`,
    })),
  ];
}
