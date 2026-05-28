---
date: 2026-05-28
session: post-engagement-bar-v0.3.2-cleanup
phase: post-2026-05-27-social-posts-system
type: minor-bump-coupled-ship
commits: [pending]
components:
  - post-card-01
  - comment-thread-01
findings:
  - ILX-3 (HIGH) — moderator section in post-card-01 kebab — CLOSED
  - ILX-4 (MEDIUM) — Comment.edited first-paint flag — CLOSED
  - drift-fix — docs/component-versions.md (rich-sidebar 0.2.4 → 0.3.0; forms count 7 → 8; marketing count 4 → 5; verification math 41 → 49) — CLOSED
  - drift-fix — .gitignore — `.claude/*.lock` added (scheduled-tasks runtime PID locks no longer untracked) — CLOSED
status: shipped (working tree; pre-push at decision-file authoring time)
---

# 2026-05-28 — post-card-01 v0.3.0 + comment-thread-01 v0.2.0 coupled ship (ILX-3 + ILX-4) + snapshot drift fixes

## Why this ship

Backend team `social-moduls-python` reviewed the 2026-05-27 v0.2.0 post-card-01 ship and 2026-05-28 morning v0.3.0/v0.3.1/v0.3.2 engagement-bar-01 reactions ship. They confirmed ILX-1 (reactions, HIGH) + ILX-2 (reactionsPreview slot, MEDIUM) shipped correctly, then flagged TWO more findings as **NOT in this ship**:

| ID | Severity | Surface | Status before this commit |
|---|---|---|---|
| ILX-3 | HIGH | post-card-01 moderator kebab section — `moderatorActions + canModerate + "moderate"` discriminator | ❌ `PostPermissionAction` union had 11 entries with no `"moderate"`; `PostPermissions` had no `canModerate`; no `moderatorActions` prop; JSDoc on `PostViewerMode` explicitly stated moderator UX was deferred to `kebabActions` full-takeover |
| ILX-4 | MEDIUM | `comment-thread-01` first-paint `(edited)` badge — `Comment.edited?: boolean` + `editedSuffix` label key | ❌ `Comment` interface had no `edited` field; `CommentThreadLabels` had no `editedSuffix`; only the realtime `{ kind: "edited" }` delta existed (and it only patched `content`) |

Both findings validated as legitimate spec gaps from the v0.2.0 ship — not bikeshed. The v0.2.0 description explicitly cut moderator UX out of scope (the JSDoc admits this), but the backend team's integration depends on a stable moderator section API, not a host-supplied `kebabActions` full-takeover (which would force every consumer to re-implement the entire owner / viewer / moderator kebab from scratch).

## What shipped

**post-card-01 v0.2.1 → v0.3.0 (additive minor):**

| Surface | Change |
|---|---|
| `PostPermissionAction` | + `"moderate"` (12th union arm) |
| `PostPermissions` | + `canModerate?: boolean` (default `false` in BOTH viewerMode defaults — orthogonal, never auto-derived from `viewerMode`) |
| `PostCard01Props` | + `moderatorActions?: (post: Post) => CommentMenuItem[]` |
| `defaultPostKebabActions` | new final optional `moderatorActions` arg; items injected between common items (Bookmark / Share / Copy link / Translate) and viewer-destructive items (Mute / Block / Report); first item carries `separatorBefore: true` |
| `PostHeader` kebab render | separator logic extended to honor explicit `separatorBefore` flag composed with the existing destructive-boundary divider |
| `lib/permissions.ts` `PERMISSION_DEFAULTS_BY_MODE` | both `owner` + `viewer` rows now carry `canModerate: false`; the resolver's `Required<PostPermissions>` contract holds |
| `PostViewerMode` JSDoc | rewritten — drops stale "moderator slot-driven via kebabActions" claim; documents the new wiring |
| Demo | + `ModeratorTab` wires Feature / Lock / Remove items with permission opt-in |
| Usage | + v0.3.0 section documenting `moderatorActions` + `canModerate` + `"moderate"` discriminator + resolution order |
| Meta | bumped to 0.3.0; +1 feature entry referencing ILX-3 |

