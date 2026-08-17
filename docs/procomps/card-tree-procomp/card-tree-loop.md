# Loop state — `card-tree` (U-loop)

<!-- This file IS the state machine: a fresh session resumes from the first unchecked gate.
     Update the Status header at EVERY stage transition (P4 retro F-8). -->

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive API; breaking-class review rigor adopted, see U0.1) |
| **Current stage** | **CLOSED** — shipped `cefad57`, deployed + post-deploy verified, retro appended |
| **Sign-off policy** | **delegated by user** (context: *"if all are valid start it accurately and fix all"*, 2026-08-17) — scope question at U1.4 answered interactively |
| **Version target** | v0.5.0 → **v0.6.0** |
| **Model roster** | architect: main session · implementers: Sonnet 5 · finders: Sonnet 5 (×2) |
| **Started / updated** | 2026-08-17 / 2026-08-17 |

**Trigger:** external consumer report *"Custom Keys Are Inert"* — filed from JSON CMS (`simple-cms`)
against `card-tree` 0.5.0. 1 blocking + 3 supporting findings, all verified against source before
intake (see U0.3). Two further findings (F5, F6) were found during U0 and are not in the report.

## Stage checklist

- [x] **U0 Intake & impact** — class + blast radius recorded; report claims verified line-by-line
- [x] **U1 Change contract** — planning-doc delta + invariants + bump target · **sign-off:** delegated by user 2026-08-17; U1.4 answered **defer the test runner** (I2 proven live at U5 instead; runner = separate feature-readiness loop)
- [x] **U2 Implement** — slices below all ticked with spot-check evidence
- [x] **U3 Gate battery** — real numbers below
- [x] **U4 Adversarial review** — 2 fresh finders + dependents axis; no open CONFIRMED
- [x] **U5 Runtime & smoke** — reproduction replayed; slug + `card-tree-node` installed
- [x] **U6 Docs sync & GATE 3** — [reviews/2026-08-17-v0.6.0-spotcheck.md](reviews/2026-08-17-v0.6.0-spotcheck.md) · verdict **Pass with follow-ups**
- [x] **U7 Ship** — commit `cefad57` (27 files) · pushed to master · **post-deploy verified live** on ui.ilinxa.com (53 files, both new files, permissions widening, signature memo, v0.3 barrel block) · retro in `.claude/improvement-log.md`

---

## U0.1 — Change classification

`customPredefinedKeys` is **already a declared public prop** (`types.ts:422`, shipped since 0.3),
so wiring it adds no new prop and removes nothing → **minor**, target **0.6.0**.

Two aspects argue upward, and the ladder says take the higher one when in doubt:

- `CardTreePredefinedEntry` (exported from `lib/parse.ts`) gains a `custom` variant. A consumer
  doing an exhaustive `switch` with a `never` check would stop compiling. Mitigating: the type is
  **not** re-exported from `index.ts` (see F5), so no consumer can reach it through the public
  barrel today.
- `classifyKey` changes parse semantics, and `card-tree-node` composes `card-tree`.

**Resolution:** classify **minor** (version-wise nothing changes — 0.5.0 → 0.6.0 either way), but
adopt the **breaking-class review rigor**: 2 fresh finders + explicit dependents axis at U4, and
`card-tree-node` installed at U5. Cheap insurance; the ladder's version outcome is identical.

## U0.2 — Owed follow-ups consulted (fix-on-touch ledger)

| Owed item | Overlaps this touch? | Decision |
|---|---|---|
| F-cross-15 static-import-vs-lazy | No — no new heavy dep; custom renderers are host-supplied | Not taken (recorded) |
| `--radix-popover-trigger-width` residual audit | **Yes** — `parts/predefined-add-menu.tsx` is popover-bearing and is edited by slice 4 | **Take it** — audit + dual-var while the file is open |
| card-tree-node v0.3 cohort | Adjacent (dependent), not this slug | Not taken; U4 covers regression only |
| Test runner (informed defer — trigger: *first pure-lib bug; first test = card-tree parse→serialize fixed-point*) | **Trigger tripped by this exact bug** | **Sign-off question — see U1.4** |

