# Loop state — `card-tree-node` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive API, plus a render-behaviour fix) |
| **Current stage** | U7 — shipped |
| **Sign-off policy** | delegated by user (context: *"go ahead and implement this end to end with consistent test and confirmation"*, 2026-08-17) |
| **Version target** | v0.3.0 → **v0.4.0** |
| **Model roster** | architect: main session · no subagents (diff held by the architect; ~450 lines, under the config's ≲150-line-per-slice orchestration threshold once split, and the change is one coherent classifier refactor) |
| **Started / updated** | 2026-08-17 / 2026-08-17 |

## Stage checklist

- [x] **U0 Intake & impact** — class `minor`; blast radius below; owed follow-ups consulted (fix-on-touch ledger: `card-tree-node v0.3` cohort — this IS that cohort item)
- [x] **U1 Change contract** — invariants delta below; bump target v0.4.0; sign-off delegated
- [x] **U2 Implement** — slices below; reproduction recorded BEFORE the fix (see Reproduction)
- [x] **U3 Gate battery** — real numbers below
- [x] **U4 Adversarial review** — findings table below; no open CONFIRMED
- [x] **U5 Runtime & smoke** — evidence below, negative path included
- [x] **U6 Docs sync & review** — [`reviews/2026-08-17-v0.4.0-spotcheck.md`](reviews/2026-08-17-v0.4.0-spotcheck.md), verdict **Pass with follow-ups**
- [x] **U7 Ship** — commit `bd5f839`; see review file + STATUS row. ⚠️ **The first deploy of this commit FAILED** — see *Post-deploy* below. Live only after `6fd8c1b`.

## Origin

Follow-up **FU-2** from card-tree's v0.6.0 review ([`../card-tree-procomp/reviews/2026-08-17-v0.6.0-spotcheck.md`](../card-tree-procomp/reviews/2026-08-17-v0.6.0-spotcheck.md)), logged as: *"`card-tree-node` renders custom blocks as **nothing** (`isCardLike` rejects arrays and non-`__rc*` objects; `classifyFlatValue` accepts only scalars). Wrong render in a composition the procomp encourages."*

## Reproduction (recorded at U2, BEFORE any fix)

Probe against v0.3.0's `deriveFlatFields` + `enumerateSubcards`, using a card carrying every built-in block, two registered custom blocks, two scalars and one child card:

```
FLAT FIELDS : ["status:string","weight:number","quote:string"]
SUBCARDS    : ["child"]
VANISHED    : ["image","table","codearea","list","body","metric"]
LEAKED->FIELD: ["quote"]
```

**FU-2 understated the defect.** It named the two custom blocks; in fact **four built-in blocks vanished too** (`image`, `table`, `codearea`, `list`), and `quote` — a *string*-valued built-in — leaked into the flat-field strip as an ordinary string, where it could consume one of the three `MAX_FLAT_FIELDS` slots and displace a real field.

Root cause is one thing, not two: the viewer had **no key router**. It asked two independent value-shape questions (*is it a scalar?* / *does this object carry `__rcid` or `ports`?*) and dropped whatever answered no to both. Every block answers no to both.

## Slice plan

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | `lib/classify-node-key.ts` — key router mirroring card-tree's precedence | self | done | mirrors `card-tree/lib/classify-key.ts:35-70`; divergences documented in-file |
| 2 | `lib/derive-blocks.ts` — `deriveBlocks` + `countBlocks` + summariser | self | done | 21 lib assertions |
| 3 | Route `deriveFlatFields` + `enumerateSubcards` through the classifier | self | done | old `isCardLike` deleted; `derive-flat-fields.ts:47` |
| 4 | `parts/block-strip.tsx` + `parts/host-block-boundary.tsx` | self | done | 11 component assertions |
| 5 | `createCardTreeViewerRenderer()` factory + options type | self | done | `cardTreeViewerRenderer` = `createCardTreeViewerRenderer()`, byte-identical behaviour |
| 6 | Barrel, meta, demo, fixture, usage, registry roster, guide | self | done | roster diff script, 0 missing / 0 stale |

## Invariants

| # | Invariant (testable) | Reviewed (U4) | Observed live (U5) |
|---|---|---|---|
| I1 | Every built-in block renders on the node | ✅ | e2e: `table`/`codearea`/`quote` chips visible on production build |
| I2 | A registered custom block renders (array- and object-valued) | ✅ | e2e: `body` chip, `data-block-kind="custom"` |
| I3 | `quote` is a block, not a flat field | ✅ | e2e: `<dl>` terms exclude `quote`; chip present |
| I4 | A block is never rendered as a subcard | ✅ | e2e: response node has exactly 1 subcard (`Metadata`) |
| I5 | Built-ins win over host registrations of the same name | ✅ | component test; **found by test, was broken** (F1) |
| I6 | Overflow past `maxBlocks` is disclosed, not dropped | ✅ | e2e: `+1` chip on the response node |
| I7 | Node and dialog agree on what is a block | ✅ | e2e: dialog renders `body` content after open |
| I8 | **No-blocks card ⇒ v0.3.0 behaviour exactly** | ✅ | lib + component regression tests |
| I-neg | Host `render()` that throws (sync **and** during render) degrades to the chip, never blanks the canvas | ✅ | 2 component tests with a throwing renderer; node survives |

**Falsification (the tests were watched failing).** Neutralising the `"block"` branch of `classifyNodeKey` turned **10 lib · 10 component · 5 e2e** assertions red; restoring returned all to green. A suite that has never failed proves nothing.

## Blast radius

| Surface | Why touched | Synced (U6) |
|---|---|---|
| `meta.ts` | version 0.3.0 → 0.4.0, features, context, budget 65 → 95 KB | ✅ |
| `index.ts` | v0.4 barrel block — new value + type exports | ✅ (card-tree's v0.6.0 barrel gap was the precedent) |
| `types.ts` | `BlockKind`, `NodeBlock`, `CardTreeViewerOptions` | ✅ |
| `registry.json` | **4 new files** in `files[]` | ✅ roster diff clean |
| `dummy-data.ts` + `demo.tsx` | demo must MOUNT the feature — a demo that didn't is half of why FU-2 shipped | ✅ |
| `usage.tsx` + procomp guide §6/§6.1/§9/§10.3 | new API + migration + F-rev-3 resolution | ✅ |
| Dependents | none — `rich-card-in-flow` is a 0-file deprecated alias | ✅ verified from `registry.json` |
| Feature slices (`meta.featureOf`) | none target this base | ✅ |
| STATUS.md, component-versions, llms/README catalog | version bump | ✅ (generated) |

## Gate battery (U3 — real numbers)

| Gate | Result |
|---|---|
| tsc | exit 0 |
| lint | 0 errors, **14** warnings (exactly the known baseline — no 15th) |
| meta-deps | 64 slugs, 64 clean, 0 findings |
| registry validators | naming 0 · registry-json 0 high / 6 pre-existing warn · whitelist clean |
| doc validators | doc-drift ✅ (llms/README/component-versions current) · doc-budget ✅ |
| registry:build | exit 0 · artifact-size 66 artifacts, 0 high |
| build | Next production build compiled successfully |
| tests | **89 passed / 14 files** (from 56 / 12) |
| e2e | **12 passed** (5 card-tree + 7 new card-tree-node), production build |
| artifact | 77.66 KB / 95 KB budget (18.3% headroom) |

## Findings table (U4)

| # | Finding (failure scenario) | Source | Verdict | Evidence / refutation | Fix |
|---|---|---|---|---|---|
| F1 | A host registering the name `table` captured the **built-in** block and routed it through its own `render()`. `deriveBlocks` derived `kind` from the registration list, so any collision won. card-tree drops such collisions at mount, so the two components disagreed. | own component test | **CONFIRMED** | test *"never routes a BUILT-IN block through host render"* failed on first run | `deriveBlocks` checks `PREDEFINED_KEYS` first; classifier returns early for built-ins |
| F2 | Disabled object-valued built-in classified as `child`, diverging from card-tree (which returns `field` without inspecting the value). | self-check vs `card-tree/lib/classify-key.ts` | **CONFIRMED** | card-tree returns `"field"` immediately at `classify-key.ts:46` | mirrored exactly; documented that this means an opted-out object built-in renders as nothing, same as card-tree |
| F3 | `maxBlocks` silently dropped surplus blocks — reproducing FU-2's own failure mode in miniature. | e2e run (demo's 4th block invisible) | **CONFIRMED** | `body` absent from the production DOM | `countBlocks` + `+N` overflow chip; demo fixture ordered so the path is exercised live |
| F4 | Artifact 77.73 KB against a 65 KB budget — **0.27 KB** below the `×1.2` fail line. Next touch breaks the gate. | gate battery | **CONFIRMED** | `validate:artifact-size` output | duplicate chip JSX factored into `<Chip>`; budget raised to 95 KB with rationale in `meta.ts` |
| F5 | `enumerateSubcards` widening — a plain object child with no `__rcid` now renders where it rendered nothing before. | self-check | **CONFIRMED, intended** | card-tree treats it as a child card, so the dialog already showed it; the node was the one lying | kept; documented in guide §9 + §10.3 |
| F6 | `find-port-target.ts` keeps its own `isCardLike` copy, so the port editor and the viewer now disagree about a block whose payload carries `ports`. | self-check | **CONFIRMED, deferred** | `lib/find-port-target.ts:149` | NOT fixed — see FU-A. Threading options through the port-editor API is a separate change with its own runtime-proof burden; a speculative guard here would be unverified |
| F7 | Cross-procomp **value** import (`PREDEFINED_KEYS`) — previously only types crossed from card-tree. | self-check | **DROPPED** | `parts/card-tree-viewer.tsx:9` already value-imports `PortsAt` from flow-canvas; smoke confirms the relative path translates verbatim and the consumer compiles | none needed |

## Runtime & smoke evidence (U5)

- **Docs site (production build, `next start` — never the dev server):** 7 new Playwright specs on `/components/card-tree-node`, all green; zero console/page errors. Block chips, kinds, summaries, `+1` overflow, host-rendered `body`, subcard count, and the node↔dialog agreement all asserted **on structure** (`[data-block-key]` / `[data-block-kind]` / `role="group"`), never page-wide text — the sibling card-tree spec records why.
- **Install:** local-served `public/r/` (pre-deploy pattern), real `npx shadcn@latest add @ilinxa/card-tree-node` → 18 files, all 4 new ones present, **no `__tests__` / demo / usage / meta leakage**. Fixtures item installed too.
- **Consumer tsc: 0 errors**, with a probe importing **every** new public symbol from the package root (`createCardTreeViewerRenderer`, `BlockStrip`, `HostBlockBoundary`, `BlockKind`, `NodeBlock`, `CardTreeViewerOptions`, plus the previously-unreachable `FlatField` / `FlatFieldType`). This is the check that caught card-tree's barrel gap, which no producer-side gate could see.
- **Negative paths:** throwing host renderer (sync + render-time) degrades to the chip with the node intact; registration without `render` degrades; card with no blocks renders no strip at all.

## Parked

- **FU-A** — `find-port-target.ts` still uses the retired `isCardLike` heuristic (F6). Owner: card-tree-node, target v0.4.x.
- Built-in blocks are chips only; no consumer has asked for a real mini-table/thumbnail at node zoom. Revisit if one does.
- `maxSubcards` / `maxFlatFields` overflow has no `+N` affordance — only blocks do. Cosmetic asymmetry, pre-existing for fields.

## Post-deploy (U7) — the first deploy failed

`bd5f839` was pushed with every local gate green. **The Vercel deploy then failed and the artifact
stayed at 14 files.** `vercel-build` runs `pnpm test:run` first; Vercel exports
`NODE_ENV=production`; Vitest only defaults `NODE_ENV` to `test` when it is UNSET; React's
production entry ships no `act()`. Every `@testing-library/react` render threw
`TypeError: React.act is not a function` — **24 component tests red, 65 lib tests green**, which
made it read as a partial failure rather than an environmental one.

Fixed in `6fd8c1b` (one line in `vitest.config.ts`, assigning `NODE_ENV` before Vite resolves the
config). v0.4.0 reached production on that deploy.

**Root cause of the miss, in this loop:** U3 ran gate 8 as `pnpm test:run`, which is implicitly
`NODE_ENV=test` locally. `vercel-build` runs the same command in a different environment. The
suite was verified; the *gate* was not. `readiness.config.md` gate 8 now specifies
`NODE_ENV=production pnpm test:run`, and the flake is documented in known-flakes.

**Verified after the fix, independently of the fixing commit's own claims:**

| Check | Result |
|---|---|
| `NODE_ENV=production pnpm test:run` | 89 passed / 14 files |
| Same, with the one-line fix removed | **24 failed / 65 passed**, `React.act is not a function` — claim confirmed |
| Live artifact `https://ui.ilinxa.com/r/card-tree-node.json` | 18 files; `classify-node-key`, `derive-blocks`, `block-strip`, `host-block-boundary` all present |
| E2E against **production** (`E2E_BASE_URL=https://ui.ilinxa.com`) | **7/7 green** |

## Pre-mortem (U7)

If this breaks for a consumer, it breaks because: they upgrade without passing `customPredefinedKeys` to the **renderer** (only to `<CardTree>`), so their registered keys stay unclassified on the canvas and — being objects — now render as *subcard outlines* rather than blocks. That is visible rather than silent, and guide §6.1 leads with the rule, but it is the most likely upgrade mistake. Second most likely: a consumer relied on `quote` appearing in the field strip; the escape hatch is `disabledPredefinedKeys: ["quote"]`, documented in §9.

---

# Run 2 — v0.5.0 (U-loop, FU-A)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive API + a walker-behaviour correction) |
| **Current stage** | U7 — shipped |
| **Sign-off policy** | delegated by user (context: *"lets start and close these items end to end consistently and accurately"*, 2026-08-17, naming FU-A as one of three items) |
| **Version target** | v0.4.0 → **v0.5.0** |
| **Model roster** | architect: main session · no subagents (session constraint: agent spawning not requested this run — see U4 for the compensating measure) |
| **Started / updated** | 2026-08-17 / 2026-08-17 |

## Stage checklist

- [x] **U0 Intake & impact** — class `minor`; blast radius below; owed follow-ups consulted (this IS the last open `card-tree-node` cohort item)
- [x] **U1 Change contract** — invariants delta below; bump target v0.5.0; sign-off delegated
- [x] **U2 Implement** — reproduction recorded BEFORE the fix and **watched failing** (7 failed / 5 passed)
- [x] **U3 Gate battery** — real numbers below
- [x] **U4 Adversarial review** — findings table below; no open CONFIRMED
- [x] **U5 Runtime & smoke** — 16/16 e2e, consumer install + tsc 0, negative path included
- [x] **U6 Docs sync & review** — guide §7.7 + §10.3; [`reviews/2026-08-17-v0.5.0-spotcheck.md`](reviews/2026-08-17-v0.5.0-spotcheck.md), verdict **Pass**
- [x] **U7 Ship** — see review file + STATUS row

## Origin

Follow-up **FU-A** from the v0.4.0 review: *"`find-port-target.ts` still uses the retired
`isCardLike` heuristic (F6). Owner: card-tree-node, target v0.4.x."* v0.4.0 deferred it on the
grounds that fixing it needed `customKeyNames` threaded through the port-editor API, "a separate
change with its own runtime-proof burden". That is exactly what this run does.

## Reproduction (recorded at U2, BEFORE any fix)

`__tests__/find-port-target.test.ts` was written against the intended behaviour and run against
the unfixed walker:

```
Tests  7 failed | 5 passed (12)

x resolves a card nested under a parent the old heuristic could not see
x writes through that parent without disturbing its siblings
x refuses a registered custom block whose payload carries __rcid + ports
x refuses a built-in block whose payload carries __rcid + ports
x defaults to zero registrations when options are omitted
x resolves nothing the viewer classifies as a block
x follows card-tree's opt-out semantics for a disabled built-in
```

The 5 passing rows are the no-regression anchors (root target, depth-1 `__rcid` child, null
paths) — they prove the file was not merely broken.

**Reachability, stated honestly.** Neither direction is reachable through the demo's click flow:
the viewer only makes depth-1 subcards clickable, and only when they carry `__rcid` — precisely
the cases both walkers already agreed on. The defect bites consumers who compute `subPath` any
other way (tree outline, `CardTreeHandle.focusCard`, deep link). That is *why* it survived two
minors, and why the regression guard has to be the test tier rather than the demo.

## Blast radius

| Surface | Status |
|---|---|
| Dependents (`registry.json` regDeps) | `card-tree-node-fixtures`, `rich-card-in-flow` (alias) — both resolved at U5 |
| Cross-procomp importers in `src/registry/` | none import `find-port-target`; flow-canvas is a *dependency*, not a dependent |
| Feature slices (`meta.featureOf`) | none for this base |
| Interop contracts | none (`ports[]` shape untouched) |
| Docs surfaces | guide §7.1 / §7.7 / §10.3 · `usage.tsx` · `demo.tsx` · meta features · STATUS row · component-versions |
| `registry.json` roster | unchanged — no shipped file added or removed (the new test lives in `__tests__/`, which is not shipped) |

## Invariants delta

**Must still hold (regression targets):** root target resolves with `subPath === undefined` ·
depth-1 `__rcid` child resolves · unknown node id / unmatched subPath → `null` (empty state, no
crash, F-05) · `updateIn` is pure · v0.4 call sites compile unchanged.

**New:** the walker and the viewer classify keys identically · a block payload is never a port
target · a child under an `__rcid`-less parent is reachable · omitted options === no registrations.

## Gate battery (U3)

| Gate | Result |
|---|---|
| tsc | 0 errors |
| lint | 0 errors · 14 warnings (documented baseline) |
| meta-deps | 64/64 clean |
| registry validators | whitelist ok · registry-json 0 high / 6 warn · naming 0 |
| doc validators | pass (incl. component-versions `--check`) |
| registry:build | pass · artifact-size 66 artifacts, 0 high |
| build | pass, 77 static pages |
| **tests (`NODE_ENV=production`)** | **102 passed / 15 files** (was 89/14) |
| e2e | **16 passed** (was 12) |

## Findings (U4 — architect adversarial pass)

| # | Finding | Verdict |
|---|---|---|
| F-1 | `RESERVED_KEYS` is only the three real `__rc*` keys, but the retired heuristic skipped **any** `__rc`-prefixed key. `__rcfoo: {...}` is now a walkable child where it used to be skipped. | **CONFIRMED — accepted.** `enumerateSubcards` already took this widening at v0.4.0, so the walker now *agrees* with the viewer; diverging again would reintroduce FU-A. Pinned by a test and documented in guide §10.3 so it is met as a decision, not a surprise. |
| F-2 | The change is **not purely additive**: with default options, a built-in block payload carrying `__rcid` stops being a valid port target. | **CONFIRMED — accepted, documented.** That case is the bug (a port write landing inside an opaque block payload). Shape is pathological — `<CardTree>` attaches `__rcid` to cards, never to block payloads. Called out explicitly in guide §7.7 rather than filed under "additive". |
| F-3 | `findCardPath` recurses with no depth cap or visited set; the wider predicate can follow more paths, so cyclic `data` would hang. | **DROPPED — pre-existing and out of reach.** The old heuristic followed cycles too. `node.data` is JSON-sourced by contract (`CardTreeJsonNode`). Not introduced here; noted, not fixed. |
| F-4 | The `keyOptions` memo allocates a new object when `customPredefinedKeys` is an inline literal, re-running the walk each render. | **CONFIRMED — mitigated, not a defect.** No state is set, so there is no loop (unlike card-tree v0.6.0's). Module-scope constants keep the default path stable; "pass a stable reference" is documented on the prop and in §7.7. |
| F-5 | The demo passed `customPredefinedKeys` to `<CardTree>` but not to `<PortEditorStrip>` — with a comment three lines above stating the exact principle it was violating. | **CONFIRMED — fixed.** `demo.tsx` now passes it; `usage.tsx` + guide §7.1 updated. |

**U4 method note.** The rigor ladder asks for 1 fresh finder subagent on a minor. Subagents were
not spawned this run (session constraint). Compensating measure: each hypothesis above was written
as a falsification attempt and checked against source or a run — F-1 by reading `RESERVED_KEYS`,
F-3 by re-reading the pre-change walker, F-5 by reading the demo. F-1 and F-5 were both found this
way and both produced changes. Recorded so the review's provenance is not overstated.

## Runtime & smoke (U5)

| Check | Result |
|---|---|
| Production build + `next start` | docs site 200 · `/components/card-tree-node` 200 |
| E2E, full suite | **16/16** — incl. 4 new `card-tree-node-port-editor.spec.ts` specs (root target resolves, subcard re-target, add-port flow, dark theme) |
| Consumer install (real CLI, local artifacts) | `card-tree-node` · `card-tree-node-fixtures` · `card-tree` — all exit 0 |
| Consumer `tsc --noEmit` | **0 errors** |
| Consumer probe naming the new props | compiles; `PortEditorStripProps["customPredefinedKeys"]` accepts `readonly CustomPredefinedKey[]` from `@ilinxa/card-tree` |
| Back-compat | a v0.4-shaped call site (`nodeId`/`canvas`/`onChange` only) typechecks |

**Harness incident (not a product defect).** The first consumer `tsc` reported 26 errors, all in
`src/components/event-calendar`. Cause: 7 orphan files from the *pre-P3-split* event-calendar
(`parts/calendar-context-menu.tsx`, `...-edit-affordances`, `...-edit-overlays`,
`...-quick-composer`, `hooks/use-calendar-edit.ts`, `lib/edit-mutations.ts`,
`lib/edit-permissions.ts`) left on disk by an older install. Proven by diffing the consumer tree
against every `target` in `registry.json`: no item ships those paths today — their live
counterparts are at `features/editing/*`, and the editing feature was never installed there.
Removing the 7 orphans took the consumer to **0 errors**, which is also the mandatory
base-without-feature negative path. Worth remembering: `shadcn add` never deletes files an item
stopped shipping, so any consumer upgrading across a feature-slicing split keeps dead files that
typecheck against the old base.

## Post-deploy (U7)

See the shared decision file
[`2026-08-17-fu-a-barrel-sweep-harness.md`](../../../.claude/decisions/2026-08-17-fu-a-barrel-sweep-harness.md).
