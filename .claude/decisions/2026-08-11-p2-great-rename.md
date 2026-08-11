---
date: 2026-08-11
session: P2 execution (single autonomous arc, /goal directive)
phase: P2 — naming canon (production-readiness plan)
type: execution + decision
commits: [53faa6f, close-out commit]
components: all 63 (52 renamed minor-bump, 11 patch-bump)
findings: 3 adversarial verify passes → all closed pre-push; see docs/reviews/2026-08-11-p2-rename-review.md
status: P2 CLOSED (2.1–2.6; directory PR submission pending user DNS + PR account)
---

# P2 — the great rename, executed end-to-end

**Canon:** [docs/naming-canon.md](../../docs/naming-canon.md) LOCKED 2026-08-11 — user delegated per-row sign-off to the revalidation pass ("revalidate the names then start p2"). One revalidation flip: `gantt-timeline` (not `gantt-chart`). **Domain locked (P2.1): `ui.ilinxa.com`** (user call).

## What happened

1. **P2.2 sweep** — `scripts/p2-rename.mjs` (map: `p2-rename-map.mjs`): 934 files / 16,008 replacements / 367 path renames; manifest regenerated; full identifier-family renames (RichCard*→CardTree*, Todo*→Task*, ArticleBody*→RichText*, ContentCard*→NewsCard*, scoped Registration*→Signup* + Workspace*→SplitWorkspace*, …). History zones verbatim.
2. **P2.2b residual** — `scripts/p2-rename-residual.mjs` after the completeness verify pass found the left-boundary guard gap (mid-identifier survivors like `useTodoTreeState`): 122 files / 400 replacements / 8 basename renames + SCREAMING `_01` drop (22 files/146) + wire MIME `x-ilinxa-todo+json`→`x-ilinxa-task+json`.
3. **P2.3 aliases** — 52 file-less deprecated items (`meta.deprecated`, regDep→new); old `/r/<old>.json` URLs serve as redirects; **verified E2E**: `add @ilinxa/rich-card` installs `card-tree` in a clean consumer.
4. **P2.4** — `validate:naming` (slug canon, copy lint incl. every served description, roster equality disk/meta/manifest/registry, canon-roster assertion) wired into `registry:build`. Plus `clean-registry-artifacts.mjs` — public/r wiped before every `shadcn build` (52 orphaned pre-rename fixtures artifacts were being served; class now impossible).
5. **P2.5 copy** — 63 canon descriptions (≤160, capability-first; `scripts/p2-descriptions.json`) + canonical Title Case names + fixtures/`file-clipboard` copy; fixture URLs pravatar/picsum ×75 → stable Unsplash (agent-executed, verified).
6. **Brand + domain** — one brand form **ilinxa pro-ui** everywhere (header/footer/titles/eyebrows; killed `ilinxa-ui-pro` + `ilinxa-proui` variants); `ui.ilinxa.com` canonical on all surfaces; vercel.app host remains as permanent fallback.
7. **P2.6 pack** — [docs/directory-pr-pack.md](../../docs/directory-pr-pack.md): entry JSON + theme-aware SVG logo + PR draft + audit checklist. **Clean-project audit GREEN** (fresh Next app, src-layout, Radix, newest CLI): list 179 / view / search (finds alias too) / add / add-fixtures / alias-add / consumer tsc 0.

## Evidence

- Gates at ship: tsc 0 · lint 0 errors (9-warning pre-existing baseline) · meta-deps 63/63 · registry-json 0 high (+52 aliases validated) · naming 0 · doc-drift/budget green · prod build green · public/r exactly 180 artifacts.
- 3 adversarial verify agents (Sonnet 5): findings ledger + accepted exceptions in the [review file](../../docs/reviews/2026-08-11-p2-rename-review.md). Every finding fixed pre-push or recorded as an accepted exception.
- Post-deploy: index 179 items content-free · alias artifact serves · llms/domain correct · renamed pages render (visual check: catalog + task-card detail) · full-63 consumer smoke: see review §5.

## Lessons

- **Left-boundary guards are wrong for identifier family renames** — `use<Family>State` compounds survive; sweep with relaxed anywhere-matching for family-unique stems, then adversarially verify.
- **`shadcn build` never deletes stale output** — renamed/removed items leave live, publicly-served orphans; always clean the artifact dir first (now automated).
- **Bare-English-word slugs (workspace) cost real sweep complexity** — the canon now bans vague single-word stems for future components.
- The 3-agent adversarial pattern caught 3 distinct failure classes the validators structurally cannot see (mid-identifier API surface, orphaned artifacts, brand/prose variants) — it stays the GATE 3 default for catalog-wide changes.

## Remaining external steps (user)

1. **DNS**: add `CNAME ui → cname.vercel-dns.com` on ilinxa.com + attach `ui.ilinxa.com` to the Vercel project (Settings → Domains). Everything already points at it; vercel.app keeps working meanwhile.
2. **Directory PR**: submit per [directory-pr-pack.md](../../docs/directory-pr-pack.md) AFTER the domain resolves (fork shadcn-ui/ui → one directory.json entry → `pnpm validate:registries` → PR).
