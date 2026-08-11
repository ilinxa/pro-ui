# GATE 3 — P2 great-rename catalog-wide review (2026-08-11)

**Scope:** the P2 naming-canon execution (plan §P2, canon [docs/naming-canon.md](../naming-canon.md) LOCKED 2026-08-11) — 52 slug renames + full identifier-family renames + 63 catalog-copy rewrites + 52 deprecated aliases + `validate:naming` + `ui.ilinxa.com` domain canon. Public-API-touching across the entire catalog → one consolidated spotcheck review (readiness rule: public-API minor → spotcheck; per-component review files are not duplicated 63×).

**Reviewers:** implementer (main session) + 3 adversarial verification agents (rename-completeness / registry-integrity / docs-coherence, Sonnet 5 per subagent-model policy) + scripted validator battery.

## 1. What shipped

| Piece | Evidence |
|---|---|
| P2.2 sweep | `scripts/p2-rename.mjs` (one-shot codemod, map in `p2-rename-map.mjs`): 934 files, 16,008 replacements, 367 path renames; manifest regenerated; minor bump ×52 renamed, patch ×11 unchanged |
| P2.3 aliases | 52 file-less alias items (`meta.deprecated`, `registryDependencies: [@ilinxa/<new>]`); `shadcn build` emits `/r/<old>.json` redirect artifacts — old install URLs stay live |
| P2.5 copy | `scripts/p2-descriptions.json` (63 one-liners ≤160 chars) applied to meta.ts + registry.json; display names canonical Title Case (PDF/JSON acronyms); fixture URLs: pravatar/picsum ×75 → stable Unsplash (agent-executed, tsc-verified, 0 residual) |
| P2.4 validator | `scripts/validate-naming.mjs` — slug canon + copy lint + meta/registry/manifest/disk roster equality + canon-roster assertion; wired into `registry:build` |
| Domain | `ui.ilinxa.com` canonical across installation-block, docs page, homepage, sitemap, README, registry.json `homepage`; vercel.app host keeps serving (never removed) |
| P2.6 pack | [docs/directory-pr-pack.md](../directory-pr-pack.md) — entry JSON + theme-aware SVG logo + PR draft + clean-project audit checklist |

## 2. Mechanical safety nets that held

- Longest-first boundary-guarded token replacement (kebab + Pascal + camel + SCREAMING + Title-space); bare-word stems (`workspace`, `registration`) replaced only in path/quoted/scoped contexts.
- History zones excluded and kept verbatim (decisions, reviews, migrations, archives, component-versions.md) — links from history to renamed folders dangle by accepted policy; the canon doc §3 is the translation table.
- Generated surfaces regenerated, not text-swept (source-map, llms.txt, README catalog, public/r).

## 3. Findings (implementer pass)

| # | Sev | Finding | Fix |
|---|---|---|---|
| I-1 | ⚠️ | `rep()` helper didn't expand `$1` in string replacements — 2 broken imports in split-workspace + 1 in generated source-map | fixed lines, regenerated source-map; tsc clean |
| I-2 | ⚠️ | signup-form registry files[] kept `use-registration-form.ts` (scoped basename rule not applied in JSON path mapper) | caught by `validate:registry-json`; fixed |
| I-3 | 🔸 | 3 `related:` arrays still said `workspace`; 1 hand-written llms.txt line said `article-body-01` | fixed; residual-grep now 0 in live zones |
| I-4 | 🔸 | `RichCardTree` → `CardTreeTree` stutter (internal type) | renamed to `ParsedCardTree` (code + plan docs) |
| I-5 | 🔸 | split-workspace runtime `aria-label` default became `"SplitWorkspace"`; guide import snippet broken (`{ Split Workspace }`) | both fixed — a11y string now "Split Workspace" |
| I-6 | 🔹 | validators/build-llms/doc-drift counted alias items as catalog entries | all three made `meta.deprecated`-aware |

## 4. Adversarial verification (3 agents — all findings closed pre-push)

**V-A rename completeness** — found the systematic gap of the pass: identifier rules required a LEFT word-boundary, so **mid-identifier occurrences survived** (`useTodoTreeState`, `serializeArticleBodyToHtml`, `resolveContentCardPermissions`, `makeRichCardRenderer`, `useRichSidebarState`, `useCooperativeChallenge`, `resolveTaskChoiceState`, `mergeRegistrationLabels`, `LazyTodoRichCard`…), plus suffixless kebab basenames (`article-body-viewer.tsx`, `cooperative-challenge-*.tsx` ×7), sentence-case UI strings (`aria-label="Rich card"`, kanban renderer label `"Todo (rich)"`), the task-family wire MIME `application/x-ilinxa-todo+json`, meta `tags` with suffixless old slugs, and the `task-choice.interaction` event literal. → **Fixed by `scripts/p2-rename-residual.mjs`** (relaxed-boundary second sweep: 122 files, 400 replacements, 8 file renames + registry path remap) + spot fixes. Re-grep of every flagged stem: 0 hits.

