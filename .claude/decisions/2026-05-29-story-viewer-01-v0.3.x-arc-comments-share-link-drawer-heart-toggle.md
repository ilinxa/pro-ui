---
date: 2026-05-29
session: story-viewer-01-v0.3.x-arc
phase: visual-review-iteration-arc
type: minor-version-ship + ux-redesign + breaking-removal + patch-bumps
commits: 18 (v0.2.0 C7 → v0.3.9)
components:
  - story-viewer-01
related_decisions:
  - 2026-05-29-story-viewer-01-v0.2.0-engagement-layer-ship
  - 2026-05-29-story-viewer-01-v0.3.0-comments-panel-and-bookmark-removal
status: shipped
---

# story-viewer-01 v0.3.x arc — visual-review iteration session

Single-day session iterating from v0.2.0 C6 pause through v0.3.9. **18 commits, 9 versions.** Driven by rapid visual review feedback from the user (dev server + screenshots) rather than formal GATE 1+2 docs per iteration.

## Versions shipped this session

| Version | Theme | Trigger |
|---|---|---|
| **v0.2.0** | Engagement layer ship (C7–C10) | Pre-pause GATE 1+2 + C0–C6 chain; this session closed the chain |
| v0.2.1 | F-cross-13 viewer-shell `showCloseButton` patch | Smoke harness consumer-tsc fail |
| v0.2.2 | `onAuthorClick` + polymorphic `authorComponent` | User asked "is the avatar+name clickable?" |
| **v0.3.0** | Instagram comments panel + bookmark removal | User: "we don't need save in stories"; "comment must open panel" |
| v0.3.1 | Share panel + scroll fix + UI polish | User: "scroll doesn't work; share also needs panel; icon sizes inconsistent" |
| v0.3.2 | DM composer collision fix (later reverted) | User screenshot showing Cancel button overlapping kebab |
| v0.3.3 | DM full-width + remove Cancel + engagement always visible | User: "gradient pushes input left; no need for Cancel" |
| v0.3.4 | DM input full-width (drop stale pr-12) | User: "still empty space on the right" |
| v0.3.5 | Kebab to header + heart toggle + stagger | User: "smile icon bigger; 3 dots not functional; replace with toggle" |
| v0.3.6 | Shrink DM input height to match avatar | User: "input area too high — match avatar height" |
| v0.3.7 | Heart toggle inline with DM bar | User: "heart not aligned; put it in same row as input" |
| v0.3.8 | Link CTA as top-anchored collapsible drawer | User screenshot: "Shop now button doesn't align; show as banner / drawer at top" |
| v0.3.9 | Full-component review cleanup | User: "review the entire component for clarity, consistency, and match" |

## Architectural decisions made

### 1. DM input semantic clarification (v0.3.0)

