# story-viewer-01 v0.2.0 — procomp description

> **Stage 1: what & why.** Addendum to the v0.1.0 [description](story-viewer-01-procomp-description.md); v0.1 doc remains authoritative for the base contract (cursor anchoring, progress timer, tap zones, keyboard nav, ARIA). This doc covers only the **v0.2.0 engagement-layer expansion**.
>
> **Driver:** [Deep review against the post-card-01 A+ recipe](../../../.) (this session) graded story-viewer-01 at **B+** — strong viewer core, missing the social-product engagement surface. v0.2.0 closes that gap.
>
> **Sibling ships required first:**
> - `engagement-bar-01` v0.3.x (shipped — multi-kind reactions, LikersStrip, ShareMenu)
> - `comment-thread-01` v0.2.1 (shipped — CommentComposer sub-export reusable as reply input)
>
> Both deps already live; no upstream coordination needed.

---

## Problem

After today's deep audit, story-viewer-01 v0.1.2 is a **passive viewer**. Compared to the post-card-01 A+ recipe + actual Instagram / TikTok / Reels stories convention:

| Missing surface | Instagram has | story-viewer-01 v0.1.2 has |
|---|---|---|
| Reactions (heart, emoji palette) | ✅ Bottom-right heart + long-press emoji picker | ❌ Nothing |
| Reply composer (DM input) | ✅ Bottom always-visible "Reply to {user}…" input | ❌ Nothing |
| Share / DM forward | ✅ Bottom-bar share icon + share-sheet | ❌ Nothing |
| Link CTA ("see more") | ✅ Link sticker on item + swipe-up | ❌ Nothing |
| View-count strip (owner only) | ✅ Bottom-left "👁 47 · 2h ago" + tap → viewer list | ❌ Nothing |
| Save-to-highlights (owner only) | ✅ Kebab item | ❌ Nothing |
| Delete story (owner only) | ✅ Kebab item | ❌ Nothing |
| Long-press to pause | ✅ Hold-anywhere = pause; release = resume | ⚠️ Click-toggle only (different UX) |
| Role-aware affordances | ✅ Owner vs viewer modes show different bottom-bar | ❌ Single mode |
| Render slots for hosts | — | ⚠️ Only `renderItem` (1 slot); compare post-card-01's 9 slots |
| Disable opt-outs | — | ❌ None; consumers must take over entirely |

The v0.1.0 description explicitly framed engagement as **out of scope**:

> "v0.1 ships click-outside + Escape close + arrow-key nav; framer-motion swipe-to-dismiss is the locked v0.2 adoption gate."

That scope cut was the right call for v0.1 — get the modal + cursor + progress timer right first. v0.2.0 layers engagement on top of that foundation without retouching the viewer core.

**Net result:** consumers building a real social product on top of story-viewer-01 v0.1.x have to fork the component to add the bottom bar. The library should ship the bottom bar.

---

## In scope (v0.2.0)

### 1. Engagement overlay (composes `engagement-bar-01` v0.3.x)

