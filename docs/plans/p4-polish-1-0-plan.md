# Plan — P4: professional polish & the 1.0 bar

<!-- The loop's state machine. A fresh session (any model tier) must be able to resume from this
     file alone. Update it as you go — not at the end. -->

## Status
- phase: COMPLETE — all R0–R7 gates closed 2026-08-12
- branch/HEAD: master @ 5ed0281 (base commit, pushed) + R7 close-out commit
- updated: 2026-08-12
- open escalation: none

## Goal
Close Phase 4 of `docs/production-readiness-plan.md`: ratify the 1.0 bar (D4), answer the
src-layout/alias install question with evidence on the current CLI, bring the docs site to
professional baseline (metadata/OG/sitemap/robots/a11y/constants/badges + design pass), and replace
the hand-maintained component-versions doc with a generated surface — all gates green, GATE 3
review ≥ Pass-with-follow-ups, one base commit.

## Scope
- In: plan §4.1 (1.0 decision doc + versioning policy) · §4.2 (install-matrix evidence on CLI
  4.17.0: custom `aliases.components`, root/non-src layout, phantom-no-op re-test; llms/README
  precision fix in the GENERATOR) · §4.3 (metadataBase/OG/sitemap/robots, skip-link, breadcrumb
  links, shared registry-constants module, status-badge unification, dead-code removal from review
  4.6, design pass per `frontend-design` skill) · §4.4 (generated `component-versions` from
  manifest + decision-file frontmatter, wired into the build).
- Out: the two USER actions (DNS `ui.ilinxa.com`, directory PR submission) — 1.0 bar records them
  as external gates, P4 does not block on them. Component-internal fix-on-touch cohorts (MED-4
  content-composer v0.4.0, F-cross-15 slices, structure-audit one-pager fixes) — stay owned by
  their components. NPM publish artifacts, MDX docs, test runner (informed defers, unchanged).
  New components. P5 loop tooling (5.3 sweep harness etc.) beyond what P4 items naturally land.

## Key ground truth (verified 2026-08-12)
- shadcn CLI latest is **4.17.0** (was 4.6.0 in all prior smoke evidence) — corruption flake +
  phantom-no-op MUST be re-observed, not assumed.
- Both existing consumers are ALREADY src-layout (`e:/tmp/ilinxa-smoke-consumer` = Base UI,
  63/63 green 2026-08-11; `e:/tmp/ilinxa-audit-consumer` = Radix, directory-audit green) →
  src-dir variant of review 10.4 has catalog-wide evidence on both backends; untested paths are
  custom `aliases.components` and root (no-src) layout.
- `ComponentMeta` has `version`/`status`/`updatedAt` but NO history array → 4.4 joins manifest
  snapshot + `.claude/decisions/*` YAML frontmatter (`components:` list) for history links.
- `docs/component-versions.md` is hand-maintained, frozen at 49 components (May 2026) — the 4.4
  replacement target.
- Review 4.6 inventory (docs-site polish gaps) + review 10.4 (llms.txt:48 vs :84 contradiction)
  are the authoritative 4.3/4.2 worklists; 10.5 feeds the 4.1 bar.

## Readiness checklist
- [x] R0 plan doc + improvement-log scan + slice plan; scope surfaced to user (goal set by user)
- [x] R1 invariants table + blast-radius table; ADR = 4.1 decision doc draft
- [x] R2 all slices ticked (S1–S6), scoped gates green per slice
- [x] R3 code gates green with numbers (see Gate results; tsc/lint/doc-drift re-run green after R4 fixes)
- [x] R4 findings table complete (14 rows: 12 CONFIRMED+fixed · 2 DROPPED+reasoned) — GATE 3 review file next
- [ ] R5 every invariant observed live incl. ≥1 negative path (see Runtime evidence)
- [x] R6 blast-radius docs walked (STATUS/master-plan/config/harness/ADR); doc validators green; base commit landed
- [x] R7 history verified (single base commit 5ed0281, gate numbers in body, nothing amended);
      handoff below; orchestration/env rules promoted to config; retro appended to improvement log

