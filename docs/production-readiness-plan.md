# Production-Readiness Master Plan

**Authored:** 2026-08-10 · **Status:** SIGNED OFF 2026-08-10 (decisions D1–D3 locked below; D4/D5 default-accepted pending objection)
**Inputs:** [2026-08-10 deep codebase review](reviews/2026-08-10-deep-codebase-review.md) (~90 verified findings) · external site review (validated, §10 there) · doc-system audit (this document, §2) · user directives (naming professionalism · doc-system slim-down · component weight/composability · self-maintaining process).

---

## 1. North star — what "production-ready" means here

A consumer — human developer **or** AI agent — can discover, install, and rely on any component with **zero surprise**:

1. **No broken flows** — every documented interaction works; no known High findings open on shipped components.
2. **No lying docs** — every public surface (site, llms.txt, README, guides) is generated from or validated against the code, never hand-maintained counts.
3. **One naming system** — a slug tells you what the component is; the catalog reads like one product.
4. **Bounded weight** — a consumer installs only what they need; heavy capability ships as opt-in slices.
5. **Cross-backend certainty** — every item is smoke-proven on both Radix and Base-UI consumers, including src-layout projects.
6. **Self-maintaining** — drift (docs, deps, size, naming) is caught by validators and on-demand loops, not by luck.

Everything below serves one of those six properties.

## 2. Verified current state (audit numbers, 2026-08-10)

| Area | Fact | Verdict |
|---|---|---|
| Gates | tsc clean · meta-deps 63/63 · lint 81-error known baseline | ⚠️ lint baseline is debt, not clean |
| Review | ~90 verified findings, ~20 High, 0 fixed | 🚫 blocks "production-ready" claim |
| `.claude/CLAUDE.md` | says "49 shipped" (real: 63); tier phases stale | stale |
| `.claude/STATUS.md` | **120KB** (convention: ≤14KB); "Recent activity" 39 entries (convention ~5); "Active queue" header dated 2026-05-13 | 8× regression vs its own F-cross-02 rule |
| Handoffs | **47** `HANDOFF-*` files in `.claude/` (convention: 1 active) | needs archive |
| Session-loaded chain | ~33KB every session (CLAUDE.md 13KB + readiness-review 13.7KB + stubs) | needs slim + budgets |
| MEMORY.md | was 52KB vs 24KB read limit (silently truncating) — **fixed 2026-08-10 → 12KB** | ✅ done, needs budget note |
| Public docs | docs page + llms.txt + README claim **8** components (real 63); homepage says 11 categories (9 populated); `/components` prerenders as skeletons only | actively misleading |
| Naming | `-01` suffix on 44/63 slugs; `rich-card`/`todo-rich-card`/`rich-card-in-flow` collision family; mixed `team-` prefix in gamification | inconsistent |
| Weight | rich-card 8.5k LOC / 280KB artifact · media-editor-01 8k / 300KB · 7 components ≥5k LOC | heavy tail real |
| Repo root | `firstconversation.md`, `graph-visualizer-old.md` debris | cleanup |
| Catalog copy | descriptions avg **463 chars** (median 324; 22 items >500, 9 >800, max 1,463); internal jargon leaks into consumer copy (decision IDs "D-10", extraction history, sibling-slug references) — validated 2026-08-10 | unprofessional; rewrite at P2.5 |

## 3. Phase map (dependency-ordered)

```
P0 Ground truth ──► P1 Stabilize ──► P2 Naming canon ──► P3 Architecture ──► P4 Polish/1.0
      │                                                        ▲
      └────────────── P5 Loops & validators (starts in P0, grows each phase)
```

P0 and P1 can interleave. P2 MUST precede P3 (feature-slice items inherit slugs — never rename twice). P5 is not a phase at the end — each phase *lands its own validator* so the class of problem it fixes can't return.

---

## Phase 0 — Ground truth & doc-system hygiene (≈2 sessions)

> **✅ EXECUTED 2026-08-10** — all six items landed in one pass; done-when criteria met (session chain ~20KB, STATUS 8.7KB, 1 active handoff, public docs 63/63 generated, both validators wired into `registry:build`). Decision file: [`.claude/decisions/2026-08-10-p0-doc-hygiene-and-validators.md`](../.claude/decisions/2026-08-10-p0-doc-hygiene-and-validators.md). Deviation from spec: the readiness-review long-form moved to a NEW `docs/reviews/readiness-review-spec.md` rather than merging into `review-process.md` (cleaner; zero-risk).

**Goal:** every always-loaded doc is accurate, small, and carries a stated size budget; internal doc debt archived; public docs stop lying.

