# Plan — Part 1 registry-wide hardening, slice group B (R1–R9, R11)

## Status
- phase: R3 (B1–B5) — next unchecked gate: commit B1–B5, then B6 (R8 sites) and B7 (R6 codemod)
- branch/HEAD: master @ aaa2b4c (group A pushed 2026-10-24)
- updated: 2026-10-24
- open escalation: none
- group A (R10, R12): [part1-registry-hardening-plan.md](part1-registry-hardening-plan.md) — closed

## Goal
Make the consumer contract (C1–C12) a set of written rules plus build gates. The gates stop the registry
from getting worse, and the existing debt is recorded in baselines that can only shrink. Each later
component loop then closes a component's rows.

## Context
This is the rest of Part 1 of the ilinxa Social Platform hardening request. The user and the platform
approved it on 2026-10-24, with "report when Part 1 closes". After Part 1, engagement-bar and media-carousel
are next.

The locked consumer decisions apply throughout:
1. Controlled data is opt-in.
2. Defaults are kept, and consumer needs go through props or CSS variables.
3. `--media-overlay*` tokens are used instead of black/white on media.
4. Tokens ship as `cssVars.theme` mappings with fallbacks.
5. Heavy composition goes through an optional feature slice.

**The request's own definition of a baseline:** a checked-in list of the violations present when a rule
lands. The rule fails on any violation not in the list, and the list may only shrink. Components already
closed under Parts 2–3 (story-rail 0.4.0, app-sidebar 0.5.0) must have no baseline entry.

## Scope
- In:
  - **R1** — tokens in `globals.css`, the README token table, and tests.
  - **R2** — the labels convention, guide section, template, and a `.replace("{` gate.
  - **R3** — the formatter/`now`/locale convention and gates.
  - **R4** — the palette-class gate.
  - **R5** — the JSX-literal gate.
  - **R6** — the physical-utility gate, the `useDirection` convention, and the codemod.
  - **R7** — the controlled-state convention and a template helper with tests.
  - **R8** — the keyboard guard helper and hook, the keydown gate, and the named ad-hoc sites replaced.
  - **R9** — the test harness, the contract kit, and an expandable-text reference.
  - **R11** — pinned ranges, the heavy flag, and the heavy-edge gate.
- Out:
  - **Fixing baselined debt inside components.** Each component's later loop closes its rows. The R6
    codemod and the R8 named sites are the exceptions, because the request asks for them in Part 1.
  - **Per-component RTL demos, locale/hydration tests and contract tests** for components not yet
    closed. Those come with each component's Part 2–3 loop.
  - **A GitHub Actions workflow** (R9 says "recommended"). It is parked for the user, because it is a new
    outward surface.

## Decisions (R1 — to verify while designing)
- **D1 — one AST-based contract validator** (`scripts/validate-contract.mjs`), built on the
  TypeScript compiler API (`typescript` is already a dependency):
  - It runs over every file shipped in `registry.json`, excluding fixtures items' `dummy-data.ts`.
  - Rules are modules: `palette` (R4), `physical` (R6), `template-fill` (R2), `intl` (R3: undefined
    locale, module-scope `new Intl.*`, no-arg `toLocale*String()`, `PluralRules("en")`), `clock` (R3:
    zero-arg `new Date()` / `Date.now()` outside an effect or event handler), `jsx-literal` (R5) and
    `keydown` (R8).
  - Class rules read every string and template literal and tokenise it, rather than only `className`
    and `cn()`. Class constants in maps and `cva` variants are therefore covered.
  - Escape hatches are comments on the same or the preceding line: `// dir-ok:`, `// palette-ok:`,
    `// now-ok:`, `// keydown-ok:`, each followed by a reason.
  - It runs in `registry:build` (and so in `vercel-build`) and in `pnpm lint`.
- **D2 — baselines count per file per rule** (`scripts/contract-baseline.json`):
  - The count in a file above its baseline fails. A new file with violations fails.
  - A count below the baseline also fails until `--update-baseline` lowers it. The flag only ever lowers
    counts, so the list only shrinks and progress is recorded.
  - A `closed` list of components may not have any baseline row.
