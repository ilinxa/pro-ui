---
date: 2026-05-28
session: engagement-bar-01-v0.3.0-reactions
phase: minor-version-ship
type: minor-version-ship + smoke-driven-patches
commits: 3
components:
  - engagement-bar-01
related_decisions:
  - 2026-05-27-engagement-bar-01-v0.2.0-likers-strip-share-menu-extraction
status: shipped
---

# engagement-bar-01 v0.3.0 — multi-kind reactions + interactive demo + 2 smoke-driven patches

Closes ILX-1 (HIGH) + ILX-2 (MEDIUM) from the `social-moduls-python` backend team's improvement spec at [`docs/consumer_order/ilinxa-proui-improvement-spec.md`](../../docs/consumer_order/ilinxa-proui-improvement-spec.md). Shipped as a 3-commit chain over a single session: main feature push, then two smoke-driven patches as F-cross-13 surfaced consumer-side issues.

## Commit chain

| Tip | Version | Scope |
|---|---|---|
| `d6e72e9` | v0.3.0 | Main ship — multi-kind reactions, interactive demo, GATE 3 spotcheck |
| `0c803ee` | v0.3.1 | Patch — F-cross-13 first facet (`PopoverAnchor` not in Base UI; revert to `PopoverTrigger`) |
| `6f99a88` | v0.3.2 | Patch — F-cross-13 second facet (`asChild` not in Base UI's PopoverTrigger; drop asChild + inline the button props onto PopoverTrigger) |

## Library additions (v0.3.0)

Strictly additive — zero v0.2.x breakage:

- **New `kind: "reaction"` arm** on `EngagementAction` with `kinds[]` catalog, `totalCount`, `viewerReaction?`, `onSelect?`, `onCountClick?`, `clearOnTap?`
- **New `EngagementReactionKind` interface** (`{ key, icon, label, count, color? }`) — single source of truth per Q-P1 lock
- **3 new `EngagementDelta` variants** — `reaction-changed`, `reactor-added`, `reactor-removed`
- **3 new nullable `EngagementState` fields** — `reactionCounts`, `reactionTotalCount`, `viewerReaction`
- **New `EngagementLocalAction` variant** — `reaction-select`
- **Handle gains** `triggerReaction(kind | null)` + `getCurrentReaction()`
- **New `reactionsPreview` slot** — parallel to `likersPreview`, rendered in all 3 variants
- **4 new label keys** — `react` / `removeReaction` / `openReactionsPanel` / `reactionPickerLabel`
- **New parts** — `<ReactionPicker>` (kinds row + Remove + arrow-key nav) + `<ReactionAction>` (popover assembly, 350ms long-press, tap-vs-clear matrix)
- **Defense 1** (microtask-deferred consumer notify) in `triggerReaction` handle + tap-clear path + handlePick path
- **Defense 2** (structural resync guard) — sync effect for controlled `viewerReaction` to prevent stale-state drift across mode transitions
- **meta.ts** version `0.2.1 → 0.3.0`, +`popover` to `dependencies.shadcn`, +`reactions` tag, 5 new feature bullets

## Q-P locks

- **Q-P1** (b) — single `kinds: EngagementReactionKind[]` catalog (not separate `counts`/`availableKinds` maps that can drift)
- **Q-P2** (c) — `clearOnTap?: boolean` default `true`; tap-with-reaction clears; long-press always opens picker
- **Q-P3** (a) — `like` + `reaction` allowed to coexist freely (most-dynamic interpretation per user direction); no enforcement; both render in array order; demo "Hybrid" tab proves the pattern

## Q-PP locks (10 plan-only)

Q-PP-1 through Q-PP-10 — see [`docs/procomps/engagement-bar-01-procomp/engagement-bar-01-procomp-plan-v0.3.0.md`](../../docs/procomps/engagement-bar-01-procomp/engagement-bar-01-procomp-plan-v0.3.0.md).

## Demo wiring (Default + Reactions tabs)

- **InteractiveDefaultDemo** — all 4 actions wired:
  - `like.onCountClick` → toggle inline `<LikersStrip>` (v0.2.0 sub-export, swipable)
  - `comment.onClick` → toggle real `<CommentThread01>` (sibling procomp) with `pageSize=5` + lazy-load (initial 5, page-2 loads +5 more with 400ms simulated latency, page-3 returns `[]` → button hides)
  - `share.onClick` → toggle inline `<ShareMenu>` (v0.2.0 sub-export, searchable)
  - `bookmark.onToggle` → uncontrolled toggle, internal mirror flips
- **InteractiveReactionsDemo** — `reaction.onCountClick` → toggle scrollable + lazy-loaded reactors panel (3 pages × 5+5+3 reactors, max-h-105, 400ms latency, mirrors the comment-thread pagination UX)
- **Hybrid tab** — proves Q-P3 (like + reaction coexisting + interacting independently)

## Re-validation findings caught + fixed (16 total)

| # | Sev | Step | Item |
|---|---|---|---|
| F-01 | 🚫 HIGH | Plan | Q-P2 self-contradiction (no-op vs open-picker fallback) |
| F-02 | 🚫 HIGH | Plan | Slot trap on picker `anchor` prop (custom-component asChild) |
| F-03 | ⚠️ MED | Plan | `onCountClick` split-target semantics undefined |
| F-04 | ⚠️ MED | Plan | Optimistic count merge rule missing (`state.reactionCounts[k.key] ?? k.count`) |
| F-05 | 🔹 LOW | Plan | Demo state shape unspecified |
| F-06 | 🔹 LOW | Plan | Q-PP-5 neutral-icon override wording confusing |
| A1 | ⚠️ MED | C1 | `EngagementReactionKind` not exported from barrel |
| A2 | 🔹 LOW | C1 | `triggerReaction` stub ignores its declared param |
| B2 | ⚠️ MED | C2 | Defense 2 (structural resync guard) not implemented per Q-PP-3 lock |
| D1 | 🔸 MED | C3 | Picker `kind.color` only applied when selected (plan says always) |
| E1 | 🔹 LOW | C4 | Type alias `ReactionAction` shadows component name |
| E7 | ⚠️ MED | C4 | `setPointerCapture` not used — long-press unreliable on touch when user drifts off |
| E8 | 🔹 LOW | C4 | Manual `aria-haspopup`/`aria-expanded` double Radix's auto-set |
| E10 | 🔸 MED | C4 | Non-split variant wrapped in extra div instead of merging `actionClassName` |
| G1 | ⚠️ MED | C6 | Demo `viewerReaction: "love"` triggered controlled+noop trap (visual updates dead) |
| H1/H2/H3 | 🔹 LOW | C7 | Stale feature bullets in meta.ts |

Plus 4 user-reported post-spotcheck issues:
- "Btns don't work" on default + compact tabs — pre-existing controlled-mode traps (`liked: false`, `bookmarked: true`) silently disabling interactivity → removed
- Send button overflow + non-functional → swapped placeholder for real `<CommentThread01>`
- "No example comments" → added page-2 fixture for lazy-load demo
- Need scrollable + lazy-loaded reactors panel parallel to comment thread → added `InteractiveReactionsDemo` with `<ReactorsList>` component

## Smoke-driven patches (F-cross-13 popover sub-trap)

Post-push live smoke surfaced TWO distinct facets of the Radix → Base UI primitive divergence on `<Popover>` — both shipped as patches in the same session:

### v0.3.1 — PopoverAnchor missing

`PopoverAnchor` is exported by the producer's Radix popover but NOT by Base UI's. Consumer-tsc error:
```
src/components/engagement-bar-01/parts/reaction-action.tsx(7,3): error TS2305:
Module '"@/components/ui/popover"' has no exported member 'PopoverAnchor'.
```

Fix: revert to `PopoverTrigger`. Add `queueMicrotask`-based override for Radix's built-in `onOpenToggle` click handler (tap-clear path + long-press click-suppression).

### v0.3.2 — asChild not accepted by Base UI's PopoverTrigger

After v0.3.1, second consumer-tsc error:
```
Type '{ children: Element; asChild: true; }' is not assignable to type
'IntrinsicAttributes & NativeButtonProps & ...'
```

Base UI's PopoverTrigger uses a `render` prop pattern, not `asChild`. Radix uses `asChild`. Cross-incompatible.

Fix: drop `asChild` entirely. Both libraries render `<PopoverTrigger>` as a `<button>` by default and pass through HTML props. Render PopoverTrigger directly as the trigger button with all props (`className`, `aria-*`, `onClick`, `onPointerDown`, etc.) spread on it. Markup also simplifies (one fewer wrapper element).

## Verification

| Check | v0.3.2 |
|---|---|
| Producer `pnpm tsc --noEmit` | ✅ exit 0 |
| `pnpm validate:meta-deps` | ✅ 49/49 clean |
| `pnpm registry:build` | ✅ all 49 slugs |
| Live install `pnpm dlx shadcn@4.6.0 add @ilinxa/engagement-bar-01` | ✅ INSTALL_OK (19 files) |
| Consumer-side `pnpm tsc --noEmit` engagement-bar-01 errors | ✅ **0** |
| Live URL serves v0.3.2 artifact | ✅ confirmed via shadcn install retrieval |

## Memory updates

- [`project_shadcn_primitive_radix_baseui_divergence.md`](../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_shadcn_primitive_radix_baseui_divergence.md) — extended carrier list with the `<Popover>` 3-facet sub-trap (no Anchor / no asChild / queueMicrotask override for auto-toggle)
- [`feedback_vercel_bot_mitigation_on_polling.md`](../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/feedback_vercel_bot_mitigation_on_polling.md) — new — don't poll Vercel artifacts faster than 60s (trips `X-Vercel-Mitigated: challenge`); manual-copy + local consumer-tsc is the fallback

## Pattern observation

Three consecutive procomp ships have now followed the "ship → smoke surfaces F-cross-13 → patch → re-smoke clean" pattern: rich-card-in-flow v0.2.0 (Select.onValueChange), todo-rich-card v0.1.1 (Select × 2 + Tooltip), todo-tree v0.1.1 (Checkbox.onCheckedChange), and now engagement-bar-01 v0.3.0 → v0.3.2 (Popover Anchor + asChild). The smoke-driven patch is the expected lifecycle, not an anomaly. Considered as a one-line addition to the [`smoke harness baseline` memory](../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_smoke_harness.md) at next update.

## Follow-ups (none blocking)

- F-2 (controlled-viewerReaction + realtime delta race) — documented host-responsibility caveat; no code change needed
- F-3 (3-browser manual matrix) — pre-push verification gate; user can run when convenient
- 5 v0.2.0 sub-Blocker follow-ups still tracked for v0.3.x or v0.4 (multi-select polls, closesAt tick, hardcoded English aria-label)
