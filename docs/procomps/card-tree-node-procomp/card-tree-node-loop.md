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
- [x] **U7 Ship** — see review file + STATUS row

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

## Pre-mortem (U7)

If this breaks for a consumer, it breaks because: they upgrade without passing `customPredefinedKeys` to the **renderer** (only to `<CardTree>`), so their registered keys stay unclassified on the canvas and — being objects — now render as *subcard outlines* rather than blocks. That is visible rather than silent, and guide §6.1 leads with the rule, but it is the most likely upgrade mistake. Second most likely: a consumer relied on `quote` appearing in the field strip; the escape hatch is `disabledPredefinedKeys: ["quote"]`, documented in §9.
