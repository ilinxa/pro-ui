# shadcn Registry Directory — verified plan for listing `@ilinxa`

> **Status 2026-08-11:** all machine-checked requirements already pass; listing is gated on **P2 (great rename)** only. This file supersedes the externally-prepared readiness guide, which was written against a ~3-month-stale picture of the project — its corrections are recorded below so nobody executes them. Open-source **MIT decided 2026-08-11** (user call); LICENSE shipped same day.

## Verified current state (checked 2026-08-11 against repo + live shadcn sources)

| Directory requirement | State |
|---|---|
| R1 open source + publicly accessible | ✅ MIT LICENSE at repo root; README + package.json say MIT; repo public |
| R2 `registry.json` valid vs `https://ui.shadcn.com/schema/registry.json` | ✅ `$schema` set; validated by `shadcn build` every deploy + `validate:registry-json` |
| R3 flat registry (`/registry.json` + `/{name}.json`) | ✅ served flat under `/r/` — index at `/r/registry.json`, items at `/r/<name>.json` |
| R4 index `files[]` has NO `content` | ✅ true in source AND served index (0 occurrences; content only in per-item artifacts — correct) |
| Items install clean | ✅ 63/63 real-CLI installs + consumer tsc 0 (P1.5 smoke, 2026-08-11) |
| `@ilinxa` namespace availability | ✅ absent from live `https://ui.shadcn.com/r/registries.json` (~500 entries) |
| Directory entry fields | `name` (regex `^@[a-zA-Z0-9][a-zA-Z0-9-_]*$`) · `homepage` · `url` with `{name}` · `description` · **`logo` (required — inline SVG; verified in `validate-registries.mts` Zod schema; the served registries.json strips it, don't be fooled)** |

## Corrections to the external guide (do NOT execute these items)

1. Its "KNOWN BLOCKER: registry inlines `files[].content`" is **false** — never true of this repo's index.
2. Its "8 components" premise is stale — 63 components / 127 items; README + llms.txt are **generated** and honest (doc-drift validator enforces).
3. `force-graph` was archived long ago; not in `registry.json`.
4. Its "269 entries" count is stale (~500 live).

## Remaining work (formalized as plan **P2.6** — rides P2 close-out)

1. **⚠️ SEQUENCING — PR only AFTER P2 ships.** The rename drops `-NN` from slugs → every item name changes. Listing first, then churning 63 item names, breaks early adopters and looks bad in review.
2. During P2: canonical name applied everywhere (kills the 4 naming variants) · final domain decision (URL template change later = a second PR) · P2.5 catalog copy rewrite (the directory guideline explicitly wants LLM-readable descriptions) · point `registry.json` `homepage` at the site (currently the GitHub URL).
3. Entry assets (~1h): square inline-SVG logo (theme-aware `var(--foreground)` fill, embeddable as a JSON string) + one accurate sentence.
4. Clean-project audit (~1h): fresh Next app + `components.json` registries entry → `list` / `view` / `search` / `add` for a sample incl. fixtures (P1.5 smoke covered `add`+tsc for all 63; the other CLI verbs are unexercised).

## Submission (verified flow)

Fork `shadcn-ui/ui` → add ONE alphabetical entry to `apps/v4/registry/directory.json`:

```json
{
  "name": "@ilinxa",
  "homepage": "https://<FINAL-DOMAIN>",
  "url": "https://<FINAL-DOMAIN>/r/{name}.json",
  "description": "<one accurate sentence — written in P2.5>",
  "logo": "<svg …>…</svg>"
}
```

Run `pnpm validate:registries` locally → PR against `main` (diff = exactly one entry) → CI validates, team reviews manually (no SLA; don't ping). After merge: verify `@ilinxa` in `registries.json`, zero-config `add` from a clean project, and shadcn-MCP search/install; then flip site install docs to lead with the namespace command.