- **D3 — helpers ship as copies** inside each component (`lib/`, `hooks/`), like the existing
  sealed-folder pattern. There is no new `registry:hook` item class.
  - The scaffold (`_template/_template/`) carries what every component needs: typed labels and
    `use-controllable-state` (R7), with tests.
  - The canonical copies of `use-direction` (R6), `is-editable-target` and `use-global-keydown` (R8)
    live with tests in `_template/_snippets/`. Authors copy them when needed, so a new component never
    ships unused files.
- **D4 — R9 uses `axe-core` directly**, which is already a devDependency, instead of adding
  `vitest-axe`. Helpers live in `tests/helpers/`. A fourth vitest project, `repo-dom` (jsdom), runs
  `tests/**/*.test.tsx`.
- **D5 — R11 heavy edges are a baseline**, not an immediate refactor:
  - `meta.ts` gains `heavy?: true` in `ComponentMeta`.
  - A static import or `registryDependencies` entry targeting a heavy item fails, except for the
    baselined edges (carousel-composer, story-composer, content-composer, media-library, json-form).
    Those close in Part 3 under decision 5.
  - `validate-registry-json` rule 7 (a cross-component import needs a regDep) stays as is.
- **D6 — the R6 codemod is a bulk-mechanical sweep under this loop**, with Sonnet agents per category,
  then coordinator re-verification and fresh-finder review. Each touched component gets a patch bump
  and a CHANGELOG line, as the R10 gate now demands. LTR rendering must be identical, so screenshot
  diffs of the docs site in LTR are the runtime check.

## Slices (R2) — each lands with its tests; commit per slice
- [x] B1 contract validator engine + rules + baseline + wiring (`registry:build`, `lint`) + fixture tests
      from each R's accept list + `closed` enforcement
- [x] B2 R1 tokens (`--brand`, `--success`, `--info`, `--story-ring-*` under `:root`/`.dark`/`@theme`) + README
      token table + repo test (table ⇔ globals.css) + Tailwind-compile fixture test
- [x] B3 guide "Consumer contract" section (C1–C12; R2, R3, R6, R7, R8 conventions) + `AGENTS.md` /
      `CONTRIBUTING.md` links + `_template` (labels interface/defaults/merge, `use-controllable-state`,
      `use-direction`, `is-editable-target`, `use-global-keydown`, tests)
- [x] B4 R11 pinned ranges (115 bare → 0) + `heavy` meta flag + heavy-edge gate + baseline
- [x] B5 R9 `tests/helpers/` (render with dir/locale, axe, matchMedia/ResizeObserver/IntersectionObserver/Embla
      mocks, media stubs, contract kit) + `repo-dom` project + expandable-text reference tests
- [ ] B6 R8 sites: story-viewer (+ SV7 regression), media-editor, pdf-viewer, split-workspace → shared guard;
      patch bumps + CHANGELOG
- [ ] B7 R6 codemod physical → logical (bulk, per category) + baseline shrink + patch bumps + CHANGELOG +
      LTR screenshot parity

## Readiness checklist
- [x] R0 plan doc + improvement-log scan + slice plan; scope surfaced (user + platform approved Part 1)
- [ ] R1 invariants + blast radius; decision file
- [ ] R2 slices B1–B7 ticked with tests
- [ ] R3 gates with numbers
- [ ] R4 findings table (fresh finders per slice group)
- [ ] R5 runtime evidence
- [ ] R6 docs + docs-audit; commits landed
- [ ] R7 handoff, parked promoted, retro