## U0.3 — Report verification (done before intake; all citations exact)

| Ref | Claim | Verified at | Verdict |
|---|---|---|---|
| F1 | Prop declared, destructured, forwarded to `useSearch` only | `types.ts:422` · `card-tree.tsx:175`,`:255` | **CONFIRMED** |
| F1 | Only reader is an unreachable `default:` branch | `lib/search.ts:148` | **CONFIRMED** |
| F1 | `classifyKey` knows only the 5 built-ins, takes no custom arg | `lib/classify-key.ts:20` | **CONFIRMED** |
| F1 | No renderer / add-menu entry exists | `parts/` — zero `custom` hits; `predefined-add-menu.tsx:49` maps `PREDEFINED_KEYS` | **CONFIRMED** |
| F1 | Dead-code marker already in source | `card-tree.tsx:1354` | **CONFIRMED** |
| F2 | Guide §7.1 + `types.ts` header present it as shipped | guide L275–303 · `types.ts:5-8` | **CONFIRMED (understated — see F6)** |
| F3 | `searchableText` comment contradicts `search.ts` | `types.ts:260` vs `search.ts:148` | **CONFIRMED (mis-framed — see U1.2 I5)** |
| F4 | Arrays rejected at `child`; classification decides first | `lib/parse.ts:325` · `classify-key.ts` order | **CONFIRMED** |

**Stronger proof than the report's** (use this in the review file): `ParseOptions`
(`lib/parse.ts:58`) carries only `disabledPredefinedKeys` + `dateDetection`. There is **no channel**
by which `parse` could learn a custom key exists — structural, not inferential.

### Findings added at U0 (not in the consumer report)

| # | Finding | Evidence | Severity |
|---|---|---|---|
| **F5** | **The public barrel skipped all of v0.3.** `index.ts` has blocks for v0.1 types, v0.2 events and v0.4 validators — and *no v0.3 block*. **20 of `types.ts`'s 47 exports are unreachable** from the package root: `CustomPredefinedKey`, `CustomKeyContext`, `MetaRenderer`, `MetaRendererContext`, `CardTreePermissions`, `PermissionRule`, `PermissionDenialReason`, `EffectivePermissions`, `DndScopes`, `SearchOptions`, `SearchMatch`, `SearchMatchType`, `SearchResult`, `AuditTrailConfig`, `ReservedKey`, `CardMovedEvent`, `CardDuplicatedEvent`, `MetaChangedEvent`, `MetaAddedEvent`, `MetaRemovedEvent`. Two guide examples therefore do not compile for a consumer: §7.1 L280 (`CustomPredefinedKey`) and L475 (`MetaRenderer`). Same root defect as F1 — v0.3 landed in `types.ts` and was never connected. | `index.ts` (48 lines) vs `types.ts` (47 exports); guide L280, L475 | 🚫 **Blocker** |
| **F6** | The drift is **4 surfaces, not 2**: guide §7.1 · `types.ts:5-8` header · `plan-v0.4.md:17` ("v0.3 shipped: … custom predefined-keys") · and the feature was fully specced in `plan-v0.3.md §9`, incl. the two behaviours the report says exist nowhere (collision `console.error` at L846; validator try/catch + fallback at L881). The guide is **faithful to the signed-off GATE 2 plan**; the implementation is what diverged. | plan-v0.3 §9/L846/L881 · plan-v0.4 L17 | 🔸 Medium (docs) |
| **F7** | Root cause of "nothing caught it": **no demo/usage coverage**. `grep customPredefinedKeys demo.tsx usage.tsx` → zero. A destructured-and-forwarded prop typechecks, lints, and passes `validate:meta-deps` forever. No gate in the battery can see an inert prop. | `demo.tsx`, `usage.tsx` | ⚠️ High (process) |
| **F8** | `lib/search.ts` carries its own dead `void ({} as PredefinedKey)` after an unreachable `return`, mirroring `card-tree.tsx:1354`. Two instances = a pattern of lint-suppression used to keep a half-wired feature compiling. | `search.ts` (post-`switch`) | 🔹 Low |