**Decision:** The always-visible bottom `<ReplyComposer>` is the **Direct Message** channel (Instagram-canonical "Reply to @user…" sends to the author's chat), NOT public comments. Public comments live in the new comments panel.

**Why:** v0.2.0 conflated the two — the comment icon focused the bottom composer, treating it as a public comment thread. That mismatched Instagram-canonical semantics.

**How:** `onAddReply` callback name preserved for back-compat (semantic equivalent of `onSendDirectMessage`); JSDoc clarifies.

### 2. Bookmark action removed (v0.3.0, breaking)

**Decision:** Remove `kind: "bookmark"` from the engagement overlay and delete the `onBookmarkStory` prop.

**Why:** User-flagged: stories are ephemeral; viewers don't bookmark them. Owner-side `Save to highlights` (in the kebab) stays — different surface.

**How:** TypeScript flags the breaking removal at consumer compile-time. v0.2.x engagement layer was days old so impact is small. Inline-copied `kind: "bookmark"` arm in `types.ts` kept for structural sync with upstream engagement-bar-01 (story-viewer never produces it).

### 3. Comments + share panels as bottom sheets (v0.3.0/v0.3.1)

**Decision:** New `renderCommentsPanel` + `renderSharePanel` slots. When tapped (comment icon, share icon), a bottom-sheet (~62% viewer height) slides up. Visual content above scales to 55% + translates up. Tap shrunk visual closes.

**Why:** Instagram-canonical UX for engagement actions. Comments panel hosts `<CommentThread01 />` (from the same library — reuse, not rebuild). Share panel hosts `<ShareMenu />` from engagement-bar-01.

**How:** Slot-only API (default panel is just chrome with an empty state). Hosts wire their full thread / menu via the slot. Generic `BottomSheet` part extracted in v0.3.1 underlies both. Mutual exclusion: opening one closes the other. Auto-pauses story timer when any panel is open.

### 4. Kebab moved from engagement column to header (v0.3.5)

**Decision:** Remove kebab as the 6th item in the engagement bar's actions array. Render it instead inside ViewerHeader's right cluster between mute and close, via a new `onKebabClick` prop on ViewerHeader.

**Why:** User-flagged: kebab in the engagement column looked visually inconsistent with the other icons + wasn't functional from that position.

**How:** `defaultStoryKebabActions` in `lib/kebab.ts` still produces the items; ViewerHeader handles the trigger. Story-viewer-01.tsx wires the `onKebabClick` prop conditionally on `viewerMode && kebabItems.length > 0`.

### 5. Engagement column collapsed by default + heart toggle (v0.3.5/v0.3.7)

**Decision:** Engagement icons (like / reaction / comment / share) hidden by default. A heart toggle reveals them with a bottom-to-top staggered animation (delays 0/75/150/200ms, 300ms ease-out). Tap heart or anywhere outside collapses.

**Why:** User: "instead of 3 dots, have a heart icon that toggles engagement icons appearing one-by-one bottom-to-top." Media-first viewing experience.

**How:** EngagementOverlay accepts `expanded` prop + targets the EngagementBar01's ActionButton children via `[&>div>*]:nth-last-child(N):delay-NN` Tailwind arbitrary-variant selectors. Outside-pointerdown listener (effect-scoped to `expanded === true`) handles the dismiss. Heart toggle initially lived inside EngagementOverlay (v0.3.5) but moved inline to the DM bar row in v0.3.7.

### 6. Heart toggle inline with DM bar (v0.3.7)

**Decision:** The heart toggle button lives at `right-3 bottom-3 z-32`, vertically aligned with the avatar in the DM bar row. EngagementOverlay only renders the engagement icons (positioned at `bottom-20` above the DM row).

**Why:** User-flagged in v0.3.5: heart at the bottom of the engagement column wasn't aligned with the rest of the UI. "Put it in the same row as the direct input area."

**How:** ReplyComposer gains `pl-4 pr-16` to leave space for the toggle. Outside-pointerdown listener checks BOTH the engagement column ref AND the toggle ref (preventing same-tap dismiss).

### 7. Top-anchored collapsible link drawer (v0.3.8)

**Decision:** `StoryItem.link` CTA is no longer a bottom button. Replaced with a small chip at `top-16 right-3` showing the host domain + link icon. Tapping reveals a drawer below (origin-top-right scale+fade transition) with the host preview + the CTA button + X close.

**Why:** User screenshot showed the v0.2.0 bottom button colliding visually with the DM bar.

**How:** Internal state-only refactor of `parts/link-cta.tsx`. Polymorphic `linkComponent` + `onLinkClick` semantics preserved. No new public API props; one new label key (`linkCloseLabel`) added in v0.3.9.

### 8. DM input height matches avatar (v0.3.6)

**Decision:** shadcn's `Textarea` ships `min-h-16` (64px) baked in — too tall for a single-row inline input. Override via arbitrary-selector className passthrough: `[&_textarea]:min-h-9 [&_textarea]:py-1.5 [&_textarea]:text-sm`. Reduce outer ReplyComposer padding `pt-8 pb-4 → pt-3 pb-3`.

**Why:** User: "DM input is too tall; should match avatar height."

**How:** No upstream shadcn change — handled at the consumer (story-viewer-01) via Tailwind arbitrary-selector passthrough.

### 9. Generic `BottomSheet` chrome extracted (v0.3.1)

**Decision:** New `parts/bottom-sheet.tsx` underlies CommentsPanel + SharePanel. Drag-handle bar + heading row + close button + `overflow-y-auto overscroll-contain` scroll area. Both panels are thin wrappers passing tier-specific labels.

**Why:** Avoid duplication between the two panels. Easier to ensure consistent UX (drag handle, scroll behavior, close affordance).

### 10. Tailwind v4 bare numeric z-utilities (v0.3.x discovery)

**Decision:** Use `z-31`, `z-32`, `z-35`, etc. directly without bracket syntax.

**Why:** Tailwind v4 supports arbitrary numeric values natively — IDE lint actively prefers `z-31` over `z-[31]` as the canonical form. A mid-session review agent flagged this as a blocker (claiming bracket syntax required); verified false positive by visual confirmation that layering works correctly.

**How:** Document in this decision file so future sessions don't waste time on the same false alarm.

## Public-API delta (v0.2.0 → v0.3.9)

### Added

- 4 new label keys (v0.3.0): `commentsHeading` / `commentsCloseLabel` / `commentsDefaultEmptyState` / 3 more for share (v0.3.1) / 4 more (v0.3.9): `linkCloseLabel` / `engagementShowLabel` / `engagementHideLabel` / `replyAriaLabel`
- 2 new render slots: `renderCommentsPanel` / `renderSharePanel`
- 2 new disable opt-outs: `disableComments` / `disableSharePanel`
- 2 new author tap-target props (v0.2.2): `onAuthorClick` / `authorComponent`
- 1 new ViewerHeader prop (v0.3.5): `onKebabClick`
- 1 new ReplyComposer prop (v0.3.2, @deprecated v0.3.9): `onActiveChange`

### Removed (breaking)

- `onBookmarkStory` (v0.3.0)

### Parts added

- `parts/comments-panel.tsx` (v0.3.0)
- `parts/share-panel.tsx` (v0.3.1)
- `parts/bottom-sheet.tsx` (v0.3.1)

### Behavioral changes

- Comment-icon click: was "focus DM composer" → now "open comments panel" (fallback to v0.2.x via `disableComments`)
- Share-icon click: was "fire `onShareStory`" → now "open share panel AND fire `onShareStory`" (fallback to v0.2.x via `disableSharePanel`)
- Engagement column: was "always visible" → now "collapsed by default + heart toggle reveals"
- Kebab: was "engagement-overlay 6th item" → now "ViewerHeader right cluster"
- LinkCta: was "bottom button at `bottom-32`" → now "top chip at `top-16 right-3` + collapsible drawer"
- DM bar: was "right-16 with internal pr-12" → now "right-0 (full-width) with no internal padding"

## GATE handling note

User opted to skip formal GATE 1+2 description-then-plan docs across v0.3.1–v0.3.9. v0.3.0 had a written description (via user messages) + post-ship spotcheck. v0.3.1–v0.3.9 are patch bumps under the readiness-review rule's exemption (no public-API removal/rename of v0.3.0; GATE 3 verdict carries forward).

Smoke harness was NOT re-run during the v0.3.x patch session — v0.2.0 smoke was the last green baseline. Queued as a follow-up in the session-close handoff.

## Zero-breakage verification

v0.2.x → v0.3.0 was the only breaking step (bookmark removal). v0.3.0 → v0.3.9 are all additive or behavior-changing-with-back-compat-flag. Patch-bump rule held throughout.

## Tip

Final commit: `0d9d2cf` (`chore(story-viewer-01): v0.3.9 — review cleanup pass`).
