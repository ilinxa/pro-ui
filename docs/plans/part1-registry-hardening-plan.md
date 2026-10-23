# Plan — Part 1 registry-wide hardening (R1–R12), slice group A: R10 + R12

## Status
- phase: R6 — next unchecked gate: base commit
- branch/HEAD: master @ 42070ff (uncommitted work on top)
- updated: 2026-10-24
- open escalation: none

## Goal
A consumer who vendors pro-ui code can tell which version each installed item is, and can trust that
an install on shadcn CLI 3.8.x or 4.x into a new-york, src-dir project lands every file where the
item says and compiles.

## Context
Part 1 of the ilinxa Social Platform hardening request (contract rule C10). The platform asked for
R10 and R12 **first**, because they gate its adoption: it vendors with a hash lockfile and never runs
`shadcn add --overwrite`. The rest of Part 1 (R1–R9, R11) is slice group B, run as a second pass of
this loop after the R10/R12 report-back. Signed off by the user and the platform on 2026-10-23.

## Scope
- In (group A):
  - **R10** — `meta.version` + `meta.status` on every component-backed item in `registry.json` and
    in the served `public/r/<item>.json`; a `// @ilinxa/<item> <version>` stamp on the served entry
    file (last line — see D2); a repo test that the served version equals `meta.ts`; a CHANGELOG validator.
  - **R12** — a repo-level install test (new-york, src-dir, `rsc: true`) on CLI 3.8.5 and 4.18.0
    from a locally served `public/r`; a cross-category import validator in `registry:build`; the
    README names the supported CLI versions.
- Out:
  - Past versions served at `r/<slug>@<version>.json` (optional in R10) — parked.
  - Fixing what the R12 install test finds inside components. A component defect it exposes is
    reported and routed to that component's loop, unless it blocks the platform's own four items.
  - R11 (pinned ranges, heavy-item imports) — group B. The install test only measures it.
  - Running the install test inside `vercel-build`. It needs the network and minutes; it is a
    release-time instrument (`pnpm test:install`), like `test:e2e`.

## Decisions (R1)
- **D1 — `meta.ts` stays the single source of truth.** `scripts/sync-registry-versions.mjs` writes
  `meta.version` / `meta.status` into `registry.json` items during `registry:build` (merging into an
  existing `meta`, never replacing it); `shadcn build` already passes item `meta` through to the served
  JSON and the index (verified: `media-editor-capture`, `article-body-01`). Base item → its own
  `meta.ts`; `<slug>-fixtures` → the base's; a feature item (`meta.featureOf`) → its base's.
  **No version:** the 52 deprecated alias items (no files; installing one installs the versioned
  target) and the 2 `_shared` support items (`file-clipboard`, `gamification-kit` — no `meta.ts`).
  The test asserts both exclusions explicitly, so a new item class cannot silently go unversioned.
- **D2 — the stamp is a TRAILER in the served JSON, not a header, and not in the source.** The
  request asked for a first-line header. Measured during S5 (probe item, nine comment placements, both
  CLIs): **shadcn CLI 3.8.5 and 4.18.0 strip every leading comment on install** — line, block, JSDoc,
  even one above `"use client"` — and keep a trailing one. A header would be served, pass a
  served-JSON test, and be deleted from the consumer's copy. So a post-`shadcn build` step
  (`scripts/stamp-registry-artifacts.mjs`) appends `// @ilinxa/<item> <version>` as the LAST line of
  the entry file's `content`: the item's root `index.ts` (base), `features/<name>/index.ts` (feature),
  the single `dummy-data.ts` (fixtures). Source files stay version-free. Idempotent (an existing
  trailer is replaced, CRLF-aware). Deviation from the request's letter, reported back with evidence.
- **D3 — CHANGELOG is the per-version history; `docs/component-versions.md` stays the snapshot.**
  `CONTRIBUTING.md` already requires a CHANGELOG entry for an API change; nothing enforced it.
  `scripts/validate-changelog.mjs`: each component's current version must appear on a CHANGELOG line
  next to its backticked slug, **or** be grandfathered in `scripts/changelog-baseline.json`. A baseline
  entry whose version no longer matches `meta.ts` fails — so the first bump after landing forces a real
  entry and the baseline only shrinks. Today's ships (fix-now batch, story-rail 0.4.0, app-sidebar
  0.5.0) get real entries instead of baseline rows.
- **D4 — the install test is a node script plus pure checker functions.** The checkers (file landing,
  header present, `ui/` untouched) are unit-tested in the `repo` vitest project with fixture trees, so
  the negative paths are proven without the network. The runner copies a committed consumer template
  to the OS temp dir, installs it, seeds one upstream primitive with a marker, serves `public/` from
  an in-process HTTP server, runs `shadcn add` per CLI, then the checks and consumer `tsc --noEmit`.
  **The CLI's exit code is not trusted** — a non-interactive skip exits 0.