## U0.4 — Blast radius

| Surface | Why touched | Synced (U6) |
|---|---|---|
| `lib/classify-key.ts` | new `"custom"` classification + registered-key arg | ✅ |
| `lib/parse.ts` | `ParseOptions.customKeys`; `CardTreePredefinedEntry` custom variant; validate-through | ✅ |
| `lib/serialize.ts` | write custom values back **verbatim** (round-trip contract) | ✅ |
| `parts/predefined-custom.tsx` (new) | render/edit + documented JSON-textarea fallback | ✅ |
| `parts/predefined-add-menu.tsx` | offer custom keys from `defaultValue`/`description`/`icon`/`category`; **+ popover dual-var audit** | ✅ |
| `parts/card.tsx` (+ predefined-edit) | mount the custom part | ✅ |
| `card-tree.tsx` | thread `customPredefinedKeys` → parse/reducer/render; drop the dead `void` block | ✅ |
| `types.ts` | header truth; `searchableText` comment; collision-policy doc | ✅ |
| `index.ts` | **export `CustomPredefinedKey` + `CustomKeyContext`** (F5) | ✅ |
| `demo.tsx` / `usage.tsx` | first-ever custom-key coverage (F7) — the regression surface | ✅ |
| `meta.ts` | 0.5.0 → 0.6.0 | ✅ |
| **Dependents** | | |
| `card-tree-fixtures` | regDep `@ilinxa/card-tree` | ✅ |
| `card-tree-node` (+ `-fixtures`) | regDep + `import type { CardTreeJsonNode } from "../card-tree/types"`; its `enumerateSubcards` heuristic will still treat an object-valued custom key as a subcard — **divergence to document, not fix** (it accepts no `customPredefinedKeys`) | ✅ |
| `rich-card` / `rich-card-in-flow` | deprecated aliases → base | ✅ |
| `kanban-board` | `demo.tsx` imports `CardTree` (demo only, not shipped) | ✅ |
| **Feature slices** | none (`meta.featureOf` → no items point at `card-tree`) | n/a |
| `registry.json` | roster diff — slice 4 **adds a file** (`parts/predefined-custom.tsx`) | ✅ |
| Guide §7.1 · plan-v0.3 §9 · plan-v0.4 L17 · STATUS row · component-versions · llms/README | doc truth (F6) | ✅ |

---

## U1 — Change contract *(draft — awaiting sign-off)*

### U1.1 What ships in 0.6.0

The report's five asks, plus F5/F7 which it could not see:

1. **`classifyKey` learns the registered keys** and checks them **before** the array/object/scalar
   branches → returns `"custom"`. Closes F1 **and** F4 in one change without reopening Q-P4 for
   ordinary children.
2. **`CardTreePredefinedEntry` gains a `custom` variant**; parse validates through the key's own
   `validate`, try/catch per plan-v0.3 L881 (throw → entry dropped + warned).
3. **`serialize` writes the value back verbatim** — a custom block's shape is the integrator's
   contract, not card-tree's.
4. **`parts/predefined-custom.tsx`** calls `render`/`edit`, with the documented JSON-textarea
   fallback when `edit` is omitted; **add-menu** fed from `defaultValue`/`description`/`icon`/`category`.
5. **Collision policy** per plan-v0.3 L846: a custom key colliding with a built-in or reserved key
   is rejected with `console.error` at mount and dropped.
6. **F5:** export `CustomPredefinedKey` + `CustomKeyContext` from `index.ts`.
7. **F7:** demo + usage coverage for a custom key — including an **array-valued** one (the F4 case).
8. **Docs:** guide §7.1 marked shipped-in-0.6.0 with the precedence rule; `types.ts` header; the
   `searchableText` comment (F3); plan-v0.4 L17 history line corrected (F6); dead `void` blocks removed (F8).

### U1.2 Invariants delta