- **0.1 CLAUDE.md accuracy pass** — fix "49 shipped"→live count wording (or drop counts entirely from always-loaded files — counts belong to generated surfaces), refresh tier-phase status, verify every referenced path/command still exists. Add header line: *"Size budget: ≤12KB. Detail belongs in docs/ or rules/."*
- **0.2 readiness-review.md slim** — compress to ~3KB always-loaded core (triggers table + close-checklist + verdict ladder); move per-tier spotcheck specifics + smoke matrix to `docs/reviews/review-process.md` (already the long-form home). Keep the redirect stub (0.8KB, 20+ historical links).
- **0.3 STATUS.md re-slim** to ≤14KB per F-cross-02: components table → one narrow row per component (name·version·status only; everything else lives in meta.ts/decision files); Recent activity 39→5; re-date or drop the stale Active-queue header. Add size budget line.
- **0.4 Archive sweep** — 46 handoffs → `.claude/handoffs-archive/` (keep newest); root debris (`firstconversation.md`, `graph-visualizer-old.md`) → delete or `docs/archive/`; `PHASE-7-PLAN.md` → archive.
- **0.5 Public docs truth** — regenerate `docs` page catalog section + `llms.txt` + README component list **from the manifest** (build script `scripts/build-llms.mjs` emitting llms.txt at build; docs page reads `getMetaList()` directly); fix homepage category count to populated-only; fix `use-filters.ts` whitelist (review 4.1); add `error.tsx` + `sitemap.ts`; SSR the unfiltered grid in the `/components` Suspense fallback (review 10.2).
- **0.6 Validators landed (P5 seed):** `validate:doc-drift` (llms.txt/README slug lists + counts vs manifest — fails build on drift) · `validate:doc-budget` (always-loaded .claude file sizes vs stated budgets, MEMORY.md included).

**Done when:** session-loaded chain ≤20KB total; STATUS ≤14KB; 1 active handoff; public docs list 63/63; both new validators wired into `registry:build`.

## Phase 1 — Stabilize (fix the review) (≈4–6 sessions)

> **✅ EXECUTED 2026-08-10** (same-day, single arc): 6 parallel fix batches + 3 adversarial verify passes; all §1/§2/§5 Blocker+High findings closed, 23 patch bumps, lint 81→0, reverse-npm + registry-json validators live. One fix-introduced regression (N1 discard-resurrection) caught by the adversarial pass and closed pre-ship. Verified live: browser walkthrough (category filter, calendar Day view, markdown XSS end-user path, rich-sidebar, content-composer v0.2.2) + Base-UI consumer smoke. Outcome ledger: review §0. Decision: [`.claude/decisions/2026-08-10-p1-fix-program.md`](../.claude/decisions/2026-08-10-p1-fix-program.md).

**Goal:** zero known High findings on shipped components. Sequencing per review §9, executed as agent batches (see P5-L2):

- **1A Broken flows:** composer publish gate + blob/editorState restore chain (1.1+1.3+1.4 — one design gap), text-mode export (1.2), calendar Day-view all-day (1.5), grid-news featured item (1.6).
- **1B Data corruption:** date-only round-trip in todo-rich-card (2.1), calendar resize clamp (2.2), todo-tree clipboard permissions (2.3), cut-await (2.5), gantt date-parse convention hoist (2.4).
- **1C Distribution hardening:** declare `radix-ui`-replacement + `lucide-react` deps (3.1/3.3); **new validators:** reverse-npm check in validate-meta-deps (3.2) + `validate:registry-json` (files-vs-disk, deps-vs-imports, regDeps-vs-internal — 3.4). Re-run Base-UI smoke on every touched item.
- **1D Security & remaining Highs:** markdown-editor sanitization (5.1); then 5.2–5.12 grouped by component owner-batch (flow-canvas, rich-sidebar/workspace, file-tree/manager, code-block, media-capture, feedback-loop).
- **1E Lint baseline burn-down:** fix the 21 pricing-table entities + unused disables now; file the React-Compiler refs diagnostics as per-component follow-ups; target = lint exits 0 so the gate regains meaning.

Every batch: patch/minor bumps per readiness rule, 4-ship smoke loop, decision file per batch (not per finding).

**Medium/Low routing (explicit):** review §6 Mediums are fixed **in the same batch** when their component is already open in 1A–1D; all remaining §6/§7 items route to the P3.4 structure-audit fix-on-touch channel (fixture-URL hygiene rides the P2.5 sweep). Nothing is silently dropped — the review file's finding rows get `fixed` / `deferred-with-owner` annotations either way.

**Done when:** review file shows every 🚫/⚠️ finding `fixed` or explicitly `deferred-with-owner`; lint exit 0; smoke green on Radix + Base UI.

## Phase 2 — Naming canon: the great rename (≈2–3 sessions incl. decision)

**Goal:** one professional naming system, executed once, before any consumer base grows.

