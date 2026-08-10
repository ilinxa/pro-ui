# HANDOFF — 2026-05-27 — post-card-01 v0.2.0 mid-implementation pause

> **Session state:** 8 commits locked on `master` (engagement-bar-01 v0.2.0 + post-card-01 v0.2.0 C0–C7). Implementation paused at C7 completion; C8–C12 remain. **No uncommitted work.** Working tree clean.
>
> **Resume readiness:** read this file first, then [STATUS.md](STATUS.md) for project context, then the plan addendum at [docs/procomps/post-card-01-procomp/post-card-01-procomp-plan-v0.2.0.md](../docs/procomps/post-card-01-procomp/post-card-01-procomp-plan-v0.2.0.md) for the C8 → C12 contract.

---

## What landed this session (8 commits, `7b453a3` → `fb05bee`)

| Commit | Step | Description |
|---|---|---|
| `7b453a3` | **C0** prerequisite | engagement-bar-01 v0.1.2 → v0.2.0 — `LikersStrip` + `ShareMenu` extracted as sub-exports; `EngagementLikerProfile` type added; meta + registry.json updated; GATE 3 spotcheck Pass. Unblocked post-card-01 v0.2.0. |
| `70a7a76` | **C1** | `types.ts` — 11 new types (`PostViewerMode` / `PostPermissions` / `PostPermissionAction` / `PostMutationHandlers` / `PostVisibility` / `PostMention` / `PostLocation` / `PostReplyTo` / `PostPollOption` / `PostPoll` / `LinkPreview`); 12 new optional `Post` fields; 26 new label keys + defaults; extended `PostCard01Props` (8 render-handler props + 4 slots + 4 disable opt-outs + role-aware trio); `@deprecated PostLikeUser` alias of `EngagementLikerProfile`. PostCard01Handle additions deferred to C3. |
| `ce99901` | **C2** | `lib/permissions.ts` (new) — pure resolver + dual-mode kebab helper. `defaultPostKebabActions` extended with optional trailing args (Q-P29); legacy path preserved zero-drift; skip-undefined merge fix from re-validation. Plan refinement: incremental registry.json updates per commit (not deferred to C12). |
| `5acd2ff` | **C3** | `post-card-01.tsx` — `pollVote` + `sensitiveRevealed` local state; 5 new imperative handle methods (`triggerEdit` / `triggerDelete` / `triggerPin` / `revealSensitive` / `votePoll`); handler-ref pattern for stable handle identity; `reset()` clears all 3 local-mirror fields. `PostCard01Handle` interface extended in types.ts (deferred from C1). |
| `aa6c0fa` | **C4** | 3 new RSC parts (`pinned-badge.tsx` / `visibility-badge.tsx` / `edited-suffix.tsx`); `post-header.tsx` rewritten with truncation discipline (F-11 closure) + 5 new render zones (pinned-badge / replyTo sub-line / editedAt suffix / visibility-badge / location chip); 4 variants updated to pass full labels + new callbacks. +`replyingTo` label (missed in C1). |
| `d07788e` | **C5** | 2 new client-component parts (`mention-text.tsx` / `tag-chips.tsx`) — both required `"use client"` due to onClick handlers (re-validation finding; description's RSC claim was overoptimistic). F-Plan-7 closure: default `renderContent` stays `<ExpandableText01>`; MentionText is opt-in via slot. TagChips auto-renders below content in all 4 variants. Both sub-exported from index.ts. |
| `0503bec` | **C6** | `parts/sensitive-gate.tsx` (`"use client"`) — absolute-positioned overlay with backdrop-blur; ShieldAlert + heading + reason + shadcn Button reveal; `motion-reduce:transition-none` (Q-P41); `role="alert"` + `aria-live="polite"`; keyboard-operable. Wired into feed + detail only (per description §1.3); compact + list receive props via baseProps but don't render the gate. |
| `fb05bee` | **C7** | `parts/link-preview-card.tsx` (`"use client"`) — OG-style preview with hero image + title + description + hostname; polymorphic root (button when onClick provided, anchor otherwise); safe hostname extraction; render-skip guard for bare-URL previews (no metadata = return null); `disableLinkPreviewRender` + `renderLinkPreview` slot wired through. |

**Tip SHA: `fb05bee`.** All 8 commits unpushed (per local-only workflow — push at end of v0.2.0 ship at C12 closure).

---

## What's still pending (C8 → C12)

| Step | Scope | Estimated time | Files touched |
|---|---|---|---|
| **C8** | Repost mini-card (`parts/repost-of-card.tsx` `"use client"`) — nested `<PostCard01 variant="compact" engagementMode="navigate" viewerMode="viewer" engagementActions={() => []}>` (empty-array suppresses bar per Q-P30 / F-Plan-1 closure); recursion-strip helper (`{...post.repostOf, repostOf: undefined}` to prevent infinite nesting); `onRepostOfClick` override → `getHref(repostOf)` default. Renders feed + detail only. | ~45 min | 1 new part + feed-variant.tsx + detail-variant.tsx + variant-shared.ts + registry.json |
| **C9** | Poll widget (`parts/poll-widget.tsx` `"use client"`) — viewer vote buttons / owner live-results bar chart; CSS `transition-[width]` + `motion-reduce:transition-none` (Q-P17 / Q-P41); optimistic vote flow (Q-P32) wires through C3's `pollVote` local-mirror; `closesAt` countdown via `formatRelativeTime`. Wired in feed + detail only. | ~1.5 hr | 1 new part + feed-variant.tsx + detail-variant.tsx + variant-shared.ts + thread `pollVote` baseProp + registry.json |
| **C10** | Responsive sweep — apply description §2.1-B step rules across all 4 variants + post-header + likers-strip + share-menu (the latter two now live in engagement-bar-01 per C0). **Run a programmatic grep-scan first** (per "Audit systematic scope" memory) — `Set` of all `p-\d` / `text-(xs\|sm\|base\|lg)` / `h-\d \|w-\d` strings under `parts/`. Touch targets ≥44×44 verified. 7-viewport visual sweep (320 / 360 / 414 / 768 / 1024 / 1280 / 1440). | ~2 hr | All 4 variant parts + post-header.tsx (post-card-01) + likers-strip + share-menu (engagement-bar-01) |
| **C11** | Kebab role-aware wiring — replace the `kebabItems` useMemo block in post-card-01.tsx with the extended `defaultPostKebabActions` signature from C2. Thread `viewerMode` + `permissions` + `canPerformAction` + `mutationHandlers` (assembled from destructured handlers) into the helper call. Visibility item is single trigger (Q-P42 — no library picker UI). Manual kebab walkthrough in 3 modes (owner / viewer / legacy). | ~1.5 hr | post-card-01.tsx (kebabItems useMemo block) + verify against C2's truth table |
| **C12** | Demo refresh + smoke harness extension + version bump — rewrite `demo.tsx` per Q-D7 (refresh 9 v0.1 tabs in-place + add 3 new tabs Repost/Poll/Sensitive; single responsive strip; 12 tabs total); update `dummy-data.ts` with new field examples (pinned post / sensitive post / poll post / repostOf post / linkPreview post / replyTo post); **extend smoke harness with consumer-side `pnpm tsc --noEmit`** per Q-P35 / F-01 closure; bump `meta.ts` version `0.1.1` → `0.2.0` + `updatedAt`; full smoke run; GATE 3 spotcheck. | ~2.5 hr | demo.tsx + dummy-data.ts + meta.ts + smoke harness files + GATE 3 spotcheck review file |

**Total estimated remaining: ~8 hours of focused work.** C12 is the version-bump + ship boundary; until then post-card-01 stays at v0.1.1 in meta.ts (even though the source carries v0.2.0 work — consumer install pulls v0.1.1 until C12 lands + Vercel redeploys).

---

## Locked decisions (all signed-off; no re-litigation needed on resume)

### From GATE 1 (description) Q-D# locks

- **Q-D1=(b)** — simple `viewerMode?: "owner" | "viewer"` toggle; no auto-derivation; no moderator tier (slot-driven). User instruction: library makes no identity assumptions.
- **Q-D2=(c)** — Permissions resolver scoped to `post-card-01/lib/permissions.ts`. Cross-card charter is v0.3+ work.
- **Q-D3=(b)** — Nested repost = counts-only, no engagement bar. Resolution mechanism per Q-P30 / F-Plan-1: empty `engagementActions={() => []}` slot suppresses the bar.
- **Q-D4=(b)** — Host pre-fetches `linkPreview`; library is fetch-free.
- **Q-D5=(a)** — Poll vote optimistic (local mirror `pollVote` field).
- **Q-D6=(a)** — Per-post sensitive gate (not per-MediaItem).
- **Q-D7=(c)** — Refresh v0.1 demo tabs in-place + add 3 new tabs for schema-only concepts (Repost / Poll / Sensitive); single strip; 12 tabs total. User instruction: replace v1 examples with v2.
- **Q-D8=(a)** — F-01 closure: smoke harness extended with consumer-side `pnpm tsc --noEmit`. Lands at C12.
- **Q-D9=(b)** — Single extended `defaultPostKebabActions` helper (not 3 role-aware helpers).
- **Q-D10=(b)** — `post-editor-01` GATE 1 sequenced AFTER post-card-01 v0.2.0 GATE 3.

### From GATE 2 (plan) Q-P# locks

- **Q-P30** — Nested repost bar suppression via `engagementActions={() => []}` (not new prop, not `renderEngagementBar={() => null}`).
- **Q-P37=(a)** — engagement-bar-01 v0.2.0 ships FIRST as blocking prerequisite. **DONE** (C0).
- **Q-P42** — Library ships NO visibility picker UI. `onChangeVisibility(postId, currentVisibility)` is a single trigger; host opens its own picker (banner/sheet/dialog/wherever). Lightest possible footprint.
- **Q-P43** — Facebook-style extensible `PostVisibility = "public" | "followers" | "friends" | "circle" | "only-me" | "private" | (string & {})`. 6 base values with autocomplete + branded extension for granular per-app values.

### From engagement-bar-01 v0.2.0 (C0)

- **Q-EB-1=(c)** — Two parallel types coexist: `EngagementLikeUser` (strict, for delta payloads) + `EngagementLikerProfile` (relaxed, for UI display). `PostLikeUser` stays as `@deprecated` alias in post-card-01 v0.2.0.
- **Q-EB-2=(b)** — No demo additions in engagement-bar-01 v0.2.0; post-card-01's existing demos cover both parts.

---

## Resume instructions for fresh session

1. **Read this file first** (you're already doing that if reading the handoff).
2. **Read [STATUS.md](STATUS.md)** — confirm engagement-bar-01 row is `v0.2.0` and post-card-01 row is still `v0.1.1` (v0.2.0 lands at C12).
3. **Read [docs/procomps/post-card-01-procomp/post-card-01-procomp-plan-v0.2.0.md](../docs/procomps/post-card-01-procomp/post-card-01-procomp-plan-v0.2.0.md)** — the GATE 2 plan is the implementation contract. C0 + C1–C7 in §2 are done; C8 → C12 remain.
4. **Read [docs/procomps/post-card-01-procomp/post-card-01-procomp-description-v0.2.0.md](../docs/procomps/post-card-01-procomp/post-card-01-procomp-description-v0.2.0.md)** if you need the "what & why" context.
5. **Verify state:**
   ```
   git log --oneline -8        # should show fb05bee..7b453a3
   pnpm tsc --noEmit           # clean
   pnpm validate:meta-deps     # 49/49 clean
   pnpm registry:build         # clean
   git status                  # clean working tree (only .claude/scheduled_tasks.lock untracked)
   ```
6. **Start C8** by following the pattern established in C4–C7:
   - Create the new part (`parts/repost-of-card.tsx`, `"use client"`)
   - Thread its props through `variant-shared.ts` → `post-card-01.tsx` → feed/detail variants
   - Update `registry.json` incrementally (don't defer to C12)
   - Verify: tsc + validate-meta-deps + registry-build
   - Present completion + recommendation; user reviews + says "go to next step"; commit + start C9.

### Critical pattern from this session

- **One commit per C-step.** Don't batch C-steps into a single commit; git bisect benefits from atomic boundaries.
- **Re-validation pass per step.** "Re-validation pass catches real issues" memory holds — every step in this session surfaced 1–2 fixable findings (overoptimistic RSC claims, edge cases in resolvers, plan ambiguities). Trust the pattern.
- **`registry.json` updates incrementally.** Plan §2 C12 originally bundled all registry.json updates; plan refinement at C2 distributed them per-step. Don't revert.
- **Compact + list variants receive v0.2.0 gate/preview/repost props via baseProps but don't render them** (description §1.3 scopes those to feed + detail only). The destructuring pattern in those variants intentionally omits the new props — TS allows this.

### Things NOT to do on resume

- Don't push to `master` until C12 closure + GATE 3 spotcheck. The 8 commits are local-only by design (intermediate states have broken-deploy potential between commits if pushed standalone — registry.json now lists files for v0.2.0 work but meta version still v0.1.1; consumer install would get partial v0.2.0 surface area).
- Don't bump `meta.ts` version yet. Stays `0.1.1` until C12.
- Don't touch the `engagement-bar-01` slug. It shipped clean in C0; further edits are out of scope.
- Don't add `onTakeDown` / `onFeature` / "moderator" tier types — explicitly out of scope per Q-D1=(b) lock.
- Don't try to make `MentionText` / `TagChips` / `LinkPreviewCard` / `SensitiveGate` RSC-compatible — onClick handlers require `"use client"`. The description claimed RSC; reality is event handlers force client boundary. Plan refinement noted in C5 commit message.

---

## Session-end verification (just now)

- `git log --oneline -8`: 8 commits from `fb05bee` back to `7b453a3` (all post-card-01 v0.2.0 + engagement-bar-01 v0.2.0 work). Previous tip was `44e943a` (cms-panel-01 GATE 1 description draft).
- `pnpm tsc --noEmit`: clean.
- `pnpm validate:meta-deps`: 49/49 clean.
- `pnpm registry:build`: clean; post-card-01.json artifact: 19 files (was 13 pre-v0.2.0 = +1 lib/permissions.ts + 6 new render parts − 0 removed; the 2 removed (likers-strip + share-menu) were already removed at C0).
- Working tree: clean except `.claude/scheduled_tasks.lock` (pre-existing, unrelated).

**Status: locked + safe to resume in fresh session.**

---

**Authored:** 2026-05-27 by Claude — session pause after C7 completion. Resume at C8 (repost-of-card).
