# Social Posts System — migration source notes

> Intake doc for [`docs/migrations/social-posts-system/`](./). Drafted by the assistant from the investigation pass — **review and fill the user-judgment markers (marked `<<TBD>>`) before I write `analysis.md`.**
>
> Scope spans 8 files split across two related kasder folders (post-card system + story system). Per the agreed plan, this single intake covers the whole social-feed substrate; it expands into ~8 sealed-folder pro-comps + 1 Tier-3 sandbox.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** kasder `kas-social-front-v0`
- **Path in source:**
  - Posts: [`src/components/social/posts/`](./original/posts/) — 5 files, ~960 LOC
    - `AdvancedPostCard.tsx` (167) — top-level orchestrator
    - `PostContent.tsx` (55) — truncate-and-expand text
    - `PostMediaCarousel.tsx` (142) — Embla carousel for images + videos
    - `PostVideoPlayer.tsx` (128) — `<video>` wrapper with controls
    - `PostEngagementPanel.tsx` (468) — actions row + likes panel + comments panel
  - Stories: [`src/components/social/story/`](./original/story/) — 4 files, ~524 LOC
    - `StoriesSection.tsx` (157) — horizontal rail + viewer trigger
    - `StoryThumbnail.tsx` (65) — single thumbnail (with "add story" variant)
    - `StoryViewer.tsx` (302) — full-screen modal sequential viewer
    - `types.ts` (16) — Story / StoryItem types
- **Used in:** rendered across multiple pages in kasder (feed, profile, explore, etc.). For the migration, the **Tier-3 sandbox collapses these usages into a single canonical feed assembly** (`/sandbox/social-feed-page-01`) — story rail at top + infinite post-card feed body. Per-page variations (profile grid, explore mosaic) are out of scope; consumers compose the post-card-01 variants themselves to recreate them.
- **Related code:** Embla (`embla-carousel-react`), framer-motion (used by StoryViewer only), shadcn `avatar` / `card` / `button` / `dropdown-menu` / `input`, `date-fns` + `date-fns/locale/tr`. No external API client — engagement is local state with optional callbacks.

## Role

The social-posts system is the central content unit of the kasder feed: an Instagram-style post card showing a user's text + media (single image, multi-image carousel, or video) with full engagement (like / comment / share / bookmark) and an inline expandable comments panel. It sits alongside an Instagram-style stories rail at the top of the feed (24-hour ephemeral content with a full-screen sequential viewer).

User value: lets community members share moments + reactions, browse what's happening, and engage without leaving the feed. The post card is the kasder community's primary content surface; the story rail is the secondary "what's happening right now" surface.

## What I like (preserve)

These are concrete patterns extracted from reading the source:

- **Multi-image carousel with peek-scale** — kasder's `PostMediaCarousel` uses 85%-width slides with `scale-95 opacity-60` on non-active items. Distinctive Instagram-post look that signals "swipeable" without indicators alone.
- **Centered indicator dots that elongate when active** (`w-1.5` → `w-4` for the active dot). Cleaner than uniform-dot row.
- **Double-tap-to-like with heart-burst overlay animation** — `Heart` icon with `animate-ping` + 0.6s duration centered on the media area when triggered. Distinctive Instagram pattern, currently animation-only (no haptic).
- **Auto-pause inactive videos in carousel** — `isActive=false` prop on `PostVideoPlayer` pauses + resets state. Critical for multi-video posts that would otherwise multi-play.
- **Tabbed expand for likes vs comments** — only one panel visible at a time, clean state management. The "Beğenenler" (likers) row is a horizontal swipeable strip of avatars with a `+N more` loader at the end.
- **Truncate-and-expand text content** — `PostContent` measures `scrollHeight > maxHeight × maxLines` to decide whether the "Daha fazla göster" button shows. No false-positive on short text.
- **Stories with multi-item segmented progress bars** — top of viewer shows N segments per story, each filling left-to-right on its 5s timer, completed segments stay full white.
- **Tap-zone navigation in story viewer** — left third = prev, middle third = pause, right third = next. Mobile-native pattern.
- **Gradient ring on unread story thumbnail** — `bg-linear-to-br from-accent via-warning to-destructive` wrapper with `p-0.5` padding creates the Instagram-style unread indicator.
- **Auto-hide controls after 2s** in `PostVideoPlayer` — controls reappear on hover/click.
- **Comment composer sticky at the bottom** of the comments panel (won't scroll out of view as the comment list grows).
- **Verified-checkmark next to author name** with the inline SVG (small, fast, no icon-font dep).
- **Kebab menu in card header** with bookmark / share / copy / report — keeps the inline action row clean.

<<TBD: any visual decisions I missed? screenshots, design files, kasder Figma URLs if they exist>>

## What bothers me (rewrite)

Honest gaps from the kasder source:

- **`PostEngagementPanel` is monolithic (468 LOC)** — actions row + likes panel + comments panel + comment input + heart animation all in one file. Hard to use just the action bar elsewhere (e.g., on a news card, an event card, a comment row).
- **No comment threading** — `CommentItem` is a flat row with a "Yanıtla" (Reply) button that doesn't actually do anything. Tree shape needs to be added.
- **`CommentItem` like state isn't persisted** — toggles UI via local `comments` state, but no callback to host. `onLikeComment` is called but the host can't drive it from outside.
- **No real-time hooks** — engagement is fully local; if another user likes the post in another session, this UI doesn't update. (Per the agreed plan, real-time is now a system requirement — needs a `subscribe` contract.)
- **Embla peer dep coupling** — both `PostMediaCarousel` and `PostEngagementPanel` (likes strip) import Embla directly. A shared `media-carousel-01` primitive would dedupe.
- **`PostVideoPlayer` controls aren't slot-based** — play/pause/mute UI is hardcoded; can't replace the overlay design without forking the component.
- **`StoryViewer` reimplements progress bars + video + nav from scratch** — could share `video-player-01` + segmented progress bar with the post system. Currently 302 LOC of duplication potential.
- **No content carousel virtualization** — fine for posts (max ~10 media), but a scrollable infinite story rail with 100+ users would lag.
- **Avatar fallback is `name.substring(0, 2).toUpperCase()`** repeated inline ~10 times across files. Already solved by `people-grid-01`'s exported `getInitials(name)` helper kernel — should reuse.
- **Hardcoded Turkish strings throughout** (`Daha fazla göster`, `Beğenenler`, `Henüz yorum yok…`, `Hikaye Ekle`, `Yanıtla`, `Sil`, etc.) — needs a `labels` object per component for i18n.
- **`mockStories` baked into `StoriesSection.tsx`** as production code (not behind a fixture flag) — should be in dummy-data.
- **No keyboard activation for double-tap** — mouse/touch only; not accessible.
- **`PostEngagementPanel` defaults `currentUser` to a stub Unsplash avatar + "Kullanıcı"** — quietly falls back to a fake user when host doesn't pass one. Should require explicit user or render an empty/anonymous composer state.
- **`postId` prop on `PostEngagementPanel` is unused** in the body — passed in but only acted on through callback closures. Leftover from an earlier API.
- **Animation lib mix:** `PostEngagementPanel` uses `animate-ping` (Tailwind) for the heart burst, `StoryViewer` uses framer-motion for the modal. Inconsistent. Per the agreed plan, framer-motion is now allowed as a peer dep — pick one approach per gesture.
- **Stories types use `Date` for `createdAt`**, posts use `string`. Inconsistent.
- **No focus trap in `StoryViewer`** despite being a modal — Tab key escapes to the page underneath.
- **No "swipe down to close" gesture** on `StoryViewer` (mobile expectation).

## Constraints / non-goals

- **Pro-ui registry rule:** components must NOT import `next/*`, app contexts, or env-specific code. Polymorphic link slots only.
- **Pro-ui design tokens:** signal-lime accent, off-white light background, graphite-cool dark, Onest + JetBrains Mono fonts. Lime is too bright for white text — pair with near-black `--primary-foreground`.
- **Realtime contract:** registry can't ship a websocket client. Each component with live data exposes an optional `subscribe?: (handler: (delta) => void) => Unsubscribe` prop; host wires the transport (websocket / SSE / polling) and pushes deltas. Optimistic local state layers underneath.
- **Embla peer dep approved.** framer-motion peer dep approved (use sparingly — CSS reveal-up still preferred for simple staggered reveals; framer-motion for genuinely interactive motion: drag, double-tap heart burst, story modal in/out).
- **Comment depth default 2** (parent + 1 reply level); `maxDepth` prop allows raising to 3 for Reddit-style.
- **Sealed-folder rule:** each pro-comp is independent; no cross-imports between sealed folders. Composition via slot props at the host level.
- **Chat is out of scope** — its own future system; engagement-bar-01 + expandable-text-01 will be reusable inside it later.
- **No real backend wiring** — sandbox demo uses optimistic local state + dummy "subscribe" that fires synthetic deltas on a timer for showcase purposes.
- **No detail-page route ship** — sandbox `/sandbox/social-feed-page-01` Tier-3 covers the assembled experience after all 8 components ship.
- **Accessibility floor:** keyboard activation for all interactive elements (including double-tap-to-like via `Enter` on focused media); `aria-live` on live-updating counts; focus trap in `story-viewer-01`.

## Screenshots / links

<<TBD: kasder Figma URL or screenshot of the post card + stories rail in the live app>>

## Proposed component breakdown (from investigation)

Locked into 8 sealed-folder pro-comps + 1 Tier-3 sandbox. Ship order:

1. `expandable-text-01` (data) — measure-and-toggle line-clamp text. No deps.
2. `video-player-01` (data) — `<video>` wrapper with optional slot-based controls + `isActive` auto-pause. No deps.
3. `media-carousel-01` (data) — Embla-driven 3-variant carousel (gallery / linear / feature-strip). Depends on video-player-01.
4. `engagement-bar-01` (data) — discriminated-union `actions[]` array; like / comment / share / bookmark / view-count / custom. Highest-leverage primitive — also retrofits into already-shipped content-card-news-01 + event-card-01 actions slots.
5. `comment-thread-01` (data) — recursive comment tree, configurable maxDepth (default 2). Depends on expandable-text-01 + engagement-bar-01.
6. `post-card-01` (data) — Tier-2 composite. Variants `feed` / `compact` / `list` / `detail`. Text-only mode when media empty. Depends on all 1-5.
7. `story-rail-01` (data) — horizontal thumbnail rail, gradient ring for unread. Depends on media-carousel-01 (feature-strip variant).
8. `story-viewer-01` (data) — full-screen modal viewer with segmented progress + tap-zones + Radix Dialog. Depends on video-player-01.

After all 8 ship: `/sandbox/social-feed-page-01` Tier-3 composition.