| # | Invariant (testable) | Kind |
|---|---|---|
| I1 | Registered object-valued key → classified `custom` → `render` called; **not** a nested card | new |
| I2 | Registered **array**-valued key survives `parse → serialize` **byte-identically** (the F4 case; the named first-test) | new |
| I3 | `validate` returning `{ok:false}` → entry dropped + inline error; validator **throwing** → dropped + warned, tree still renders | new |
| I4 | Custom key colliding with a built-in / `__rc*` reserved key → `console.error`, dropped, built-in wins | new |
| I5 | `searchableText` supplied → custom block is searchable; omitted → skipped, no throw. *(Note: Q-P15 deferred custom-key search to v0.4; `search.ts` shipped it early. At 0.6.0 the code is right and the **comment** is the drift — resolve toward the code, not the comment.)* | regression |
| I6 | **No `customPredefinedKeys` passed → behavior byte-identical to 0.5.0** (the whole existing catalog) | regression |
| I7 | Ordinary (non-registered) array at a child position still errors per Q-P4 — unchanged | regression |
| I8 | `card-tree-node` compiles and renders unchanged against 0.6.0 | dependent |
| I-neg | A registered key whose `render` **throws** degrades gracefully (generic JSON fallback), does not blank the tree | negative |

### U1.3 Reproduction of record (write before fixing — U5 replays it)

```jsonc
// input: a registered custom key "body" whose value is an array (Plate Value shape)
{ "title": "Post", "body": [{ "type": "p", "children": [{ "text": "hi" }] }] }
```
**0.5.0 (broken):** `classifyKey("body", [...])` → `"child"` → `parse.ts:325` errors
"arrays not supported at child positions"; nothing renders; no warning about the registration.
**0.6.0 (expected):** → `"custom"` → `validate` → `render`; `serialize` returns the array unchanged
(I2 byte-identical).

### U1.4 Open sign-off question

The test-runner defer's trigger is **exactly this bug**, and its named first test is **exactly I2**
(STATUS.md: *"test runner (trigger: first pure-lib bug; first test = card-tree parse→serialize
fixed-point)"*). Standing up Vitest is non-component tooling, so it is a `feature-readiness-loop`
job, not this U-loop. See the question posed to the user at U1 sign-off.

---

## Slice plan (U2)

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | **Core pipeline** — `lib/classify-key.ts` (`"custom"` before value-shape branches), `lib/custom-keys.ts` (NEW — collision/dupe rejection + diagnostics), `lib/parse.ts` (`CardTreeCustomEntry` + `isCustomEntry` + `ParseOptions.customKeys` + validate-through in try/catch), `lib/search.ts` (guard-first narrowing, dead `void` removed), `lib/validate-edit.ts` (custom names unavailable as field/card names) | architect | **done** | `classify-key.ts:47` custom branch precedes scalar/object; `parse.ts:~330` `case "custom"`; `custom-keys.ts:38` `resolveCustomKeys` |
| 2 | **Render/edit parts** — `parts/predefined-custom.tsx` (NEW), `card.tsx`, `predefined-edit.tsx`, `predefined-add-menu.tsx` | implementer (Sonnet 5) | in flight | — |
| 3 | **Threading** — `card-tree.tsx`: resolve-once memo + loud diagnostics effect, 4 `parseInput` sites, 4 validator sites, `CardConfig.customKeys`, `useSearch` fed resolved list, dead `void` block + 4 orphaned imports removed | architect | **done** | `card-tree.tsx:202` memo · `:207` console.error effect · `:219,~560,~980,~1046` parse sites · `:447,483,602,778,780,782` validators · `:874` config |
| 4 | **Demo/usage + doc truth** — `demo.tsx`, `usage.tsx`, guide §7.1, plan-v0.3 §9 note, plan-v0.4 L17 | implementer (Sonnet 5) | in flight | — |
| 5 | **Version + roster** — `meta.ts` 0.5.0 → 0.6.0 + feature/context copy; `registry.json` + 2 files | architect | **done** | `meta.ts:45`; roster diff **0 missing / 0 orphaned** (57 on disk = 53 roster + 4 never-shipped) |

**serialize.ts needed no change** — `treeToJsonNode` already writes `out[entry.key] = entry.value` verbatim, so the report's ask #3 (round-trip fidelity) was satisfied by the existing implementation the moment the entry reaches `predefined[]`. Recorded because it is a *claim the review must not take on faith*: I2 still has to be proven live at U5.

