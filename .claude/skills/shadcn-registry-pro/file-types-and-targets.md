# File types + target semantics

The `type` on each file (and on the item itself) controls where the file lands on the consumer's filesystem and which import-path rewrites apply.

## Default destination per type

Resolved against the consumer's `components.json` aliases:

| `type` | Default destination |
|---|---|
| `registry:component` | `<aliases.components>/<filename>` (e.g. `@/components/<filename>`) |
| `registry:ui` | `<aliases.ui>/<filename>` (e.g. `@/components/ui/<filename>`) |
| `registry:lib` | `<aliases.lib>/<filename>` (e.g. `@/lib/<filename>`) |
| `registry:hook` | `<aliases.hooks>/<filename>` (e.g. `@/hooks/<filename>`) |
| `registry:block` | At ITEM level → meta-type for multi-file composites. Files inside have their own types. |
| `registry:page` | **REQUIRES `target`.** Typically `~/app/<route>/page.tsx`. |
| `registry:file` | **REQUIRES `target`.** Lands at exact `target` path. |
| `registry:style` | Style preset — used in shadcn's own registry for the `default` / `new-york` style variants. Producer-side use cases for custom registries are limited; consult shadcn's source examples before using. |
| `registry:theme` | Theme bundle (typically `cssVars` + `css`, no `files[]`) — referenced in some recipes but not verified verbatim in the shadcn schema as of Feb 2026. If unsure, use a `registry:block` item with only `cssVars` + `css` and an empty `files[]` — works equivalently. |
| `registry:font` | Font config; uses `font` field. |

## The `target` field

`target` overrides the default destination. Use it whenever a file must land at a specific path the type defaults can't express.

**Resolution semantics — smoke-test-verified (shadcn CLI v4.5+, May 2026):**

| `target` value | Resolves to |
|---|---|
| `"components/<slug>/foo.tsx"` (no prefix) | **Consumer's project root.** `target` without `~` is project-root-relative. To land under the consumer's `components/` directory, the target string itself must include `components/` (or whatever path matches the consumer's `aliases.components`). |
| `"~/<path>"` (tilde prefix) | Consumer's project root explicitly. `~/foo.config.js` → `<project-root>/foo.config.js`. Equivalent to no prefix in practice; the docs only require `~` for `registry:page` and `registry:file` types. |

**Consumer-layout fragility — important:** because `target` is project-root-relative and producer-decided, it implicitly assumes the consumer's components dir is at `./components/`. Consumers with `./src/components/` (their `aliases.components` mapped to `@/src/components`) will see files land at `./components/<slug>/...` — outside their alias. They must either move the files post-install OR adjust their components.json alias. Document the assumption in your registry's docs site so consumers know what to expect.

Examples:
```json
{ "path": "src/registry/.../properties-form.tsx", "type": "registry:component", "target": "components/properties-form/properties-form.tsx" }
{ "path": "src/registry/.../app/page.tsx",        "type": "registry:page",      "target": "~/app/properties-form-demo/page.tsx" }
{ "path": "src/registry/.../middleware.ts",       "type": "registry:file",      "target": "~/middleware.ts" }
```

## Sealed-folder mapping (the canonical pro-component pattern)

For a sealed folder like:

```
src/registry/components/forms/properties-form/
  properties-form.tsx       ← entry
  index.ts                  ← re-exports
  types.ts
  parts/
    field-row.tsx
  hooks/
    use-foo.ts
  lib/
    flatten.ts
```

Goal on consumer side:

```
components/properties-form/
  properties-form.tsx
  index.ts
  types.ts
  parts/field-row.tsx
  hooks/use-foo.ts
  lib/flatten.ts
```

Recipe — single `registry:block` item with `target` on every file. **Use homogeneous `type: registry:component` for all files** so default-destination behavior is uniform; **prefix every target with `components/`** so the seal lands inside the consumer's components dir:

```json
{
  "name": "properties-form",
  "type": "registry:block",
  "title": "Properties Form",
  "description": "Schema-driven controlled read/edit form.",
  "files": [
    {
      "path": "src/registry/components/forms/properties-form/properties-form.tsx",
      "type": "registry:component",
      "target": "components/properties-form/properties-form.tsx"
    },
    {
      "path": "src/registry/components/forms/properties-form/index.ts",
      "type": "registry:component",
      "target": "components/properties-form/index.ts"
    },
    {
      "path": "src/registry/components/forms/properties-form/types.ts",
      "type": "registry:component",
      "target": "components/properties-form/types.ts"
    },
    {
      "path": "src/registry/components/forms/properties-form/parts/field-row.tsx",
      "type": "registry:component",
      "target": "components/properties-form/parts/field-row.tsx"
    },
    {
      "path": "src/registry/components/forms/properties-form/hooks/use-foo.ts",
      "type": "registry:component",
      "target": "components/properties-form/hooks/use-foo.ts"
    },
    {
      "path": "src/registry/components/forms/properties-form/lib/flatten.ts",
      "type": "registry:component",
      "target": "components/properties-form/lib/flatten.ts"
    }
  ]
}
```

**Why this shape:**
- All files typed `registry:component` → uniform default-destination behavior. Heterogeneous typing (`registry:hook`, `registry:lib`) is unnecessary when `target` overrides destination anyway.
- Every target starts with `components/<slug>/...` because `target` is project-root-relative — without the `components/` prefix, files land at `<project-root>/<slug>/...` (outside the consumer's components alias).
- The seal stays intact; consumer can `import { X } from "@/components/<slug>"` consistently.
- Internal relative imports (`./parts/foo`, `./hooks/use-foo`) survive the copy unchanged.
- Cross-aliased imports (`@/components/ui/button`, `@/lib/utils`) are rewritten by the CLI based on the consumer's alias config (and act as no-ops when consumer's aliases match the producer's).

Type each file accurately even when overriding `target` — `type` drives the default destination (when `target` is omitted) and may inform CLI behavior in future versions. Import-path rewriting today is path-pattern-based (see below), not type-based.

## Import-path rewriting on copy

The CLI parses each file before writing and rewrites imports based on the consumer's `components.json` aliases:

| Source import | Rewritten to |
|---|---|
| `@/components/ui/button` | consumer's `aliases.ui` + `/button` |
| `@/lib/utils` | consumer's `aliases.utils` |
| `@/hooks/use-foo` | consumer's `aliases.hooks` + `/use-foo` |
| `@/registry/...` | resolved per item type / target |
| Relative imports (`./parts/foo`) | preserved as-is |

This is why a strict registry rule (only import from `react`, `@/components/ui/*`, `@/lib/utils`, declared third-party) is exactly what the CLI expects. Anything outside that surface either fails to rewrite or copies a broken import.

## Last-writer-wins for path conflicts

If two registry items target the same consumer file path (rare but possible with overlapping cssVars or shared utility files), the last item resolved overwrites earlier ones. Avoid by:

- Never targeting the same file from two different items (except for `lib/utils.ts` shared by primitives, the canonical exception — and that's owned by the shadcn registry, not yours).
- Sharing utility files via a single dedicated `registry:lib` item that other items declare as a `registryDependency`.

## When `registry:component` is correct vs `registry:block`

- ITEM-level `registry:component` — single-file or near-single-file component. Default destination behavior is fine.
- ITEM-level `registry:block` — multi-file composite. Use `target` per file to control layout.

If an item has more than ~3 files OR has subdirectories (`parts/`, `hooks/`, etc.), prefer `registry:block` + explicit `target`s. The default-destination behavior of `registry:component` for sub-files leads to scattered output.