## Invariants (R1 — draft)
| # | Invariant | R4 | R5 |
|---|---|---|---|
| 1 | Every accept fixture in R2–R6, R8, R11 behaves as the request states (e.g. `bg-red-500` fails, `text-white/60` passes, `ms-2` passes, `left-1/2 -translate-x-1/2` passes, `aria-label={labels.close}` passes) | | |
| 2 | On the current catalog the validator is green with the checked-in baseline, and one new violation in any shipped file fails `registry:build` | | |
| 3 | The baseline only shrinks: a lower count fails until the baseline is updated, and `--update-baseline` never raises a count | | |
| 4 | story-rail and app-sidebar (closed) have zero baseline rows | | |
| 5 | Every README token exists under `:root`, `.dark` and `@theme inline`; a Tailwind build of the fixture emits rules reading each variable | | |
| 6 | A scaffolded component compiles and contains `<Name>Labels`, `default<Name>Labels`, the merge, and the four helpers with passing tests | | |
| 7 | `registry.json` has no bare dependency name; a new heavy edge fails the build | | |
| 8 | `expectNoAxeViolations` fails on a fixture with a violation; the expandable-text kit run passes | | |
| 9 | story-viewer: Space / ArrowRight typed in the reply textarea insert text and change neither pause nor item | | |
| 10 | After the codemod, LTR rendering of every touched component's demo is pixel-identical; the physical baseline count drops | | |

## Blast radius (R1 — draft)
| Surface | Why | Docs (R6) |
|---|---|---|
| `scripts/validate-contract.mjs` + `scripts/contract-baseline.json` (new) | B1 | header comment |
| `package.json` (`registry:build`, `lint`, `test` projects) | B1, B5 | — |
| `vitest.config.ts` | `repo-dom` project | comment |
| `src/app/globals.css`, `README.md` token table, `public/llms.txt` | B2 | update |
| `docs/component-guide.md`, `AGENTS.md`, `CONTRIBUTING.md` | B3 | new section + links |
| `src/registry/components/_template/_template/**`, `scripts/new-component.mjs` | B3 | — |
| `src/registry/types.ts` (`heavy`), heavy components' `meta.ts`, `registry.json` deps | B4 | guide §11.5 |
| `tests/helpers/**` | B5 | guide cites the kit |
| story-viewer, media-editor, pdf-viewer, split-workspace | B6 | CHANGELOG + versions |
| ~45 components (codemod) | B7 | CHANGELOG + versions |
| `.claude/readiness.config.md`, registry skill, STATUS, decision file | all | update |

## Gate results (B1–B5, after R4 fixes)
| Gate | Result |
|---|---|
| typecheck | `pnpm tsc --noEmit` exit 0, 0 errors |
| lint | 0 errors / 14 warnings = baseline; `validate-contract` in lint: no new violations |
| registry:build | exit 0 (sync, cross-category, registry-deps, contract, changelog, stamp all green) |
| build | `pnpm build` exit 0 |
| tests | `NODE_ENV=production pnpm test:run --no-file-parallelism`: **698 passed / 60 files** (594/52 at group A close) |
| contract baseline | palette 87 · physical 295 · template-fill 28 · intl 37 · clock 31 · jsx-literal 640 · keydown 10 (closed: story-rail, app-sidebar — 0 rows) |
| heavy edges | 23 baselined; 7 flagged heavy items, 6 more reach one |
| scaffold | a probe `pnpm new:component` scaffold compiled and its 10 tests passed (before R4; the template tests re-run green after) |

## Findings table (R4 — B1–B5)
Two fresh Sonnet finders: C on the contract validator, D on tokens, template, R11 and the R9 harness.
They made 28 reports. All are CONFIRMED and fixed except where marked. Four fixes were falsified: the fix
was reverted, the test went red, the file was restored, and `cmp` confirmed it byte-identical. Those four:
- out-of-order guard
- shadow-DOM origin
- the CHANGELOG anchor (group A)
- the gate's red CLI test

