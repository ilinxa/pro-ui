# Tailwind v4 / React 19 / Next 16 compatibility

## Status as of Feb 2026

| Stack | Status | Notes |
|---|---|---|
| Tailwind v4 | ✅ Officially supported | `tailwind` config field on items DEPRECATED — use `cssVars` + `css` |
| React 19 | ✅ Officially supported | `--legacy-peer-deps` only needed with npm; pnpm/bun/yarn fine |
| Next 15 | ✅ Officially supported | Documented baseline |
| Next 16 | ⚠️ Not explicitly documented | Registry layer is framework-independent; consumer install flow unaffected |
| pnpm 10 | ✅ | No known issues |
| shadcn CLI | `^4.5.0` validated | v5 status — re-check the changelog before using |

## Tailwind v4 specifics

Tailwind v4 has no `tailwind.config.*` — config lives in `globals.css` via `@theme`, `@custom-variant`, `@source`, etc.

Implication for registry items:
- The `tailwind` field on a registry item (which used to inject into `tailwind.config.*`) is **deprecated**.
- Push tokens via `cssVars`. The CLI merges them into the consumer's `globals.css` `@theme` block.
- Push raw layers via `css` (use `@layer utilities {}` to scope).
- Don't generate or expect a `tailwind.config.*` on the consumer side.

```json
{
  "cssVars": {
    "theme": {
      "color-brand": "oklch(0.80 0.20 132)",
      "font-heading": "Onest, sans-serif"
    },
    "light": {
      "background": "oklch(0.975 0.003 250)"
    },
    "dark": {
      "background": "oklch(0.13 0.006 250)"
    }
  }
}
```

Inferred merge behavior on consumer side (extrapolated from Tailwind v4 conventions; verify by inspecting consumer's `globals.css` after install):
- `theme.X` → `@theme { --X: ...; }` (Tailwind v4 token registration)
- `light.X` → `:root { --X: ...; }` (light-mode override)
- `dark.X` → `.dark { --X: ...; }` (dark-mode override)

## React 19 specifics

- shadcn primitives shipped after late-2025 are React-19-native (use ref-as-prop, no `forwardRef` ceremony).
- Consumers on Tailwind v3 + React 18 still work — the registry serves older primitive variants based on consumer config.
- `--legacy-peer-deps` only needed with `npm` install path due to ERESOLVE on `react@19` peer-dep ranges in some transitive deps.
- `pnpm` and `bun` resolve without ceremony.

## Next 16 considerations

Next 16 isn't explicitly called out in shadcn docs (Next 15 is). What's verified:
- The registry CLI is framework-independent for the **build side** — producing JSON doesn't care what framework you use.
- **Consumer-side install** rewrites paths via `components.json` aliases, not Next-specific config. Works for App Router, Pages Router, and non-Next React projects equally.
- The content-negotiation rewrite recipe in [namespacing-and-hosting.md](namespacing-and-hosting.md) is Next-specific but works on Next 14 / 15 / 16 unchanged.
- No regressions reported between Next 15 and 16 affecting the registry flow.

If a consumer is on Next 16 and reports a registry-flow regression, suspect (a) their alias config in `components.json`, (b) a Next 16-specific peer-dep on a primitive your component uses, NOT the registry layer itself.

## peer-dep gotcha matrix

| Consumer's package manager | React 19 install | Workaround |
|---|---|---|
| pnpm | ✅ Clean | None needed |
| bun | ✅ Clean | None needed |
| yarn (any) | ✅ Mostly | Occasional duplicate warnings |
| npm | ⚠️ ERESOLVE | `npm install --legacy-peer-deps` |

Document supported package managers in your registry's docs. Default to recommending pnpm.

## Things that have churned recently — re-validate before relying

- **`tailwind` field deprecation timeline** — may be removed entirely in a future CLI release, not just deprecated.
- **`registry:style` and `registry:theme` semantics** — newer types added late 2025; behavior subject to refinement.
- **Object form for `registries`** — auth + headers + params landed in the v4 series; pre-v4 only string form worked.
- **`registry:font` and the `font` field** — new addition; verify behavior empirically before relying.

## What the registry CLI does NOT depend on

- Consumer's React version (any of 18, 19+ work for the install layer itself; component code is what couples to React).
- Consumer's bundler (Webpack, Turbopack, Vite, Rollup all consume the copied source as plain TSX/TS).
- Consumer's Tailwind major version (v3 vs v4 affects the `cssVars` merge behavior, not the install).
- Consumer's TypeScript version (5.x is the shadcn baseline; the CLI is widely understood to copy source files without typechecking, but this isn't documented explicitly — large enterprise consumers may want to verify before assuming).

## What the registry CLI DOES depend on

- Consumer has `components.json` at project root (or specified via `--cwd`).
- `aliases` block in that file matches the imports inside the source code being copied.
- Consumer's package manager detected from lockfile (see [cli-and-protocol.md](cli-and-protocol.md)).
- Network access to the registry URL.