## Invariants (R1)
| # | Invariant (testable) | R4 checked | R5 observed |
|---|---|---|---|
| 1 | `metadataBase` set once in root layout; every component detail page emits per-slug title/description + OG; no route ships default-Next metadata | ✅ (F-10/F-13/F-14 found+fixed) | ✅ R5: og:site_name/type/image + per-slug og:title verified on / , /components, detail |
| 2 | `/sitemap.xml` enumerates home + list + all 63 detail routes; `/robots.txt` exists and points at the sitemap | ✅ | ✅ R5: 66 `<loc>` entries; robots 200 w/ Sitemap line |
| 3 | First Tab on any page reaches a working skip-link; activating it moves focus to main content | ✅ | ✅ R5: Playwright Tab→skip-link, Enter→focus in #main-content |
| 4 | Breadcrumb category segment on detail pages is a real link to the category-filtered list (was inert text) | ✅ (`?cat=` contract read-verified) | ✅ R5: click → /components?cat=data, filtered explorer |
| 5 | Registry base URL + `@ilinxa` namespace read from ONE module; grep = 0 non-prose hits outside module | ✅ (F-13 last stray fixed; prose mentions exempt) | — (static property, R4 grep is the proof) |
| 6 | ONE status→badge helper used by every render site; `deprecated` arm renders | ✅ (all 4 union arms covered; SandboxStatus subset-safe) | ✅ R5: alpha+beta arms observed live (no deprecated component exists to render) |
| 7 | `docs/component-versions.md` is generator-owned; counts match manifest (63) | ✅ (F-4/F-5/F-6/F-7 found+fixed) | ✅ byte-stable re-run + `--check` green in gate 5 |
| 8 | llms.txt/README install-path text states the S1-evidenced behavior — contradiction gone | ✅ (F-2/F-3 wording tightened) | ✅ R5: served /llms.txt carries new sentence, stale claim absent |
| 9 | Feature-item add + re-add behavior on CLI 4.17.0 recorded; convention doc matches observed | ✅ (overclaim hedged: whole-write-abort marked unverified on ≥4.17) | ✅ S1 report §T3 (print-vs-disk evidence) |
| 10 | Nonexistent slug renders styled not-found (negative path) | ✅ | ✅ R5: HTTP 404 + styled content |
| 11 | Design tokens hold on all touched surfaces | ✅ (token-classes only in new files) | ✅ S4: 12-screenshot light/dark audit |

## Blast radius (R1)
| Surface | Why touched | Docs action (R6) |
|---|---|---|
| `src/app/layout.tsx` | metadataBase + title.template + OG defaults + skip-link | cleared: site chrome, no doc surface |
| `src/app/page.tsx` · `components/page.tsx` | missing metadata exports; constants de-dupe | cleared |
| `src/app/components/[slug]/page.tsx` | breadcrumb category link, badge helper, per-slug OG | cleared |
| `src/app/sandbox/page.tsx` · `_components/sandbox-shell.tsx` | badge helper unification (restores `deprecated` arm) | cleared |
| `src/app/robots.ts` · `not-found.tsx` · icon/OG image (NEW) | missing professionalism surfaces | cleared |
| `src/app/sitemap.ts` | consume shared constants | cleared |
| `src/components/site/site-header.tsx` | skip-link | cleared |
| `src/lib/registry-constants.ts` (NEW single source) | 7+ hardcoded base-URL/namespace sites | component-guide §11.5 pointer if relevant |
| `src/registry/registry.ts` dead exports (`getGroupedRegistry`/`getEntriesByCategory`) | 4.6 dead code — remove ONLY after grep proves unused | cleared |
| `public/*.svg` starter leftovers | create-next-app junk | cleared |
| `scripts/build-component-versions.mjs` (NEW) + `package.json` + `docs/component-versions.md` | 4.4 generated surface | decisions/README note; STATUS pointer |
| `scripts/build-llms.mjs` + `public/llms.txt` + `README.md` | 4.2 install-path precision (post-S1) | doc-drift validator green |
| `.claude/decisions/2026-08-12-p4-one-point-oh-bar.md` | 4.1 ADR | finalize DRAFT→FINAL at R6 |
| `docs/production-readiness-plan.md` · `.claude/STATUS.md` · `readiness.config.md` | phase close bookkeeping | R6 |
| `docs/reviews/2026-08-12-p4-polish-review.md` (NEW) | GATE 3 artifact | R4 |
| `e:/tmp` consumers + HARNESS.md | S1 evidence on CLI 4.17.0 | note CLI-version facts in harness doc |

