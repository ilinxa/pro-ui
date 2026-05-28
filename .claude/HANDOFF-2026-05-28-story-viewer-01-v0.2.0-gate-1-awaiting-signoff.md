# HANDOFF — 2026-05-28 — story-viewer-01 v0.2.0 GATE 1 awaiting sign-off

> **Session-pause state-lock.** Resume from this file in a fresh chat — has everything needed to continue without re-discovery.

---

## Tip + working tree

- **git tip:** `c229be3` (`fix(post-card-01): v0.3.2 — inline PostMediaItem to dodge cross-cat /types rewriter bug`).
- **Working tree:** clean after this commit lands. (This commit itself bundles the GATE 1 description + STATUS update + handoff — see "Commits in this state-lock" below.)

## What just happened in this session

1. **Snapshot drift fix** (early session) — `docs/component-versions.md` rich-sidebar 0.2.4 → 0.3.0, forms count 7→8, marketing count 4→5, verify math 41→49; `.gitignore` `.claude/*.lock`. Bundled into the ILX commit.
2. **ILX-3 + ILX-4 ship** — backend-team findings closed:
   - post-card-01 v0.2.1 → **v0.3.0** (moderator section: `moderatorActions` + `canModerate` + `"moderate"` discriminator)
   - comment-thread-01 v0.1.0 → **v0.2.0** (`Comment.edited` + `editedSuffix` + `CommentMenuItem.separatorBefore`)
   - Both with GATE 3 spotchecks (Pass with follow-ups) + decision file at [`.claude/decisions/2026-05-28-ilx-3-and-ilx-4-moderator-and-edited-comment.md`](decisions/2026-05-28-ilx-3-and-ilx-4-moderator-and-edited-comment.md). Commit: `bbe1c64`.
3. **3-patch smoke loop** (post-push F-S1 + F-cross-13 surfaces from the v0.3.0 ship):
   - post-card-01 v0.3.0 → **v0.3.1** (F-S1: 32 cross-procomp absolute imports across 9 files → relative + specific-file). Commit: `1cdb240`.
   - comment-thread-01 v0.2.0 → **v0.2.1** + media-carousel-01 v0.1.2 → **v0.1.3** (F-cross-13: `<DropdownMenuTrigger asChild>{<Button>}` → `buttonVariants(…)` pattern + sibling F-S1 hygiene). Commit: `b52d22d`.
   - post-card-01 v0.3.1 → **v0.3.2** (cross-category `/types` inline-copy: `PostMediaItem` + soft-compat `MediaItem` alias). Commit: `c229be3`.
   - Final smoke: ✅ green (install + consumer-tsc clean across post-card-01 + comment-thread-01 + media-carousel-01 + engagement-bar-01 + expandable-text-01 + video-player-01). Only remaining tsc noise is pre-existing `ui/dialog.tsx` `icon-sm` size variant — unrelated to any procomp.
4. **Memory updates** — F-cross-13 carrier list extended with `DropdownMenuTrigger asChild`; F-S1 lock memo extended with Bug 3 (cross-cat `/types` inline-copy pattern).
5. **Deep review** — story-rail-01 + story-viewer-01 audited against the post-card-01 A+ recipe (this conversation). Grade snapshot below.
6. **GATE 1 description** — authored at [`docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description-v0.2.0.md`](../docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description-v0.2.0.md). 7 Q-Ps locked (3 by user + 4 by re-validation against Instagram / TikTok / Snapchat conventions).

---

## Grade snapshot from the deep review

| Component | Grade | One-line verdict |
|---|---|---|
| `story-rail-01` v0.2.0 | **A−** | Architecturally complete; matches A+ recipe at every load-bearing dimension. Only gap: usage.tsx code snippets still show v0.1 positional `onItemClick(item, index)` shape. **One-commit patch closes it.** |
| `story-viewer-01` v0.1.2 | **B+** | Strong core (ID-anchored cursor, accumulator-based pause-preserving timer, 4 well-decomposed hooks, full keyboard/tap nav, ARIA progressbar). But **passive viewer** — missing the social-product engagement surface (reactions / reply composer / view-count for owner / share / DM / save-to-highlights). v0.2.0 closes this. |
| Doublet as a system | **B+** | Rail half is A−, viewer half is B+; viewer is the bottleneck. |