## Gate battery (U3 — real numbers)

| Gate | Result |
|---|---|
| tsc | **exit 0**, 0 errors |
| lint | **0 errors**, 14 warnings. Card-tree contributes **0**. Baseline drift finding: config documents 9 known warnings; 5 more come from `scripts/build-component-versions.mjs:280,282` (unused vars) — that file is **unmodified this run** (`git status --porcelain scripts/` empty), so the warnings pre-date it and the documented baseline is stale. Recorded, not caused here. |
| meta-deps | **exit 0** — "Audited 64 slugs — 64 clean, 0 with findings" (incl. reverse-npm) |
| registry validators | whitelist **exit 0** (25 types clean) · registry-json **exit 0** (64 base + 2 feature + 52 aliases, 0 high · 6 warn) · naming **exit 0** (64 checked, 0 findings) |
| doc validators | doc-drift **exit 0** — llms.txt ✓ · README ✓ · `component-versions` current (regenerated by `registry:build`, clearing the expected stale-version failure) · doc-budget **exit 0** |
| registry:build | **exit 0** — all artifacts regenerated; `validate:artifact-size` 66 artifacts, 0 high |
| build | **exit 0** — Next production build, all routes compiled |

**Artifact size watch:** `card-tree` built to **301.10 KB against a 320 KB budget — only 5.9% headroom**, the tightest in the catalog. Two files were added this run. Not a blocker; flagged as a follow-up (owner: next card-tree touch) because the next feature slice plausibly breaches it.

## Findings table (U4)

2 fresh finders (pipeline axis · dependents/distribution axis) + 1 coordinator finding. **15 raised, 13 CONFIRMED, 1 severity-refuted, 1 informational.**