- **D5 — the cross-category import validator** (`scripts/validate-cross-category-imports.mjs`, in
  `registry:build`): for every shipped file, a static import of `@/registry/components/<cat>/…` whose
  `<cat>` differs from the importer's must target a basename unique across all shipped files; a
  cross-category `export … from` or dynamic `import()` fails outright. Measured today: 27 cross-category
  imports, 0 re-exports, 0 dynamic imports, **1 basename collision** (`content-composer/lib/gates.ts`
  → `json-form/lib/path`; another shipped `path.ts` exists). That one is baselined with an owner
  (next content-composer or json-form loop); the baseline fails when stale.

## Readiness checklist
- [x] R0 plan doc + improvement-log scan + slice plan; scope surfaced to user (platform order: R10+R12 first)
- [x] R1 invariants table + blast-radius table; decision file drafted (`.claude/decisions/2026-10-24-part1-r10-r12-versions-install-test.md`, local)
- [x] R2 all slices ticked, tests with code, scoped tests green
- [x] R3 code gates green with numbers (see Gate results)
- [x] R4 findings table complete — every row CONFIRMED+fixed+tested or DROPPED+reasoned
- [x] R5 every invariant observed live incl. ≥1 negative path (see Runtime evidence)
- [ ] R6 blast-radius docs walked; docs-audit green; base commit landed
- [ ] R7 history verified; handoff below; parked promoted to config; retro appended to improvement log

## Invariants (R1)
| # | Invariant (testable) | R4 checked | R5 observed |
|---|---|---|---|
| 1 | Every component-backed item (base, fixtures, feature) has `meta.version` and `meta.status` equal to its owning `meta.ts`, in `registry.json` AND in the committed `public/r/<item>.json` | yes | yes — catalog test on committed files |
| 2 | Alias and `_shared` items carry no version, and no other item class is unversioned | yes (A11 added the reverse check) | yes |
| 3 | Pre-existing item `meta` keys (`featureOf`, `budgetKB`, `deprecated`, `replacedBy`) survive the sync unchanged | yes | yes |
| 4 | The served entry file's `content` ENDS with `// @ilinxa/<item> <version>` (last line); exactly one such line; no other file is stamped | yes (A5/B6 fixed) | yes |
| 5 | The stamp survives a real `shadcn add` on CLI 3.8.5 and 4.18.0 (installed entry file ends with it) | yes | yes — a first-line header did NOT survive (run 1); the trailer does (run 2) |
| 6 | A version bump without a CHANGELOG line fails `registry:build`; a stale baseline row fails it too | yes (A6/B4 fixed) | yes |
| 7 | Install test, both CLIs: every file of every installed `@ilinxa` item lands at `src/<target>`; no pre-existing file under `src/components/ui/` changes; consumer `tsc --noEmit` exits 0 | yes (A7–A10 fixed) | yes — runs 2 and 3 |
| 8 | The install test FAILS when a file is missing, the stamp is missing, or a seeded `ui/` file changed (negative paths) | yes | yes — unit tests + run 1 failed live (missing files, lost header) + planted tsc error |
| 9 | A new cross-category `export … from`, dynamic `import()`, or non-unique basename target fails `registry:build` | yes (A1–A3 fixed) | yes |
| 10 | Sync + stamp are deterministic: a second `registry:build` on unchanged inputs leaves `registry.json` and `public/r` byte-identical | yes | yes |

## Blast radius (R1)
| Surface | Why touched | Docs action (R6) |
|---|---|---|
| `scripts/sync-registry-versions.mjs` (new) | D1 writer | header comment |
| `scripts/stamp-registry-artifacts.mjs` (new) | D2 | header comment |
| `scripts/validate-changelog.mjs` + `scripts/changelog-baseline.json` (new) | D3 | header comment |
| `scripts/validate-cross-category-imports.mjs` (new) | D5 | header comment |
| `scripts/install-test/` (new: runner, checkers, consumer template) | D4 | README in folder |
| `package.json` scripts | `registry:build` chain, `validate:changelog`, `validate:cross-category-imports`, `test:install` | — |
| `registry.json` | 130 items gain `meta.version`/`status` | generated by the sync |
| `public/r/*.json` | meta + entry header | regenerated |
| `tests/` (repo tier) | versions test, changelog gate test, cross-category gate test, install checker test | — |
| `CHANGELOG.md` | 2026-10-23 entries | written |
| `CONTRIBUTING.md` | the CHANGELOG rule is now enforced; how to add an entry | update |
| `README.md` | supported CLI versions; version header | update (grep every install mention) |
| `docs/component-guide.md` §11.5 | shipping: version stamp + install test | update |
| `.claude/skills/shadcn-registry-pro/` | registry convention changed (item meta.version, header) | update |
| `.claude/readiness.config.md` | gates (registry:build chain), test tiers (`test:install`) | update |
| `.claude/STATUS.md` + decision file | state + D1–D5 | update |