**V-B registry integrity** — graph/artifacts/imports structurally sound (install-graph closure 179 items ✓, files-vs-disk 12-item sample ✓, R4 no-content-in-index ✓, 1337 cross-imports all resolve ✓). Real findings: **52 orphaned pre-rename `<old>-fixtures.json` artifacts** still committed in `public/r/` (stale build output — publicly fetchable, silently serving old code) → fixed + **`clean-registry-artifacts.mjs` added to `registry:build`** so output always equals registry.json (now exactly 180 files); llms.txt hand-authored preamble kept the old domain (5 URLs) → fixed; 10 fixtures files exported `_01`-suffixed SCREAMING identifiers (`ARTICLE_META_01_DUMMY`…) → generic uppercase `_01` drop, 22 files/146 replacements; `[workspace]` console tags → `[split-workspace]`.

**V-C docs & site coherence** — STATUS table 63/63 correct incl. bump semantics ✓; all sampled links/snippets resolve ✓; directory pack clean ✓. Real findings: third brand variant `ilinxa-proui` in docs-page metadata → unified to **ilinxa pro-ui** (also layout.tsx / homepage / site-header — the P2.3 brand unification); `file-clipboard` (64th support item) description violated the copy canon → rewritten (125 chars) + **validate:naming extended to every served item description**; stale `workspace.tsx` prose + bare `` `workspace` `` slug refs in the split-workspace procomp doc headers → fixed; pre-existing broken links repaired (.claude/CLAUDE.md ×3, docs/systems/README handoff, graph-system force-graph ×9 → point at `docs/migrations/force-graph/` + `docs/archive/`).

**Accepted exceptions (recorded):** history zones keep old names verbatim (canon policy — their links to renamed folders dangle; canon §3 is the translation table) · `card-tree-node` description says "Card-tree" (humanized head-noun, not a slug token — adapter components may name their host) · `id: "workspace"` nav-context ids in app-sidebar fixtures (semantic, not a slug) · verbatim user quotes in task-card GATE 1 doc keep original wording.

## 5. Gates & E2E evidence

**Local gates at ship (commit 53faa6f):** tsc 0 · lint 0 errors (9-warning pre-existing baseline) · meta-deps 63/63 · registry-json 0 high (63 base + 52 aliases) · naming 0 · doc-drift/doc-budget green · production build green (63 SSG detail pages) · public/r exactly 180 artifacts (= registry.json, clean step enforced).

**Post-deploy E2E (production registry):**
- **Full-catalog consumer smoke (Base UI consumer, `e:/tmp/ilinxa-smoke-consumer`): 63/63 installs pass · consumer tsc 0 errors** across the full installed tree. (First batch showed 7 cold-start timeouts at exactly the 120s cap — all 7 re-ran warm at 6–20s; report: harness `results/2026-08-11-smoke.md`.)
- **Clean-project directory audit (fresh Next app, src-layout, Radix, newest shadcn CLI):** `list @ilinxa` 179 items with canon copy · `view card-tree` · `search kanban` (surfaces base + fixtures + the deprecated alias) · `add kanban-board` · `add kanban-board-fixtures` (pulls base) · **`add @ilinxa/rich-card` (old slug) resolves via alias and installs `card-tree`** · consumer tsc clean. Also answers the src-layout install question for this path (installs to `src/components/<slug>/`).
- **Live surface checks:** `/r/registry.json` 179 items, no `content` in index files[] (directory R4) · alias artifact serves with redirect metadata · llms.txt fully on `ui.ilinxa.com` · catalog + detail pages render with new names/copy (visual check: `/components`, `/components/task-card`).

## Verdict

**Pass with follow-ups.**

Follow-ups (owners = next respective touch):
1. **User actions to finish D6:** DNS `ui.ilinxa.com` (CNAME → `cname.vercel-dns.com`) + Vercel domain attach; then submit the directory PR per [directory-pr-pack.md](../directory-pr-pack.md). Until DNS lands, `ilinxa-proui.vercel.app` serves everything (registry + site) — nothing is broken, but the canonical URLs printed in docs/README/llms resolve only after the attach.
2. Alias grace-window removal: one release window after the directory listing stabilizes, delete the 52 alias items (tracked here).
3. Smoke-harness per-slug timeout: raise 120s → 240s or add one retry for cold-start (first-run false negatives; P5.2 hygiene).
4. Accepted exceptions stand as recorded in §4 (history zones verbatim · `card-tree-node` humanized head-noun · nav-context `"workspace"` ids · verbatim user quotes).
