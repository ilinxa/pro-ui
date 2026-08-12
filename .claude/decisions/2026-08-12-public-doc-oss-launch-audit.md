---
date: 2026-08-12
session: public-doc + oss-launch skill audit
phase: pre-launch (post-P4)
type: audit
commits: []
components: []
findings: 14
status: repo-side executed 2026-08-12 (same session) — remaining items are user actions, see §User actions
---

# Audit: repo vs `public-doc` + `oss-launch` skills — gap list

Both skills were loaded and their full requirement matrices run against the repo **and** GitHub-side configuration. Verdict: **not fully aligned** — content quality is strong (README, LICENSE, directory-PR pack), but neither system is instantiated. This file is the durable to-do list; nothing here may be silently dropped.

## Scope of the audit (what was checked)

- **Repo docs:** root files, `docs/` tree, community files, README structure/writing/SEO, LICENSE consistency (LICENSE ↔ README ↔ package.json).
- **GitHub settings** (via `gh repo view` API): visibility, description, topics, social-preview image, homepage URL, releases, wiki/discussions/issues toggles, license detection, default branch.
- **package.json** public-metadata fields.
- **oss-launch phase state** vs STATUS.md + `docs/registry-directory-plan.md` + `docs/directory-pr-pack.md`.
- *Not* checked (out of scope / premature): branch-protection rules (admin API), live-site page-level SEO meta, Phase 3–5 channel work, org vault.

## Gap list — public-doc (repo)

| # | Gap | Detail |
|---|---|---|
| 1 | **`docs-index.yml` missing** | The spine of the whole public-doc system — block tracking, wikilinks, release cycle all hang off it. Bootstrap required. |
| 2 | **CHANGELOG missing** | Required for OSS. Decision files exist but no public changelog; ties to gap 9 (no releases). |
| 3 | **SECURITY missing** | Required for OSS. |
| 4 | **SUPPORT missing** | Required for OSS. |
| 5 | **CONTRIBUTING missing** | README §Contributing exists but no root `CONTRIBUTING.md`. |
| 6 | **CODE_OF_CONDUCT missing** | Required for OSS. |
| 7 | **`.github/` issue + PR templates missing** | No `.github/` directory at all. |
| 8 | **README: no wikilink anchors, no FAQ** | Anchors needed once docs-index exists; FAQ = public-doc SEO requirement (questions phrased as users search). |

## Gap list — GitHub configuration (verified 2026-08-12 via `gh` API)

| # | Gap | Detail |
|---|---|---|
| 9 | **Description empty** | `description: ""` — write one accurate sentence (align with directory-pack copy). |
| 10 | **Topics null** | Need 5–15 (e.g. `shadcn`, `shadcn-registry`, `react`, `tailwindcss-v4`, `nextjs`, `component-library`, `radix-ui`, `typescript`). |
| 11 | **Social preview NOT set** | `openGraphImageUrl` is the default githubassets hash. `public/og-image.png` exists — upload it (Settings → Social preview; manual UI action). |
| 12 | **Homepage URL stale** | Points at `pro-ui-one.vercel.app`; flip to `https://ui.ilinxa.com` once DNS lands (DNS is already a tracked user action). |
| 13 | **No releases/tags; wiki enabled** | `latestRelease: null` — start tagging with CHANGELOG (gap 2). Wiki ON = drift risk, disable. Discussions OFF — deliberate call needed. |
| 14 | **package.json metadata** | Only `name` + `license`. Add `description`, `repository`, `homepage`, `keywords`. Note: `name: ilinxa-ui-pro` predates the P2 canon (`pro-ui`) — private package, cosmetic, fix on touch. |

## Gap — oss-launch

- **Layer 2 instance file missing** — create in the org vault from `references/launch-template.md` (NEVER in this repo, never in docs-index). Without it Phases 2–5 have no single source of truth.
- **Phase 1 gate not certifiable** until gaps 1–8 close (gate = public-doc L3 checklist green). Phase 2 prep is otherwise excellent (directory pack ready; gated on the two tracked user actions: DNS + PR).

## What already passes (don't redo)

MIT consistency across all three surfaces · README writing rules (no AI tells, factual, plain headings) · repo PUBLIC · hosted demo live · og-image asset exists · directory-first seeding strategy correctly sequenced · clean-project audit green.

## Execution record (2026-08-12, same session)

- ✅ Gaps 1–8: `docs-index.yml` bootstrapped (7 docs, 19 blocks, real ranges + hashes) · CHANGELOG (dated baseline) · SECURITY (private advisory + email; email already public in every commit) · SUPPORT · CONTRIBUTING · CoC (Contributor Covenant 2.1) · `.github/` bug/feature/PR templates · README wikilink anchors + 6-question FAQ (generated catalog region untouched).
- ✅ Gap 14: package.json description/homepage/repository/keywords.
- ✅ oss-launch Layer 2 instance created: `e:/2026/ilinxaDOC/documentation/launch--pro-ui.md` (vault, outside repo).
- ✅ Gates: doc-drift, doc-budget, lint (0 errors), tsc clean. component-versions regenerated (was stale from empty-state ship).
- ❌→user Gaps 9–13: PAT lacks repo-admin scope (403 on `gh repo edit` and private-vuln-reporting PUT).

## User actions (everything that remains)

1. **GitHub metadata** — either `gh auth refresh -h github.com -s repo` then run:
   ```bash
   gh repo edit ilinxa/pro-ui --description "High-level composed components for shadcn/ui — kanban, gantt, calendar, media editors, story viewers, flow canvas, forms, and more. MIT, installable via the shadcn CLI." --enable-wiki=false --add-topic shadcn --add-topic shadcn-ui --add-topic shadcn-registry --add-topic react --add-topic nextjs --add-topic tailwindcss --add-topic radix-ui --add-topic typescript --add-topic component-library --add-topic ui-components --add-topic design-system
   ```
   or set description + topics + wiki-off in repo Settings by hand.
2. **Private vulnerability reporting** — Settings → Advanced Security → Private vulnerability reporting → Enable (SECURITY.md already links the advisory form).
3. **Social preview** — Settings → Social preview → upload `public/og-image.png`.
4. **DNS** — `ui.ilinxa.com` CNAME → `cname.vercel-dns.com` + Vercel domain attach; afterwards flip GitHub homepage to `https://ui.ilinxa.com` (`gh repo edit ilinxa/pro-ui --homepage https://ui.ilinxa.com`).
5. **Directory PR** — submit per [docs/directory-pr-pack.md](../../docs/directory-pr-pack.md) (after DNS).
