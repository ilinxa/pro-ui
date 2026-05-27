# `engagement-bar-01` v0.2.0 — Plan Addendum (Stage 2)

> **Stage:** 2 of 3 · **Status:** 🟡 Drafted, awaiting sign-off
> **Slug:** `engagement-bar-01` (unchanged) · **Target version:** `0.2.0`
> **Depends on:** [engagement-bar-01-procomp-description-v0.2.0.md](./engagement-bar-01-procomp-description-v0.2.0.md) (GATE 1 ✅ signed off — Q-EB-1 + Q-EB-2 locked)
> **Upstream blocker for:** [post-card-01 v0.2.0 C0 prerequisite](../post-card-01-procomp/post-card-01-procomp-plan-v0.2.0.md)
>
> This addendum is the **implementation contract** for engagement-bar-01 v0.2.0 — *how* the 6 mechanical changes from the description's §2.1 land in code. Scope is deliberately tight: file moves + sub-exports + one new parallel type + meta bump + registry.json update + spotcheck. ~2–3h end-to-end from C0-G1 sign-off to GATE 3 closure.

---

## 1. Q-P locks (v0.2.0-specific; v0.1 plan locks carry unchanged)

| # | Lock | Source |
|---|---|---|
| **Q-PEB-1** | Files move byte-identical from `post-card-01/parts/` → `engagement-bar-01/parts/`. No content edits during the move itself; any required type-import path updates happen in the same commit but are mechanical (find/replace `from "../types"` → `from "../types"` — works either way since both procomps have a `types.ts` at the same relative depth). | Description §2.1 #1, #2 |
| **Q-PEB-2** | `LikersStripProps.likers` and `ShareMenuProps.users` switch from `PostLikeUser[]` to `EngagementLikerProfile[]`. New type added to `engagement-bar-01/types.ts`. | Q-EB-1 lock |
| **Q-PEB-3** | `PostLikeUser` stays exported from post-card-01 v0.2.0 as `@deprecated` alias: `/** @deprecated Use EngagementLikerProfile from @ilinxa/engagement-bar-01 instead. */ export type PostLikeUser = EngagementLikerProfile;`. This is propagated in post-card-01 v0.2.0 plan C1 — engagement-bar-01 v0.2.0's responsibility ends at the rename + new type definition. | Q-EB-1 lock |
| **Q-PEB-4** | Internal hook `useDragScroll` (defined inside `likers-strip.tsx`) stays INSIDE the file. Not separately exported. Not refactored. v0.3+ candidate. | Description §2.2 out-of-scope |
| **Q-PEB-5** | No `demo.tsx` additions in engagement-bar-01 v0.2.0. Post-card-01's existing demos cover both parts. | Q-EB-2 lock |
| **Q-PEB-6** | `engagement-bar-01/meta.ts` gains `avatar` + `input` to `dependencies.shadcn` (currently `["button"]`). LikersStrip uses `avatar` + `button`; ShareMenu uses `avatar` + `button` + `input`. **Already installed in the project** (post-card-01 declared them); this is a meta-only declaration to match the truth. `validate:meta-deps` will fail otherwise. | F-cross-07 audit lock |
| **Q-PEB-7** | GATE 3 spotcheck rotating dim = **Public API**. Obvious choice given the additive-public-surface scope. Author review at `docs/procomps/engagement-bar-01-procomp/reviews/<YYYY-MM-DD>-v0.2.0-spotcheck.md`. | Readiness-review rule |
| **Q-PEB-8** | Dual-slug smoke at C0-3: install BOTH `@ilinxa/engagement-bar-01` AND `@ilinxa/post-card-01` (latter is still v0.1.1 at this point — but its import paths to `LikersStrip` / `ShareMenu` still resolve to the OLD location until post-card-01 v0.2.0 C0-1 commit moves them; smoke at this stage validates engagement-bar's new exports alone). | Smoke harness pattern |

---

## 2. Implementation order (3 commits + GATE 3 spotcheck)

| Commit | Scope | Files touched | Verification |
|---|---|---|---|
| **C0-1** | **Atomic file moves + type addition + post-card-01 cross-folder import update** (single commit; sub-steps a+b per §3). (a) `git mv` `likers-strip.tsx` + `share-menu.tsx` from `post-card-01/parts/` → `engagement-bar-01/parts/` (byte-identical content); add `EngagementLikerProfile` type to `engagement-bar-01/types.ts` (relaxed-fields shape: `{ id: string; name: string; username?: string; avatar?: string }`); update internal type refs inside moved files (`PostLikeUser` → `EngagementLikerProfile`). (b) update `post-card-01/post-card-01.tsx` 2 import lines: `./parts/likers-strip` + `./parts/share-menu` → `@/registry/components/data/engagement-bar-01`. | 2 files moved + `engagement-bar-01/types.ts` (+1 type) + 2 import lines edited in the moved files + 2 import lines edited in `post-card-01.tsx` | `pnpm tsc --noEmit` clean repo-wide (atomic commit — see §3 for sequencing rationale) |
| **C0-2** | **Public exports + meta + registry.** Add the 4 lines to `engagement-bar-01/index.ts` (`export { LikersStrip / ShareMenu }` + `export type { LikersStripProps / ShareMenuProps }`); update `engagement-bar-01/meta.ts` (version `0.1.2` → `0.2.0`, `updatedAt: 2026-05-27`, append 2 features + 1 tag, add `avatar` + `input` to `dependencies.shadcn`); update `registry.json` engagement-bar-01 base item with the 2 new file entries (locked target convention). | `engagement-bar-01/index.ts` + `engagement-bar-01/meta.ts` + `registry.json` (repo root) | tsc + lint + `pnpm validate:meta-deps` clean |
| **C0-3** | **Dual-slug smoke** — run smoke harness for `engagement-bar-01` (full surface) + verify post-card-01 v0.1.1 still installs cleanly (its existing imports STILL reference the old local `parts/` paths, but those files exist as the moved sources in engagement-bar-01 now — see plan §4 for the cross-folder import resolution sequence). | Smoke harness only (no source) | Both installs succeed; both consumer-tsc clean (smoke harness extension at post-card-01 C12 is not in place yet, so this run uses plain shadcn-add smoke; per Q-PEB-8) |
| **C0-GATE 3** | Author spotcheck review file. Fixed core (Dim 1/9/10/12) + rotating Public API. | `docs/procomps/engagement-bar-01-procomp/reviews/2026-05-27-v0.2.0-spotcheck.md` (or actual date) | Verdict ≥ `Pass with follow-ups` |

**Estimated time:** ~2h. C0-1 ~45min (file moves + type rename throughout the 2 source files; type addition + dependency import-path updates), C0-2 ~30min (mechanical), C0-3 ~15min (smoke), C0-GATE 3 ~30min (spotcheck).

---

## 3. Critical workflow sequencing (post-card-01 cross-folder import resolution)

Per Q-P37=(a) of [post-card-01 v0.2.0 plan](../post-card-01-procomp/post-card-01-procomp-plan-v0.2.0.md), this entire ship (C0-1 through C0-GATE 3) lands BEFORE post-card-01 v0.2.0 implementation begins. But there's a subtlety in C0-1 that needs explicit handling:

**Problem:** During C0-1, the moved files no longer exist at `post-card-01/parts/`. Post-card-01 v0.1.1's `post-card-01.tsx` still has `import { LikersStrip } from "./parts/likers-strip"` (relative import). After the move, that import is broken → tsc fails repo-wide.

**Resolution (locked):** C0-1 is a **2-step commit chain inside the same logical step**:

```
Step C0-1a — Move files + add EngagementLikerProfile type.
  git mv post-card-01/parts/likers-strip.tsx engagement-bar-01/parts/likers-strip.tsx
  git mv post-card-01/parts/share-menu.tsx engagement-bar-01/parts/share-menu.tsx
  Add EngagementLikerProfile to engagement-bar-01/types.ts
  Update internal imports inside moved files (PostLikeUser → EngagementLikerProfile)

Step C0-1b — Immediately update post-card-01 v0.1.1 imports cross-folder.
  Edit src/registry/components/data/post-card-01/post-card-01.tsx:
    import { LikersStrip } from "./parts/likers-strip"  →  import { LikersStrip } from "@/registry/components/data/engagement-bar-01"
    import { ShareMenu } from "./parts/share-menu"  →  import { ShareMenu } from "@/registry/components/data/engagement-bar-01"

  (Cross-folder pattern matches existing precedents — post-card-01 already imports cross-folder from comment-thread-01 + engagement-bar-01.)
```

**Both steps land in the same commit** (single tsc-clean checkpoint). This means **post-card-01 v0.1.1's source IS modified by C0-1b** — but ONLY 2 import lines, both mechanical, both adding cross-folder imports that already existed in its meta.ts `internal: ["engagement-bar-01"]` declaration.

**Is this a behavior change to post-card-01 v0.1.1?** No — the JS module resolution gives the same `LikersStrip` / `ShareMenu` references; UI is byte-identical. tsc + lint + smoke remain clean.

**Does post-card-01 need a patch bump (v0.1.1 → v0.1.2)?** No — the imports are internal compile-time references, NOT public API. The consumer-side installed code keeps pointing to the same `LikersStrip` / `ShareMenu` symbols (just via a different import path in the producer source). No behavior change, no API surface change → no patch bump for post-card-01 alone. The next post-card-01 ship is v0.2.0 directly.

**Failure mode if this is missed:** C0-1a alone → tsc repo-wide fails on post-card-01 v0.1.1. Engagement-bar-01 v0.2.0 GATE 3 cannot close. Therefore C0-1a + C0-1b MUST land together.

---

## 4. Files added / modified summary

### Added to engagement-bar-01

```
parts/
  likers-strip.tsx              # MOVED from post-card-01/parts/ (byte-identical content + internal type-name update)
  share-menu.tsx                # MOVED from post-card-01/parts/ (byte-identical content + internal type-name update)
```

### Modified

```
engagement-bar-01/
  types.ts                      # +1 type definition (EngagementLikerProfile)
  index.ts                      # +4 lines (2 exports + 2 type exports)
  meta.ts                       # version bump + features/tags/shadcn-deps update

post-card-01/
  post-card-01.tsx              # 2 import lines updated cross-folder (per §3 C0-1b)
  parts/likers-strip.tsx        # MOVED OUT (no file at this path post-C0-1)
  parts/share-menu.tsx          # MOVED OUT

repo root/
  registry.json                 # engagement-bar-01 item gains 2 new files; version bump
```

Net delta:
- engagement-bar-01: **+2 files, +1 type, +4 export lines, +1 minor version**
- post-card-01: **−2 files, 2 import-lines updated, NO version bump (compile-time only; consumer-installed code identical)**

### NOT touched at this stage (deferred to post-card-01 v0.2.0)

- `post-card-01/types.ts` — the `@deprecated PostLikeUser` alias addition happens at post-card-01 v0.2.0 C1, not here. **At C0-1 time, `PostLikeUser` still exists at its original definition.** No tsc breakage because nothing imports `PostLikeUser` from outside post-card-01.

---

## 5. Backwards-compatibility verification (zero-breakage proof)

| v0.1 pattern | v0.2.0 behavior | Verification |
|---|---|---|
| `<EngagementBar01 actions={...} />` | Identical render | ✓ |
| `<EngagementHeartBurst trigger={n} />` | Identical | ✓ |
| `useEngagementState({ actions, subscribe })` | Identical hook signature + return | ✓ |
| `engagementReducer(state, action)` | Identical pure reducer | ✓ |
| `formatEngagementCount(1234)` | Identical | ✓ |
| `import type { EngagementAction, EngagementDelta, EngagementLikeUser } from "@ilinxa/engagement-bar-01"` | Identical exports (EngagementLikeUser still strict-fields) | ✓ |

Net: **zero v0.1.x semantics changed.** All 12 existing exports + their types + their behaviors are unchanged. v0.2.0 adds 4 new exports (LikersStrip + ShareMenu + LikersStripProps + ShareMenuProps) and 1 new type (EngagementLikerProfile). Pure additive expansion.

---

## 6. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| **C0-1a + C0-1b not landed atomically** → tsc repo-wide breaks at the C0-1a-only checkpoint | High (if separated) | Plan §3 explicitly mandates both steps in same commit. Pre-commit verification: `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps` must ALL pass before committing C0-1. |
| **Naming collision in `engagement-bar-01/index.ts`** (e.g., a hypothetical existing `LikersStrip` export) | Very Low | Pre-checked at C0-G1 description — `engagement-bar-01/index.ts` only exports `EngagementBar01` + 11 other symbols; no `LikersStrip` or `ShareMenu` exists. |
| **`meta.ts` shadcn deps drift** (adding `avatar` + `input` to engagement-bar-01's deps; what if `validate:meta-deps` had passed before because the LikersStrip / ShareMenu files lived elsewhere?) | Medium | Yes — this IS a meta drift fix. `validate:meta-deps` would have failed PREVIOUSLY if it scanned engagement-bar-01 with the moved files in place (since `<Avatar>` + `<Input>` would appear in the source but not in meta deps). The fix here lands AT the same commit (C0-2) as the file moves take effect. Verified by `pnpm validate:meta-deps` clean at C0-2. |
| **Smoke harness consumer-tsc not yet extended** (Q-PEB-8) | Low | At C0 time, the harness uses plain shadcn-add smoke. Consumer-tsc extension lands at post-card-01 v0.2.0 C12 (per Q-D8 lock there). For C0-3, plain smoke + manual tsc check on the installed `engagement-bar-01` slug is sufficient (mechanical scope; low surface). |
| **Spotcheck surfaces a Blocker (Dim 14 Cross-component coherence)** | Very Low | The move is intra-family (engagement-related files → engagement family). Cross-component coherence improves; doesn't worsen. |
| **Future re-name needed if `EngagementLikerProfile` proves awkward** | Low | If GATE 3 review or downstream consumer surfaces objection, we can patch-bump to add a parallel alias later. Names are easy to alias; structural shape is what matters. |

---

## 7. GATE 3 spotcheck plan

**Template:** [`docs/reviews/templates/review-spotcheck.md`](../../reviews/templates/review-spotcheck.md). Tier-2 (procomp) spotcheck — fixed core (Dim 1/9/10/12) + 1 rotating.

**Rotating dim:** **Public API** (Dim 4). Obvious choice — the entire scope of v0.2.0 is public-surface additions.

**What to verify:**

| Dim | Specifics |
|---|---|
| 1 — Planning docs | This description + plan + (eventually) guide-section addendum exist + are signed off |
| 4 — Public API (rotating) | The 4 new exports + 1 new type compile in a consumer; type signatures are documented; `@deprecated` alias on `PostLikeUser` resolves to `EngagementLikerProfile` without type-narrowing surprises |
| 9 — Registry distribution | `https://ilinxa-proui.vercel.app/r/engagement-bar-01.json` resolves with 2 new file entries; locked target convention preserved |
| 10 — Meta + manifest sync | `meta.ts` version + features + tags + shadcn-deps updated; STATUS.md row reflects the v0.2.0 bump |
| 12 — Verification | tsc 0 / lint 0 / validate-meta-deps clean / smoke pass for engagement-bar-01 slug AND post-card-01 v0.1.1 (the post-card-01 install at this point still pulls v0.1.1 from the registry; consumer-installed code is byte-identical because cross-folder imports resolve to the same install graph) |

**Findings expected:** likely 0–2 findings. The mechanical scope reduces the surface for substantive findings. Worst-case: Low-severity guidance on the type-naming convention or one-line JSDoc clarity.

---

## 8. Pre-emptive locks (inherited)

- **Additive expansion. Zero breaking changes** to v0.1.x exports.
- **No new behavior, no new state machines, no new effects.** Components ship at v0.1.1 quality (post-card-01 sweep-reviewed).
- **`"use client"` boundaries preserved.** LikersStrip + ShareMenu both `"use client"` (own local state); EngagementHeartBurst stays RSC-compatible.
- **No framer-motion** anywhere.
- **`React.memo` at export** for both new parts (preserved from source).
- **Locked target convention** for registry.json.
- **Cross-folder imports allowed** — post-card-01 already imports cross-folder from this slug per its meta.internal declaration.
- **GATE 3 required** per readiness-review rule. Spotcheck template + rotating dim Public API.

---

## 9. Implementation sequence summary

```
C0-G1  description addendum                                       → user sign-off ✅
C0-G2  this plan addendum                                         → user sign-off (PENDING)

C0-1   git mv 2 files + EngagementLikerProfile type +
       update post-card-01 v0.1.1 imports cross-folder            → tsc + lint clean (atomic)
C0-2   index.ts +4 exports + meta.ts bump + registry.json update  → tsc + lint + validate-meta-deps
C0-3   dual-slug smoke (engagement-bar-01 + post-card-01)         → smoke clean

C0-GATE 3  spotcheck review                                       → verdict ≥ Pass-with-follow-ups
```

Net surface delta: **+2 files relocated, +1 new type (EngagementLikerProfile), +4 sub-exports, +1 minor-bump on engagement-bar-01, 0 source-line changes to engagement-bar-01.tsx + types.ts behaviors, 2 import-lines updated in post-card-01.tsx (mechanical, no version bump).**

---

**Status:** ✅ GATE 2 SIGNED OFF (2026-05-27). Q-PEB-1 through Q-PEB-8 locked. Implementation begins at C0-1.

**Estimated total time** to engagement-bar-01 v0.2.0 GATE 3 closed: ~2h focused work.
