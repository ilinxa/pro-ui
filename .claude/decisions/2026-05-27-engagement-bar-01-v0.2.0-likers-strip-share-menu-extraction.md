---
date: 2026-05-27
session: post-card-01 v0.2.0 — C0 prerequisite ship
phase: implementation (engagement-bar-01 v0.2.0 ship; unblocks post-card-01 v0.2.0 C1)
type: minor-bump-shipped
commits: [pending]
components: [engagement-bar-01, post-card-01]
findings: []
status: shipped
---

# 2026-05-27 — engagement-bar-01 v0.2.0 SHIPPED — LikersStrip + ShareMenu sub-export extraction

## Context

`post-card-01` v0.2.0 GATE 2 plan locked Q-P37=(a) as a **BLOCKING prerequisite**: `LikersStrip` + `ShareMenu` (sealed in `post-card-01/parts/` since v0.1.1) must move to `engagement-bar-01/parts/` as sub-exports before post-card-01 v0.2.0 main chain (C1 → C12) can begin. This decision file records the C0 prerequisite ship — engagement-bar-01 v0.1.2 → v0.2.0 (additive minor bump; zero behavior changes).

The driver: three engagement-adjacent surfaces (`comment-thread-01` likers preview, profile-page following lists, `story-viewer-01` reactor strip) want to reuse the same horizontal avatar strip + searchable user picker. v0.1 accidentally sealed them inside post-card-01; v0.2.0 of engagement-bar-01 lifts them up to the right home.

## Deliverable

Three gate docs + one spotcheck + the code ship:

1. **GATE 1** — [`docs/procomps/engagement-bar-01-procomp/engagement-bar-01-procomp-description-v0.2.0.md`](../../docs/procomps/engagement-bar-01-procomp/engagement-bar-01-procomp-description-v0.2.0.md) — Q-EB-1 + Q-EB-2 signed off (re-validated; naming refined `EngagementLikerUser` → `EngagementLikerProfile` to close one-letter typo distance from `EngagementLikeUser`).
2. **GATE 2** — [`engagement-bar-01-procomp-plan-v0.2.0.md`](../../docs/procomps/engagement-bar-01-procomp/engagement-bar-01-procomp-plan-v0.2.0.md) — Q-PEB-1 through Q-PEB-8 locked. 3-commit chain (C0-1 atomic + C0-2 + C0-3).
3. **GATE 3** — [`reviews/2026-05-27-v0.2.0-spotcheck.md`](../../docs/procomps/engagement-bar-01-procomp/reviews/2026-05-27-v0.2.0-spotcheck.md) — verdict **Pass**. 0 findings. Rotating dim Public API.
4. **Code ship**:
   - 2 files moved (`git mv`): `likers-strip.tsx` + `share-menu.tsx` from `post-card-01/parts/` → `engagement-bar-01/parts/`
   - `engagement-bar-01/types.ts` gains `EngagementLikerProfile` (relaxed-fields shape: `{ id, name, username?, avatar? }`; coexists with existing strict `EngagementLikeUser` used by realtime delta payloads)
   - `engagement-bar-01/index.ts` adds 4 new exports (2 components + 2 type exports) + 1 type re-export
   - `engagement-bar-01/meta.ts` bumped `0.1.2` → `0.2.0`; features list +2 entries; tags +1 (`"likers"`); shadcn deps `["button"]` → `["avatar", "button", "input"]`
   - `post-card-01/post-card-01.tsx` imports updated cross-folder
   - `post-card-01/index.ts` barrel updated with soft-compat re-export from engagement-bar-01 (preserves zero-breakage for any v0.1 consumer that imported `LikersStrip`/`ShareMenu` from the post-card-01 barrel)
   - `post-card-01/meta.ts` dropped over-declared `input` shadcn dep (was only used by share-menu, which moved out)
   - `registry.json` updated: engagement-bar-01 gains 2 files + `input` registryDependency; post-card-01 loses 2 files

## Process