## Slices (R2)
- [x] S1 — 4.2 install-matrix evidence (CLI 4.17.0) — report: `e:/tmp/ilinxa-p4-install-matrix-report.md`.
      T1 root layout → `components/<slug>/` · T2 custom alias `@/widgets` → explicit targets STILL
      `src/components/` (aliases only move primitives; imports rewritten, compiles) · T3 phantom
      no-op softened: prompt auto-"no" non-interactive, exit 0, no false success; `--overwrite`
      per-file diffs · T4 package.json corruption NOT reproduced (6 clean diffs) · T5 src layout
      re-confirmed `src/components/`. tsc: 1 error in both consumers, unrelated (Next typegen
      artifact, needs one build/dev run).
- [x] S2 — 4.3 mechanical: ALL W1–W10 done (W10a object-URL leak fixed; W10b pending-identity
      claim investigated + DROPPED — stable-validate contract makes reference equality correct).
      tsc 0 · lint 0 errors + exactly the 9 known warnings. Dead code was in `manifest.ts` not
      `registry.ts` (getGroupedRegistry/getEntriesByCategory/GroupedRegistry removed, grep-proven).
- [x] S3 — 4.4 generator: `scripts/build-component-versions.mjs` → regenerated
      `docs/component-versions.md` (63 rows, byte-stable re-runs, naming-canon old→new mapping for
      decision links; old hand file archived at `docs/archive/component-versions-hand-maintained-final.md`);
      wired into `registry:build` after build-llms + standalone `pnpm build:component-versions`.
      Known limitation: pre-canon ad-hoc renames (e.g. `sidebar-nav-01` era) not resolvable — noted in header.
- [x] S4 — 4.3 design pass: 12-screenshot light/dark audit (production server, Playwright) —
      system coherent, no drift changes needed. Shipped assets: `src/app/opengraph-image.png`
      (+alt.txt, token-rendered via Playwright, no volatile counts), `icon.svg` (geometric brand
      mark, font-free), `apple-icon.png`, branded `favicon.ico` (PNG-ICO wrap). Scratchpad
      generators: `og-image.html`/`render-og.mjs`/`render-icons.mjs`.
- [x] S5 — 4.2 doc precision per S1 evidence. The install-path prose was HAND-maintained (outside
      the generated catalog block): fixed in `public/llms.txt` (§install + §gotchas), `README.md`
      (§install + troubleshooting row), `src/app/docs/page.tsx` (install prose + troubleshooting
      entry), `docs/feature-slicing-convention.md` (dated P4.2 re-test note), and the
      `shadcn-registry-pro` skill (3 files — refuted src-layout claim corrected, dated).
- [x] S6 — 4.1 decision doc FINAL at `.claude/decisions/2026-08-12-p4-one-point-oh-bar.md`;
      criteria 4/5/6 evidenced same-day; only #8 (user actions: DNS + directory PR) remains open.

