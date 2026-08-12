import type { MetadataRoute } from "next";

import { getAllSlugs } from "@/registry/manifest";
import { SITE_URL } from "@/lib/registry-constants";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/components` },
    { url: `${SITE_URL}/docs` },
    ...getAllSlugs().map((slug) => ({
      url: `${SITE_URL}/components/${slug}`,
    })),
  ];
}