- **Default:** mount `<EngagementBar01 variant="stacked">` overlaid on the right edge of the viewer (TikTok / Reels convention for portrait video).
- **Actions:** `like`, `reaction` (multi-kind picker via long-press), `comment` (opens reply composer), `share`, `bookmark` — same `EngagementAction[]` discriminated-union shape as post-card-01.
- **Realtime:** separate `Subscribe<StoryEngagementDelta>` prop (NOT bundled into the existing `Subscribe<StoryViewerDelta>` — separation matches post-card-01's two-stream pattern).
- **Slot escape hatches:**
  - `engagementActions?: (story, item, ctx) => EngagementAction[]` — extend/replace the default action list (parallels post-card-01's `engagementActions`).
  - `renderEngagementOverlay?: (story, item, helpers) => ReactNode` — full takeover (parallels post-card-01's `renderEngagementBar`).
  - `disableEngagement?: boolean` — suppress entirely (parallels post-card-01's `disableHeartBurst`).

### 2. Reply composer (composes `comment-thread-01` v0.2.x `CommentComposer`)

- **Default:** mount `<CommentComposer>` at the bottom of the viewer (always-visible, Instagram convention). Story auto-pauses while user types (`setPaused(true)` on first character; resume on submit/cancel/blur).
- **Behavior:**
  - `onAddReply?: (storyId, itemId, content) => Promise<void> | void` — fires on submit. Library does NOT optimistically render the reply (reply is a DM, not a comment on the story — single-direction).
  - `composerEmptyState?: ReactNode` — for unauthenticated viewers (`currentUser` absent → composer hidden, slot rendered).
- **Slot escape hatches:**
  - `renderReplyComposer?: (story, item, helpers) => ReactNode` — full takeover.
  - `disableReplyComposer?: boolean` — suppress entirely (host wants viewer-only experience).

### 3. Role-aware mode (`viewerMode` + `permissions` + `canPerformAction` — mirrors post-card-01 v0.2.0+)

- **`viewerMode?: "owner" | "viewer"`** — opt-in toggle. `undefined` → v0.1 legacy mode (no engagement, no reply composer, no owner overlay — the v0.1.2 surface unchanged). No auto-derivation from `currentUser` + `story.userId` (matches post-card-01 precedent — library stays neutral on identity models).
- **`StoryViewerPermissions`** — per-action permissions matrix with these arms:
  - Owner-side: `canSaveToHighlights`, `canDeleteStory`, `canShareToFeed`, `canSeeViewers`
  - Viewer-side: `canReact`, `canReply`, `canShare`, `canDM`, `canReport`, `canBlockAuthor`, `canMuteAuthor`
  - Moderator-side (orthogonal, same pattern as post-card v0.3.0): `canModerate`
- **`canPerformAction?: (action, story, item) => boolean | undefined`** — universal override. Resolution order verbatim per post-card-01's `lib/permissions.ts`.
- **`StoryPermissionAction`** discriminator union covering all the above arms + `"moderate"`.
- **Default matrices** by viewerMode in a new `lib/permissions.ts` (same shape as post-card-01's): owner sees Save/Delete/Share-to-feed/See-viewers; viewer sees React/Reply/Share/DM/Report/Block/Mute. Moderate is `false` in both — explicit-only.

### 4. Owner overlay (bottom-bar replacement for owner mode)

Replaces the reply composer when `viewerMode === "owner"`:

- **View-count strip:** `👁 {count} · {time}` — uses `story.viewerCount` (new optional field on Story) for eager count + `onLoadViewers?: () => Promise<ViewerListItem[]>` slot for lazy-loaded user list on tap.
- **Viewers list panel:** lifts inline (analog of post-card-01's likers panel pattern); paginating `+N` pill via reused `LikersStrip` sub-export from engagement-bar-01 (already a sibling dep, just a barrel import).
- **`OwnerOverlay` part** — sub-exportable for hosts wanting to render outside the viewer.
- **`renderOwnerOverlay?: (story, item, helpers) => ReactNode`** — full takeover.
- **`disableOwnerOverlay?: boolean`** — suppress.

### 5. Kebab — engagement-overlay placement (platform-aligned per Q-V17)

New kebab placed as the **6th item in the stacked engagement-bar** (after ❤ 💬 ↗ 🔖 + reaction). Fallback to header right cluster when `disableEngagement: true`. Items render per resolved permissions:

- Owner-side: `Save to highlights` / `Unsave from highlights` / `Delete story` / `Share to feed`
- Viewer-side: `Report` / `Block author` / `Mute author` / `Copy link`
- Moderator-side: `moderatorActions?: (story, item) => CommentMenuItem[]` slot — additive section with `separatorBefore: true` flag (same pattern as post-card-01 v0.3.0 moderator section)

`kebabActions?: (story, item) => CommentMenuItem[]` — full takeover (mirrors post-card-01).

**Implementation note:** the engagement-bar v0.3.x has `kind: "custom"` action arm we can leverage for the kebab slot — it accepts arbitrary ReactNode + onClick. The kebab assembly logic (resolveActions + section + separator) lives in a new `lib/kebab.ts` mirroring post-card-01's `lib/defaults.tsx` `defaultPostKebabActions`. When `disableEngagement: true`, the kebab item is detached from the action list and mounted into a new `<HeaderKebabFallback>` part in the header.

### 6. Render slot expansion (1 → 7)

Match post-card-01's slot density. All additive:

- `renderHeader?: (story, item, helpers) => ReactNode` — replace the avatar/name/time/buttons strip
- `renderProgress?: (items, currentItemIndex, progress) => ReactNode` — replace the segmented bars
- `renderNavArrows?: (helpers) => ReactNode` — desktop ← →
- `renderTapZones?: (helpers) => ReactNode` — touch nav strip
- `renderEngagementOverlay?` — see §1
- `renderReplyComposer?` — see §2
- `renderOwnerOverlay?` — see §4

Existing `renderItem?` stays.

### 7. Disable opt-outs (0 → 8)

- `disableTapZones?: boolean`
- `disableKeyboardNav?: boolean`
- `disableNavArrows?: boolean`
- `disableAutoClose?: boolean`
- `disableProgressBars?: boolean`
- `disableEngagement?: boolean` (see §1)
- `disableReplyComposer?: boolean` (see §2)
- `disableOwnerOverlay?: boolean` (see §4)

### 8. Imperative handle expansion (7 → 13)

Additions (6 new methods):

- `setMuted: (muted: boolean) => void` — parity with existing `setPaused`
- `triggerReaction: (kind?: string) => void` — fire onReaction without consulting permissions (escape hatch, matches engagement-bar v0.3.0 `triggerReaction`)
- `triggerLike: () => void` — fire onLike heart
- `triggerReply: (content?: string) => void` — focus composer + optionally pre-fill
- `triggerShare: () => void` — open share menu
- `openKebab: () => void` — programmatic kebab open (matches post-card-01)

### 9. Polymorphic `linkComponent` + `StoryItem.link` CTA

- `StoryItem.link?: { url: string; cta?: string }` — when set, renders a bottom CTA button "Open link" (or custom `cta` label) above the engagement overlay.
- `linkComponent?: ElementType` — polymorphic root for the CTA + any Send-DM link affordance. Default `"a"`.
- `onLinkClick?: (storyId, itemId, url) => void` — analytics hook; coexists with default navigation.

### 10. Long-press pause (additive — preserves v0.1 click-pause)

Add `pointerdown` + `pointerup` handlers on the surface deriving a `LONG_PRESS_MS = 200ms` threshold (Instagram-feel; rough match — exact value tunable). Long-press anywhere = pause; release = resume. Click pause (middle tap zone) still works for users who don't long-press. Expose `longPressThresholdMs?: number` prop (default 200) so consumers can tune for their UX research.

### 11. i18n expansion

New label keys:

- `reactionPickerLabel`, `replyComposerPlaceholder`, `replyComposerSend`, `replyComposerCancel`
- `viewerCountLabel(count, time)`, `viewersHeading`, `viewersMoreLabel(count)`
- `saveToHighlights`, `unsaveFromHighlights`, `deleteStory`, `shareToFeed`
- `report`, `blockAuthor`, `muteAuthor`, `copyLink`
- `openLink` (default CTA when `StoryItem.link.cta` absent)
- `engagementLabels?: EngagementBarLabels` — nested forward to engagement-bar-01
- `commentLabels?: CommentThreadLabels` — nested forward to comment-thread-01 (composer-only labels matter here)

### 12. Demo expansion

Existing 6 tabs unchanged. Add 4 new tabs (kept tight to avoid SwipeTabsList overload):

- **Viewer mode** — reactions + reply composer + share + kebab w/ Report/Block/Mute
- **Owner mode** — owner overlay (view-count + viewers list) + kebab w/ Save/Delete/Share-to-feed + moderator section example
- **Custom slots** — replaces `renderHeader` + `renderEngagementOverlay` + `renderReplyComposer`
- **Link CTA + long-press** — story with `link: { url, cta }` + instructional overlay teaching long-press pause

Total: 6 existing + 4 new = 10 tabs. Permissions-matrix demonstration lives inside Viewer mode + Owner mode tabs (toggle via local state).

### 13. F-S1 hygiene patch (bundled — same commit as v0.2.0 GATE 3)

- `parts/item-view.tsx` `import { VideoPlayer01 } from "../../video-player-01"` → `"../../video-player-01/video-player-01"` (specific-file per F-S1 lock). Latent — may or may not be broken on current shadcn rewriter; fix is one-line.

### 14. Touch target patch (bundled)

- `parts/viewer-header.tsx` pause/mute/close buttons `h-8 w-8` (32×32) → `h-11 w-11` (44×44) mobile. Optional `md:h-9 md:w-9` for desktop-tighter. Closes the WCAG 2.5.5 mobile mistap gap.

---

## Out of scope (explicit non-goals)

- **Story-creation flow** — recording, sticker placement, music overlay, drawing tools. Out of charter for v0.2.0; consumers compose their own creator.
- **Story-archive surface** — past stories grid for owner. Separate procomp candidate (`story-archive-01`?).
- **Mention / hashtag stickers** — host can use `renderItem` slot to inject custom rich items; library doesn't model on-item interactive elements.
- **AR filters / face detection** — way out of scope.
- **Story analytics dashboard** — owner overlay surfaces view-count + viewers list; deeper analytics (impressions / unique reach / completion rate) is host territory.
- **Polls / questions / quizzes / sliders** — Instagram has these as item-level interactive widgets. v0.2.0 doesn't model them; host wires via `renderItem`. Possible v0.3.0 if user-tested as load-bearing.
- **Music tagging** — Instagram shows current music at the top. Out of scope.
- **Replay / restart story** — Instagram doesn't have this; matches.
- **Cross-story swipe (left/right between users)** — desktop has nav arrows already; mobile drag-between-users requires gesture infra not in scope. (Already deferred to v0.3 framer-motion adoption.)

---

## Public API delta (zero-breakage matrix)

Every addition is optional. v0.1.x consumers' code compiles unchanged + renders unchanged when no v0.2.0 props are passed.

| Layer | v0.1.x behavior preserved? | How |
|---|---|---|
| `<StoryViewer01 stories={...} initialStoryIndex={i} isOpen={o} onClose={...} />` | ✅ | Identical render — no engagement overlay, no reply composer, no owner overlay (all gated on opt-in props) |
| `renderItem={...}` | ✅ | Unchanged |
| `subscribe={engagementSubscribe}` (new prop is opt-in additive; existing `subscribe` for `StoryViewerDelta` unchanged) | ✅ | New prop name to avoid collision: `engagementSubscribe?: Subscribe<StoryEngagementDelta>` |
| Imperative handle | ✅ | All 7 existing methods preserved; 6 new methods are additive |
| `useStoryProgress` / `useStoryKeyboardNav` / `useStoryViewerState` exports | ✅ | Unchanged |
| `Story` / `StoryItem` shapes | ✅ | New optional fields only (`Story.viewerCount?`, `StoryItem.link?`) |

The only behavior change: when `viewerMode` is set, the default kebab + bottom overlay are mounted. Hosts opting in by setting `viewerMode` are explicitly asking for the new surface. v0.1 consumers (not setting viewerMode) see zero diff.

---

## Constituent dependencies

| Dep | Version | Used for | Hygiene notes |
|---|---|---|---|
| `engagement-bar-01` | `^0.3.0` (current 0.3.2) | EngagementBar01 (variant="stacked") + EngagementAction types + LikersStrip (viewers panel) + ShareMenu (share affordance) + EngagementReactionKind types | Already a sibling in `media/` category — cross-category. Use specific-file imports per F-S1 lock; inline-copy any types that hit Bug 3 (cross-cat /types) per the post-card-01 v0.3.2 precedent |
| `comment-thread-01` | `^0.2.1` (current 0.2.1) | `CommentComposer` sub-export for reply input | Same cross-category as above |
| `video-player-01` | (existing) | Video items (unchanged from v0.1.0); F-S1 import hygiene patch bundled | |
| `currentUser` prop | (new) | Optional `CurrentUser` shape (id, name, avatar) — drives composer avatar + isOwn check on default kebab; structurally compatible with `CommentThreadCurrentUser` | Local type def; not a hard dep on comment-thread-01's shape |

Update `meta.ts` `dependencies.internal` from `["video-player-01"]` to `["video-player-01", "engagement-bar-01", "comment-thread-01"]`.

---

## Open questions — need user sign-off before GATE 2 (plan)

### Q-V1 — Reply composer position

**Problem:** Where does the reply composer live in the viewer?

**Options:**
- **(a) Always-visible bottom bar** — `<CommentComposer>` mounted at the bottom, "Reply to {username}…" placeholder always visible. Instagram default.
- **(b) Tap-to-open affordance** — collapsed "Reply to story" button that expands to composer on tap. Lighter visual; preserves content-first emphasis.
- **(c) Behind a chevron / icon** — even more minimal; composer hidden until intentional.

**Differences:** (a) maximizes engagement (visible CTA); (b) keeps the story image fully visible at all times; (c) almost-zero footprint.

**Recommendation:** **(a)** — Instagram convention is well-internalized; story viewers expect the bottom strip. Tradeoff (some image obstruction) is acceptable.

### Q-V2 — Engagement-bar variant

**Problem:** Which `EngagementBar01` variant to mount as default overlay?

**Options:**
- **(a) `variant="stacked"`** — vertical column on the right edge, TikTok/Reels-style. Designed exactly for portrait full-screen video.
- **(b) `variant="default"`** — horizontal row under the item.
- **(c) `variant="compact"`** — minimal horizontal row.

**Differences:** (a) standard for portrait media in 2024; (b) takes vertical real estate that competes with reply composer; (c) too small for primary engagement.

**Recommendation:** **(a) stacked** — engagement-bar v0.2.0 introduced the stacked variant explicitly for this use case ("vertical for video overlays" per its meta features).

### Q-V5 — View-count strip data shape (owner mode)

**Problem:** How does the host supply viewer data?

**Options:**
- **(a) Eager** — host pre-computes `story.viewerCount` + `story.viewers: PartialUser[]`; viewer renders both at first paint.
- **(b) Lazy** — host supplies only `story.viewerCount`; viewer fetches user list via `onLoadViewers?: (storyId) => Promise<ViewerListItem[]>` when user taps "👁 47".
- **(c) Hybrid** — eager count + lazy user list (count visible always; tap to expand panel).

**Differences:** (a) double the byte cost per story; (b) tap latency for the most-engaged owners; (c) balanced — count is cheap, user list is expensive.

**Recommendation:** **(c)** — count is just a number (negligible payload); user list can be 50+ avatars + names (expensive). Matches post-card-01's likers pattern: `likers?: PostLikeUser[]` pre-loaded + `onLoadMoreLikers?: () => Promise<...>` lazy paginate.

### Q-V8 — Long-press pause

**Problem:** Add long-press pause alongside existing click-pause, or replace it?

**Options:**
- **(a) Additive** — both gestures work. Long-press anywhere = pause-while-held; release = resume. Click middle = toggle pause.
- **(b) Replace** — drop click-pause; long-press only (Instagram-exact).
- **(c) Defer** — skip v0.2.0; revisit in v0.3.

**Differences:** (a) maximally compatible — preserves v0.1 click-pause contract; (b) cleaner UX but breaking; (c) faster ship.

**Platform alignment check (re-validated):** Instagram / TikTok / Snapchat all use **long-press-anywhere-pause** as the canonical mobile pause gesture; *none* use middle-tap-pause (which is a v0.1 kasder addition unique to this codebase). On those platforms, the middle tap zone is either silent (no nav, no pause) or part of next/prev navigation.

**Recommendation: (a) — additive.** Long-press becomes the **primary platform-aligned gesture** (Instagram-exact); the v0.1 middle-tap-pause stays as a **desktop-friendly fallback** (long-press is less natural with a mouse). Guide documents long-press as canonical for mobile, middle-tap as the click escape hatch. Zero v0.1 breakage. Header pause button stays for discoverability + keyboard users.

### Q-V9 — `StoryItem.link` CTA rendering

**Problem:** How does the optional `link` on an item surface visually?

**Options:**
- **(a) Bottom button** — `<Button>` above the engagement overlay: `[Open link → ]` or custom CTA label.
- **(b) Swipe-up affordance** — bottom chevron + caption "Swipe up to see more" (Instagram pre-2021 — *retired*).
- **(c) Link sticker on the item** — small chip overlaid on the item itself (Instagram post-2021 *current default*).

**Differences:** (a) simplest, works on every input mode (click/tap/keyboard), no gesture infra; (b) deprecated platform pattern; (c) current platform default but requires positioning + sticker design system.

**Platform alignment check (re-validated):** Instagram retired the swipe-up affordance in **2021** (was a creator-only feature requiring 10K followers; replaced with link stickers to democratize external links). The current platform default is (c) link sticker on the item. TikTok shows in-video CTAs as floating chips. Snapchat still uses bottom swipe-up.

**Recommendation: (a) for v0.2.0; plan (c) for v0.3.0.** No sticker primitive in the project yet; the bottom button is the simplest accessible-on-every-input-mode pattern. Once `story-sticker-01` (or similar) lands, link can move to (c) sticker placement. v0.2.0 button is forward-compatible — adding a sticker affordance later doesn't remove the button option.

### Q-V16 — Existing `subscribe` prop: keep name or rename for symmetry?

**Problem:** v0.1.x has `subscribe?: Subscribe<StoryViewerDelta>` for story-list realtime. v0.2.0 adds `engagementSubscribe?: Subscribe<StoryEngagementDelta>`. Two-stream symmetry would suggest renaming the existing prop to `viewerSubscribe` (matching post-card-01's `engagementSubscribe` + `commentSubscribe` paired pattern).

**Options:**
- **(a) Keep `subscribe`** — asymmetric (`subscribe` + `engagementSubscribe`) but zero v0.1.x breakage.
- **(b) Rename `subscribe` → `viewerSubscribe`** + deprecated alias for one version. Symmetric but requires v0.1 consumers to migrate.
- **(c) Rename hard (no alias)** — clean break.

**Differences:** (a) keeps the v0.1.x prop name in API forever; (b) costs one alias deprecation cycle for clean naming; (c) breaks v0.1.x consumers.

**Platform alignment check (re-validated):** Real platforms (Instagram / TikTok / Snapchat) don't expose a typed realtime API at all — this is purely an internal library naming call with no platform precedent to anchor against. Post-card-01's two-stream pattern (`engagementSubscribe` + `commentSubscribe`) is the project's internal precedent.

**Recommendation: (a) — keep `subscribe`.** Zero v0.1.x breakage is more important than naming symmetry. The two streams are semantically very different (story-list mutations vs engagement events) — the asymmetric naming actually reflects that clearly. Document the asymmetry in usage.tsx with a one-line "why" note.

### Q-V17 — Kebab placement (REVISED after platform re-validation)

**Problem:** v0.2.0 adds a kebab (Report/Save/Delete/Share-to-feed/etc.). Where does it visually live?

**Options:**
- **(a) Header right cluster** — `[avatar/name] | [kebab][pause][mute][close]`. Original draft proposal.
- **(b) Engagement-overlay cluster** — kebab as the bottom-most item in the stacked engagement-bar (after ❤ 💬 ↗ 🔖). Becomes ❤ 💬 ↗ 🔖 ⋯ vertical column.
- **(c) Bottom-right floating button** — independent of engagement overlay, sits above the reply composer at the bottom-right safe-area inset.
- **(d) Drop pause/mute from header entirely** — minimalist Instagram-exact header (avatar + name + time + X close only); pause/mute migrate into the engagement overlay; kebab also in overlay.

**Platform alignment check (re-validated):**

| Platform (2024-2025 UI) | Kebab position |
|---|---|
| **Instagram Stories** | Bottom-right above reply composer (independent floating button) — *NOT in header* |
| **TikTok** | Right-edge stacked actions cluster (kebab is part of the vertical action stack) |
| **Snapchat Stories** | Bottom-right floating ⋯ |
| **Reels (FB)** | Right-edge stacked cluster (TikTok-style) |

Header position (option a, my original draft) is **NOT used by any major platform**. Header-kebab is a desktop-app pattern, not a story-viewer pattern.

The platform-aligned answer is **(b) or (c)**. Both correspond to real-world UX.

**Recommendation: (b) engagement-overlay kebab as default, gracefully degrade to (a) header kebab when `disableEngagement: true`.**

- Default flow: kebab is the **6th item in the stacked engagement-bar** (after ❤ 💬 ↗ 🔖 + reaction if active). Matches TikTok / Reels / Instagram-2024-when-engagement-overlay-is-visible exactly. Zero v0.1 header disturbance.
- Fallback flow: when consumer passes `disableEngagement: true`, kebab has nowhere to live in the overlay → falls back to header right cluster (a). Documented in the guide.
- Option (d) — minimalist header migration — is most platform-aligned but breaks v0.1.x header expectations. Defer to v0.3.0 if user-tested as desirable.

The implementation cost is the same either way (just a positional decision). Result: platform-native by default, robust under every disable-opt-out combination.


---

## Q-Ps pre-locked from precedent (NOT asking; documenting for the record)

| ID | Question | Lock | Precedent |
|---|---|---|---|
| Q-V3 | Engagement realtime — extend `StoryViewerDelta` or separate `Subscribe<StoryEngagementDelta>`? | **Separate stream** | post-card-01 has separate `engagementSubscribe` + `commentSubscribe` |
| Q-V4 | Reaction emoji palette — fixed or configurable `kinds[]`? | **Configurable via engagement-bar v0.3.0's `kinds[]` API** | Inherited free by composing engagement-bar-01 |
| Q-V6 | Save-to-highlights — kebab item, dedicated icon, or both? | **Kebab item only** | Keeps the footer for reactions + reply + share; dedicated icon deferred to v0.3 if needed |
| Q-V7 | Owner view-count strip — placement? | **Below the item** (replacing reply composer in owner mode) | Symmetric with viewer's reply composer position |
| Q-V10 | Permissions resolution order | **Verbatim post-card-01** (`canPerformAction` > `permissions[canX]` > viewerMode defaults > library baseline) | Established 2026-05-22 |
| Q-V11 | viewerMode auto-derivation from `currentUser.id === story.userId` | **No auto-derivation; explicit host opt-in** | post-card-01 precedent — library neutral on identity models |
| Q-V12 | `kebabActions` full-takeover | **Wins over default + moderator section** | post-card-01 v0.3.0 pattern |
| Q-V13 | `separatorBefore: true` on first moderator item | **Inherit pattern from post-card-01** | Same `CommentMenuItem.separatorBefore` flag (already in shipped `comment-thread-01` v0.2.0+) |
| Q-V14 | F-cross-13 hygiene for any new shadcn primitive use | **buttonVariants() pattern, never `<Trigger asChild>{<Button>}`** | Locked 2026-05-28 evening |
| Q-V15 | F-S1 cross-procomp imports | **Relative + specific-file for same-cat; absolute-with-suffix for cross-cat components; inline-copy for cross-cat types** | Locked 2026-05-28 |

---

## Acceptance criteria

Component is "v0.2.0 ready" when ALL of:

1. All 14 "in scope" items implemented + tested manually in the demo.
2. Zero v0.1.x consumer breakage — verified by re-running the existing 6 demo tabs without modification.
3. `meta.ts` v0.1.2 → 0.2.0; features list extended; `dependencies.internal` updated.
4. `pnpm tsc --noEmit` + `pnpm validate:meta-deps` + `pnpm lint` + `pnpm build` clean.
5. F-S1 import patch landed (item-view.tsx).
6. Touch target patch landed (viewer-header buttons ≥44×44).
7. Procomp doc trio updated: this description signed off, plan signed off, guide updated alongside implementation.
8. GATE 3 spotcheck file at `docs/procomps/story-viewer-01-procomp/reviews/<date>-v0.2.0-spotcheck.md` with verdict ≥ `Pass with follow-ups`.
9. Decision file authored at `.claude/decisions/<date>-story-viewer-01-v0.2.0-engagement-layer-ship.md`.
10. STATUS.md row + `docs/component-versions.md` row bumped to 0.2.0.
11. Post-push smoke harness run within 10 min of push; results recorded.
12. Bundled story-rail-01 v0.2.1 docs patch (positional → object-shape `onItemClick` snippets) lands in same commit OR a precursor commit.

---

## Constituent ship coordination

This v0.2.0 ship requires NO sibling-procomp version bumps. All deps are at adequate versions:

- `engagement-bar-01` v0.3.2 ✓ (multi-kind reactions live)
- `comment-thread-01` v0.2.1 ✓ (CommentComposer + separatorBefore + edited badge live)
- `video-player-01` (current — F-S1 patch is internal to story-viewer, not video-player)

If during implementation we discover a missing slot on `engagement-bar-01` v0.3.x (e.g., need a `ref={engagementRef}` we don't expose), we'd ship an additive engagement-bar v0.3.3 patch alongside.

---

**Sign-off needed:**

Please answer **Q-V1, Q-V2, Q-V5, Q-V8, Q-V9, Q-V16, Q-V17** (7 genuinely-novel design calls — or just say "all recommendations" to accept the defaults). Pre-locked Q-Ps (Q-V3/V4/V6/V7/V10/V11/V12/V13/V14/V15) don't need answers — they inherit from established post-card-01 / engagement-bar v0.3 / F-S1 / F-cross-13 precedent — but speak up if you want to revisit any.

Once locked, I author `story-viewer-01-procomp-plan-v0.2.0.md` (Stage 2 — how: commit chain C1–CN, per-commit deliverables, per-commit verification gates, types schema, slot signatures, permissions resolver shape, smoke expectations) and pause again for plan sign-off before any code lands.

**Estimated scope (for sizing):** 8–10 implementation commits + 1 docs/STATUS commit + 1 GATE 3 spotcheck commit = ~10–12 commits total. Implementation ~1–2 working days at the pace post-card-01 v0.2.0 shipped. Post-push smoke loop expected (engagement-bar / dropdown-menu / popover surface = F-cross-13 carriers).