## Gate results (R3 — 2026-08-12)
| Gate | Result (real numbers) |
|---|---|
| typecheck | exit 0, no output |
| lint | 0 errors · 9 warnings (exactly the 9 known — none added) |
| meta-deps | 63 slugs audited — 63 clean · 0 high/warn/error |
| registry validators | whitelist: 25 types clean · registry-json: 63 base + 2 feature + 52 aliases, 0 high 6 warn · naming: 63 checked, 0 findings |
| doc validators | doc-drift: llms.txt ✓ + README ✓ (63) — after F-1 fix below · doc-budget: all budgets ✓ |
| registry build | full chain green incl. shadcn build; artifact-size: 65 artifacts, 0 high |
| app build | exit 0 · 74 static pages incl. /robots.txt, /sitemap.xml, /_not-found |

## Findings table (R4; F-1 surfaced at R3)
| # | Finding | Failure scenario | Verdict | Evidence file:line | Fix |
|---|---|---|---|---|---|
| F-1 | Edit-tool rewrote 4 files with CRLF endings; validate-doc-drift's ↳-strip (`.*$` non-multiline) can't cross `\r` → slice mentions leak as phantom slugs, gate 5 fails; 3 more files would carry whole-file line-ending diffs | Any Windows editor CRLF-ing llms.txt breaks the deploy gate with a misleading "run build:llms" message | CONFIRMED (hexdump: HEAD `2e a`, CURR `d a` before slice line) | scripts/validate-doc-drift.mjs:46 | LF-normalized the 4 files; validator now `\r\n`-normalizes on read (validates content, not endings) |
| F-2 | Skill files carry stale pre-P4.2 claims directly contradicting the new corrected notes in the same files | Producer reads §1 advice first ("match consumer's aliases.components"), keeps wrong mental model | CONFIRMED | file-types-and-targets.md:30 · pitfalls-and-fixes.md:7-9 | Both passages rewritten to source-root semantics; "do NOT match aliases" made explicit |
| F-3 | "silently (exit 0)" overstates — CLI prints the y/N prompt line; only the completion summary is absent | stdout-inspecting caller would see the prompt; doc claims otherwise | CONFIRMED | README:198 · llms.txt gotchas · docs/page.tsx troubleshooting | Reworded all 3: "prints the overwrite prompt, auto-answers 'no', exit 0 — exit-code checks can't detect" |
| F-4 | build-component-versions.mjs byte-compares prev without `\r\n`-normalize — same class as F-1, missed in the same diff | autocrlf checkout → CRLF on disk → every build "regenerates", permanent thrash on Windows clones | CONFIRMED (core.autocrlf=true active) | build-component-versions.mjs:349-352 | prev now `\r\n`-normalized before compare |
| F-5 | extractField "first match wins" is safe only by template field order; nested `slices[].name` would win if ordered earlier | future hand-edited meta.ts with reordered fields silently extracts wrong name | CONFIRMED (latent) | build-component-versions.mjs:70-80 | regex re-anchored to exactly-2-space top-level indent — order-independent; re-run byte-identical on all 63 |
| F-6 | `localeCompare` sort is ICU/locale-dependent — violates the script's own byte-identical contract | CI runner with different ICU could order differently | CONFIRMED | build-component-versions.mjs:273 | replaced with ordinal comparator |
| F-7 | Committed docs/component-versions.md freshness had NO gate (regeneration at vercel-build is transient; llms.txt HAS doc-drift) | meta.ts bump without regenerate → stale committed file visible on GitHub forever, nothing fails | CONFIRMED | validate-doc-drift.mjs:92-93 (absence) | generator `--check` mode added + chained into `validate:doc-drift` (gate 5) |
| F-8 | Plan-doc Status header/checklist frozen at R0 while body showed R2/R3 done — resume-from-file contract broken | fresh session resumes from wrong phase | CONFIRMED | this file §Status | Status/checklist synced (this update) |
| F-9 | ADR bar row 5 bundled validated (llms/README) with unvalidated (component-versions) freshness claims | reader infers uniform validation that didn't exist | CONFIRMED | ADR row 5 | reworded; now uniformly true after F-7 fix |
| F-10 | Detail-page `openGraph` override REPLACES layout's whole OG object (Next shallow-merge) → og:site_name/type/locale dropped on all 63 detail routes | Slack/Discord share of any component URL loses site attribution | CONFIRMED (verified against node_modules Next docs) | src/app/components/[slug]/page.tsx:105 | new `src/lib/site-metadata.ts` OG_BASE spread into every route-level openGraph (detail + home + /components) |
| F-11 | Playground object-URLs accumulate within a mount (revoked only at unmount) | N publishes = N retained blobs until navigation | DROPPED — uploader cannot know whether an earlier URL is still referenced (composer state/result panel); revoke-on-replace risks breaking live previews. Bounded by publish count, reclaimed at unmount — media-editor blob-cache precedent | composer-playground.tsx:42-58 | comment hardened to state the bound + rationale |
| F-12 | favicon.ico is single-frame 32px PNG-ICO (old file was multi-res) | legacy 16px consumers get downscale | DROPPED as defect — valid modern format; icon.svg + apple-icon.png ship and are preferred; cosmetic legacy edge | src/app/favicon.ico | noted; revisit only if legacy crispness ever matters |
| F-13 | Hand-typed `@ilinxa/<slug>` literal in home generateMetadata while same file imports installCommand | drift class R1-#5 exists to prevent | CONFIRMED | src/app/page.tsx:15 | now uses `installCommand("<slug>")` |
| F-14 | Home + /components OG title/description diverge from page title/description (inherited stale OG text) | share preview shows generic blurb while tab/SERP show count | CONFIRMED | src/app/page.tsx:12-17 · components/page.tsx:12-18 | page-level openGraph (OG_BASE spread + matching text) added to both |