| # | Finding | Verdict | Fix + test |
|---|---|---|---|
| C1 | The gate had no failing CLI test; `--update-baseline` / `--seed-rule` untested | CONFIRMED (High) | CLI tests on a fixture repo: exit 1 on a new violation, closed component, seed-once, update-never-adds |
| C2 | An escape trailing one line's code silenced the next line | CONFIRMED | Above-line escape only from a comment-only line; test |
| C3 | `literal-ok` couldn't be written in JSX (`{/* */}`) | CONFIRMED | Block / JSX comments accepted; test |
| C4 | HTML entities (`&nbsp;`) counted as letters | CONFIRMED | Entities stripped; test |
| C5 | `new Intl.X()` and `toLocaleString(undefined, …)` passed | CONFIRMED | Zero-arg / undefined forms fail (`.resolvedOptions()` reads exempt); tests. intl 36 → 37 |
| C6 | keydown bypasses: `document.body`, casts, template event name | CONFIRMED (aliased variable not traced — documented) | AST unwrap + body/documentElement; tests |
| C7 | Tailwind 4.2 palettes (mauve/olive/mist/taupe) missing | CONFIRMED (checked theme.css) | Added; test |
| C8 | Arbitrary colours only matched at the start; `hsl(var())` flagged | CONFIRMED | Literal-colour detection after removing `var()`; text-shadow prefix; tests. palette 89 → 87 |
| C9 | Centring / inset pairs ignored variants | CONFIRMED | Same-variant pairing; tests |
| C10 | Prose in non-class JSX attributes hit class rules | CONFIRMED | Class rules skip non-class attributes; test |
| C11 | Clock heuristics: promise callbacks flagged; `handle*` name trusted | PARTLY — `.then/.catch/.finally` now deferred; naming heuristic kept (documented) | test |
| C12 | `origin-left`, `bg-left`, `slide-in-from-left` not physical | DROPPED — not in the request's inline-axis list; parked | — |
| C13 | Count-only baseline let a fix + a new violation swap silently | CONFIRMED | Baseline is now the per-file list of violations, compared as a multiset; test |
| C14 | `'Close ' + n` and similar concatenations missed | CONFIRMED (`String('x')` dropped as rare) | `+` concatenation read; test |
| D1 | Overlapping uncontrolled requests rolled back to a stale value | CONFIRMED | Latest-request-decides + last-settled value; tests |
| D2 | Controlled async stuck on optimistic value when the parent didn't adopt | CONFIRMED | Pending clears on the latest request's resolve; test |
| D3 | `Object.is` reconcile dropped optimism / looped on fresh objects | CONFIRMED | Reconcile in an effect + `isEqual` option; test |
| D4 | Mode switch silent | CONFIRMED (Low) | Dev warning; test |
| D5 | `optimistic={false}` applied out-of-order results | CONFIRMED | Settled-sequence guard; test (falsified) |
| D6 | `isEditableTarget` blind inside shadow DOM | CONFIRMED | `composedPath()[0]` origin; test (falsified) |
| D7 | `fireMedia` left `paused` inconsistent; no `load()` | CONFIRMED | Fixed + stub; test |
| D8 | `mockLayout` missed `getPropertyValue("line-height")` | CONFIRMED | Fixed; test |
| D9 | Kit checks optional / unproven; `rerender` dropped `dir` | CONFIRMED | `rtl.expect` required; `contractChecks()` exported and proven to FAIL broken components; `wrapper`-based context; tests |
| D10 | Heavy gate: no transitive edges; code-block / flow-canvas unflagged | CONFIRMED (a, c); (b) DROPPED — dynamic / relative forms still need a `registryDependencies` entry, which is checked | Transitive closure + 2 flags; +9 baselined edges (23 total); test |
| D11 | Dark `--success` changed app-sidebar's look on the site | CONFIRMED | Back to 0.65 |
| D12 | Contrast comment overstated | CONFIRMED | Corrected |
| D13 | Guide §8 still banned black/white without the media note | CONFIRMED | Reconciled |
| D14 | Template: `locale=""` throws; aria-label on a role-less span | CONFIRMED | `locale \|\| "en"`; sr-only label text; tests |

## Parked
- GitHub Actions workflow for tests + lint on pull requests (R9 "recommended") — outward surface; user call.
- `origin-*`, `bg-left/right`, `slide-in-from-left/right` as physical utilities (C12) — not in R6's list; decide with the platform.
- A content-hash lock for served files (one version ⇒ one content) — would have caught app-sidebar's comment-only change automatically; proposed, not in the request.

## Handoff (R7)
