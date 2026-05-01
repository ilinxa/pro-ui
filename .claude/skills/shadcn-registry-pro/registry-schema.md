# registry.json + registry-item.json schemas

Authoritative as of Feb 2026 (`shadcn@^4.5.0`).

## Top-level `registry.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "ilinxa",
  "homepage": "https://ilinxa.com",
  "items": [/* registry items */]
}
```

| Field | Required | Type | Notes |
|---|---|---|---|
| `$schema` | optional but recommended | string | `https://ui.shadcn.com/schema/registry.json` enables editor validation |
| `name` | yes | string | Identifier used in metadata + data attributes |
| `homepage` | yes | string | Project homepage URL; metadata only |
| `items` | yes | array | One registry item per shippable artifact |

## Registry item — full field list

Required: `name`, `title`, `description`, `type`, `files[]`. Everything else optional.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "properties-form",
  "title": "Properties Form",
  "description": "Schema-driven controlled read/edit form.",
  "type": "registry:block",
  "author": "ilinxa",
  "categories": ["forms", "graph-system"],
  "registryDependencies": ["button", "input", "select", "switch", "textarea", "tooltip"],
  "dependencies": ["lucide-react@^1.11.0"],
  "devDependencies": [],
  "files": [
    {
      "path": "src/registry/components/forms/properties-form/properties-form.tsx",
      "type": "registry:component",
      "target": "components/properties-form/properties-form.tsx"
    }
  ],
  "cssVars": {
    "theme": { "font-heading": "Onest, sans-serif" },
    "light": { "brand": "oklch(0.80 0.20 132)" },
    "dark": { "brand": "oklch(0.86 0.18 132)" }
  },
  "css": "@layer utilities { /* raw CSS appended to consumer's globals */ }",
  "envVars": { "NEXT_PUBLIC_FOO": "default-value" },
  "docs": "Long-form install doc, shown after install completes.",
  "meta": { "anything": "key-value pairs preserved verbatim" }
}
```

| Field | Type | Purpose |
|---|---|---|
| `$schema` | string | Editor validation |
| `name` | string | Item slug; what consumer types after the namespace prefix |
| `title` | string | Display name |
| `description` | string | Shown in some CLI flows; useful for catalog UIs |
| `type` | enum | `registry:component` / `registry:ui` / `registry:lib` / `registry:hook` / `registry:block` / `registry:page` / `registry:file` / `registry:style` / `registry:font`. `registry:theme` is referenced in some recipes but not verified verbatim in shadcn docs as of Feb 2026 — fetch the live `registry-item.json` schema to confirm before relying. |
| `author` | string | Free-form |
| `categories` | string[] | Tags; surface in a catalog UI; not used by CLI |
| `registryDependencies` | string[] | Other items to install first. Resolution order: (1) bare names matching this registry's own `items`, (2) bare names known to shadcn's default registry — primitives like `button`, `input`, `card`, etc. — which the CLI knows about by built-in convention, (3) full URLs for cross-registry references, (4) namespaced names like `@other-ns/foo` resolved through the consumer's `registries` map. Resolution is recursive across all forms. |
| `dependencies` | string[] | npm packages to install (CLI runs `pnpm add` automatically) |
| `devDependencies` | string[] | npm dev-deps to install |
| `files` | object[] | Source files — see [file-types-and-targets.md](file-types-and-targets.md) |
| `cssVars` | `{ theme?, light?, dark? }` | CSS custom properties merged into consumer's globals |
| `css` | string | Raw CSS appended to consumer's globals (use `@layer` to scope) |
| `tailwind` | object | **DEPRECATED for Tailwind v4.** Use `cssVars` + `css` instead |
| `envVars` | `{ [k]: defaultValue }` | Hint values for `.env.local`; CLI prompts user |
| `font` | object | Only meaningful for `type: registry:font` |
| `docs` | string | Free-form long doc; some CLI flows print post-install |
| `meta` | object | Arbitrary; CLI passes through verbatim |

## File entry shape

```json
{
  "path": "src/registry/components/forms/properties-form/parts/field-row.tsx",
  "type": "registry:component",
  "target": "components/properties-form/parts/field-row.tsx"
}
```

| Field | Required | Notes |
|---|---|---|
| `path` | yes | Path RELATIVE TO REPO ROOT (where `registry.json` lives), pointing at the source file the CLI parses |
| `type` | yes | Determines default destination — see [file-types-and-targets.md](file-types-and-targets.md) |
| `target` | conditionally | **Required for `registry:page` and `registry:file`**. Recommended for any `registry:block` whose files must stay co-located. `~` prefix = consumer's project root |

## What's NOT in the schema

Confirmed absent (research-verified — these were explicitly checked):
- `permissions` / `extends` / `inherits` — no inheritance between items.
- `--with-fixtures` style flags — no per-item file-subset selection at install time.

Not documented (treat as absent until proven otherwise; verify against live schema before relying on a workaround):
- Item-level `version` — registry items appear to be content-addressed by URL rather than semver-versioned. Bumping a component republishes the URL contents.
- Per-file `optional: true` — every file in an item appears to ship together.

A single registry item produces ONE registry entry. To ship variants (base + fixtures, base + theme), author multiple items and link via `registryDependencies`.

## Source-folder convention (informational)

Shadcn's own registry organizes source under `registry/<style>/<name>/...` (e.g. `registry/new-york/hello-world/hello-world.tsx`) — the `<style>` segment supports their `default` / `new-york` style variants. Custom registries are NOT required to follow this layout; the `path` field is just the source path relative to the repo root, organized however your project prefers. This skill's recipes use `src/registry/components/<category>/<slug>/...` to match the `ilinxa-ui-pro` project, but anything works as long as `path` resolves to a real file. The CLI doesn't impose a structure on `path`, only on what gets written via `target`.

## Schema-evolution caveat

The official schema lives at `https://ui.shadcn.com/schema/registry-item.json` and is occasionally extended. Before relying on undocumented behavior, fetch the schema directly and diff against this recipe.