## Runtime evidence (R5 — 2026-08-12, production build via `next start`, Playwright + fetch)
- Suite: scratchpad `r5-verify.mjs` — **31 checks / 31 pass, 0 fail** (final run after two live
  findings, below).
- **Live finding (R5-only, would not appear in any static gate):** the app-dir
  `opengraph-image.png` file convention does NOT cascade to child segments on Next 16.2.4 —
  only `/` emitted og:image; /components and all detail routes had none. Fixed by moving the
  asset to `public/og-image.png` + explicit `images` in `OG_BASE` (uniform mechanism, verified
  on all three route classes). This empirically overrode the R4 finder's docs-based claim that
  inheritance would apply — runtime wins.
- Negative path: `/components/definitely-not-real` → HTTP 404 + styled not-found (invariant 10).
- Keyboard: first Tab → skip-link, Enter → focus lands in `#main-content` (invariant 3).
- Consumer-install evidence (S1): `e:/tmp/ilinxa-p4-install-matrix-report.md` — real CLI 4.17.0
  installs on 3 fresh consumers + print-vs-disk phantom-no-op test (invariant 9).
- Screenshots: 12-page light/dark set + OG/icon assets in scratchpad `shots/`.

## Parked
- shadcn CLI 4.17.0 behavior deltas beyond the tested paths (interactive prompts, monorepo flag) —
  note in harness docs if observed, don't chase.

## Handoff (R7)
- done: P4 complete end-to-end — base commit `5ed0281` pushed to master (deploys via Vercel).
  ADR FINAL (1.0 bar: 8/9 criteria closed, #8 user-gated) · install-matrix evidence + 5 doc
  surfaces corrected · site baseline (metadata/OG/robots/404/skip-link/breadcrumbs/constants/
  badges/brand assets) · generated component-versions + --check gate · GATE 3 Pass-with-follow-ups
  · R5 31/31 on prod build.
- pre-mortem: if this breaks in prod, it breaks because the deployed Vercel env renders
  metadata differently than local `next start` (mitigation: post-deploy spot-check below), or
  a legacy scraper needs multi-res favicon.ico (accepted, icon.svg covers modern).
- next: USER — DNS `ui.ilinxa.com` (CNAME → cname.vercel-dns.com + Vercel attach) then the
  directory PR (docs/directory-pr-pack.md). Repo — P5 loop tooling on demand; 1.0 declaration
  = flip catalog version + decision file once #8 closes. Follow-up owners in the review file.
