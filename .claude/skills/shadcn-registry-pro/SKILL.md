---
name: shadcn-registry-pro
description: >
  Producer-side mastery for building, hosting, and shipping a shadcn registry — the
  pnpm dlx shadcn add @namespace/foo distribution model. Use when authoring
  registry.json, running shadcn build, mapping sealed-folder components onto
  registry:block items with target paths, shipping optional fixtures via the dual-item
  pattern, configuring namespaced installs, hosting registry output on Vercel,
  setting up content-negotiation rewrites for branded URLs, or evaluating
  Tailwind v4 / React 19 / Next 16 compatibility for shadcn-distributed components.
  Triggers: registry.json, registry-item.json, shadcn build, namespaced install,
  registries map, components.json registries, registry namespace, fixture bundle,
  multi-item registry, sealed-folder distribution, registry hosting. Does NOT cover
  consumer-side workflows — those follow standard shadcn install.
---

# shadcn-registry-pro

Producer-side recipes for shipping a shadcn registry. Covers the full path from `registry.json` author → `shadcn build` → Vercel host → consumer install via `pnpm dlx shadcn add @namespace/foo`. Companion to (not a replacement for) the official shadcn docs — focuses on the gaps Claude's training data misses and the patterns that hold a multi-component sealed-folder library together on the consumer side.

Validated against shadcn CLI v4.5+ and the registry schema as of Feb 2026.

## When this skill fires

- Authoring `registry.json` or registry items
- Running / configuring `shadcn build`
- Shipping components via `pnpm dlx shadcn add @ns/<slug>` (any namespace)
- Hosting a registry (Vercel, Netlify, GH Pages, S3 + CloudFront)
- Configuring namespaced registries in `components.json`
- Shipping optional fixtures / theme bundles separately from a base component
- Tailwind v4 / React 19 / Next 16 + registry compatibility questions
- Migrating a flat `src/components/` library into a registry-shipped one

## Quick decision tree

| You want to ... | Use ... |
|---|---|
| Distribute a shadcn primitive (`button`, `input`) | `type: registry:ui` at item level |
| Distribute a multi-file pro-component (sealed folder) | `type: registry:block` with `target` on each file |
| Distribute a pure utility (`cn`, helpers) | `type: registry:lib` |
| Distribute a hook | `type: registry:hook` |
| Drop a file at consumer's project root | `type: registry:file` with `target: "~/foo.config.js"` |
| Add a route on consumer side | `type: registry:page` with `target: "~/app/foo/page.tsx"` |
| Add CSS variables / global styles | `cssVars` + `css` fields (NOT `tailwind` — deprecated for v4) |
| Make fixtures / variants opt-in | Ship a second item with `registryDependencies: [base]` |
| Brand-paint the consumer's theme | Separate dedicated theming item — `registry:block` with `cssVars` + `css` only is always safe; `registry:theme` may also work but isn't verified verbatim in the current schema. Never push from functional components. |

## Critical anti-patterns

❌ **Multi-file component without `target` per file.** Each file's destination is determined by its individual `type`. Without `target`, `parts/foo.tsx` (typed `registry:component`) lands in `components/foo.tsx`, NOT `components/<slug>/parts/foo.tsx`. The seal collapses; consumer ends up with files scattered across `components/`, `hooks/`, `lib/`.

✅ **Use explicit `target` to preserve the seal** (path shown is the alias-relative form — see [file-types-and-targets.md](file-types-and-targets.md) and smoke-test before bulk-authoring):
```json
{
  "path": "src/registry/components/forms/properties-form/parts/field-row.tsx",
  "type": "registry:component",
  "target": "components/properties-form/parts/field-row.tsx"
}
```

❌ **Registry URL without `{name}` placeholder.** CLI validation rejects.
```json
"registries": { "@ilinxa": "https://ilinxa.com/r/component.json" }
```

✅ **Always include `{name}`:**
```json
"registries": { "@ilinxa": "https://ilinxa.com/r/{name}.json" }
```

❌ **Using the `tailwind` field for Tailwind v4 projects.** The `tailwind` config field is deprecated for v4. v4 has no `tailwind.config.*` — config lives in CSS via `@theme`.