## Slices (R2)
- [x] S1 `sync-registry-versions` + versions repo test (invariants 1–3, 10)
- [x] S2 `stamp-registry-artifacts` + stamp test (invariant 4) — header→trailer after S5 measured the CLI strip
- [x] S3 `validate-changelog` + baseline + CHANGELOG entries + gate test (invariant 6)
- [x] S4 `validate-cross-category-imports` + baseline + gate test (invariant 9)
- [x] S5 install test: checkers + unit tests (invariant 8), runner + new-york template; run on 3.8.5 and 4.18.0 (invariants 5, 7)
- [x] S6 wire `registry:build` + `package.json`; docs

## Gate results (R3)
| Gate | Result (real numbers) |
|---|---|
| typecheck | `pnpm tsc --noEmit` exit 0, 0 errors (final, after R4 fixes) |
| lint | 0 errors / **14** warnings = baseline (two runs hit 16 and 18 from my own scripts — fixed, back to 14) |
| meta-deps + registry validators | all exit 0 inside `registry:build`; sync "in sync (64 components)"; cross-category "1183 shipped files clean (1 baselined)"; changelog "64 … (12 in CHANGELOG.md, 52 grandfathered)" |
| doc validators | doc-drift exit 0; doc-budget exit 0 (STATUS 13.9/14.0 KB) |
| registry:build | exit 0; "130 entry file(s) end with their version stamp"; artifact-size 66 audited, 0 high; two consecutive runs byte-identical (`diff -rq` public/r + `cmp` registry.json) |
| build | `pnpm build` exit 0 (pre-fix and final) |
| tests | `NODE_ENV=production pnpm test:run --no-file-parallelism`: **594 passed / 52 files** final (586/52 before the R4 regression tests); repo tier 114/7 |

## Findings table (R4)
Two fresh Sonnet finders (A: code-vs-spec on the scripts; B: code-vs-test + code-vs-doc). 20 reports → 18 rows
(A4 = B1, A5 = B6, A6 ⊇ B4 merged). Each fix that carries a regression test was falsified: fix reverted → test
red → restored → `cmp` byte-identical (changelog anchor, CRLF stamp, comment stripper, stamp check).