Two re-validation passes per [feedback memory `feedback_re_validation_pass_catches_real_issues.md`](../memory/feedback_re_validation_pass_catches_real_issues.md):

- **GATE 1 re-validation:** caught one Low naming concern — `EngagementLikerUser` (originally proposed) differs from `EngagementLikeUser` (existing) by one letter. Refined to `EngagementLikerProfile` (semantically clearer "profile of a liker"; unambiguous beside `EngagementLikeUser`).
- **GATE 2 re-validation:** caught one Medium error — C0-1 verification column initially said "tsc will fail at this step" (contradiction with §3 atomic-commit promise). Fixed to "tsc + lint clean repo-wide (atomic per §3)".
- **Post-implementation re-validation:** caught the post-card-01/index.ts barrel re-export requirement (without it, the existing `LikersStrip` + `ShareMenu` exports from post-card-01's barrel would break = backwards-compat violation). Resolution: add soft-compat re-export with a JSDoc note. Documented in the spotcheck even though not explicitly in the plan.

## Verification

- `pnpm tsc --noEmit` clean repo-wide ✓
- `pnpm validate:meta-deps` 49/49 clean ✓
- `pnpm registry:build` clean (49 slugs built; `public/r/engagement-bar-01.json` now lists 16 files, was 14; `public/r/post-card-01.json` now lists 11 files, was 13) ✓
- Live smoke deferred to post-deploy (procedural; recorded as follow-up in spotcheck)
- Pre-existing lint baseline (21 errors in file-manager / file-tree / rich-sidebar) unrelated and not introduced by this ship

## Public API additions (engagement-bar-01)

```ts
// Components
export { LikersStrip } from "./parts/likers-strip";
export { ShareMenu } from "./parts/share-menu";

// Component prop types
export type { LikersStripProps } from "./parts/likers-strip";
export type { ShareMenuProps } from "./parts/share-menu";

// New type (relaxed-fields shape for UI display)
export type { EngagementLikerProfile } from "./types";
//   ↳ { id: string; name: string; username?: string; avatar?: string }
//      Parallel to the existing strict EngagementLikeUser (used in EngagementDelta).
```

## Zero v0.1.x breakage

All 19 existing engagement-bar-01 exports unchanged: `EngagementBar01`, `EngagementHeartBurst`, `engagementReducer`, `useEngagementState`, `deriveStateFromActions`, `formatEngagementCount`, `EngagementBar01Props`, `EngagementBar01Handle`, `EngagementBar01Variant`, `EngagementBarLabels`, `EngagementAction`, `EngagementActionAlign`, `EngagementDelta`, `EngagementLikeUser`, `EngagementState`, `EngagementLocalAction`, `Subscribe`, `Unsubscribe`, `DEFAULT_ENGAGEMENT_BAR_LABELS`.

Post-card-01 barrel re-export of `LikersStrip` + `ShareMenu` preserved (now resolves cross-folder); v0.1 consumers importing those from `@ilinxa/post-card-01` keep working.

## Follow-ups

| Action | Status |
|---|---|
| Live smoke against deployed Vercel registry | Open (post-deploy) |
| `PostLikeUser` `@deprecated` alias in post-card-01 v0.2.0 | Open (lands at post-card-01 v0.2.0 C1) |
| engagement-bar-01 guide.md "v0.2.0 sub-exports" section | Open (low priority; base guide accurate) |
| Continue post-card-01 v0.2.0 C1 (types.ts main chain) | Open (next step) |

## Cross-references

- Upstream plan: [post-card-01 v0.2.0 plan](../../docs/procomps/post-card-01-procomp/post-card-01-procomp-plan-v0.2.0.md) Q-P37
- Upstream description: [post-card-01 v0.2.0 description](../../docs/procomps/post-card-01-procomp/post-card-01-procomp-description-v0.2.0.md) Bucket D
- Pattern precedent: `EngagementHeartBurst` sub-export (engagement-bar-01 v0.1.0)
