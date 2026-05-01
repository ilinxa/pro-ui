# `shadcn build` + consumer `shadcn add` — flags, protocol, package manager

## `shadcn build` (producer side)

Generates `public/r/*.json` + `public/r/registry.json` (catalog) from the source `registry.json`. Note: the emitted catalog filename is `registry.json`, not `index.json` — confusingly the same name as the source input file.

| Flag | Default | Purpose |
|---|---|---|
| `[registry]` (positional) | `./registry.json` | Path to registry.json |
| `-o, --output <path>` | `./public/r` | Destination dir for emitted JSONs |
| `-c, --cwd <cwd>` | current dir | Working directory |
| `-h, --help` | — | Help |

That's the entire flag surface. There is no `--watch`, no `--validate-only`, no `--minify`. To re-build on save, wrap in `nodemon` / `chokidar-cli` / similar.

Recommended `package.json` script:
```json
{ "scripts": { "registry:build": "shadcn build" } }
```

Output structure:
```
public/r/
  registry.json           ← catalog: lists every item with metadata, NO inlined file content
  <slug>.json             ← one per registry item, with file content inlined under each `files[].content`
```

The catalog (`public/r/registry.json`) is what content-negotiation rewrites should redirect to (see [namespacing-and-hosting.md](namespacing-and-hosting.md)) — its smaller size is the right artifact for catalog UIs and content-negotiated index responses.

## Consumer-side `shadcn add` flags (for context — we ship for it)

| Flag | Purpose |
|---|---|
| `-y, --yes` | Skip confirmation |
| `-o, --overwrite` | Replace existing files (otherwise CLI prompts on conflict) |
| `-c, --cwd <cwd>` | Working dir |
| `-a, --all` | Install all available components |
| `-p, --path <path>` | Override destination dir |
| `-s, --silent` | Mute output |
| `--dry-run` | Preview without writing |
| `--diff [path]` | Show what would change |
| `--view [path]` | Show file contents without installing |

There is no documented `--no-deps` or `--legacy-peer-deps` flag on `shadcn add`. For peer-dep issues consumers handle at `npm install` / `pnpm install` time.

## Argument forms (in resolution order)

1. **Bare name** — `pnpm dlx shadcn add button` — fetches from default shadcn registry.
2. **Namespaced** — `pnpm dlx shadcn add @ilinxa/properties-form` — resolves via consumer's `components.json` `registries` map.
3. **Full URL** — `pnpm dlx shadcn add https://ilinxa.com/r/properties-form.json` — direct fetch.
4. **Local path** — `pnpm dlx shadcn add ./local/path.json` — useful for smoke-testing before deploy.

`registryDependencies` resolution is **recursive** — installing one item walks the full dep graph and installs everything in topological order.

## HTTP protocol — what the CLI sends

When the CLI fetches a registry URL, it sends:

```
User-Agent: shadcn
Accept: application/vnd.shadcn.v1+json
```

Two server-side strategies:
1. **Static hosting (default).** Vercel / Netlify / GitHub Pages serve the JSON file at the URL directly. The `Accept` header is ignored by static servers, which return the file regardless. **No special config needed.**
2. **Content-negotiated branded URL.** A Next rewrite that checks `Accept` can serve `/` as the registry index when the CLI hits it, and the docs site otherwise. See [namespacing-and-hosting.md](namespacing-and-hosting.md).

## CORS

`shadcn add` does direct HTTP fetch from the consumer's machine (Node, not browser). **CORS does not apply.** No `Access-Control-Allow-Origin` configuration needed for public registries.

## Package manager detection (consumer side)

Undocumented in shadcn's CLI reference, but in practice the CLI detects from the consumer's working directory:

- `pnpm-lock.yaml` → `pnpm add`
- `bun.lockb` → `bun add`
- `yarn.lock` → `yarn add`
- `package-lock.json` (or none) → `npm install`

If detection fails, falls back to npm. Consumers using exotic setups (e.g. monorepo workspaces, ESM-only) should run with `--silent` and install deps manually.

## Caching behavior

The CLI does not cache fetched registry JSONs across runs (each invocation refetches). Stale results almost always come from CDN edge caches at the host, not from the CLI. See [pitfalls-and-fixes.md](pitfalls-and-fixes.md) §10.

## Smoke-test loop (the canonical workflow)

```bash
# producer terminal A
pnpm registry:build
pnpm dev   # serves public/r/*.json at http://localhost:3000/r/*.json

# producer terminal B — throwaway tmp consumer Next app
cd /tmp/test-consumer
pnpm dlx shadcn add http://localhost:3000/r/<slug>.json

# inspect what landed where — exact path depends on consumer's components.json aliases:
#   aliases.components = "@/components"     → ./components/<slug>/
#   aliases.components = "@/src/components" → ./src/components/<slug>/
ls -la <consumer-components-dir>/<slug>/
cat <consumer-components-dir>/<slug>/<slug>.tsx | head -20   # confirm imports rewrote correctly
```

If the output is wrong, adjust `target` paths in `registry.json`, rebuild, re-add. Iterate on ONE component first; lock the pattern; bulk-author the rest.

**The smoke test is also where you nail down `target` resolution semantics** (alias-relative vs project-root-relative; see [file-types-and-targets.md](file-types-and-targets.md)). Don't bulk-author your `registry.json` until this is locked.

## CLI version sanity check

```bash
pnpm dlx shadcn@latest --version
```

This skill targets `shadcn@^4.5.0`. v5 may ship with breaking changes; re-validate against the changelog before relying on undocumented behavior.