| # | Finding (failure scenario) | Source | Verdict | Evidence / refutation | Fix |
|---|---|---|---|---|---|
| **C1** | 🚫 **Crash on first use.** `predefinedAdd`/`predefinedEdit` routed custom entries into `validatePredefinedShape`, whose switch is exhaustive over the 5 built-ins with no `default` → returns `undefined` → caller reads `.ok` → `TypeError`. Adding or editing ANY custom block throws. | coordinator (from implementer's Parked list) | **CONFIRMED** | `validate-edit.ts:313-317` no default; `card-tree.tsx` old `if (!shape.ok)` | `validateEntryShape` helper routes custom → host `validate`, try/catch (`card-tree.tsx:293-307`) |
| **P2** | 🚫 **Unbounded render loop.** `customKeys` memo keyed on array identity; the documented inline-literal usage makes a new array each render → `useSearch`'s `result` memo recomputes (its early-return branch allocates too, so this fires even with search inactive) → `enrichedResult` new → `onSearchResults` effect fires every render → host `setState` → loop. | finder 1 | **CONFIRMED** | `use-search.ts:24-46,91-96`; trigger is the shipped `usage.tsx` snippet itself | Memo keyed on a name **signature**, not array identity — valid because registration is mount-only by contract (`card-tree.tsx:201-220`) |
| **D1** | 🚫 **Flagship snippet doesn't compile for a consumer.** New `usage.tsx` custom-keys example imported `@/registry/components/data/card-tree` (repo-internal) while line 23 of the same file uses `@/components/card-tree` (installed path). | finder 2 | **CONFIRMED** | `usage.tsx:98` vs `:23`; house majority 76:55 favors consumer path | `usage.tsx:98` → `@/components/card-tree` |
| **D2** | ⚠️ Guide showed the same non-resolving path at 5 sites — pre-existing, and the guide is exactly what the reporting consumer read. Barrel fix (F5) made the *type* resolve; the *path* still didn't. | finder 2 | **CONFIRMED** | guide L49,109,289,498,1111 | all 5 rewritten to `@/components/card-tree`; catalog-wide (~50 more sites) → Parked |
| **P3** | ⚠️ `console.error` diagnostics effect keyed on object identity → re-fires every render with an unstable prop, not once at mount as its comment promises. Worse UX than the silence it replaced. | finder 1 | **CONFIRMED** | `card-tree.tsx` effect deps | Fixed by P2's signature memo |
| **P4** | ⚠️ `registration.icon` rendered raw with **no containment** — the only host channel unguarded. A throwing icon crashes the add-menu; try/catch cannot help (throw is inside React's render). | finder 1 | **CONFIRMED** | `predefined-add-menu.tsx:113-117` vs correct pattern at `predefined-custom.tsx:92-98` | `HostRenderBoundary` exported and wrapped around `reg.icon` |
| **P5** | 🔸 `deepCloneWithFreshIds` shallow-copies entries, so a duplicated card shares the custom `value` **by reference**; a host `edit` that mutates in place corrupts the original. Latent for `table.rows`, far likelier now that values are arbitrary host JSON. | finder 1 | **CONFIRMED (latent)** | `reducer.ts:246-255` | `cloneEntryValue` (structuredClone → JSON fallback → shallow) in `reducer.ts` |
| **P1** | 🚫→⚠️ Registering a name that matches an existing object-valued **child card** reinterprets it; if the host validator rejects the old shape the whole subtree is dropped. | finder 1 | **CONFIRMED as behavior; severity REFUTED to ⚠️ High** | **Refutation:** this is the signed-off spec, not a regression. plan-v0.3 §9 (L881) specifies invalid custom value → "entry dropped + warned", and it is *identical to existing built-in behavior* — `quote: {…}` is dropped today by `validatePredefinedShape`. The alternative (silently keeping it as a child) is precisely the 0.5.0 bug being fixed: a registration that quietly does nothing. It is also not silent — `logParseErrors` warns. | Documented as a hazard in guide §7.1 + `types.ts` precedence note; non-destructive-fallback option → Parked |
| **P6** | 🔸 `dispatchers`/`validators`/`config`/handle memos all recompute per render under an unstable prop. | finder 1 | **CONFIRMED** | `card-tree.tsx` dep arrays | Fixed by P2 |
| **D3** | 🔸 `STATUS.md` row still read `0.5.0` while `meta.ts`, `component-versions.md` and the built artifact said `0.6.0`. | finder 2 | **CONFIRMED** | `.claude/STATUS.md:36` | bumped to 0.6.0 |
| **D4** | 🔸 `card-tree-node` divergence is broader than U0 recorded — custom values are **invisible**, not misclassified. | finder 2 | **CONFIRMED** | `enumerate-subcards.ts:36-42`, `derive-flat-fields.ts:54-62` | U0 note corrected; → Parked, owner card-tree-node v0.4 |
| **P7** | 🔹 Stale `as PredefinedKey` cast left at a call site after `EditMode` was widened — the exact artifact the widening comment says was fixed. | finder 1 | **CONFIRMED** | `parts/card.tsx:410` | cast removed |
| **P8** | 🔹 `resolveCustomKeys` returns a shared module-level `EMPTY` by reference — aliasing landmine. | finder 1 | **CONFIRMED (hygiene)** | `custom-keys.ts:33` | `Object.freeze` on the singleton + its arrays |
| **D5** | 🔹 Compound-structure rule violated (24 parts, 2 standalone exports) — **pre-existing**, not worsened. | finder 2 | **CONFIRMED informational** | `parts/` vs `index.ts` | → Parked; a refactor, not a U-loop |
| **D6** | I8 dependent type-regression check | finder 2 | **CLEAN** | probe compiled a full `CustomPredefinedKey` + event handlers + `CardTreeProps` from the barrel alone, 0 errors; `card-tree-node` imports only `CardTreeJsonNode` | — |

## Runtime & smoke evidence (U5)

### Pure-logic invariant probe — **28 passed / 0 failed** ✅

The user deferred standing up a test runner (U1.4), so the round-trip invariant was proven by
executing it once by hand. Probe preserved at `e:/tmp/card-tree-v060-invariant-probe.ts`
(`npx tsx`), driving the real `lib/parse` · `lib/serialize` · `lib/classify-key` ·
`lib/custom-keys` modules with the U1.3 reproduction. **This is the content of the deferred
first test** — the STATUS.md defer names it as "card-tree parse→serialize fixed-point", and it is
exactly the consumer report's ask #5.

| Invariant | Result |
|---|---|
| **I2** array-valued custom block: classified `custom`, not a child; keeps the discriminant; value still an array; serialize deep-equals input; **`parse(serialize(parse(x)))` byte-identical fixed point** | 9/9 PASS |
| **I7** unregistered array still errors at child position (Q-P4 intact) | PASS |
| **I6** no `customPredefinedKeys` ⇒ 0.5.0 behaviour exactly (array rejected, object becomes a child card, zero predefined entries) | 3/3 PASS |
| **I3** invalid value dropped + diagnosed; **throwing** host validator does not take parse down | 4/4 PASS |
| **I4** built-in collision, reserved collision, duplicate (keep-first), empty name all rejected; only the valid registration survives | 5/5 PASS |
| Precedence: reserved > built-in > custom > scalar > child, incl. custom beating scalar/object/array | 6/6 PASS |

> ⚠️ **Honest limitation:** this proves the invariants *now*; it is **not** a regression guard,
> because nothing re-runs it. That is the cost of the deferred runner and the reason the follow-up
> below is owned rather than closed.

### Docs-site runtime — **7 passed / 0 failed** ✅

Against `pnpm build` + `npx next start -p 4311` (production, **never** the dev server, per the
machine-load incident). Host-side Playwright 1.62.1. Port freed by PID afterwards.

| Check | Result |
|---|---|
| SSR: both custom blocks in the server HTML (`% task success`, `Why array-valued blocks matter`, `Plate Value and editor.js`) | 3 hits each |
| **I1** object-valued custom block (`metric`) visible after hydration | PASS |
| array-valued custom block (`body`) renders **every** array item | PASS |
| **Zero console errors / pageerrors** after hydration | PASS |
| **The decisive regression assertion:** the card holding both custom blocks (`ch4`) has **zero descendant cards / treeitems** — under 0.5.0 `metric` would have fallen through to the `child` route and rendered as a nested card, and `body` would have been rejected outright | PASS |
| Dark theme: custom block still renders | PASS |
| Screenshots | `e:/tmp/card-tree-v060-{light,dark}.png` |

> **The test was wrong before the code was.** The first version of the regression check counted
> the literal text `"metric"` and failed — it was matching demo prose inside a `<code>` tag and a
> `table` column header in an unrelated card. Inspecting the DOM instead of trusting the red
> replaced it with a structural assertion that is strictly stronger. Same class as the P4 retro's
> "caught the scope bug in the TEST itself" — worth re-recording because it recurred.

### Consumer smoke — install + consumer tsc ✅

Real `pnpm dlx shadcn@latest add` from `e:/tmp/ilinxa-smoke-consumer` against a **local artifact
server** (`localhost:4173`, `@ilinxa` temporarily remapped in `components.json` — required
pre-deploy, per the known flake: `card-tree-fixtures`' `@ilinxa/card-tree` regDep cannot resolve
against production until this ships).

| Step | Result |
|---|---|
| `add @ilinxa/card-tree --overwrite` | **exit 0** |
| `add @ilinxa/card-tree-fixtures` | **exit 0** (`dummy-data.ts` landed) |
| `add @ilinxa/card-tree-node` (dependent) | **exit 0** |
| New files arrived in consumer | `lib/custom-keys.ts` (2789 B) + `parts/predefined-custom.tsx` (7363 B), non-empty, relative imports intact |
| Artifact is genuinely 0.6.0 | `resolveCustomKeys` + `customKeySignature` present in installed `card-tree.tsx`; 53 files; `HostRenderBoundary` icon fix present in installed `predefined-add-menu.tsx` |
| **Consumer `tsc --noEmit`** | **0 errors** |

**Consumer-side API probe** (the real test of F5 — the barrel gap had to be verified from the
consumer, not the producer). A probe importing **only** from `@/components/card-tree` declared: a
`CustomPredefinedKey` using *every* optional field (`edit`/`icon`/`category`/`description`/
`searchableText`), an **array-valued** registration, an explicit `CustomKeyContext` parameter,
`MetaRenderer`, `SearchOptions`, `PredefinedAddedEvent`, `CardTreePermissions`, and mounted
`<CardTree customPredefinedKeys={…} editable />`. Compiled **0 errors**. Negative path
(`<CardTree>` with no `customPredefinedKeys`) compiled unchanged. Probe removed, `components.json`
restored to `https://ui.ilinxa.com/r/{name}.json`, port 4173 freed by PID.

> **U5-discovered finding — S1 ⚠️ High, FIXED.** The probe would not compile
> `byPredefinedKey: { metric: … }`: `CardTreePermissions.byPredefinedKey` was keyed to
> `PredefinedKey` only, so **custom blocks could not be permission-controlled** — silently locking
> the headline v0.3 permission matrix out of the v0.6 feature. `lib/permissions.ts:156` already
> cast the lookup to `Record<string, PermissionRule>`, so the runtime always supported it; the
> narrow type was the only obstacle. Widened to `PredefinedKey | (string & {})` (keeps built-in
> autocomplete). Producer rebuilt, reinstalled, re-verified from the consumer. **Found only
> because the probe exercised the type as a consumer would — no producer-side gate could see it.**

**Harness note (not a card-tree finding):** the adds triggered a `pnpm install` that pruned six
peer deps never recorded in the consumer's `package.json` (`react-hook-form`, `zod`,
`@hookform/resolvers`, `pdfjs-dist`, `canvas-confetti`, `shiki`), surfacing 127 errors across 7
**unrelated** components — the documented "CLI does not add primitives' own npm deps" flake.
card-tree's own error count was **0** throughout. Applied the documented remedy (`pnpm add`),
after which total consumer errors were **0**, so the result is unambiguous rather than
argued-around. The harness is left healthier than found.

## Parked

- **`card-tree-node` renders custom blocks as nothing** (corrected at U4 by finder 2 — the earlier
  U0 note said "misclassified as a subcard", which was wrong and understated it). `isCardLike`
  (`enumerate-subcards.ts:36-42`) rejects all arrays and any object lacking `__rc*`/`ports`, and
  `classifyFlatValue` (`derive-flat-fields.ts:54-62`) accepts only boolean/number/string. So a
  custom key's value — object *or* array — is **silently invisible** in a card-tree-node canvas
  preview, not misplaced. Not corruption (raw JSON untouched, card-tree itself renders correctly),
  but a wrong render in a composition the procomp actively encourages. Owner: card-tree-node v0.4;
  related to its existing F-04 "card-tree exports no is-card predicate" lock.
- **Guide import paths are inconsistent catalog-wide**: 76 sites use the consumer path
  (`@/components/<slug>`), 55 use the repo-internal `@/registry/components/<cat>/<slug>`, which
  does not resolve in an installed consumer. Fixed for `card-tree` this run (5 sites); the other
  ~50 across other procomp guides are a mechanical sweep. Owner: docs sweep / next `public-doc` pass.
- **Compound-structure rule**: `card-tree` has 24 `parts/` files but exports only 2 standalone
  parts — a pre-existing violation of `.claude/rules/compound-component-structure.md`, neither
  introduced nor worsened here (`predefined-custom.tsx` is an internal part like every sibling).
  Owner: a dedicated card-tree compound refactor, not a U-loop.
- **Artifact-size headroom**: 301.10 / 320 KB (5.9%). Owner: next card-tree touch.
- **Lint baseline stale**: config documents 9 known warnings, actual is 14; the 5 extra are
  pre-existing in `scripts/build-component-versions.mjs`. Owner: next `readiness.config.md` touch.
- Test runner (see U1.4) — owner: separate feature-readiness loop.

## Pre-mortem (U7)

If this breaks for a consumer, it breaks because: a host registers a name that collides with existing document data (documented hazard — drops + warns; non-destructive option parked as FU-4), or because `card-tree-node` renders their custom blocks as nothing on a flow canvas (FU-2, known and owned). Neither is silent in the way the 0.5.0 bug was.
