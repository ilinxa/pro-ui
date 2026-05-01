# Pitfalls + fixes

## 1. Sealed-folder layout lands at wrong path on consumer side

**Symptom:** Files end up at `<project-root>/<slug>/...` instead of `<project-root>/components/<slug>/...` (outside the consumer's components alias).

**Cause:** `target` was set without the `components/` prefix. The CLI resolves `target` relative to the consumer's PROJECT ROOT, not relative to the alias root for the file's `type`. So `target: "<slug>/foo.tsx"` lands at `<project-root>/<slug>/foo.tsx`, NOT under `<aliases.components>/<slug>/foo.tsx`.

**Fix:** Prefix every `target` with `components/` (or whatever path matches the consumer's `aliases.components`):
```json
{ "path": "src/registry/.../foo.tsx", "type": "registry:component", "target": "components/<slug>/foo.tsx" }
```

See [file-types-and-targets.md](file-types-and-targets.md) for the canonical recipe.

**Consumer-layout fragility:** the `target` value is producer-decided and project-root-relative, so it implicitly assumes the consumer's components dir is at `./components/`. Consumers with `./src/components/` will see files land outside their alias and need to move them post-install OR adjust their `components.json`. Document this assumption in your docs site.

## 2. Registry URL missing `{name}` placeholder

**Symptom:** CLI validation error on consumer's `pnpm dlx shadcn add @ns/foo` immediately, before any fetch happens.

**Cause:** `components.json` `registries` value is a static URL.

**Fix:** Add `{name}` placeholder. Reference: [issue #9370](https://github.com/shadcn-ui/ui/issues/9370).

```json
// BROKEN
"registries": { "@ilinxa": "https://ilinxa.com/r/component.json" }

// FIXED
"registries": { "@ilinxa": "https://ilinxa.com/r/{name}.json" }
```

## 3. Optional fixtures / variants want a "flag" — there isn't one

**Symptom:** Want consumers to opt into a `dummy-data.ts` fixture file but only when they ask for it.

**There's no flag.** No `--with-fixtures`, no per-file `optional: true`, no install-time prompt.

**Fix — dual-item pattern:**

```json
{
  "items": [
    {
      "name": "properties-form",
      "type": "registry:block",
      "files": [/* core component files only — no dummy-data */]
    },
    {
      "name": "properties-form-fixtures",
      "type": "registry:block",
      "title": "Properties Form (with fixtures)",
      "description": "Properties Form bundle including dummy data.",
      "registryDependencies": ["properties-form"],
      "files": [
        {
          "path": "src/registry/components/forms/properties-form/dummy-data.ts",
          "type": "registry:component",
          "target": "components/properties-form/dummy-data.ts"
        }
      ]
    }
  ]
}
```

Consumer:
- `pnpm dlx shadcn add @ns/properties-form` → lean
- `pnpm dlx shadcn add @ns/properties-form-fixtures` → core + fixtures (resolves the dep automatically)

Document the suffix convention (`-fixtures`, `-with-theme`, `-storybook`, etc.) in the registry's docs site so consumers can predict variant names.

## 4. Pushing brand tokens via cssVars overrides consumer's theme

**Symptom:** Consumer reports their `--brand` / `--accent` colors got hijacked after installing your component.

**Cause:** Every component's `cssVars` merges into the consumer's globals. ANY token you push that the consumer already had gets overwritten.

**Fix:** Don't ship producer-brand tokens via `cssVars` on functional components. Instead:
- Ship a separate dedicated theming item — a `registry:block` named `<your-name>-theme` with `cssVars` + `css` only is the safe default; `registry:theme` may also exist as a dedicated type but verify against the live schema first. Consumers who want your accent install this explicitly.
- Functional components reference variables generically — `var(--primary)`, `var(--accent)` — and inherit whatever the consumer's theme defines.

Exception: shipping a token the consumer is GUARANTEED not to have (e.g. `--<your-namespace>-doc-glow`) is fine. Just don't override common names.

## 5. Heavy components fight the shadcn philosophy

**Symptom:** Component has 30+ files, complex peer deps (Web Workers, WebGL, codemirror, dnd-kit), updates require manual diff merges.

**Issue:** `shadcn add` copies source verbatim into consumer's repo. Consumer ends up owning all 30+ files. The shadcn philosophy ("you own the code") works for 1–10 file composables; gets ugly at scale.

**Fix options:**
- Ship via NPM instead for very heavy components; reserve shadcn-registry for lean composable surfaces.
- OR ship via shadcn-registry but minimize the consumer-facing file count (consolidate `parts/` into the entry file, inline trivial helpers) — only if you accept readability cost.
- OR document the rebuild story explicitly: "to update, re-run `pnpm dlx shadcn add @ns/foo --overwrite`".

Mixed strategy is normal: some components ship via NPM, others via registry. Both can live in the same producer repo.

## 6. Two registry items target the same consumer file

**Symptom:** Consumer reports a file got overwritten by an unexpected install.

**Cause:** Two items both write to the same `target` path. Last-writer-wins resolution; whichever was processed last replaces earlier ones.

**Fix:** Audit your `target` paths during `shadcn build` review. Shared utility files belong in ONE item that other items depend on, never duplicated.

```bash
# producer-side audit (bash / Git Bash / WSL)
cat registry.json | jq -r '.items[].files[].target' | sort | uniq -d
# any output here = a conflict
```

```powershell
# Windows PowerShell equivalent
(Get-Content registry.json | ConvertFrom-Json).items.files.target |
  Group-Object | Where-Object Count -gt 1 | Select-Object Name,Count
```

## 7. Consumer's `npm install` errors on React 19 peer deps

**Symptom:** `ERESOLVE could not resolve` after `shadcn add` succeeds.

**Cause:** npm's stricter peer-dep resolution with `react@19`.

**Fix on consumer side:** `npm install --legacy-peer-deps`, or recommend pnpm in your install docs.

## 8. Smoke test was skipped, registry ships broken

**Symptom:** Real consumer reports component imports break or files don't land where expected.

**Fix — always smoke-test BEFORE bulk-authoring `registry.json`:**

```bash
# producer
pnpm registry:build
pnpm dev   # serves public/r/*.json at http://localhost:3000/r/*.json

# in throwaway tmp consumer Next app
pnpm dlx shadcn add http://localhost:3000/r/<slug>.json
# inspect what landed where, fix targets, repeat
```

Iterate on ONE component first, lock the pattern, then bulk-author the rest. Path-mapping bugs are cheap to fix on one component, expensive across eight.

## 9. Branded URL works in browser, not from CLI

**Symptom:** Visiting `https://ilinxa.com` works, but `shadcn add https://ilinxa.com` 404s.

**Cause:** Content-negotiation rewrite missing or misconfigured.

**Fix:** Add the `next.config.ts` rewrite from [namespacing-and-hosting.md](namespacing-and-hosting.md). Verify with curl:
```bash
curl -H "Accept: application/vnd.shadcn.v1+json" https://ilinxa.com
# should return registry index JSON, not HTML
```

If the rewrite is in place but still 404s, check (a) the regex correctly matches the `Accept` header (CDN may strip or modify it), (b) the rewrite is `beforeFiles` not `afterFiles`, (c) `/r/index.json` exists in the deployed `public/r/`.

## 10. Stale CDN cache after `shadcn build` redeploy

**Symptom:** Consumer keeps getting old version of a component after you rebuild + redeploy.

**Cause:** CDN edge cache holding the previous JSON.

**Fix:**
- Producer: short `max-age` on `public/r/*.json` (5 min works; see [namespacing-and-hosting.md](namespacing-and-hosting.md)).
- Producer: trigger CDN purge on deploy if your host supports it (Vercel does this automatically on new deploys).
- Consumer: ensure their shadcn CLI version isn't pinned to a stale release (`pnpm dlx shadcn@latest` requests the newest published CLI; that's a CLI-version mechanic, NOT a registry-fetch cache-bust). The CLI itself doesn't cache fetched registry JSON across runs — staleness almost always traces to CDN edge caches at the host. If the host supports it, append a cache-buster to the registry URL once (`?v=<hash>`) to force a fresh edge fetch.

## 11. `meta.ts` / `demo.tsx` / `usage.tsx` accidentally shipped

**Symptom:** Consumer's repo gets bloated with docs-site-only files; sometimes broken imports because `usage.tsx` references `@/registry/...` paths the consumer doesn't have.

**Cause:** Lazy `files: ["src/registry/.../*"]` glob.

**Fix:** Enumerate `files` explicitly. Ship only consumer-facing artifacts:
- ✅ Component entry, `index.ts`, `parts/*`, `hooks/*`, `lib/*`, `types.ts`
- ❌ `demo.tsx`, `usage.tsx`, `meta.ts` — docs-site only
- ❓ `dummy-data.ts` — ship via the dual-item fixtures pattern (§3) if at all

## 12. Source files use `@/registry/...` cross-component imports

**Symptom:** After `shadcn add`, the copied file has unresolved `@/registry/...` imports — the consumer doesn't have a `registry/` alias.

**Cause:** A source file inside one component imports from another sibling component.

**Fix:** Enforce a registry rule: components may only import from `react`, `@/components/ui/*`, `@/lib/utils`, and explicitly-declared third-party deps. Cross-component composition happens at the host level, not inside a component. Verify with grep:
```bash
grep -r "from ['\"]@/registry/" src/registry/components/ --include='*.ts' --include='*.tsx'
# only allowed hits: usage.tsx string literals (which don't ship)
```

## 13. Registry JSON exceeds reasonable size

**Symptom:** `public/r/<slug>.json` is megabytes; consumers report slow installs.

**Cause:** Large auto-generated files (compiled assets, test fixtures, screenshots) included in `files`.

**Fix:** Ship only source files. Binary assets (icons, images) belong in NPM packages or a separate `registry:font` / dedicated CDN, not inlined into `registry-item.json`.

## 14. Consumer hasn't run `shadcn init` first — `cn` helper missing

**Symptom:** After `shadcn add`, consumer's build fails with `Cannot find module '@/lib/utils'` or similar — the `cn` helper that every shadcn primitive imports.

**Cause:** `shadcn add` installs the explicitly-listed `registryDependencies` and `dependencies`, but the `cn` utility (`lib/utils.ts`) is seeded by `shadcn init`, NOT by `add`. Smoke-tested manually: a minimal consumer project with `components.json` but no `shadcn init` run will receive primitives that import `@/lib/utils`, but no `lib/utils.ts` file gets created.

**Fix:** Document in your registry's docs site that consumers must run `pnpm dlx shadcn@latest init` once before installing components from any registry — this seeds `cn` plus other shared utilities. Real consumer projects almost always have this from before; the issue surfaces in fresh smoke-test setups.

## 15. Per-item JSON gets unexpectedly huge

**Symptom:** A specific component's `public/r/<slug>.json` is megabytes; consumers report slow installs of that one component.

**Cause:** That item ships large source files OR very large inlined fixtures via the dual-item pattern. Each per-item JSON inlines every `files[].content` as a string — a 50KB component is ~50KB of JSON-escaped string in the artifact.

**Fix:** Per-item JSON size is roughly source size × ~1.1 (JSON escaping overhead). If `<slug>.json` exceeds a few hundred KB, audit:
- Are demo/usage/meta files accidentally included? (See pitfall 11.)
- Are large fixtures inlined? (Move them to `<slug>-fixtures` per pitfall 3.)
- Are binary assets inlined as text? (They shouldn't ship via registry — see pitfall 13.)

The catalog (`public/r/registry.json` after build) is normally metadata-only with NO inlined `content` — it's the per-item JSONs that carry the source. If the catalog itself has `content` fields, that's an unusual artifact: re-run `pnpm dlx shadcn@latest build` to ensure current CLI, and compare against a known-good registry's catalog (e.g. `https://ui.shadcn.com/r/registry.json`).