### Findings — minor correction since deep review

- **story-rail-01 F-01:** the deep review said "Two code snippets" with stale positional `onItemClick`. Actual count is **three** at usage.tsx lines **32, 53, 91** + a prose mention at line 10. Trivial — all four need updating to object-shape `({ item, index })`.
- All other findings (F-02 / F-03 / F-04 for rail; F-01–F-12 for viewer) verified accurate against current source.

---

## GATE 1 description — locked Q-Ps

Live at [`docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description-v0.2.0.md`](../docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description-v0.2.0.md). User signed off on Q-V1 / Q-V2 / Q-V5 (all my recommendations) + told me to "re-validate Q-V8/V9/V16/V17 against well-known social platforms". I did the platform-alignment check and updated those four; results below.

| Q-P | Final lock | Source |
|---|---|---|
| **Q-V1** Reply composer position | **(a) Always-visible bottom bar** (Instagram default) | User-locked |
| **Q-V2** Engagement-bar variant | **(a) `variant="stacked"`** (TikTok/Reels exact for portrait media) | User-locked |
| **Q-V5** View-count data shape | **(c) Hybrid eager-count + lazy-users-list** | User-locked |
| **Q-V8** Long-press pause | **(a) Additive** — long-press is canonical mobile gesture; middle-tap-pause stays as desktop fallback | Re-validated (Instagram/TikTok/Snapchat all use long-press; middle-tap was v0.1 kasder-specific) |
| **Q-V9** `StoryItem.link` CTA | **(a) Bottom button for v0.2.0**; plan **(c) link sticker for v0.3.0** | Re-validated (Instagram retired swipe-up in 2021; current default is sticker but needs sticker primitive we don't have) |
| **Q-V16** `subscribe` prop rename | **(a) Keep `subscribe` + add `engagementSubscribe`** (asymmetric, zero v0.1 breakage) | Re-validated (no platform precedent for typed realtime API; zero-breakage wins) |
| **Q-V17** Kebab placement | **(b) 6th item in engagement-overlay stack; fallback to (a) header when `disableEngagement: true`** | **REVISED** — my original draft (a) header-kebab is NOT used by any major platform. Instagram (2024)/TikTok/Snapchat/Reels all put kebab in engagement overlay or bottom-right floating. Header-kebab is a desktop-app pattern, not story-viewer pattern |

Pre-locked Q-Ps from precedent (no user attention needed unless they object): Q-V3 / Q-V4 / Q-V6 / Q-V7 / Q-V10 / Q-V11 / Q-V12 / Q-V13 / Q-V14 / Q-V15. All inherit post-card-01 / engagement-bar v0.3 / F-S1 / F-cross-13 patterns documented inline in the description doc.

---

## Next step on resume — GATE 2 (plan-v0.2.0.md)

**Authority for the workflow:** [`.claude/CLAUDE.md` § Workflow](CLAUDE.md) — GATE 1 description signed off → author GATE 2 plan → user sign-off → implementation chain C1–CN → GATE 3 spotcheck.

**GATE 2 plan should cover:**

1. **Commit chain C1–CN** — proposed split (estimated 8–10 implementation commits):
   - C0: pre-flight — F-S1 import fix at `parts/item-view.tsx` + touch-target patch at `parts/viewer-header.tsx` (the two bundled hygiene items per description §13/§14). Independent of v0.2.0 scope; could ship as v0.1.3 first OR roll into C1.
   - C1: types expansion (Story.viewerCount, StoryItem.link, StoryViewerPermissions, StoryEngagementDelta, StoryPermissionAction, expanded Handle + Props + Labels)
   - C2: `lib/permissions.ts` (copy post-card-01's resolver + adapt action keys: edit→saveToHighlights, etc.)
   - C3: engagement overlay (compose EngagementBar01 variant=stacked + EngagementAction[] resolver + engagementSubscribe wiring)
   - C4: reply composer (compose CommentComposer; auto-pause-on-type wiring; replyComposer state machine)
   - C5: owner overlay (view-count strip + lazy viewers list panel using LikersStrip sub-export)
   - C6: kebab assembly (lib/kebab.ts — same dual-mode helper shape as post-card-01's lib/defaults.tsx defaultPostKebabActions; engagement-overlay placement + header fallback)
   - C7: render slots (renderHeader / renderProgress / renderNavArrows / renderTapZones / renderEngagementOverlay / renderReplyComposer / renderOwnerOverlay)
   - C8: disable opt-outs (8 flags wired through)
   - C9: long-press pause + StoryItem.link CTA + linkComponent
   - C10: handle expansion (6 new methods) + demo refresh (+ 4 new tabs) + meta bump v0.1.2 → v0.2.0 + guide.md update + GATE 3 spotcheck + decision file
   - **C-bundle:** story-rail-01 v0.2.1 docs patch (3 onItemClick snippets fixed; could land in same final commit OR a separate precursor commit)
2. **Type schemas** — concrete TS for StoryViewerPermissions, StoryEngagementDelta union, StoryPermissionAction discriminator, expanded Story + StoryItem fields, expanded Handle + Labels.
3. **Slot signatures** — exact prop shape for each of the 7 new render slots.
4. **Permission resolver shape** — copy post-card-01 `lib/permissions.ts` verbatim; rename keys per the new action discriminator.
5. **Smoke expectations** — engagement-bar / dropdown-menu / popover usage = F-cross-13 carriers; expect a same-day patch loop (precedent: post-card-01 v0.3.0 → v0.3.1 → v0.3.2 today; engagement-bar v0.3.0 → v0.3.1 → v0.3.2 yesterday morning).
6. **Re-validation pass** — before declaring plan complete, audit the plan critically for: (a) any cross-category type imports (Bug 3 — inline-copy required); (b) any `<XxxTrigger asChild>{<Button>}` patterns (F-cross-13 — `buttonVariants()` pattern required); (c) zero-breakage matrix verification for all 6 existing demo tabs; (d) layout sketch for the engagement-overlay-with-kebab + header-with-kebab-fallback states.

**Estimated GATE 2 authoring time:** ~1 hour. After plan sign-off, implementation = ~1–2 working days.

---

## Concurrent in-flight (unchanged this session)

- **cms-panel-01 GATE 1 description** — awaiting user sign-off + answers to 10 open questions. Authored at [`docs/panels/cms-panel-01/cms-panel-01-description.md`](../docs/panels/cms-panel-01/cms-panel-01-description.md). Handoff: [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md). This handoff doesn't affect cms-panel-01 state.

## Commits in this state-lock

Single commit bundling:
- New: GATE 1 description doc (`docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description-v0.2.0.md`)
- New: this handoff (`.claude/HANDOFF-2026-05-28-story-viewer-01-v0.2.0-gate-1-awaiting-signoff.md`)
- Modified: `.claude/STATUS.md` (active handoff banner repointed; Recent activity entry added)

No code changes. No version bumps. Pure planning artifact + state-lock.

---

## Resume checklist (for fresh chat)

1. Read this file fully.
2. Read [`docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description-v0.2.0.md`](../docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description-v0.2.0.md) end-to-end (locked Q-Ps + full scope).
3. Read [`docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description.md`](../docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description.md) for v0.1.0 context.
4. Read [`docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-plan.md`](../docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-plan.md) — the v0.1 plan doc is the architectural anchor.
5. Skim [`docs/procomps/post-card-01-procomp/post-card-01-procomp-plan.md`](../docs/procomps/post-card-01-procomp/post-card-01-procomp-plan.md) — this is the A+ template the v0.2.0 plan should mirror.
6. Glance at [`src/registry/components/data/post-card-01/lib/permissions.ts`](../src/registry/components/data/post-card-01/lib/permissions.ts) — the resolver to copy + adapt.
7. Author `story-viewer-01-procomp-plan-v0.2.0.md` per the "GATE 2 plan should cover" outline above. Apply re-validation pass before declaring complete.
8. Pause for user sign-off on the plan before any code lands.

**Bundled small patch when resuming the work:** the story-rail-01 v0.2.1 usage.tsx docs fix (3 onItemClick snippets at lines 32/53/91) is trivial; can land in C0 of the v0.2.0 chain OR as a precursor commit.

---

**Status:** ✅ State locked. Working tree clean post-commit. cms-panel-01 GATE 1 in-flight unchanged. Tip will become `<new SHA>` after this commit lands.
