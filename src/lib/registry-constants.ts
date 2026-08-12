/**
 * Single source of truth for the ilinxa shadcn-registry distribution
 * surface — site URL, namespace, and per-slug URL/command builders.
 *
 * Every hardcoded occurrence of these values across the docs site
 * (sitemap, install blocks, marketing copy, sandbox snippets) should
 * import from here instead of re-typing the literal.
 */

export const SITE_URL = "https://ui.ilinxa.com" as const;

export const REGISTRY_NAMESPACE = "@ilinxa" as const;

/** Base the CLI's `{name}.json` template resolves against. */
export const REGISTRY_BASE_URL = `${SITE_URL}/r` as const;

/** Template string for the `registries` entry in a consumer's components.json. */
export const REGISTRY_ITEM_URL_TEMPLATE =
  `${SITE_URL}/r/{name}.json` as const;

/** Public JSON artifact URL for a given registry item (slug or `<slug>-fixtures`). */
export function registryItemUrl(name: string): string {
  return `${REGISTRY_BASE_URL}/${name}.json`;
}

/** Namespaced `@ilinxa/<slug>` identifier used by `shadcn add`. */
export function registryItemId(slug: string): string {
  return `${REGISTRY_NAMESPACE}/${slug}`;
}

/** `shadcn@latest add @ilinxa/<slug>` command (runner prefix supplied by caller). */
export function installCommand(slug: string, runner = "pnpm dlx"): string {
  return `${runner} shadcn@latest add ${registryItemId(slug)}`;
}

/** The `registries` block to merge into a consumer's components.json. */
export function registriesSnippet(): string {
  return `"registries": {
  "${REGISTRY_NAMESPACE}": "${REGISTRY_ITEM_URL_TEMPLATE}"
}`;
}
