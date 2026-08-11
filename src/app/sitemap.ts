import type { MetadataRoute } from "next";

import { getAllSlugs } from "@/registry/manifest";

const BASE = "https://ui.ilinxa.com";

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