| # | Finding | Failure scenario | Verdict | Evidence | Fix + regression test |
|---|---|---|---|---|---|
| A1 | Comment stripper: a `/*` inside a line comment or string swallowed later code | `// glob /*` then a cross-category import → import invisible, gate green | CONFIRMED | `validate-cross-category-imports.mjs` old `stripComments` (regex, `(^\|\s)` anchor) | String-aware single-pass stripper; test "does not let a `/*` … swallow a real import" (falsified) |
| A2 | Side-effect `import "…"` and template-literal `import(\`…\`)` not scanned | cross-category side-effect import never checked | CONFIRMED (require() part DROPPED: no `require(` in registry source, grep) | old SPEC required `["']`, static form required `from` | side-effect + backtick forms; test "reads side-effect imports and template-literal dynamic imports" |
| A3 | `[^;]*?` spanned statements in no-semicolon files; `typeof import()` flagged as dynamic | false rule B / C blocks `registry:build` | CONFIRMED | old static regex; dynamic regex had no `typeof` guard (and a `\1` backreference bug found while fixing) | kind from the statement's own leading keyword; named groups; `typeof` excluded; test "takes the kind from the statement's own keyword…" |
| A4/B1 | Plan doc still described a first-line header | a reader re-implements the header the CLI strips | CONFIRMED | this file D2 + invariants 4/5/8 | D2 rewritten (trailer + evidence); invariants amended |
| A5/B6 | `withStamp` not CRLF-aware → second stamp appended | re-stamping CRLF content leaves two stamps (invariant 4) | CONFIRMED (masked today: clean step runs first) | `stamp-registry-artifacts.mjs` old split on `"\n"` | split on `\r?\n`, keep the file's EOL; test "keeps CRLF endings and replaces a CRLF stamp" (falsified) |
| A6/B4 | `hasEntry` credited an incidental mention and a prerelease | deleting media-editor's line stays green because story-composer's line says "Needs `media-editor` 0.4.0" | CONFIRMED | `validate-changelog.mjs` old any-line match; CHANGELOG.md story-composer line | bullet must OPEN with `` `slug` version``; `-` excluded after the version; empty-state's prose entry grandfathered; tests "does not credit a passing mention…", "…prerelease…" (falsified) |
| A7 | Timeout killed only the `cmd.exe` wrapper | a hung `shadcn add` hangs the runner forever | CONFIRMED (reasoned; Node `shell:true` semantics) | `install-test/run.mjs` old `child.kill()` | `taskkill /T /F` on win32, SIGKILL elsewhere, resolve on timeout regardless |
| A8 | Empty `INSTALL_TEST_CLIS` / `ITEMS` → "0/0 pass", exit 0 | a misconfigured CI step goes green with nothing checked | CONFIRMED | `run.mjs` main | exit 2 on an empty list |
| A9 | Sample never installed a fixtures or feature item | their landing + stamp untested | CONFIRMED (content-compare part DROPPED: the CLI rewrites imports, so installed ≠ served by design; consumer `tsc` is the content check) | `run.mjs` default ITEMS | default sample + `story-rail-fixtures`, `media-editor-capture`; import page derives paths from each entry file |
| A10 | Local server: `startsWith(PUBLIC)` accepts `public2`; directory / bad `%` crash the handler | server dies mid-run → misleading install failures | CONFIRMED (robustness; bound to 127.0.0.1) | `run.mjs` serve() | `PUBLIC + sep`, `isFile()`, try/catch → 400 |
| A11 | A component folder with `meta.ts` but no registry item passed silently | new component ships no version, nothing flags it | CONFIRMED | `sync-registry-versions.mjs` iterated items only | `unregisteredComponents` → sync errors; test "reports a component folder that has no registry item" |
| A12 | `extractField` takes the first 2-space `version:` in the file | a meta.ts with an earlier top-level `version:` outside `meta` | DROPPED | identical extractor already used by `build-component-versions.mjs` since P4 (R4 F-5 there); meta.ts is scaffolded with `meta` first; a mis-read would also mis-render the generated versions doc, which `--check` gates | — |
| B2 | CONTRIBUTING, component guide §11.5, registry skill silent on the gate/stamp/install test | contributor bumps a version, `registry:build` fails with no warning in the docs | CONFIRMED (skill §17 was written in parallel; compat row still said only 4.5.0) | CONTRIBUTING.md PR list; component-guide.md §11.5; skill compatibility-and-versions.md:12 | all three updated |
| B3 | readiness config said "changelog: none" next to the new gate | contradictory instructions to the next loop | CONFIRMED | `.claude/readiness.config.md` docs-map | rewritten |
| B5 | Index-import test passed for the wrong reason ("not shipped" is also rule A) | dropping index resolution stays green | CONFIRMED | `cross-category-imports-gate.test.ts` index case | asserts the basename detail + a new unique-index pass case |
| B7 | README/llms said "Releases are install-tested" without the sample scope | a consumer reads it as whole-catalog proof on 3.8.x | CONFIRMED (doc-scope part; content-compare part DROPPED as A9) | README compat bullet | names the sample; full catalog smoke stated as 4.x |
| B8 | Stamp location omitted feature items | consumer of a feature slice looks in the wrong file | CONFIRMED | README "Which version" | features named |

## Runtime evidence (R5)
Instrument: `node scripts/install-test/run.mjs` (real `pnpm dlx shadcn@<v> add` into a throwaway new-york
src-dir project, `public/` served in-process), plus a 9-file probe item for CLI comment handling.

- **Run 1 (negative, live):** 0/2 CLIs pass. Both CLIs: app-sidebar, post-card and carousel-composer wrote
  NOTHING with exit 0 (155 / 310 "missing" lines) — the seeded, edited `ui/button.tsx` raised an overwrite
  prompt on closed stdin; story-rail and expandable-text installed but **lost the first-line header**.
  Consumer tsc then failed on the unresolved barrels. → two findings about the CLI, not our code.
- **Probe (both CLIs):** every leading comment stripped (line, block, JSDoc, above `"use client"`, before
  re-exports/imports); a trailing comment kept. Closed stdin + one edited file + one deleted file → nothing
  written, deleted file not restored, exit 0. Piped `n` (and `yes n |`) → edited files kept, deleted file restored.
- **Run 2 (header→trailer, answers "n"):** 2/2 pass — 10 items, all files under `src/components/`, every stamp
  present, seeded button keeps its marker (3 prompts answered), consumer tsc 0. Negative: a planted
  `const x: number = "x"` in an installed file → consumer tsc exit 2; restored → 0.
- **Run 3 (after R4 fixes, sample + `story-rail-fixtures` + `media-editor-capture`):** 2/2 pass — 12 items
  incl. a fixtures and a feature item; landing, stamps, `ui/` untouched, tsc 0 on 3.8.5 and 4.18.0.
- Invariants 1–3, 6, 9, 10 observed through the gates above (catalog tests read committed files; two builds
  byte-identical); invariant 6 negative path observed when the strict matcher failed empty-state's prose entry.

## Parked
- Past versions served at `r/<slug>@<version>.json` (R10 optional) — needs an artifact history the build does not keep.
- Versions for the 2 `_shared` support items — no `meta.ts` to source one from.

## Handoff (R7)
