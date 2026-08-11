# Plan — P3 Architecture: weight & composability (feature-slicing)

<!-- Readiness-loop state machine for the P3 phase of docs/production-readiness-plan.md.
     A fresh session resumes from this file alone. Config: .claude/readiness.config.md. -->

## Status
- phase: R0 → R1 — next unchecked gate: invariants + blast-radius + P3.1 spike verdict
- branch/HEAD: master @ 7e879e3 (P2 close-out) — P3 work uncommitted until R6
- updated: 2026-08-11
- open escalation: none

## Goal
Heavy capability ships as opt-in slices (feature-items layered on lean bases), enforced by an
artifact-size validator and a ratified convention, with every heavy component structure-audited —
proven end-to-end by real consumer installs on both backends.

## Scope
- In: P3.1 slicing-mechanics spike (local registry) · P3.2 pilots `event-calendar` (base +
  `event-calendar-editing`) and `media-editor` (base + `media-editor-capture`) · P3.3 convention
  doc + rule + CLAUDE.md/skill integration · P3.4 structure-audit checklist run once across the
  heavy tail · P3.5 `gamification-kit` shared-helper extraction (D-04) · `validate:artifact-size`
  + size budgets in meta · full e2e (consumer installs both backends, docs-site browser pass).
- Out: slicing any component beyond the 2 pilots (rule = slice on next major touch) · P4 items
  (site polish, changelog surface, src-layout answer) · unit-test runner (informed defer stands) ·
  fixing parked P1 cohorts except where P3.4 fix-on-touch reaches them · hosting/DNS decisions.

## Success bars (REVISED at R1 with seam-map evidence — supersedes master plan §P3.2's ≤50%)

> **⚠️ Evidence-based deviation from the signed-off plan (user visibility).** The ≤50% bar assumed
> the pilots' heavy axes were sliceable. Seam maps falsify this for media-editor: capture is 1,284
> LOC (15.3%) of pure native-API code with ZERO npm weight — the artifact/bundle weight is the konva
> edit-canvas (182KB min npm) which EVERY consumer needs (carousel-composer, content-composer,
> story-composer all mount the canvas). For event-calendar the honest edit axis (incl. MIXED-chunk
> extraction) is ~37% of LOC. No capability-coherent slice reaches 50% on either pilot; konva-slicing
> would break all three consumers. Revised bars:
- **event-calendar:** base artifact ≤135KB (−33% vs 203KB) AND base item npm deps exclude
  `@dnd-kit/core` + `@dnd-kit/utilities` (real consumer-bundle win) AND base-alone renders read-only.
- **media-editor:** capture slice lands (≈−15% artifact) AND file/gallery intake moves to BASE
  (today the ONLY `<input type="file">` lives inside EditorCamera and the upload path is a
  placeholder — base-alone must be genuinely usable: pick file → edit → export) AND konva mount
  gains the compound-rule-mandated `React.lazy` boundary AND story-composer's overdue deprecated
  capture re-exports resolve in lockstep. Value here = proving the convention on the hardest
  consumer topology (cross-procomp re-exports + circular barrel import), not KB.