**comment-thread-01 v0.1.0 → v0.2.0 (additive minor):**

| Surface | Change |
|---|---|
| `Comment` | + `edited?: boolean` (optional; falsy = no suffix; only `true` renders) |
| `CommentMenuItem` | + `separatorBefore?: boolean` (reusable additive flag — first consumer is post-card-01 v0.3.0's moderator section; same flag is already idiomatic on `flow-canvas-01/types.ts:113` for `ContextMenuItem`) |
| `CommentThreadLabels` | + `editedSuffix?: string` (default `"(edited)"`) |
| `DEFAULT_COMMENT_THREAD_LABELS` | + `editedSuffix: "(edited)"` |
| `commentReducer` | `{ kind: "edited" }` realtime delta arm now also flips `edited: true` — first-paint and post-realtime UI behave identically |
| `CommentNode` render | Conditional `(edited)` suffix in the timestamp row when `comment.edited === true`; rendered as a muted inner `<span>` for visual de-emphasis |
| Demo dummy data | Existing `c3` comment (Ines Park) now has `edited: true` + body extended to explain the edit — surfaces the badge in the docs without inventing a new demo tab |
| Usage | + v0.2.0 "edited badge" section + `separatorBefore` example in the kebab snippet + 2 new Notes entries |
| Meta | bumped to 0.2.0; +2 feature entries referencing ILX-4 + `separatorBefore` |

## Zero-breakage analysis

Every new public API entry is optional + has a default that matches v0.1.x / v0.2.x behavior:

- `Comment.edited` omitted → no suffix rendered (== v0.1)
- `PostPermissions.canModerate` omitted → `false` default → moderator section never renders (no v0.2 consumer was using this)
- `moderatorActions` omitted → no moderator section even if `canModerate: true` (triple-guard: `canDo("moderate") && moderatorActions && modItems.length > 0`)
- `separatorBefore` omitted → no explicit divider; existing destructive-boundary divider unchanged
- `editedSuffix` omitted → default `"(edited)"` (only matters if `comment.edited === true`)
- Realtime `{ kind: "edited" }` delta semantics shift: now flips `edited: true` alongside the content patch. **The v0.1 behavior was a bug** — a realtime-edited comment didn't surface as edited in the UI. No consumer can be depending on the absence of the flag.

`kebabActions` full-takeover semantics unchanged — when supplied, it bypasses the moderator section entirely. v0.2 consumers using `kebabActions` for moderator semantics still work.

## Bundled snapshot drift fixes

The same commit closes drift findings surfaced during the session-open "validate the state" pass:

- `docs/component-versions.md` `rich-sidebar` row was stale at `0.2.4`; meta.ts truth is `0.3.0`. Fixed.
- `docs/component-versions.md` `forms` count `7` → `8` (`registration-form-01` was missing from tally).
- `docs/component-versions.md` `marketing` count `4` → `5` (`pricing-table-01` was missing from tally).
- `docs/component-versions.md` Verification-method math `21 + 6 + 2 + 4 + 4 + 2 + 1 + 1 = 41` rewritten to `24 + 8 + 5 + 4 + 4 + 2 + 1 + 1 = 49`.
- `.gitignore` `.claude/*.lock` added — scheduled-tasks runtime PID lock no longer surfaces as untracked.

## GATE 3 spotchecks

Both procomps got a v0.3.0 / v0.2.0 spotcheck file authored as part of this commit:

- [`docs/procomps/post-card-01-procomp/reviews/2026-05-28-v0.3.0-spotcheck.md`](../../docs/procomps/post-card-01-procomp/reviews/2026-05-28-v0.3.0-spotcheck.md) — Verdict: **Pass with follow-ups**. 3 findings (F-01 post-push smoke; F-02 `patch-content` asymmetry JSDoc note → v0.2.1 of comment-thread; F-03 optional `viewerMode="moderator"` preset deferred to v0.4 conditional on host request).
- [`docs/procomps/comment-thread-01-procomp/reviews/2026-05-28-v0.2.0-spotcheck.md`](../../docs/procomps/comment-thread-01-procomp/reviews/2026-05-28-v0.2.0-spotcheck.md) — Verdict: **Pass with follow-ups**. 3 findings (F-01 post-push smoke; F-02 same `patch-content` JSDoc note as the sibling spotcheck; F-03 standalone `<CommentKebab>` doesn't currently consume `separatorBefore` — informational asymmetry, optional v0.2.1).

Rotating dimension on both: **Public API**. Self-review acceptable per the readiness-review rule (pro-component v0.x → v0.x.next minors).

## Post-push protocol

Standard sequence per the engagement-bar v0.3.0 → v0.3.2 pattern:

1. Push this commit.
2. Vercel rebuilds (~2 min).
3. Run `node scripts/smoke-all.mjs --slug post-card-01 --slug comment-thread-01` at `e:/tmp/ilinxa-smoke-consumer/`.
4. If both `install` + `tsc` pass → F-01 closes on both spotchecks; v0.3.0 + v0.2.0 GATE 3 fully closed.
5. If F-cross-13 sub-trap surfaces → patch + v0.3.1 / v0.2.1 same session (same pattern as engagement-bar v0.3.0 → v0.3.1 → v0.3.2 earlier today).

post-card-01 has very low F-cross-13 surface (no new Select / Tooltip / Popover wiring); comment-thread-01 has effectively zero (additive type + render only). Smoke is highly likely to pass first run.

## Files touched (15)

```
.claude/STATUS.md                                                        (Components table 2 rows + Recent activity)
.gitignore                                                               (.claude/*.lock entry)
docs/component-versions.md                                               (3 rows + 2 cat counts + verify math)
public/r/comment-thread-01.json                                          (regenerated)
public/r/post-card-01.json                                               (regenerated)
src/registry/components/data/comment-thread-01/dummy-data.ts             (c3 edited: true)
src/registry/components/data/comment-thread-01/hooks/use-comment-state.ts (edited delta flips edited:true)
src/registry/components/data/comment-thread-01/meta.ts                   (v0.2.0 + 2 features)
src/registry/components/data/comment-thread-01/parts/comment-node.tsx    (edited suffix render)
src/registry/components/data/comment-thread-01/types.ts                  (Comment.edited + separatorBefore + editedSuffix)
src/registry/components/data/comment-thread-01/usage.tsx                 (v0.2.0 section + notes)
src/registry/components/data/post-card-01/demo.tsx                       (Moderator tab)
src/registry/components/data/post-card-01/lib/defaults.tsx               (moderatorActions arg + section injection)
src/registry/components/data/post-card-01/lib/permissions.ts             (canModerate: false in both modes)
src/registry/components/data/post-card-01/meta.ts                        (v0.3.0 + 1 feature)
src/registry/components/data/post-card-01/parts/post-header.tsx          (separator logic extended)
src/registry/components/data/post-card-01/post-card-01.tsx               (moderatorActions destructured + threaded)
src/registry/components/data/post-card-01/types.ts                       (moderate / canModerate / moderatorActions + stale JSDoc)
src/registry/components/data/post-card-01/usage.tsx                      (v0.3.0 moderator section docs)
docs/procomps/post-card-01-procomp/reviews/2026-05-28-v0.3.0-spotcheck.md     (NEW)
docs/procomps/comment-thread-01-procomp/reviews/2026-05-28-v0.2.0-spotcheck.md (NEW)
.claude/decisions/2026-05-28-ilx-3-and-ilx-4-moderator-and-edited-comment.md  (NEW — this file)
```

## Verification trio

- `pnpm tsc --noEmit` — clean
- `pnpm validate:meta-deps` — 49/49 clean
- `pnpm registry:build` — all 49 artifacts regenerated clean
- `pnpm lint` — clean on changed files (pre-existing warnings in rich-sidebar / todo-tree unrelated)