✅ **Use `cssVars` for tokens + `css` for raw layer additions:**
```json
{
  "cssVars": {
    "theme": { "font-heading": "Onest, sans-serif" },
    "light": { "brand": "oklch(0.80 0.20 132)" },
    "dark": { "brand": "oklch(0.86 0.18 132)" }
  },
  "css": "@layer utilities { .reveal-up { animation: reveal-up 600ms ease-out; } }"
}
```

❌ **Expecting a native `--with-fixtures` or per-file install flag.** No CLI flag exists for opting into a subset of files inside a single registry item.

✅ **Ship two items: base + variant.** Variant has `registryDependencies: [base]` and adds the optional file(s) only.
```json
{ "name": "properties-form",          "files": [/* component code */] },
{ "name": "properties-form-fixtures", "registryDependencies": ["properties-form"], "files": [/* dummy-data only */] }
```
Consumer UX: `pnpm dlx shadcn add @ns/properties-form` (lean) vs `pnpm dlx shadcn add @ns/properties-form-fixtures` (base + extras). The `-fixtures` item resolves the base as a `registryDependency` automatically.

❌ **Pushing producer brand tokens via `cssVars` on every component.** Overrides consumer's existing theme tokens silently.

✅ **Ship theme as a separate opt-in item** so consumers explicitly choose to apply your accent. Functional components reference `var(--primary)`, `var(--accent)` generically.

❌ **Skipping the smoke test.** The first component you author in `registry.json` MUST be installed into a fresh tmp consumer app before you bulk-author the rest. Path-mapping bugs surface fast and cheap on one component; expensive across eight.

✅ **Smoke-test loop:** `pnpm registry:build` → `pnpm dev` → from a throwaway Next app run `pnpm dlx shadcn add http://localhost:3000/r/<slug>.json` → inspect what landed where → adjust `target` paths → repeat.

❌ **Pushing complex Web Worker / WebGL / 30+ file components into shadcn-registry.** Consumer ends up owning the source for everything; updates require manual diff merges. The shadcn philosophy ("you own the code") works for 1–10 file composables, gets ugly at scale.

✅ **Mixed strategy:** ship lean composables via shadcn-registry; ship heavy components via NPM. Both can coexist in the same producer codebase.

## Recipe links

| File | Covers |
|------|--------|
| [registry-schema.md](registry-schema.md) | Complete `registry.json` + `registry-item.json` schemas, every field |
| [file-types-and-targets.md](file-types-and-targets.md) | What each `type` resolves to, `target` semantics, sealed-folder mapping recipe, import-path rewriting |
| [cli-and-protocol.md](cli-and-protocol.md) | `shadcn build` + `shadcn add` flag tables, HTTP protocol (Accept, User-Agent), package-manager detection |
| [namespacing-and-hosting.md](namespacing-and-hosting.md) | `registries` map (string vs object form), `${ENV}` interpolation, Vercel hosting, content-negotiation rewrite for branded URLs |
| [compatibility-and-versions.md](compatibility-and-versions.md) | Tailwind v4 + React 19 + Next 16 status, deprecated fields, peer-dep gotchas |
| [pitfalls-and-fixes.md](pitfalls-and-fixes.md) | Sealed-folder collapse, fixture-bundle pattern, theme-pollution avoidance, ERESOLVE, last-writer-wins file conflicts, stale CDN cache |

## Sources

Authoritative as of Feb 2026:
- [Registry intro](https://ui.shadcn.com/docs/registry)
- [registry.json schema](https://ui.shadcn.com/docs/registry/registry-json)
- [registry-item.json schema](https://ui.shadcn.com/docs/registry/registry-item-json)
- [Getting started — full flow](https://ui.shadcn.com/docs/registry/getting-started)
- [Namespaces](https://ui.shadcn.com/docs/registry/namespace)
- [Authentication](https://ui.shadcn.com/docs/registry/authentication)
- [CLI reference](https://ui.shadcn.com/docs/cli)
- [Tailwind v4 compat](https://ui.shadcn.com/docs/tailwind-v4)
- [React 19 compat](https://ui.shadcn.com/docs/react-19)
- [components.json reference](https://ui.shadcn.com/docs/components-json)