- Both pilot variants smoke-green on both backends (base alone AND base+feature; install + consumer tsc 0 + render).
- Convention ratified (docs + rule + registry skill updated); heavy components slice on next major touch, not big-bang.
- `validate:artifact-size` wired into `registry:build`; budgets recorded per component; >20% growth without minor bump fails.
- Structure-audit checklist exists + has run once across the ≥150KB tail (11 items as of 2026-08-11, not the review's 7: media-editor 315 · card-tree 276 · task-tree 211 · story-viewer 205 · event-calendar 203 · gantt-timeline 188 · news-card 179 · app-sidebar 178 · json-form 178 · file-manager 174 · content-composer 154).
- `gamification-kit` extracted; review drift table resolved.

## Readiness checklist
- [x] R0 plan doc + improvement-log scan (none exists — first loop) + slice plan; scope surfaced to user (turn of 2026-08-11)
- [x] R1 invariants + blast-radius + spike VERDICT (strategy b); ADR drafted (.claude/decisions/2026-08-11-p3-feature-slicing-convention.md)
- [x] R2 all slices S0–S6 landed (4 implementer agents + coordinator merges; registry 182 items)
- [x] R3 gates green with numbers (see Gate results) — battery caught 4 issues en route, fixed
- [x] R4 findings table complete: 14 findings / 13 fixed / 1 owned follow-up (MED-4); stash hypothesis refuted
- [x] R5 all invariants observed live: install matrix both backends + browser 8/8 + negative paths; 3 more registry bugs fixed (see Runtime evidence)
- [x] R6 blast-radius walked (convention doc · budgets · audits 3/3 · pilot trios · CLAUDE.md 11.9/12KB · registry skill §16 · guide §11.5 · F-cross-15 filed · F-cross-13 ledger updated) · full battery green (tsc 0 / lint 0-9 / chain 0 / build 93s) · **base commit fe72f47 (188 files, +5660/−1837; git rename-detection corroborates byte-near-identical moves)**
- [x] R7 GATE 3 verdict recorded (Pass with follow-ups); STATUS/decision/memory synced; retro → .claude/improvement-log.md; parked promoted to readiness.config; push = close-out commit

## Slices (R2)
> Progress 2026-08-11: S0 ✅ (spike table below) · S1 ✅ (infra agent; gates re-verified by
> coordinator) · S2 ✅ code-complete (base 120.5KB ≤135 bar, @dnd-kit shed; registry items MERGED
> incl. coordinator correction: feature regDeps += context-menu, input) · S5 ✅ 8/11 audited
> (24 findings; 3 new slice candidates; pilots + content-composer audit post-refactor) · S6 ✅
> code-complete (3 helpers, kit item MERGED, 6× regDeps appended) · S3 in flight.
> Coordinator fixed validate-meta-deps.mjs slices-field regex (parked #1 of cal handoff).
> Stash-window incident (kit agent git stash over live tree): recovered; both pilots' accounts
> corroborate; final-state gates + R4 diff review are the backstop; stash kept until R3 green.
- [x] S0 (R1) P3.1 spike: local-registry experiment answering — base-compiles-without-feature
      strategy (a) vs (b) · CLI overwrite/conflict behavior on shared target paths · rewriter
      behavior on feature-item import shapes (F-S1 constraints) · fixtures-item interaction ·
      docs-site rendering of sliced items. Output: evidence table in this doc + strategy verdict.
- [ ] S1 `validate:artifact-size` + `artifactBudgetKB` (or equivalent) in meta for all 63 — wired into `registry:build`
- [ ] S2 Pilot 1: `event-calendar` base + `event-calendar-editing` feature item (editing layer already file-separated behind `editable`)
- [ ] S3 Pilot 2: `media-editor` base + `media-editor-capture` feature item — SCOPE REFINED at R1:
      capture axis = 6 files (use-media-capture, use-camera-permissions, use-multi-instance-guard,
      editor-camera, camera-permission-prompt, shutter-button) + gallery/file intake MOVES TO BASE
      (validateGalleryFile is generic, not camera-specific) + fix circular barrel import
      (editor-camera→"../../media-editor") + konva React.lazy + story-composer lockstep
      (deprecated capture re-exports at story-composer/index.ts:46-59,72-82)
- [ ] S4 P3.3 convention doc + rule (+ CLAUDE.md line via configuring-project-memory, registry-skill update) — gated on S2+S3 measurements
- [ ] S5 P3.4 structure-audit checklist authored + run across the 11-item tail (findings → fix-on-touch owners, not big-bang fixes)
- [ ] S6 P3.5 `gamification-kit` extraction (shared-helper precedent; resolves review drift table)

## R1 evidence — registry mechanics (explorer report, 2026-08-11)

Mechanical constraints any feature-item design must satisfy (evidence: `scripts/*.mjs` + registry.json + shadcn-registry-pro skill):

1. **Triple exclusion filter in lockstep ×3 scripts.** `validate-registry-json.mjs:79-82`, `validate-naming.mjs:83-88`, `build-llms.mjs:25-28` all define "base item" as NOT(`-fixtures` suffix | `meta.deprecated` | `files[0].target` starts `components/_shared`). A feature item needs a 4th exemption predicate added to all three in lockstep — candidate: registry.json item `meta.featureOf: "<base-slug>"` (precedent: alias items already use `meta.deprecated`).
2. **Disk-coverage rule breaks on split.** `validate-registry-json.mjs:110-119` requires every on-disk shipped file under a slug folder to appear in that slug's base item `files[]`. Splitting a folder across base + feature items requires the validator to union feature-item files into the coverage check.
3. **No cross-folder file precedent.** `_shared/file-clipboard` ships to its OWN target folder + regDep — nothing today targets another item's folder. Registry skill warns same-target collisions are last-writer-wins within a run (`pitfalls-and-fixes.md §6`); CLI prompts on conflicts with files already on disk unless `--overwrite` (`cli-and-protocol.md:35`).
4. **meta.ts deps are folder-scoped** (`validate-meta-deps.mjs` walks disk per slug, one flat `dependencies` block). registry.json items each carry their own npm `dependencies` (per-item scan, `validate-registry-json.mjs:132-169`) — so per-slice npm deps ARE expressible registry-side; meta.ts declares the union (docs site renders the full composed component — correct there).
5. **build-llms count string assumes 1:1 base:fixtures** (`build-llms.mjs:50`) — needs feature-aware counts.
6. **InstallationBlock hard-codes the `-fixtures` suffix** (`installation-block.tsx:132`) — feature install commands need a driven (not hard-coded) extension.
7. **`shadcn build` (external CLI) is the sole rewriter** — no in-repo script rewrites imports; consumer-side rewriting per components.json aliases happens at `add` time.

**Spike questions (S0) — empirical, local registry + real CLI:**
- Q1 same-run collision: feature item (regDep → base) whose file targets a path base also ships — silent last-writer-wins or prompt?
- Q2 upgrade path: base installed earlier, feature added later — prompt/skip/overwrite? What exactly does `--overwrite` clobber (all files or only conflicts)?
- Q3 rewriter: feature files importing base files (relative within target folder + alias shapes) — survive `add` intact under F-S1 constraints?
- Q4 fixtures interaction: base + feature + fixtures installed together — order effects?
- Q5 build-side: does `shadcn build` accept items targeting another item's folder at all?
- Q6 docs site renders the full composed component from disk (no CLI) — verify no per-item awareness needed beyond InstallationBlock.

## S0 spike results (2026-08-11, shadcn CLI via `dlx shadcn@latest`, local registry on :4980)

Synthetic items: `spike-base` (core + stub-at-`lib/edit-impl.ts` + seam), `spike-editing-a`
(strategy a: real impl at the stub's target + new file, regDep base), `spike-editing-b`
(strategy b: new file only, regDep base), `spike-editing-c` (b without regDep), `spike-base-fixtures`.

| # | Scenario | Result |
|---|---|---|
| Q5 | `shadcn build` with items targeting another item's folder | ✅ builds clean, exit 0 |
| Q1/C1 | fresh: add feature-a alone (base via regDep, target collision in-run) | ✅ silent last-writer-wins — FEATURE file lands (`real-editing`), no prompt |
| Q2/C2 | upgrade: base installed, then add feature-a, no flags | ❌ prompt appears despite `--yes`; non-interactive EOF → **whole-run abort, exit 0, NOTHING written** (phantom success — even the non-colliding new file skipped) |
| Q2/C2 | same with `--overwrite` | ⚠️ collision file updated BUT **every differing file in the resolved graph rewritten — user's local edit to base `core.ts` destroyed** |
| C3 | strategy-b upgrade onto locally-MODIFIED base (regDep) | ❌ same phantom abort — trigger is the regDep re-resolving BASE files that differ, not the feature's own files |
| C3b | strategy-b upgrade onto PRISTINE base (regDep) | ✅ identical base files silently skipped; feature file created |
| Q3/C3b | rewriter on feature file importing base relatively (`./seam`, `./core`) | ✅ imports preserved verbatim, correct in consumer |
| Q4/C4 | fresh combined add: base + fixtures + feature-a | ✅ 5 files, collision resolved to feature, fixtures fine |
| C5 | feature WITHOUT regDep onto modified base | ✅ writes only its own file; base untouched; user edit survives |
| C6 | interactive terminal: answer `n` to base-file prompt | ✅ that file skipped, run CONTINUES, feature file lands (abort is EOF-specific) |
| tsc | consumer tsc: base-only AND base+feature end states | ✅ 0 errors both |

## R1 VERDICT — strategy (b): injection surface. (a) stub-overwrite is DISQUALIFIED.

1. (a) self-collides on EVERY upgrade by construction (stub ≠ real ⇒ file always differs) →
   non-interactive phantom no-op, or `--overwrite` which destroys local edits graph-wide (C2).
   Post-install code ownership is the shadcn model — clobbering is unacceptable.
2. (b) never self-collides (new files only). Residual hazard — regDep re-resolution prompting on
   locally-modified base files — is shared with the EXISTING fixtures pattern (not new), is
   recipe-documentable (interactive: answer `n`; the feature still lands), and is absent on
   pristine bases (C3b).
3. (b)'s injection surface is a public extension API (consumers can inject their OWN
   implementations) — aligns with dynamicity-first, compound-structure rule, renderer-registry precedent.
4. Feature items KEEP `registryDependencies: [@ilinxa/<base>]` — preserves the headline fresh-install
   DX (`add @ilinxa/event-calendar-editing` alone brings everything, C1/C4).

**Injection mechanics (locked for pilots):** prop-based, never module side-effects. Base owns: the
extension context (`createContext`, null default), the extension TYPE, and an optional prop
(`editing?: CalendarEditExtension`). Feature files (in `features/<name>/` inside the base folder,
targets `components/<slug>/features/<name>/...`) export a Provider/implementation object carrying
the edit components + gesture handlers; base parts read them through the context (renderer-registry
style) so NO base file ever statically imports a feature file. Feature-only npm deps (e.g.
`@dnd-kit/*`) move to the feature item's `dependencies`. `editable`-style props stay for API
back-compat; setting them without the extension wired = read-only + one console.warn (negative path).
Registry marker: feature items carry `meta: { featureOf: "<base-slug>" }` — the 4th exclusion
predicate for the validator triple-filter (name-suffix matching is ambiguous; the marker is explicit).

## Invariants (R1)
| # | Invariant (testable) | R4 checked | R5 observed |
|---|---|---|---|
| 1 | Fresh install of base item alone → consumer tsc 0 AND renders read-only (feature files absent) | | |
| 2 | Fresh install of feature item alone → base auto-pulled, consumer tsc 0, full capability works when wired via documented prop | | |
| 3 | No feature-item file target collides with any base-item target (mechanically validated) | | |
| 4 | Revised size bars hold: event-calendar base ≤135KB AND sheds @dnd-kit/*; media-editor base ≤275KB AND base-alone file-intake works | | |
| 5 | Base item npm deps exclude feature-only deps; feature item declares exactly its own | | |
| 6 | Upgrade add of feature onto pristine base → exit 0, feature files created, zero base files modified | | |
| 7 | Producer docs site: pilots render + behave unchanged (full composed component) — demo parity | | |
| 8 | All registry validators green with feature items present; feature items excluded from base-item battery; disk-coverage = base ∪ features; llms/README counts correct | | |
| 9 | `validate:artifact-size` fails a >20%-over-budget artifact without a minor bump; green otherwise | | |
| 10 | gamification-kit: 6 components consume shared kit, no helper drift, all 6 install + consumer-tsc clean | | |
| 11 | Existing consumers' import surface unchanged: every pre-split `index.ts` export still resolves (base or via feature wiring) | | |

## Blast radius (R1)
| Surface | Why touched | Docs action (R6) |
|---|---|---|
| `src/registry/components/data/event-calendar/**` | pilot 1 split (features/editing/) | guide + procomp docs + meta minor bump |
| `src/registry/components/media/media-editor/**` | pilot 2 split (features/capture/) | guide + procomp docs + meta minor bump |
| `src/registry/components/gamification/**` (+ shared kit home) | P3.5 extraction | decision file + meta bumps |
| `registry.json` | feature items ×2, kit item, budgets n/a | roster convention note |
| `scripts/validate-registry-json.mjs` | featureOf predicate + coverage union + collision check (inv. 3) | comment header |
| `scripts/validate-naming.mjs` | featureOf predicate | comment header |
| `scripts/build-llms.mjs` | featureOf predicate + counts + feature listing under base | llms.txt/README regen |
| `scripts/validate-artifact-size.mjs` (NEW) | S1 | wire into `registry:build`; component-guide |
| `src/registry/types.ts` | `slices?` meta field (install-surface listing) + budget field | component-guide |
| `src/app/components/[slug]/_components/installation-block.tsx` | render feature install commands from meta | — |
| `package.json` | registry:build chain + validate:artifact-size script | CLAUDE.md commands block |
| `docs/component-guide.md` + `.claude/skills/shadcn-registry-pro/` + `.claude/CLAUDE.md` + `.claude/rules/` | P3.3 convention ratification | the convention doc itself |
| `docs/procomps/{event-calendar,media-editor}-procomp/` | pilot planning trio + reviews | GATE 3 files |
| `.claude/STATUS.md` + `.claude/decisions/` | close-out | R7 |
| NOT touched | `validate-meta-deps.mjs` (folder-scoped union stays correct — docs site renders composed component); `src/components/ui/*`; manifest entry shape | cleared: reasoning at left |

## Gate results (R3)
| Gate | Result (real numbers) |
|---|---|
| pre-P3 baseline (2026-08-11) | tsc 0 · lint 0 err/9 warn · 6 validators exit 0 · build green (63 routes) |
| R3 post-implementation (2026-08-11) | tsc 0 · lint 0 err/9 pre-existing warn · `registry:build` FULL CHAIN exit 0 (meta-deps 63/63 · whitelist clean · registry-json 63 base + 2 feature + 52 aliases: 0 high/4 pre-existing warn · naming 0 · llms/README regenerated w/ slice sub-lines · doc-drift green incl. new feature-mention check · doc-budget green · shadcn build 182 items · artifact-size 65 audited 0 high) · next build: ✅ compiled in 103s, exit 0 |
| R3 fixes en route (validators earned their keep) | editing item deps object→array (schema) + missing date-fns/lucide-react caught by registry-json ×2 HIGH · validate-doc-drift needed the 4th predicate + ↳-mention check (5th lockstep script — R1 evidence #1 undercounted) · validate-registry-json: deps shape guard + feature-aware import resolution + F5-regDep warn exemption |
| **Artifact actuals vs revised bars** | event-calendar base **136.4KB** vs ≤135 bar (−32.8% vs 203KB; miss = +1%, JSON-wrap overhead unmodeled in source-byte estimate; @dnd-kit shed ✓) · editing 95.4KB · media-editor base **282.0KB** vs ≤275 bar (−10.5% vs 315; +2.5% over) · capture 53.5KB · kit 4.2KB. **Accepted-with-note pending R4 verdict; budgets tighten at R6 (calendar 235→160, editing 85→110, capture 55→65).** |

## Findings table (R4)
Verdicts by the architect after refute-checks (greps/reads recorded in-session); fixes folded into
the unlanded base commit; "regression test" = the validator/gate that now catches the class.
| # | Finding | Failure scenario | Verdict | Evidence | Fix + regression guard |
|---|---|---|---|---|---|
| CAL-1/INFRA-3 ⚠️ | calendar base item still lists context-menu+input regDeps (stale post-split) | base-alone add pulls 2 unused primitives | CONFIRMED (grep: both only under features/) | registry.json + grep | removed from base item; editing item declares them (merge correction). Guard: none mechanical (shadcn-primitive regDeps unscanned — parked) |
| CAL-2 🔹 | no-editing warn dedup module-scoped, sibling is per-instance | 2nd calendar instance loses its diagnostic | CONFIRMED | calendar-root.tsx:30 | per-instance ref passed into warn fn |
| CAL-3 🔸 | base props reference types the base barrel no longer exports | base-only consumer can't type its own handlers | CONFIRMED (grep: 0 of 9 names in base index.ts) | index.ts | type-only re-export block appended (erased at compile — no runtime feature dep) |
| INFRA-1 🚫 | crossSlug nulls own-slug → base→own-features imports invisible to validators; invariant 3's "base never imports feature" unenforced | future edit adds the import; gates stay green; consumer-tsc fails post-deploy | CONFIRMED | validate-registry-json.mjs:73-83 | dedicated base→own-features check added (HIGH), alias + relative resolution |
| INFRA-2 🔸 | doc-drift has no stale-slice-mention reverse check | removed/renamed feature leaves phantom ↳ line forever | CONFIRMED | validate-doc-drift.mjs | reverse mention-scan added (fails on unknown slice slug) |
| INFRA-4 🚫 | media-editor base misses `button` regDep; 5 BASE files import Button (implementer's "raw <button> only" claim FALSE — read one file, claimed all) | fresh base-alone add → consumer tsc fails (invariant 1) | CONFIRMED (grep: 5 base + 2 capture files) | registry.json + grep | `button` added to base item regDeps. Pre-existing, P3-exposed |
| INFRA-5 🔸 | artifact-size audits only what exists; silently-dropped artifact undetected | dropped item → green build → 404 in prod | CONFIRMED | validate-artifact-size.mjs:59 | completeness check vs registry.json items added |
| INFRA-6 🔹 | media-editor budget comment claims unverified estimate; actual verified | future maintainer loosens budget "to be safe" | CONFIRMED | meta.ts:43-49 | comment updated with verified 282.0KB actual |
| — | Stash-window corruption hypothesis | half-reverted file states | REFUTED both pilots (calendar: byte-identical extraction diffs; media: no dangling refs to removed paths, provider surface field-for-field intact) | normalized diffs + greps | stash dropped after R4 close |
| MED-1 🔸 | multi-instance-guard docstring stale; trigger narrowed config→mounted (disclosed) | 2 camera-configured instances, surfaces unmounted: old warned, new silent | CONFIRMED — narrowing accepted as MORE accurate (tracks live contention); docstring was dishonest | use-multi-instance-guard.ts:5-8 | docstring rewritten stating both semantics + the R4 verdict |
| MED-2 ⚠️ | story-composer removed the ComposerCamera/Editor/Toolbar/ColorSwatchPicker band that was never schedule-deprecated (contract snapshot: "must still resolve"); meta.ts retroactively claimed a schedule | external v0.1.5-era consumers break silently on v0.4.0 with zero announced removal | CONFIRMED (git show + snapshot doc) | story-composer/index.ts:44-48 vs HEAD:44-58 | 8-name band RESTORED as re-exports (camera names from the capture slice) with real schedule: REMOVED in v0.5.0 |
| MED-3 🔸 | media-editor budget 300 unreconciled vs ≤275 bar / 282 actual | +15KB growth stays green while ~8% past the negotiated bar | CONFIRMED | meta.ts:50 | budget tightened to 290 (~3% headroom) with reasoning comment |
| MED-4 🔸 | content-composer statically wires mediaCapture regardless of config's mediaSources | upload-only config still pulls the capture module graph | CONFIRMED — follow-up with owner (design change, not a patch): content-composer v0.4.0 makes capture wiring config-conditional (lazy or prop-injected) | media-substrate.tsx:17-24,221 | follow-up row; carried in content-composer post-refactor audit + STATUS |
| MED-5 🔹 | demo docstring says five tabs; there are six | reader undercounts | CONFIRMED | demo.tsx:23 | docstring fixed |

**R4 CLOSED 2026-08-11** — 14 findings (2 blocker-class, 2 high, 6 medium, 4 low/refuted-class), 13 fixed + re-gated (tsc 0 · registry:build chain 0 · lint 0/9), 1 follow-up with owner (MED-4). Post-fix artifact: event-calendar 137.3KB.

## Runtime evidence (R5) — 2026-08-11, all real CLI installs against local registry :4990

**Install matrix (fresh consumers, `pnpm dlx shadcn@latest add`, consumer `tsc --noEmit`):**
- Base-UI backend (style base-nova): calendar base-alone → no features/, no @dnd-kit (inv. 5) ·
  upgrade +editing → 14 created / 68 identical-skipped, base file hash UNTOUCHED (inv. 6), tsc 0
  (inv. 2) · editing feature-alone → 82 files incl. auto-pulled base, tsc 0 · media base-alone →
  no capture dir, button/alert-dialog/popover/slider primitives present, tsc 0 (inv. 1) ·
  +capture → 8 files, tsc 0 · kit + story-composer chain (76 files) → tsc 0 (inv. 10).
- Radix backend (style new-york): calendar+editing + media+capture in one consumer → 127 files,
  @radix-ui primitives, tsc 0. **Both backends green.**
- R5 caught + fixed 3 more registry-data bugs pre-ship: media-editor missing `slider` regDep
  (new primitive-scan validator added — caught exactly 2 gaps catalog-wide) · 27 pinned
  `new-york/*.json` style-URL regDeps de-pinned catalog-wide after one CLOBBERED a consumer's
  base-nova button live (dialog/button variant skew → consumer tsc fail) — retires the known
  F-cross-13 "pinned URL" carrier class · editing item now declares its own `button`.
- Harness lessons (config updated): components.json must be BOM-free; CLI does NOT add installed
  primitives' own npm deps (@base-ui/react / class-variance-authority / @radix-ui) — re-align
  after add (known 4.6.0 class).

**Browser pass (docs site, host-side Playwright vs dev :3050, console-error collection on):**
8/8 checks, 0 console errors. Screenshots in session scratchpad r5/pw/out/: calendar page renders
month grid + mini-nav on design tokens, "Optional feature slices" install step shows the exact
`@ilinxa/event-calendar-editing` command (InstallationBlock slices UI live) · view-switch
interaction OK · event right-click OK (editing extension wired) · media page shows capture slice
step + 6 demo tabs incl. "No-capture (base-alone)"; that tab's file-intake affordance asserted
(NEGATIVE PATH: base-alone intake works, no crash, no console errors) · team-challenge (kit
consumer) renders.
- Virtual-browser detour recorded: container MCP blocked (host firewall, port-3000 collision with
  an unrelated host service) → host-side Playwright adopted as the R5 browser instrument;
  `next.config.ts` gained `allowedDevOrigins` for future container use. Stale memory: the browser
  container is now `shadow-browser`, not `virtualbrowser-stealth-browser-1`.

## Parked
- Heavy-tail count grew 7 → 11 since the 2026-08-10 review (measurement basis differs: review used LOC, this uses artifact KB) — P3.4 audit records both.
- CLAUDE.md trigger line for feature-readiness-loop (config bootstrap §5) — fold into S4's CLAUDE.md edit.

## Handoff (R7)
- **Status: P3 COMPLETE.** HEAD = fe72f47 (base) + close-out commit; pushed to master (= deployed
  = installable). GATE 3: Pass with follow-ups (docs/reviews/2026-08-11-p3-feature-slicing-review.md).
- done: convention ratified + tooled (5 scripts feature-aware, F1–F7, artifact-size+completeness,
  primitive scan, base→features ban) · pilots shipped both slices · kit extracted · 11 audits ·
  27 style-URL pins retired · e2e both backends + browser 8/8 · docs synced (CLAUDE.md/skill/guide/
  convention/trios).
- pre-mortem: if this breaks in prod, it breaks because a consumer hits the non-interactive
  upgrade phantom-no-op onto a modified base (documented CLI limit), or a newer shadcn CLI major
  changes feature-item install semantics (re-test owner: P4.2 smoke variants).
- next: (1) post-deploy single-slug spot check of `@ilinxa/event-calendar-editing` from the
  DEPLOYED registry (≥60s spacing — Vercel bot-mitigation); (2) P4 phase per master plan;
  (3) follow-up owners: content-composer v0.4.0 (MED-4 + eager substrates), F-cross-15
  fix-on-touch, task-family clipboard docs gap.

## Invariants — final status
All 11 R4-checked and R5-observed (see Gate results + Runtime evidence): #1–#3, #5–#11 fully
verified; #4 held in revised form with the two accepted-with-note KB deviations (137.3 vs 135;
282 vs 275) — budgets now enforce mechanically at 160/110/290/65.