- **2.1 Decision doc (GATE 1):** the canon. Recommended: **drop `-NN` from all public slugs** (version lives in the version field; `-02` returns only when a true second variant ships); rename the misleading stems (`rich-card`→e.g. `card-tree-editor`, disambiguate `todo-rich-card`/`rich-card-in-flow`, `workspace`→`split-workspace`, unify gamification `team-` prefix); full 63-row rename table with old→new. **User signs the table.**
- **2.2 Scripted sweep:** folder moves, manifest, registry.json (both items each), cross-procomp imports, docs/procomps folder names, guide/meta text — one commit series, one release window.
- **2.3 Compatibility policy:** old slugs remain as deprecated thin registry items (`registryDependencies: [new]` + a README note) for one grace window, then removed. Registry `homepage` fixed; naming variants on site unified per review 10.3 (brand *ilinxa pro-ui*, host `ilinxa-proui`).
- **2.4 Validator:** `validate:naming` — slug pattern lint (kebab, no `-NN` unless variant registered, no stem collisions) **+ catalog-copy lint** (description ≤200 chars hard cap; forbidden patterns: `D-\d+` decision IDs, version archaeology, self/sibling slug references) so drift can't re-enter via the scaffolder.
- **2.5 Catalog copy rewrite (validated 2026-08-10):** all 63 `meta.ts` descriptions + registry.json sync, per a description canon locked in the 2.1 decision doc — proposed: **one sentence, ≤160 chars, capability-first, zero internal jargon** (`data-table`'s 99-char form is the model); capability detail belongs in the guide + detail page, not the blurb. Rides the same per-component sweep as the rename (same files open). While each component is open: swap unvetted fixture URLs (pravatar/picsum/example.com → Unsplash or inline SVG per review §6) in the same commit.

**Done when:** all 63 slugs match the canon; all 63 descriptions pass the copy lint; deprecated aliases live; site/README/llms show one brand form; validator wired.

## Phase 3 — Architecture: weight & composability (≈4–8 sessions, investigation-gated)

**Goal:** heavy capability ships as opt-in slices; every component passes a structure audit.

- **3.1 Feature-slicing investigation (GATE 1 doc, ~1 session):** the à-la-carte install model. Mechanics already half-proven in-repo (fixtures + `_shared/file-clipboard` ship files into another item's target folder). Open questions to settle with a local-registry spike: base-compiles-without-feature strategy — **(a) stub-file-overwritten-by-feature-item** vs **(b) injection surface (`editAdapter` prop/registration)**; CLI overwrite/conflict behavior on shared target paths; rewriter behavior on the import shapes (F-S1 constraints); fixtures-item interaction; docs-site rendering of sliced items.
- **3.2 Pilot (2 components):** `calendar` (read-only base + `calendar-editing` — the editing layer is already file-separated behind `editable`) and `media-editor` (edit base + `media-editor-capture`). Measure: artifact KB + LOC delta for a base-only consumer. Success bar: base ≤50% of current artifact, both variants smoke-green on both backends.
- **3.3 Convention doc + rule:** if pilot passes, `feature-item` convention joins the fixtures pattern in CLAUDE.md/registry skill; heavy components (≥4k LOC or ≥150KB artifact — the 7-component tail) get sliced **on next major touch**, not big-bang.
- **3.4 Structure audit checklist (rolling):** per-component one-pager — compound compliance, dead public API (e.g. `TaskChoiceInteraction`, sidebar `focusFirstItem`), undocumented prop semantics, a11y baseline, artifact size vs budget. Run via P5-L3 sweep, fix on touch.
- **3.5 `gamification-kit` extraction** (already queued, D-04) — folds in as the shared-helper precedent; resolves the drift table from the review.

**Done when:** convention ratified, 2 pilots shipped + smoked, size budgets recorded in meta, audit checklist exists and has run once across the tail.

## Phase 4 — Professional polish & the 1.0 bar (≈2–3 sessions)

- **4.1 Define 1.0** (decision doc): proposed bar — P0–P3 done · all validators green in CI · Base-UI + src-layout smoke matrix green across catalog · design-coherence sweep passed · docs fully generated · versioning policy published (semver meaning per component + catalog-level version).
- **4.2 src-layout install answer** (review 10.4): run the two smoke variants (src/ dir; custom `aliases.components`), then either fix targets or make llms.txt/README precise — currently the two doc mentions contradict each other.
- **4.3 Site professionalism:** metadataBase/OG/sitemap/robots, skip-link, breadcrumb links, shared registry-constants module, status-badge helper unification (review 4.6), design pass on docs pages per `frontend-design` skill.
- **4.4 Changelog/versioning surface:** generate `component-versions` page from meta history + decision files; stop hand-maintaining.

## Phase 5 — The self-maintaining system: validators, loops, agents

**Principle: validators for anything mechanically checkable; agents only where judgment is needed; every loop writes evidence to a file.** No scheduled/cron agents — all loops are on-demand, triggered by you (session-start or explicit command).

### 5.1 Validator battery (deterministic — wired into `registry:build`, fails deploys)

| Validator | Catches | Lands in |
|---|---|---|
| `validate:meta-deps` (exists, extended) | declared-vs-imported both directions incl. **reverse-npm** (review 3.2), comment-stripping fix (3.8) | P1C |
| `validate:registry-json` (new) | item files vs disk, item deps vs shipped imports, regDeps vs meta.internal, docs-file leakage (3.4) | P1C |
| `validate:doc-drift` (new) | llms.txt/README/docs-page slug lists + counts vs manifest (4.2/10.1) | P0 |
| `validate:doc-budget` (new) | always-loaded .claude files + MEMORY.md vs stated size budgets | P0 |
| `validate:naming` (new) | slug canon compliance (P2) | P2 |
| `validate:artifact-size` (new) | per-item KB vs recorded budget; fails on >20% growth without a minor bump | P3 |

### 5.2 Ship loop (per change — the formalized 4-ship pattern)

`implement → gate battery → GATE 3 review (agent-assisted adversarial for anything touching public API) → ship → post-deploy cross-backend consumer smoke (Radix + Base UI; src-layout variant monthly) → patch → re-smoke clean`. Agent roles: **implementer** (batch executor), **adversarial reviewer** (tries to refute the fix; the review's verify pattern), **smoke-runner** (tmp-consumer install + tsc + render). The existing `feature-readiness-loop` skill is the template for multi-step arcs.

### 5.3 Maintenance sweep (on-demand, "run the sweep" — recommended before each ship window)

One orchestrated agent pass producing `docs/reviews/sweeps/<date>-sweep.md`: validator battery + STATUS/memory budgets + stale-handoff check + open-High-findings count + naming/structure spot-audit of 3 random components + one random consumer-install smoke. Output: table of drift found, each item either fixed-inline (mechanical) or filed with owner.

### 5.4 Deep review loop (quarterly-ish, on demand)

Re-run the multi-agent end-to-end review (the 2026-08-10 shape: per-family deep-read + infra + docs + cross-cutting, adversarial verify, one canonical findings file). Compare against previous review — findings that reappear indicate a missing validator: add one.

### 5.5 Consumer-experience loop (before any sales milestone)

Feed llms.txt to a *fresh* AI agent in a tmp consumer app; task it to install + integrate 3 components unaided; log every friction point verbatim → each becomes a docs/DX finding. This is the closest proxy for the real 2026 install path.

---

## 6. Effort & parallelism

| Phase | Est. sessions | Parallelizable? |
|---|---|---|
| P0 | 2 | 0.5 (docs) ∥ 0.6 (validators) |
| P1 | 4–6 | 1A ∥ 1B ∥ 1D by family (agent batches); 1C serial (validator first) |
| P2 | 2–3 | decision serial; sweep scripted |
| P3 | 4–8 | investigation serial; pilots ∥ |
| P4 | 2–3 | mostly ∥ |
| **Total** | **≈14–22 sessions** | |

## 7. Risks & mitigations

- **Rename churn breaking the few existing consumers** → deprecated-alias grace window; do P2 before any marketing push.
- **Feature-slicing spike fails on CLI/rewriter constraints** → pilot is investigation-gated; fallback = keep single items + document à-la-carte *bundler* slicing (already works) as the official story.
- **Doc slim loses history** → nothing is deleted, only archived; decision files remain canonical.
- **Fixing Highs on heavy components before restructuring (P1 before P3)** is deliberate: restructure on top of broken flows makes regressions unbisectable.
- **Loop fatigue** → loops are on-demand and evidence-producing, never cron; if a loop finds nothing twice, widen its interval.

## 8. Decisions (locked 2026-08-10)

1. **D1 — Naming canon: drop `-NN` from all public slugs.** ✅ Locked. Version lives in the version field; `-02` returns only when a true second variant ships. Rename table still requires per-row approval at P2.1.
2. **D2 — Phase order: P1 → P2 → P3.** ✅ Locked. Stabilize before rename before slicing; P0 interleaves.
3. **D3 — STATUS.md slim: one-line rows.** ✅ Locked. name · version · status only; detail in meta.ts + decision files; Recent activity capped at 5; enforced by `validate:doc-budget`.
4. **D4 — 1.0 bar** (§4.1 proposal) — default-accepted; revisit at P4.1 decision doc.
5. **D5 — Loop cadence: on-demand only, never scheduled** — default-accepted (matches standing preference).
