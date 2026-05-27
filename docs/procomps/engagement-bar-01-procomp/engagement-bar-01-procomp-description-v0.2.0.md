# `engagement-bar-01` v0.2.0 — Description Addendum (Stage 1)

> **Stage:** 1 of 3 · **Status:** 🟡 Drafted, awaiting sign-off
> **Slug:** `engagement-bar-01` (unchanged) · **Target version:** `0.2.0`
> **Release model:** **additive expansion only** — 2 new sub-exports, 2 new prop type re-exports, zero behavior changes, zero modifications to existing API surface. Every v0.1.x consumer keeps working unchanged.
> **Upstream driver:** This ship is the **C0 prerequisite** for [post-card-01 v0.2.0](../post-card-01-procomp/post-card-01-procomp-plan-v0.2.0.md). Per Q-P37=(a) of that plan, the LikersStrip + ShareMenu file extraction blocks post-card-01 v0.2.0 implementation. This addendum is the GATE 1 description for the engagement-bar ship that unblocks it.
>
> **Scope is deliberately tight.** Two files move IN from `post-card-01/parts/`. Two sub-exports added. One version bump. One spotcheck. Done. No new behavior, no new state machines, no new component composition — this is a pure organizational re-home of two reusable engagement-related parts that v0.1 accidentally sealed inside `post-card-01`.

---

## 1. Problem (delta)

`LikersStrip` (horizontal swipable avatar strip + "+N" pill, with internal `useDragScroll` hook for desktop mouse drag + native touch swipe) and `ShareMenu` (searchable user picker with optional async search) were authored at `post-card-01/v0.1.1` for kasder's inline engagement panels. They're **inside `post-card-01/parts/` and not exported.** Three engagement-adjacent surfaces want to reuse them:

1. **`comment-thread-01` likers preview** — when comment-thread adds a comment-likers preview affordance (queued for that procomp's v0.2+), it should compose `LikersStrip` rather than re-implement.
2. **Profile pages / "Following" lists** — generic horizontal swipable avatar strip with a "+N more" affordance is a recurring need.
3. **`story-viewer-01` reactor strip** — same horizontal avatar + count pattern.

Each of these consumers currently has to either re-implement the same drag-scroll logic + symmetric column grid + "+N" pill (which is the kasder-style pattern, ~70 LOC for the strip alone), OR copy-paste the files from `post-card-01` and accept ownership drift. Both are wrong.

**`engagement-bar-01` is the natural home** for both parts because:
- Both are explicitly engagement-affordance UI (likers / share).
- Both depend ONLY on `lucide-react` + shadcn `avatar` / `button` / `input` — same dep set engagement-bar-01 already has.
- Neither imports from `post-card-01` (zero coupling).
- The existing `engagement-bar-01` already ships `EngagementHeartBurst` as a sub-export (sealed RSC-compatible part) — the same export pattern fits LikersStrip / ShareMenu perfectly.

v0.2.0 lifts them up one level: from `post-card-01/parts/` (sealed) to `engagement-bar-01/parts/` (sub-exported). Net effect: engagement-bar-01 grows by 2 sub-exports + 2 type re-exports; post-card-01 v0.2.0 imports them cross-folder and drops the local files. Future consumers (comment-thread / profile / story-viewer) get them for free.

### Why this isn't a breaking v1.0.0

Because nothing existing changes. `EngagementBar01`, `EngagementHeartBurst`, `engagementReducer`, `useEngagementState`, `formatEngagementCount`, `EngagementAction`, `EngagementDelta`, all 12 existing exports — unchanged. The 2 new sub-exports are pure additions.

Version bump is `0.1.2 → 0.2.0` (minor) per semver: additive public API = minor. **GATE 3 required** per the readiness-review rule (public-API touch on a minor bump). Patch-bump exemption does NOT apply — even though the implementation is mechanical (file moves only), the public surface area grew, which is exactly what GATE 3 is for.

---

## 2. In scope / Out of scope

### 2.1 In scope (5 mechanical changes)

1. **Move `likers-strip.tsx`** from `src/registry/components/data/post-card-01/parts/likers-strip.tsx` → `src/registry/components/data/engagement-bar-01/parts/likers-strip.tsx`. File content unchanged.
2. **Move `share-menu.tsx`** from `post-card-01/parts/share-menu.tsx` → `engagement-bar-01/parts/share-menu.tsx`. File content unchanged.
3. **Add 4 lines to `engagement-bar-01/index.ts`:**

   ```ts
   export { LikersStrip } from "./parts/likers-strip";
   export type { LikersStripProps } from "./parts/likers-strip";
   export { ShareMenu } from "./parts/share-menu";
   export type { ShareMenuProps } from "./parts/share-menu";
   ```

4. **Update `engagement-bar-01/meta.ts`:** version `0.1.2` → `0.2.0`, `updatedAt` to today's date, append 2 new features to the features list (`"LikersStrip sub-export — horizontal swipable avatar strip + +N pill"` + `"ShareMenu sub-export — searchable user picker (sync + async filter)"`), and add 1 new tag (`"likers"`).
5. **Update `registry.json`:** add 2 new files to the `engagement-bar-01` base item: `parts/likers-strip.tsx` and `parts/share-menu.tsx`. Bump version. Both retain locked target convention (`type: "registry:component"` / `target: "components/engagement-bar-01/parts/<file>"`).
6. **Add `EngagementLikerProfile` type** to `engagement-bar-01/types.ts` (per Q-EB-1 lock): the relaxed-fields shape ported from `PostLikeUser` (`{ id: string; name: string; username?: string; avatar?: string }`). Export it from the index alongside the existing `EngagementLikeUser` (which keeps required fields for realtime delta payloads). Both types coexist; `LikersStripProps.likers` + `ShareMenuProps.users` use the relaxed `EngagementLikerProfile`.

That's the complete in-scope list. Two existing types preserved; one new type added; no props added to existing components; no new state, no new effects, no new memoization. Near-pure file relocation + re-export + one parallel-shape type.

### 2.2 Out of scope (deliberately)

- **Touching `post-card-01`.** The post-card-01 import-path update happens in `post-card-01-procomp-plan-v0.2.0.md` C0-1 (called out there as the move step). This addendum lands its work BEFORE post-card-01 v0.2.0 C1 begins; the cross-folder imports get rewired in post-card's own C0-1 commit.
- **Any modification to the existing engagement-bar component or its types.** EngagementBar01 + EngagementHeartBurst + all 12 v0.1 exports stay identical.
- **Refactoring `useDragScroll` (internal hook inside likers-strip)** to be a separate export. It stays internal. If a future consumer wants the bare hook, that's a v0.3 candidate.
- **New behavior for LikersStrip / ShareMenu.** No async-load improvements, no new pagination affordances, no new keyboard navigation. The components ship at v0.1.1 quality (which passed the post-card-01 sweep review). Behavior frozen.
- **Re-exporting `PostLikeUser`.** That type currently lives in `post-card-01/types.ts` and is consumed by `LikersStripProps.likers: PostLikeUser[]`. **Resolution:** rename `PostLikeUser` → `EngagementLikeUser` (the type union already-exported by engagement-bar-01 as `EngagementLikeUser` for the realtime `liker-added` delta), and update `LikersStripProps` to use `EngagementLikeUser` instead. Then re-export nothing new (the type is already exported from engagement-bar-01). **HOWEVER** — the existing `EngagementLikeUser` has all-required fields (`username: string` and `avatar: string`), while `PostLikeUser` has them OPTIONAL. We need to relax the existing `EngagementLikeUser` shape OR add a new `EngagementLikerProfile` (with the relaxed shape). See Q-EB-1.
- **Demo coverage for LikersStrip / ShareMenu in `engagement-bar-01/demo.tsx`.** Optional; covered by the existing post-card-01 demo (Feed tab + Inline TR tab already demo LikersStrip / ShareMenu). v0.2.0 of engagement-bar-01 ships without adding demo tabs (keeps scope tight). Q-EB-2.

---

## 3. Target consumers (delta to v0.1)

Existing engagement-bar-01 consumers carry. v0.2.0 explicitly enables:

3. **`post-card-01` v0.2.0** — imports both sub-exports cross-folder; drops local files. This is the immediate driver.
4. **`comment-thread-01` future likers-preview integration** — when comment-thread adds a likers preview affordance (v0.2+ of that procomp), it composes `LikersStrip` instead of re-implementing.
5. **Profile pages / "Following" lists** — generic horizontal swipable avatar strip with "+N" pill — anywhere a host needs the same UX.
6. **`story-viewer-01` reactor strip** — when story-viewer ships reactor-list, it composes `LikersStrip`.

---

## 4. Rough API sketch

The two new sub-exports' types (sealed inside post-card-01 today; sub-exported in v0.2.0):

```ts
// engagement-bar-01/index.ts (additive — 4 new lines)
export { LikersStrip } from "./parts/likers-strip";
export type { LikersStripProps } from "./parts/likers-strip";
export { ShareMenu } from "./parts/share-menu";
export type { ShareMenuProps } from "./parts/share-menu";
```

**`LikersStripProps`** (unchanged from post-card-01 v0.1.1 surface):

```ts
export interface LikersStripProps {
  totalCount: number;                              // drives the "+N" pill
  likers: EngagementLikerProfile[];                // pre-loaded users (relaxed-fields shape per Q-EB-1)
  heading: string;                                  // e.g. "Likes" / "Beğenenler"
  onLoadMore?: () => Promise<EngagementLikeUser[]>; // append paginated results
  moreAriaLabelTemplate?: string;                  // default "+{count} more"
  onClose?: () => void;                             // optional Hide button
  closeLabel?: string;                              // default "Hide"
  className?: string;
}
```

**`ShareMenuProps`** (unchanged from post-card-01 v0.1.1 surface):

```ts
export interface ShareMenuProps {
  users: EngagementLikerProfile[];                  // pre-loaded suggested users (relaxed-fields shape per Q-EB-1)
  onSearch?: (query: string) => Promise<EngagementLikeUser[]>;  // optional async search
  onShareTo: (user: EngagementLikeUser) => void;    // selection callback
  heading?: string;                                  // default "Share with…"
  searchPlaceholder?: string;                        // default "Search people…"
  emptyLabel?: string;                               // default "No matches."
  onClose?: () => void;                              // optional Hide button
  closeLabel?: string;                               // default "Hide"
  className?: string;
}
```

Consumer usage:

```tsx
import { LikersStrip, ShareMenu, type EngagementLikeUser } from "@ilinxa/engagement-bar-01";

<LikersStrip
  totalCount={post.likes}
  likers={likers}
  heading="Likes"
  onLoadMore={async () => api.fetchMoreLikers(post.id)}
  onClose={() => setShowLikers(false)}
/>

<ShareMenu
  users={suggestions}
  onSearch={async (q) => api.searchUsers(q)}
  onShareTo={(user) => api.sharePost(post.id, user.id)}
  onClose={() => setShowShare(false)}
/>
```

---

## 5. Open Q-Ps (require sign-off before GATE 2)

| # | Question | Options | Recommendation |
|---|---|---|---|
| **Q-EB-1** | The existing `EngagementLikeUser` type at `engagement-bar-01/types.ts:59-64` has all fields **required** (`username: string`, `avatar: string`). The `PostLikeUser` type at `post-card-01/types.ts:34-39` (current type of `LikersStripProps.likers` + `ShareMenuProps.users`) has `username?: string` + `avatar?: string` **optional**. How do we reconcile? | (a) Relax `EngagementLikeUser` (breaking — would force `delta.user.avatar` consumers to handle undefined); (b) Add a new type alongside the existing one; (c) Same as (b), keep `PostLikeUser` exported from post-card-01 as `@deprecated` alias for zero-breakage | **(c)** ✅ **SIGNED OFF (re-validated).** Two parallel types coexist: `EngagementLikeUser` (strict, required fields — used by realtime delta payloads where the emitter always has full data) + **`EngagementLikerProfile`** (relaxed, optional `username`/`avatar` — used by LikersStripProps + ShareMenuProps UI display). **Naming refined during re-validation:** `EngagementLikerProfile` (originally proposed as `EngagementLikerUser`, but one-letter distance from `EngagementLikeUser` posed typo-confusion risk; `Profile` suffix is clearer + unambiguous). `PostLikeUser` stays exported from post-card-01 v0.2.0 as a `@deprecated` alias of `EngagementLikerProfile` to preserve zero-breakage for any consumer that imported it directly. |
| **Q-EB-2** | Does `engagement-bar-01/demo.tsx` add tabs for LikersStrip + ShareMenu, or rely on post-card-01's demo? | (a) Add 2 new demo tabs to `engagement-bar-01/demo.tsx`; (b) No demo additions — post-card-01's Feed + Inline TR tabs already demo both | **(b)** ✅ **SIGNED OFF (re-validated).** Post-card-01's existing demo tabs ([demo.tsx](../../../src/registry/components/data/post-card-01/demo.tsx) Feed lines 38-58 + Inline TR lines 199-228) already exercise both parts in production-realistic contexts. Adding isolated demos would be scope-creep. v0.3 can add if asked. |

That's it. Two Q-EBs total. The rest is mechanical.

---

## 6. Success criteria

1. **2 files moved** from `post-card-01/parts/` → `engagement-bar-01/parts/`. Content byte-identical.
2. **4 new exports** in `engagement-bar-01/index.ts`. Compile clean.
3. **1 type renamed/added** per Q-EB-1 resolution (`PostLikeUser` → `EngagementLikerProfile` at engagement-bar-01/types.ts, with `@deprecated` alias still exported from post-card-01 v0.2.0).
4. **meta.ts version bumped** `0.1.2` → `0.2.0`, features list + tags updated, `updatedAt` is today.
5. **registry.json** engagement-bar-01 item has 2 new files added. Locked target convention preserved.
6. **Smoke harness clean** for `engagement-bar-01` slug — install + consumer-side `pnpm tsc --noEmit` post-install both pass (F-cross-11 path-b, per post-card-01 v0.2.0 plan Q-P35; the harness extension lands at post-card-01 C12 but the dual-slug run here uses whatever harness state exists at C0-3 time; if the harness doesn't have consumer-tsc yet, run plain shadcn-add smoke).
7. **Zero breaking changes verified.** Every existing engagement-bar-01 demo + every existing consumer of `EngagementBar01` / `EngagementHeartBurst` / `engagementReducer` / `useEngagementState` / `formatEngagementCount` compiles + runs identically without source modification.
8. **GATE 3 spotcheck file authored** at `docs/procomps/engagement-bar-01-procomp/reviews/<YYYY-MM-DD>-v0.2.0-spotcheck.md`. Fixed core (Dim 1/9/10/12) + rotating dim **Public API** (the additive surface is the obvious choice). Verdict ≥ `Pass with follow-ups`.

---

## 7. Pre-emptive locks (inherited from precedents)

- **Additive expansion. Zero breaking changes** to the v0.1.x API surface. `EngagementBar01` + 11 existing exports unchanged.
- **LikersStrip + ShareMenu component code is unchanged** during the move. Same source, same behavior, same a11y, same Tailwind classes. v0.1.1's sweep review already cleared their quality.
- **Sub-export pattern matches `EngagementHeartBurst`** — both are sealed parts re-exported at the top level. Same shape: `export { Component } from "./parts/<file>"; export type { ComponentProps } from "./parts/<file>";`.
- **`"use client"` boundaries preserved.** LikersStrip is `"use client"` (owns drag-scroll pointer state + load-more local state). ShareMenu is `"use client"` (owns query + searchResults state). EngagementHeartBurst stays RSC-compatible (pure CSS-driven).
- **No new shadcn primitives.** `avatar`, `button`, `input` — already required by engagement-bar-01 indirectly via the inline panels (post-card-01) but not declared in its meta yet. v0.2.0 ALSO updates `engagement-bar-01/meta.ts` `dependencies.shadcn` to add `avatar` + `input` to the existing `["button"]` — explicit declaration of what the new parts depend on. This is a meta-only change; no new shadcn installs needed for any consumer (already in the project / consumer base).
- **No framer-motion.** LikersStrip uses raw pointer events + CSS `transform`; ShareMenu uses raw `<input>` + filter. Both already free of any motion library.
- **`React.memo` at export** for both new parts (already memo'd in the source at post-card-01/v0.1.1).
- **Locked target convention** for registry.json: every file `type: "registry:component"`, `target: "components/engagement-bar-01/<sub>"`. Never ship `demo.tsx` / `usage.tsx` / `meta.ts`. (engagement-bar-01 has no `-fixtures` sibling yet; no dummy-data file involved.)
- **GATE 3 required** (public-API-touching minor bump). Patch-bump exemption does NOT apply. Spotcheck template; rotating dim = Public API.

---

**Status:** ✅ GATE 1 SIGNED OFF (2026-05-27). Q-EB-1 + Q-EB-2 locked. Plan addendum at [engagement-bar-01-procomp-plan-v0.2.0.md](./engagement-bar-01-procomp-plan-v0.2.0.md).

**Estimated full v0.2.0 ship time** (description + plan + impl + spotcheck): ~2–3h. ~30min for plan, ~45min for impl (file moves + index.ts edits + meta updates + registry.json + dual-slug smoke), ~30min for spotcheck.
