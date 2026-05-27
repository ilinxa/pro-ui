# `post-card-01` v0.2.0 — Description Addendum (Stage 1)

> **Stage:** 1 of 3 · **Status:** 🟡 Drafted, awaiting sign-off
> **Slug:** `post-card-01` (unchanged) · **Target version:** `0.2.0`
> **Release model:** **additive expansion + structural polish** on v0.1.1. Net public-API surface grows; every v0.1.x consumer keeps working unchanged (no rename, no removal, no semantic narrowing). A short tour of the breaking-or-not analysis is in §1.4.
>
> **Why this addendum exists.** v0.1.1 shipped the canonical 4-variant social-post composite with inline engagement panels, but five structural gaps surfaced when we walked the surface for the "post system" sweep:
> 1. zero responsive breakpoints anywhere in the variants — kasder source was mobile-first and we lost the breakpoints in migration
> 2. the `Post` data shape is leaner than "every standard post field" (no `tags` / `mentions` / `editedAt` / `visibility` / `repostOf` / `linkPreview` / `poll` / `isPinned` / `isSensitive` / `language` / `location` / `replyTo`)
> 3. no permissions model — kebab items derive from "is handler wired?", which cannot express the **owner vs viewer** distinction (the user's headline ask)
> 4. `LikersStrip` + `ShareMenu` are sealed inside `parts/`; other engagement surfaces (comment-thread, profile, story-viewer) re-implement
> 5. no `post-editor-01` sibling — half the "post system" surface area is missing
>
> **This addendum** documents only the **delta** v0.1.1 → v0.2.0. The base description ([`post-card-01-procomp-description.md`](post-card-01-procomp-description.md)) still defines the load-bearing v0.1 surface; this file extends it. When v0.2.0 ships GATE 3, the addendum is FOLDED into the base description and removed — but until then, the two read together.
>
> **A+ structural grade target.** v0.1.1 is B+ today (per the validation pass that preceded this draft). The v0.2.0 scope below is calibrated to close exactly the grade-affecting gaps: permissions + responsive + schema breadth + engagement-extraction + the editor sibling. The "Structural A+ checklist" in §7 is the explicit grade criterion this version is committed to.

---

## 1. Problem (delta)

### 1.1 The owner-vs-viewer asymmetry — the user's headline ask

Every social-post surface has **exactly two conditional sets of UI affordances** depending on whether the viewer owns the post (or has CRUD permissions on it) or is a third-party reader:

| Affordance | Owner / has CRUD | Viewer / third party |
|---|---|---|
| Kebab — Edit | ✓ | ✗ |
| Kebab — Delete | ✓ | ✗ |
| Kebab — Pin to top / unpin | ✓ | ✗ |
| Kebab — Change visibility (public ↔ followers ↔ private) | ✓ | ✗ |
| Kebab — See analytics | ✓ | ✗ |
| Kebab — Mark sensitive | ✓ | ✗ |
| Kebab — Report | ✗ | ✓ |
| Kebab — Block author | ✗ | ✓ |
| Kebab — Mute author / hide future posts | ✗ | ✓ |
| "Edited X ago" badge — visible to viewer? | always | always (if `editedAt` set) |
| "Pinned" badge on the card | render if `isPinned` | render if `isPinned` |
| Content-warning gate before media reveal | render if `isSensitive` | render if `isSensitive` |

v0.1.1 cannot express any of the owner row. There is no `onEdit` / `onDelete` / `onPin` handler. The kebab cannot diverge by viewer role. **This is the load-bearing gap** — without it, every consumer ends up doing the "if (post.author.id === currentUser.id) { showEditMenu() } else { showReportMenu() }" dance in `kebabActions={...}`, repeated per surface, with each app's drift.

The user's explicit ask: **"this card in some cases will be created by other users and in some cases will be our own post or the post that we have CRUD permissions so setting and some other features must have 2 different conditional set."** v0.2.0 ships a simple **two-mode toggle** (`viewerMode?: "owner" | "viewer"`) + an optional `PostPermissions` matrix for granular per-field overrides. The library does NOT make assumptions about the host's identity / role model (different projects have different systems) — host explicitly passes the mode it wants. Auto-derivation from `currentUser.id === author.id` is NOT shipped (drops the Q-D1 (c) `"auto"` sentinel from the prior draft) — the host knows.

**Moderator UX** (take-down, feature, etc.) is NOT a third toggle value in v0.2.0 — moderator dashboards override via the existing `kebabActions={...}` full-takeover slot (already used by v0.1's `ListTab` demo for "Pin to top / Take down"). Adding a `"moderator"` toggle value is a v0.3+ candidate IF asked. Keeps v0.2.0 honest: two variations as the user requested.

Sibling cards (project-card-01, event-card-01, content-card-news-01) inherit the same `viewerMode` toggle + `Permissions` matrix shape — the user explicitly extended the ask to "projects, news, event…". Cross-card charter remains v0.3+ work per Q-D2 lock.

### 1.2 The responsive deficit

Grep across the four variants + header + parts: **zero `sm:` / `md:` / `lg:` breakpoints anywhere.** The kasder source was mobile-first and laid out for ~360–414px viewports. The library migration normalized everything to "desktop default" (`p-4`, `text-sm`, `h-10 w-10` avatars, `w-32` list thumbnail), and the variants now look correct at exactly one breakpoint and wrong everywhere else:

- `list-variant` thumb is `w-32` (128px) at every viewport — postage-stamp on a wide desktop list, ~40% of the row on narrow mobile.
- `feed-variant` + `detail-variant` use `p-4` always — detail page should breathe more (`p-4 md:p-6 lg:p-8`) on tablet/desktop.
- `post-header` long author name + `@username · 3h ago` + verified badge + kebab can push the kebab off-screen <320px; no `min-w-0` / `truncate` discipline on the time-string span.
- `LikersStrip` columns are `w-20` × `h-12 w-12` avatars — fixed sizes on a strip that's supposed to be touch-scrollable from any width.
- Demo tab list (`grid-cols-9`) overflows below ~720px — wraps into 2 lines mid-word.

v0.2.0 lays in a responsive pass: padding/typography/avatar/thumb all step at `sm:` / `md:` / `lg:`; header truncates correctly; demo tab list collapses to a scroll-overflow strip on narrow viewports. Touch targets stay ≥44px per WCAG 2.5.5.

### 1.3 The schema breadth gap — "every standard post field"

v0.1.1 `Post`:

```ts
interface Post {
  id; author; content; media?;
  createdAt;
  likes; isLiked?; comments; shares?; viewCount?; isBookmarked?;
}
```

Missing from a baseline that any modern social-post API would return:

| Field | Why it's standard | v0.2.0 disposition |
|---|---|---|
| `tags?: string[]` | hashtag chips, tag-search routing | **add (optional)** |
| `mentions?: PostMention[]` | clickable `@name`, notification fanout, highlighting in body | **add (optional, sub-type `{ id, name, username?, range: [start, end] }`)** |
| `location?: PostLocation` | place chip in header sub-row | **add (optional, sub-type `{ name, lat?, lng? }`)** |
| `visibility?: PostVisibility` | visibility badge in header + change-visibility kebab trigger | **add (optional, Facebook-style extensible string union; 6 base values + branded extension per Q-D43)** |
| `editedAt?` | "Edited 3m ago" badge after `createdAt` | **add (optional)** |
| `isPinned?: boolean` | "Pinned" badge above header | **add (optional)** |
| `isSensitive?: boolean` + `sensitiveReason?: string` | content-warning gate over media; viewer taps to reveal | **add (optional)** |
| `language?: string` | "Translate this post" affordance | **add (optional, BCP-47 string)** |
| `replyTo?: PostReplyTo` | "Replying to @x" header sub-line | **add (optional, sub-type `{ id, author: PostAuthor }`)** |
| `repostOf?: Post` | nested mini-card render — full quoted/reposted parent | **add (optional, recursive type)** |
| `linkPreview?: LinkPreview` | OG card under content; tap → external | **add (optional, sub-type `{ url, title?, description?, image?, siteName? }`)** |
| `poll?: PostPoll` | inline poll widget — owner sees results live, viewer votes once | **add (optional; full sub-type below)** |

**`PostVisibility` sub-type** (Q-D43 lock — Facebook-style extensible):

```ts
// 6 known base values with autocomplete + branded extension for granular cases.
// Library renders default labels/icons for the 6 base values via DEFAULT_POST_CARD_LABELS.
// Custom string values (e.g. "specific-friends", "list:close-friends", "everyone-except-bob")
// get a "Custom" fallback label + a configurable icon via labels.customVisibilityIcon.
export type PostVisibility =
  | "public"      // visible to everyone
  | "followers"   // visible to people who follow the author
  | "friends"     // mutual-follow / approved-connections
  | "circle"      // private group / list visible to a subset
  | "only-me"     // author only (drafts, archived posts)
  | "private"     // explicitly hidden (deleted soft-hide, banned-by-mod)
  | (string & {}); // branded extension for granular per-app visibility values
```

Library does NOT model granular cases directly (Facebook's "Friends except…" or "Specific friends only" require carrying user-id lists). Hosts encode their granular cases as their own string keys; e.g. `post.visibility = "list:123"` is valid and renders with the "Custom" fallback. Cross-card consistency: same shape used by `project-card-01` / `event-card-01` / `news-card-01` when their permission models adopt visibility.

**`PostPoll` sub-type** (closes F-9):

```ts
export interface PostPollOption {
  id: string;
  label: string;
  voteCount: number;
}

export interface PostPoll {
  options: PostPollOption[];
  closesAt?: Date | string | number;
  totalVotes: number;
  /** Whether the current viewer has already voted (gates the vote buttons). */
  hasVoted?: boolean;
  /** The option id the viewer voted for (highlights it in the results view). */
  viewerVoteOptionId?: string;
  /** Whether the poll allows multi-select. Default false (single-choice). */
  multiSelect?: boolean;
}
```

This is structural breadth, not behavior — most renders to a small badge/chip or a sub-row in the existing variants. The big-ticket items (`repostOf`, `linkPreview`, `poll`) need rendering surfaces; see §2.3 for scope splits between v0.2.0 and v0.3.0.

### 1.4 The engagement extraction gap

`engagement-bar-01` is a full sibling procomp, BUT `LikersStrip` + `ShareMenu` sit inside `post-card-01/parts/` and are not exported. Any other engagement surface (comment-thread, profile, story-viewer) that wants the same UX has to re-implement.

v0.2.0 promotes both to **sub-exports of `engagement-bar-01`** (alongside the existing `EngagementHeartBurst` sub-export). post-card-01 then composes them via cross-folder import. This is mechanical — no API change visible to post-card consumers, but consumers of `engagement-bar-01` gain two new sub-exports.

### 1.5 The editor gap

No `post-editor-01` slug exists. Today every consumer rolls their own "compose post" form with whatever form library they prefer. v0.2.0 ships a sibling `post-editor-01` procomp in the `forms` category that:

- Shares the same `Post` type with `post-card-01` (single source of truth)
- Uses `json-form` as the form substrate (already shipped; headless mode supported)
- Has TWO modes (`mode: "create" | "edit"`) — they share fields, differ only in (a) initial values, (b) which fields are frozen, (c) the submit button label
- Supports `frozenFields?: (keyof Post)[]` so edit-mode can lock `author` / `createdAt` (per the user's ask "in post just some parts will be editable")
- Composes existing siblings: `media-carousel-01` for the media-input preview, `expandable-text-01` for the long-text preview

The editor is a SEPARATE procomp, not folded into `post-card-01`. Two reasons: (a) `post-card-01` stays `display-only`, which keeps its bundle size pristine for read-heavy feed surfaces, and (b) one editor consumed by many cards is the right factoring — same pattern serves `project-editor-01` / `event-editor-01` / `news-editor-01` in later versions.

### 1.6 Why this isn't a breaking v1.0.0

Because none of the v0.1.x semantics change:
- Existing `PostHandlers` (`onLike` / `onComment` / `onShare` / `onBookmark`) keep their signatures and defaults.
- Existing `Post` fields are unchanged; all new fields are optional.
- Existing kebab default behavior (Bookmark / Share / Copy link / Report when handler wired) is preserved when no `viewerMode` / `permissions` prop is passed. **Role-aware mode is fully opt-in via the new `viewerMode` toggle** — passing `currentUser` alone does NOT change kebab semantics. No auto-derivation. The host explicitly sets `viewerMode="owner"` or `viewerMode="viewer"`. Undefined = v0.1 legacy mode.
- Default `engagementMode = "inline"` is preserved.
- The 8 slot escape hatches stay exactly as they are; v0.2.0 adds new ones additively.
- `defaultPostEngagementActions` and `defaultPostKebabActions` keep their signatures; v0.2.0 adds **new optional parameters** and **new helpers** (`defaultPostOwnerKebabActions`, `defaultPostViewerKebabActions`) — old call sites compile.

Version bump is `0.1.1 → 0.2.0` (minor) per semver. **GATE 3 required** (public-API-touching minor); patch-bump exemption does not apply.

---

## 2. In scope / Out of scope (delta to v0.1)

### 2.1 v0.2.0 — in scope (six buckets)

#### Bucket A — Two-mode toggle + permissions matrix

**Opt-in model (F-1 closure, Q-D1 lock).** Role-aware mode activates only when at least one of `viewerMode`, `permissions`, or `canPerformAction` is set. Passing `currentUser` alone preserves v0.1 handler-driven kebab semantics — this prevents silent breakage of v0.1 consumers who already wire `currentUser` purely for the embedded comment-thread.

**Library makes no identity assumptions.** No auto-derivation. The host explicitly toggles between the two variations. Different projects have different role models (some have `is_owner` flag, some have RBAC, some derive from URL slug, some have invite-token sessions) — library stays neutral.

New types:

```ts
export type PostViewerMode = "owner" | "viewer";
//   ↳ Just two values. Owner = full CRUD affordances; Viewer = read-only + report/block/mute.
//      No "moderator" tier — that's slot-driven via kebabActions full-takeover (existing v0.1 mechanism).
//      No "auto" derivation — host explicitly picks.

export type PostPermissionAction =
  | "edit" | "delete" | "pin" | "changeVisibility" | "markSensitive" | "seeAnalytics"
  | "share" | "bookmark"
  | "report" | "blockAuthor" | "muteAuthor";

export interface PostPermissions {
  // owner-side (default true when viewerMode="owner"; false when "viewer")
  canEdit?: boolean;
  canDelete?: boolean;
  canPin?: boolean;
  canChangeVisibility?: boolean;
  canMarkSensitive?: boolean;
  canSeeAnalytics?: boolean;
  // host-policy gates (viewer-side actions whose visibility the host can deny —
  // e.g. visibility="private" posts may hide Share; unauthenticated viewers may have canBookmark=false)
  canShare?: boolean;
  canBookmark?: boolean;
  // viewer-side (default false when viewerMode="owner"; true when "viewer")
  canReport?: boolean;
  canBlockAuthor?: boolean;
  canMuteAuthor?: boolean;
}
```

New `PostCard01Props` fields:

```ts
viewerMode?: PostViewerMode;
//   ↳ default: undefined (= v0.1 legacy mode, NOT role-aware). Set "owner" or "viewer" explicitly.

permissions?: PostPermissions;
//   ↳ overrides per-field on top of viewerMode defaults. Setting any field flips to role-aware mode
//      even if viewerMode is undefined; defaults then assume "viewer" baseline.

canPerformAction?: (action: PostPermissionAction, post: Post) => boolean | undefined;
//   ↳ single universal predicate (closes F-15). Returns true/false to force-allow/deny;
//      returns undefined to fall through to the permissions matrix → viewerMode defaults.
//      Wins over permissions + viewerMode.
```

New `PostMutationHandlers` interface (separate from `PostHandlers` per F-2 — `PostHandlers` stays "engagement-action handlers only" per its existing JSDoc at types.ts L63):

```ts
export interface PostMutationHandlers {
  // owner-side
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onPin?: (postId: string, nextPinned: boolean) => void;
  onChangeVisibility?: (postId: string, currentVisibility: PostVisibility | undefined) => void;
  //   ↳ Per Q-P42 lock: library does NOT ship a visibility picker UI.
  //      This callback fires when the kebab "Change visibility" item is tapped.
  //      Receives the CURRENT visibility as context. Host opens its own picker
  //      (banner / sheet / dialog / inline control) and calls back to the API directly —
  //      the library never knows the new value. Lightest possible library footprint.
  onMarkSensitive?: (postId: string, nextSensitive: boolean, reason?: string) => void;
  onSeeAnalytics?: (postId: string) => void;
  // viewer-side
  // (onReport already exists on PostCard01Props from v0.1; it carries unchanged)
  onBlockAuthor?: (authorId: string) => void;
  onMuteAuthor?: (authorId: string) => void;
}
```

**Moderator UX is slot-driven, not toggle-driven.** A moderator dashboard uses `viewerMode="owner"` for the full-controls kebab + overrides via `kebabActions={(p) => [...]}` (full takeover) to inject `Take down` / `Feature` / etc. This is the same pattern v0.1's `ListTab` demo already uses. No new types or handlers for moderator actions in v0.2.0 — keeps the library honest to the user's "two variations" requirement.

`PostMutationHandlers` is **flattened onto `PostCard01Props`** (same pattern as `PostHandlers extends PostCard01Props` today) — no nested `mutations={...}` prop bag. Consumers pass handlers at the top level.

Additional `PostCard01Props` fields for the schema-expansion render surfaces (closes F-4 / F-5 / F-6 / F-7):

```ts
onVotePoll?: (postId: string, optionId: string) => void;
onRevealSensitive?: (postId: string) => void;
onTranslate?: (postId: string, sourceLanguage: string) => void;
onMentionClick?: (mentionId: string) => void;
onTagClick?: (tag: string) => void;
onLocationClick?: (location: PostLocation) => void;
onLinkPreviewClick?: (url: string) => void;     // override default <a> nav
onRepostOfClick?: (originalPost: Post) => void; // override default getHref nav on nested card
```

Imperative handle additions (closes F-16):

```ts
export interface PostCard01Handle {
  // existing v0.1 methods carry: openKebab / triggerLike / getCurrentPost / reset
  //                              / getEngagementHandle / getThreadHandle

  // NEW v0.2.0:
  triggerEdit: () => void;            // fires onEdit if permitted
  triggerDelete: () => void;          // fires onDelete if permitted
  triggerPin: () => void;             // toggles pin via onPin if permitted
  revealSensitive: () => void;        // dismisses the sensitive-media gate programmatically
  votePoll: (optionId: string) => void;  // fires onVotePoll on the local poll widget
}
```

New helpers (all exported):

```ts
// Single role-aware kebab default (Q-D9=(b) lock: single helper, not 3).
defaultPostKebabActions(
  post: Post,
  handlers: PostHandlers & Partial<PostMutationHandlers> & {
    onReport?: (postId: string) => void;
    onCopyLink?: (postId: string) => void;
  },
  labels: Required<Pick<PostCard01Labels, ...>>,
  viewerMode?: PostViewerMode,
  permissions?: PostPermissions,
  canPerformAction?: (action: PostPermissionAction, post: Post) => boolean | undefined,
): CommentMenuItem[];
//   ↳ when viewerMode + permissions + canPerformAction are ALL omitted → v0.1 legacy behavior.
//      When any is set → role-aware items.

resolvePostPermissions(
  viewerMode: PostViewerMode | undefined,
  permissions: PostPermissions | undefined,
): Required<PostPermissions>;
//   ↳ pure function. Returns the fully-resolved permission matrix for the rendering pass.
//      No author.id === currentUser.id derivation — host explicitly toggles.
```

Resolution order, **most → least specific** (mirrors rich-card's pattern; closes F-15):
1. `canPerformAction?(action, post)` returns `true` or `false` → wins everything for that action
2. `permissions` prop, per-field — `false` denies, `true` allows
3. `viewerMode`-derived defaults — `"owner"`: all owner-side capabilities `true`, viewer-side `false`; `"viewer"`: inverse (owner-side `false`, viewer-side `true`)
4. Library-baseline default (legacy mode — no `viewerMode` + no `permissions` + no `canPerformAction`): v0.1 handler-driven kebab behavior

#### Bucket B — Responsive sweep

Step rules applied across the variants (Tailwind v4 only, no breakpoints invented):

| Surface | Mobile (`<sm`) | sm (`≥640`) | md (`≥768`) | lg (`≥1024`) |
|---|---|---|---|---|
| Card padding (feed) | `p-3` | `p-4` | `p-4` | `p-4` |
| Card padding (detail) | `p-3` | `p-4` | `p-5` | `p-6` |
| Card padding (compact/list) | `p-2.5` | `p-3` | `p-3` | `p-3` |
| Header avatar | `h-9 w-9` | `h-10 w-10` | `h-10 w-10` | `h-10 w-10` |
| Compact avatar | `h-7 w-7` | `h-8 w-8` | `h-8 w-8` | `h-8 w-8` |
| Body text size (feed/detail) | `text-[15px]` | `text-sm` | `text-sm` | `text-base` (detail only) |
| Body text size (compact/list) | `text-xs` | `text-xs` | `text-sm` | `text-sm` |
| List thumb | `w-20` | `w-28` | `w-32` | `w-40` |
| Likers strip column | `w-16` | `w-20` | `w-20` | `w-20` |
| Likers strip avatar | `h-10 w-10` | `h-12 w-12` | `h-12 w-12` | `h-12 w-12` |
| Detail comment section padding | `px-3 py-3` | `px-4 py-4` | `px-5 py-5` | `px-6 py-6` |
| Demo tab strip | `flex overflow-x-auto` | `grid grid-cols-9` | `grid grid-cols-9` | `grid grid-cols-9` |

Header truncation discipline (closes F-11):
- Outer header row: `flex min-w-0 items-center gap-2`
- Avatar: `shrink-0`
- Identity column (name + sub-line wrapper): `flex min-w-0 flex-col`
- Author-name span: `min-w-0 truncate` (only span — verified badge stays full-size beside it)
- Verified badge: `shrink-0`
- `@username · timestamp` sub-line: `truncate text-ellipsis whitespace-nowrap`
- Kebab button: `shrink-0`

All interactive elements pass **WCAG 2.5.5 touch-target ≥44×44 CSS px** (kebab, like, comment, share, bookmark, kebab items, share-menu rows) — verified by visual sweep + a touch-target lint pass.

Reduced-motion respected (`@media (prefers-reduced-motion: reduce)`) for the heart-burst — already inherited via `engagement-bar-01`'s CSS, no new work.

#### Bucket C — Schema expansion

Adds the 12 new optional fields enumerated in §1.3. Type-level only — every field is optional and unset by default; v0.1 consumers' `Post` shapes still satisfy the type.

**Render surfaces added:**

| Field | Render site | Variant scope |
|---|---|---|
| `tags` | chip row below content body | feed / detail |
| `mentions` | highlighted spans inline in body (via `renderContent` default — won't break custom `renderContent` consumers) | all |
| `location` | place chip in header sub-row, next to timestamp | feed / detail (truncates on compact/list) |
| `visibility` | small icon badge next to timestamp (globe / users / lock) | all |
| `editedAt` | "(edited)" text next to timestamp, tooltip with exact time | all |
| `isPinned` | "Pinned" badge above header — Lucide `<Pin>` + "Pinned" text | all |
| `isSensitive` | content-warning gate over media block; viewer taps "Show" to reveal | feed / detail |
| `language` | no render — used only by `onTranslate?(postId)` kebab item when wired | all |
| `replyTo` | "Replying to @x" mini-line above header | feed / detail (hidden on compact/list) |
| `repostOf` | nested `<PostCard01 variant="compact" post={repostOf}>` mini-card below content | feed / detail |
| `linkPreview` | OG card below content + above media — `<a>` wrap | feed / detail |
| `poll` | inline poll widget below content — vote buttons (viewer) / live results bar chart (owner) | feed / detail |

**v0.2.0 hands the poll + linkPreview + repostOf renders behind a `disablePollRender` / `disableLinkPreviewRender` / `disableRepostOfRender` opt-out (default `false`)** so consumers wanting a custom render via `renderContent` can suppress. Per-feature slots (`renderPoll?` / `renderLinkPreview?` / `renderRepostOf?`) are added for full takeover.

#### Bucket D — Engagement extraction (BLOCKING prerequisite per Q-P37=(a))

**Workflow note (F-3 closure + Q-P37 lock).** `engagement-bar-01` is a sibling procomp with its own GATE 1 / 2 / 3 cycle. Per the GATE 2 plan v0.2.0 Q-P37=(a) user lock, the engagement-bar-01 additive ship **MUST land before post-card-01 v0.2.0 C1 begins**. No fallback path: this is committed as a blocking prerequisite (C0 in the plan).

- **Engagement-bar-01 v0.1.2 → v0.2.0** (minor bump — additive public API: 2 new sub-exports `LikersStrip` + `ShareMenu` + 2 new type re-exports). Per the readiness-review rule, that bump triggers a spotcheck GATE 3 (narrow scope; mechanical file move; ~2–3h end-to-end).
- **engagement-bar-01 v0.2.0 owns:** authoring its own description + plan addenda + GATE 3 spotcheck. Separate procomp folder: `docs/procomps/engagement-bar-01-procomp/`. C0 of the post-card-01 v0.2.0 plan enumerates the steps.
- **Sequencing:** engagement-bar-01 description ✅ → engagement-bar-01 plan ✅ → file moves + sub-exports + meta bump + dual-slug smoke + spotcheck ✅ → THEN post-card-01 v0.2.0 C1 begins.

Proposed shape of the engagement-bar-01 additive ship:

```ts
// engagement-bar-01/index.ts (additive)
export { LikersStrip } from "./parts/likers-strip";
export type { LikersStripProps } from "./parts/likers-strip";
export { ShareMenu } from "./parts/share-menu";
export type { ShareMenuProps } from "./parts/share-menu";
```

Existing post-card consumers see no change either way — `LikersStrip` was never exported from post-card-01 in v0.1.x. Existing engagement-bar consumers gain two new sub-exports if/when that ship lands.

#### Bucket E — Display badges & content gates (new render parts)

Net-new parts inside `post-card-01/parts/`:

- `parts/pinned-badge.tsx` — RSC-compatible (no `"use client"`); `<Pin>` + "Pinned" pill
- `parts/visibility-badge.tsx` — RSC-compatible; small icon (globe/users/lock) + tooltip
- `parts/sensitive-gate.tsx` — `"use client"`; covers media with a reveal button; `onReveal` callback
- `parts/mention-text.tsx` — RSC-compatible; reads `post.mentions` + content, returns a `ReactNode` tree with highlighted spans (default renderContent calls this)
- `parts/link-preview-card.tsx` — `"use client"` (handles fetch state if `linkPreview` lazy-loads); OG-card layout
- `parts/poll-widget.tsx` — `"use client"`; owner sees results bar chart, viewer sees vote buttons (one selectable, fires `onVotePoll`). Bar-fill uses CSS `transition-[width]` with `motion-reduce:transition-none` (closes F-17); reveal of post-vote results uses `transition-opacity` with `motion-reduce:transition-none`.
- `parts/repost-of-card.tsx` — `"use client"`; nests `<PostCard01 variant="compact" post={repostOf} viewerMode="viewer" engagementMode="navigate" />` — explicit defaults to prevent recursive engagement panel state.

#### Bucket F — Sibling `post-editor-01` procomp (separate slug)

Lives at `src/registry/components/forms/post-editor-01/`. Sealed-folder convention, GATE 1 + GATE 2 + GATE 3 for the editor are **separate procomp work** and tracked in `docs/procomps/post-editor-01-procomp/` (NOT this addendum). v0.2.0 of `post-card-01` declares `post-editor-01` as a `related` slug; the editor description ships its own description doc.

**The minimum editor contract referenced by post-card-01 v0.2.0** (the rest is editor's concern):

```ts
interface PostEditor01Props {
  mode: "create" | "edit";
  initialPost?: Post;                          // empty for create; hydrated for edit
  frozenFields?: (keyof Post)[];               // edit-mode can lock createdAt, author, etc.
  visibilityOptions?: PostVisibility[];        // which values the editor's visibility picker offers (editor-side picker; library card has no picker)
  maxMediaItems?: number;
  enabledFeatures?: {                          // surface gating per host's plan / role
    poll?: boolean;
    location?: boolean;
    tags?: boolean;
    mentions?: boolean;
    linkPreview?: boolean;
    repost?: boolean;                          // F-14: gates the "Quote post" affordance
    sensitiveMark?: boolean;                   // gates the "Mark sensitive" toggle
    visibility?: boolean;                      // gates the visibility selector
  };
  onSubmit: (post: Post, mode: "create" | "edit") => Promise<void> | void;
  onCancel?: () => void;
}
```

#### Bucket G — Misc structural polish

- **Re-export the new permission helpers** + the new types from `post-card-01/index.ts`.
- **Add `isPinned` bubble + `editedAt` "(edited)" suffix to `<PostHeader>`** alongside the existing avatar+name+time row.
- **Lift the sweep finding F-01** (cross-folder-import brittleness) into a documentation block in the guide AND extend the smoke harness to run consumer-side `pnpm tsc --noEmit` post-install (the F-cross-11 path-b smoke we already run for new ships). One-time fix.
- **Drop the demo's `grid-cols-9`** in favor of a responsive `flex overflow-x-auto` tab strip on `<sm`; demo files only — no library change.
- **Add 4 new demo tabs:** Owner-mode (kebab shows Edit/Delete/Pin) / Viewer-mode (kebab shows Report/Block) / Repost (nested mini-card) / Sensitive (content-warning gate over media).

### 2.2 v0.2.0 — explicitly OUT of scope

- **Inline edit affordance** — full takeover through `onEdit` callback → host opens `<PostEditor01 mode="edit" initialPost={post} />` in a sheet/dialog. Editor is a SEPARATE procomp; no inline edit in the card.
- **Reaction emojis** (Facebook-style 6-emoji popover) — explicit out-of-scope, deferred to `engagement-bar-01` v0.3.
- **Multi-author posts** — `post.author` stays a single object. Co-authors not modeled.
- **Comment-level permissions** — `commentActions` already takes `isOwn` from comment-thread-01; v0.2.0 doesn't extend that surface here.
- **Drafts / scheduled posts** — editor-side concern (`post-editor-01`).
- **Auto-translate** — `language` field is structural-only in v0.2.0; the translate action is consumer-wired via `onTranslate` kebab (added if `language !== currentLocale` and handler wired).
- **Mention-detail popovers** (hover/tap on `@mention` → profile preview) — out of scope; `mention-text.tsx` ships clickable spans with `onMentionClick?: (mentionId)` callback, host owns the popover.
- **Link-preview server-side fetch** — `linkPreview` is fully consumer-supplied; the card renders what's passed.
- **Poll mid-vote-edit** — once a viewer votes, the buttons disable. No "change vote" affordance in v0.2.0.
- **Quote-post creation flow** — `repostOf` is render-only; creating a repost is editor work.
- **Poll real-time delta channel** (closes F-13) — `EngagementDelta` is not extended in v0.2.0 to carry poll deltas (would propagate to engagement-bar-01's public union, out of scope here). Consumers needing live poll vote updates either: (a) refresh via `ref.current.reset(updatedPost)` from their own subscription, or (b) wait for v0.3+ which can introduce a `pollSubscribe` channel parallel to `engagementSubscribe` / `commentSubscribe`. v0.2.0 ships poll widget as optimistic-vote + static-render.

### 2.3 v0.3+ — flagged candidates (not committed)

- **Reaction emojis** (engagement-bar-01 v0.3)
- **Reply-thread renderer** in feed-variant (Twitter-style ancestor-chain peek)
- **Long-press preview / hover card** (force-touch detail peek)
- **Cross-card permission charter** — same `PostPermissions` shape mapped to `ProjectPermissions` / `EventPermissions` / `NewsPermissions` / `CommentPermissions`, all sharing a `resolvePermissions(role, overrides)` resolver in a new `src/registry/lib/permissions/` shared module (NOT today — would need a separate F-cross-NN charter)
- **Mention-detail popovers** (engagement family)
- **Auto-translate** (kebab + content body)

---

## 3. Target consumers (delta to v0.1)

All v0.1 consumers carry. v0.2.0 adds:

7. **Owner-aware social feeds** — apps where the same post component renders for both the author's profile view (full edit/pin/visibility controls) AND third-party feeds (report/block).
8. **Moderator dashboards** — `viewerMode="owner"` baseline + `kebabActions={...}` full-takeover slot (existing v0.1 mechanism) injects Take-down / Feature / etc. No new library types for moderator-specific actions in v0.2.0 (Q-D1 lock).
9. **Mobile-first SaaS apps** — the responsive sweep makes the card work on `<360px` viewports without consumer overrides.
10. **Apps with `repostOf` / quoted posts** — Twitter / Bluesky / Mastodon-style.
11. **Apps with polls** — Twitter / LinkedIn / Mastodon-style inline polls.
12. **Apps with content warnings** — Mastodon / Bluesky-style sensitive-media gates.
13. **Multi-language feeds** — `language` field + translate action.

---

## 4. Rough API sketch (delta)

Owner mode (host's app determined the current viewer has CRUD on this post) — kebab shows Edit/Delete/Pin/Change-visibility:

```tsx
<PostCard01
  variant="feed"
  post={ownPost}
  currentUser={viewer}
  viewerMode="owner"            // explicit toggle — no auto-derivation
  onEdit={(id) => openEditor(id)}
  onDelete={(id) => api.deletePost(id)}
  onPin={(id, pinned) => api.pinPost(id, pinned)}
  onChangeVisibility={(id, current) => openVisibilityPicker(id, current)}  // host opens its own picker UI
  onLike={api.likePost}
  onBookmark={api.bookmarkPost}
/>
```

Viewer mode (third-party viewing) — kebab shows Report/Block/Mute:

```tsx
<PostCard01
  variant="feed"
  post={otherPost}
  currentUser={viewer}
  viewerMode="viewer"           // explicit toggle
  onReport={(id) => openReportDialog(id)}
  onBlockAuthor={(id) => api.blockUser(id)}
  onMuteAuthor={(id) => api.muteUser(id)}
  onLike={api.likePost}
  onBookmark={api.bookmarkPost}
/>
```

Host derives the mode (typical app pattern — the library doesn't do this for you):

```tsx
const viewerMode = post.author.id === viewer.id ? "owner" : "viewer";

<PostCard01
  variant="feed"
  post={post}
  currentUser={viewer}
  viewerMode={viewerMode}
  {...handlers}
/>
// viewerMode omitted entirely → v0.1 legacy mode (handler-driven kebab); no role-aware items.
```

Granular permission override on top of `viewerMode="owner"`:

```tsx
<PostCard01
  variant="feed"
  post={post}
  viewerMode="owner"
  permissions={{ canDelete: false }}  // owner mode, but suppress the Delete action
  {...handlers}
/>
```

Universal predicate escape hatch (`canPerformAction`) wins over both `permissions` and `viewerMode`:

```tsx
<PostCard01
  variant="feed"
  post={post}
  viewerMode="owner"
  canPerformAction={(action, p) => {
    if (action === "delete" && p.isPinned) return false;   // pinned posts can't be deleted
    return undefined;  // fall through to matrix + mode defaults
  }}
  {...handlers}
/>
```

Moderator dashboard (slot-driven, not toggle-driven — same pattern as v0.1):

```tsx
<PostCard01
  variant="list"
  post={post}
  viewerMode="owner"            // shows full controls baseline
  kebabActions={(p) => [        // full takeover — inject moderator-specific items
    { label: "Pin", onClick: () => api.pin(p.id) },
    { label: "Take down", destructive: true, onClick: () => api.takeDown(p.id) },
    { label: "Feature", onClick: () => api.feature(p.id) },
    { label: "Block author", onClick: () => api.block(p.author.id) },
  ]}
  {...handlers}
/>
```

Repost (nested mini-card):

```tsx
<PostCard01
  variant="feed"
  post={{
    ...basePost,
    repostOf: originalPost,  // nested Post
  }}
  {...handlers}
/>
```

Poll (owner sees results live, viewer votes):

```tsx
<PostCard01
  variant="feed"
  post={{
    ...basePost,
    poll: {
      options: [{ id: "a", label: "Yes", voteCount: 42 }, { id: "b", label: "No", voteCount: 18 }],
      closesAt: tomorrow,
      totalVotes: 60,
      hasVoted: false,
    },
  }}
  onVotePoll={(postId, optionId) => api.votePoll(postId, optionId)}
  {...handlers}
/>
```

Sensitive content (viewer must tap to reveal):

```tsx
<PostCard01
  variant="feed"
  post={{ ...basePost, isSensitive: true, sensitiveReason: "Spoiler — finale" }}
  {...handlers}
/>
```

---

## 5. Example demos (Q-D7 lock: replace, don't stack)

**v0.1 tabs are refreshed in place — no two-groups layout.** Per the user's instruction ("if we are replacing v1 with v2 we must update v1 examples to v2 examples — no need them any more"), the 9 existing tabs get rewritten to showcase v0.2 features blended into their established demo personas. Plus three new tabs for genuinely net-new schema concepts (Repost, Poll, Sensitive) that don't fit cleanly into any existing variant label.

**Single `<Tabs>` group; 12 tabs total; responsive tab strip:** `flex overflow-x-auto sm:grid sm:grid-cols-[repeat(auto-fit,minmax(96px,1fr))]` (no fixed column count; stock Tailwind v4 has no `grid-cols-14`; flex-scroll on mobile, auto-fit grid on `sm+`).

### Refreshed v0.1 tabs

| Tab | v0.1 content | v0.2 refresh |
|---|---|---|
| **Feed** | Multi-image post + inline panels + comment-thread | Adds a `viewerMode` switch widget at the top of the demo (owner ↔ viewer) so reviewer sees both kebab variations on the same post. Adds `tags`, `mentions`, `location` to the post — chips render below content. |
| **Compact** | Sidebar widget — single image post | Adds `visibility` icon badge + `editedAt` "(edited)" suffix in header. `viewerMode="viewer"` fixed. |
| **List** | Admin row — `kebabActions` slot override (Pin / Take down / Block) | Demonstrates moderator pattern explicitly: `viewerMode="owner"` baseline + `kebabActions` full-takeover. Adds `isPinned` Pinned-badge on featured post. |
| **Detail** | Full-page post + embedded thread | Adds `repostOf` (nested mini-card) + `linkPreview` OG card. `viewerMode="owner"`. Demonstrates the universal `canPerformAction` predicate (disables Delete on pinned posts). |
| **Text-only** | Long-text post — no media | Adds `replyTo` "Replying to @x" sub-header line. |
| **Video** | Video carousel | Adds `language` field + `onTranslate` kebab item (visible only because `language !== "en"`). |
| **Realtime** | engagementSubscribe + commentSubscribe | Adds `viewerMode="owner"` + `onPin` handler — demonstrates that pin-state can flow through realtime via `reset()` (Q-D5 / F-13 documented flow). |
| **Inline TR** | TR-localized inline panels | Adds TR labels for the new kebab items (Düzenle / Sil / Sabitle / Bildir / Engelle). Demonstrates `viewerMode` works under i18n. |
| **Custom** | Slot takeover — `engagementActions` + `kebabActions` | Now also demonstrates `canPerformAction` predicate composed with the slot. Demonstrates the dynamicity-primacy pattern. |

### Net-new tabs (schema-only concepts)

| Tab | Demonstrates |
|---|---|
| **Repost** | Dedicated showcase: feed-variant post with `repostOf` set; tapping nested card navigates via `getHref(repostOf)`. Shows the nested-card-no-engagement-bar lock (Q-D3=(b)). |
| **Poll** | Inline poll widget. Two views via a control: "as viewer" (vote buttons) vs "as owner" (live-results bar chart). Optimistic vote flow per Q-D5. |
| **Sensitive** | `isSensitive: true` + `sensitiveReason: "Spoiler — finale"`. Tap "Show" to reveal media. `prefers-reduced-motion` snap-reveal (no opacity transition) demonstrated via DevTools toggle. |

### Cost note (transparency)

The v0.1 demos are **rewritten, not deleted**. Existing tab labels (Feed / Compact / List / Detail / Text-only / Video / Realtime / Inline TR / Custom) stay — same docs-site URL `/components/post-card-01` continues to surface "Feed" / "Detail" / etc. as the first thing readers click. This is doc churn, not API churn. **Library API stays backwards-compat per §1.6** — `demo.tsx` rewrite is purely the showcase layer.

---

## 6. Success criteria (delta to v0.1)

All v0.1 criteria stand. New v0.2.0 criteria:

8. **Owner-vs-viewer divergence is observable** without any `kebabActions` override. `viewerMode="owner"` produces Edit/Delete/Pin/Visibility/Mark-sensitive kebab items by default (when their handlers are wired). `viewerMode="viewer"` produces Report/Block/Mute by default. Moderator UX is slot-driven (`kebabActions` full takeover) — no third toggle value in v0.2.0.
9. **`viewerMode` is a host-explicit toggle.** No auto-derivation. Undefined = v0.1 legacy mode; no role-aware kebab items. Test cases prove the two explicit modes + legacy-mode preservation.
10. **`permissions` overrides win over `viewerMode` defaults**; `canPerformAction(action, post)` universal predicate wins over both. The 3-layer resolution order from §2.1-A is mechanically verifiable.
11. **Zero breaking changes verified at the LIBRARY API surface.** Every existing prop signature compiles + renders identically with no source modification. tsc + lint + smoke all green when a v0.1.x consumer imports the new `post-card-01` without touching their call site. (Note: the docs-site `demo.tsx` is rewritten per Q-D7 lock — this is showcase churn, not API churn. The library stays backwards-compat; only the demonstration narrative is refreshed.)
12. **Responsive sweep complete.** Every variant renders correctly at 320 / 360 / 414 / 768 / 1024 / 1280 / 1440 viewports. Touch targets ≥44×44 everywhere. Verified via visual + a touch-target lint pass (informal `Set` of all interactive class strings).
13. **Schema expansion complete.** 12 new optional fields shipped; type-level only. **11 with render surfaces** (`tags` / `mentions` / `location` / `visibility` / `editedAt` / `isPinned` / `isSensitive` / `replyTo` / `repostOf` / `linkPreview` / `poll`); **1 wire-only** (`language` — drives the `onTranslate` kebab item visibility but renders no marker). Closes F-8.
14. **Engagement extraction complete via blocking prerequisite (Q-P37=(a)).** `LikersStrip` + `ShareMenu` are sub-exports of `engagement-bar-01` v0.2.0 (which shipped first per the C0 prerequisite in the GATE 2 plan). `post-card-01` v0.2.0 imports cross-folder. Both packages' smoke harness runs clean. No v0.2.1-deferred path — extraction is part of this version.
15. **`post-editor-01` GATE 1 description in flight** in a separate procomp folder. Its GATE 3 closure is NOT a prerequisite for post-card-01 v0.2.0 GATE 3 (the card ships standalone; the editor lands when it lands).
16. **F-01 from v0.1.1 spotcheck closed.** Either consumer-side `pnpm tsc --noEmit` lands in the smoke harness (preferred) OR the cross-folder import convention is documented + lint-enforced. One of the two; user picks at GATE 2.
17. **Sensitive-media gate respects `prefers-reduced-motion`** (no animation on reveal) and is keyboard-operable (`Enter` / `Space` on the focused gate reveals).

---

## 7. Structural A+ checklist (the explicit grade criterion)

v0.2.0 closes the five grade-affecting gaps from the validation pass. Each item below is a binding promise of v0.2.0 GATE 3:

| # | Gap | v0.2.0 close |
|---|---|---|
| 1 | No permissions model | Simple `viewerMode?: "owner" \| "viewer"` two-mode toggle (no auto-derivation; no moderator tier) + `PostPermissions` matrix for granular override + `resolvePostPermissions()` resolver + single role-aware `defaultPostKebabActions` helper + universal `canPerformAction` predicate + new `PostMutationHandlers` interface with 8 new handlers |
| 2 | Zero responsive breakpoints | Six surfaces (padding, avatar, body text, list thumb, likers column, demo tabs) step at `sm:` / `md:` / `lg:`; touch targets ≥44×44; reduced-motion respected (heart-burst + poll bar + sensitive-reveal all `motion-reduce:transition-none`) |
| 3 | Schema breadth gap | 12 new optional `Post` fields; **11 with render surfaces, 1 (`language`) wire-only** |
| 4 | `LikersStrip` / `ShareMenu` sealed | Both promoted to sub-exports of `engagement-bar-01` (the bump version + GATE 1/2/3 owned by engagement-bar-01; post-card-01 v0.2.0 ships either with the cross-folder imports OR with the legacy in-`parts/` files depending on which procomp lands first — see Bucket D) |
| 5 | No editor procomp | Sibling `post-editor-01` GATE 1 description authored in parallel (separate procomp; not gated on post-card-01) |
| 6 | F-01 cross-folder-import brittleness still open | Smoke harness extended with consumer-side `tsc --noEmit` (path-b smoke) OR convention documented + lint-enforced |

**A+ grade criteria explicitly NOT addressed in v0.2.0** (no fake claims):
- **Vitest test coverage** — informed-defer per project lock; no test files in v0.2.0
- **Reaction emojis / long-press preview / quote-post creation flow** — v0.3+ candidates per §2.3
- **Cross-card permission charter** (sharing the same resolver across project-card / event-card / news-card) — F-cross-NN candidate, NOT a v0.2.0 deliverable; the resolver lives inside `post-card-01/lib/` for now and gets lifted into a shared module IF the user explicitly wants the cross-cutting charter as a separate work item

---

## 8. Open Q-Ps (require sign-off before GATE 2)

Locked Q-Ps from v0.1.x carry. New Q-Ps for v0.2.0:

| # | Question | Options | Recommendation |
|---|---|---|---|
| **Q-D1** | How does role-aware mode activate? | (a) auto-derived from `currentUser` (= silent v0.1 breakage); (b) explicit toggle, two modes only — `viewerMode?: "owner" \| "viewer"`; undefined keeps v0.1 legacy mode; no auto-derivation; no third moderator value (slot-driven instead) | **(b)** ✅ **SIGNED OFF.** User lock: "we are creating a generally usable component and they may [be] different systems in different projects — just handle it by a toggle that mimics 2 variations." No identity assumptions in the library; host explicitly picks the mode. Moderator UX = `kebabActions` slot full-takeover (existing v0.1 mechanism). |
| **Q-D2** | Do we ship the `PostPermissions` resolver as a project-shared module today, or scoped under `post-card-01/lib/`? | (a) scoped under `post-card-01/lib/`; (b) shared `src/registry/lib/permissions/` (cross-card today); (c) scoped today, lift to shared with an F-cross charter later | **(c)** ✅ **SIGNED OFF.** Keeps v0.2.0 scope tight. Cross-card charter is its own work item with its own GATE 1. |
| **Q-D3** | `repostOf` renders as nested `<PostCard01 variant="compact">` — does the nested card show its own engagement bar? | (a) yes (full engagement); (b) no (display-only, no bar); (c) configurable via prop | **(b)** ✅ **SIGNED OFF.** Nested reposts show counts-only. Tapping the nested card navigates to the original post via `getHref(repostOf)`. Configurable later if requested. |
| **Q-D4** | Where does the `linkPreview` fetch happen? | (a) library fetches (`linkPreviewFetcher?(url) => Promise<LinkPreview>`); (b) host pre-fetches and supplies `post.linkPreview`; (c) both — host-supplied wins, library fallback fetcher | **(b)** ✅ **SIGNED OFF.** Link previews are server-render-friendly when host pre-fetches; library staying fetch-free keeps `post-card-01` zero-network-IO. v0.3+ can add (c) if asked. |
| **Q-D5** | Poll vote — optimistic or pessimistic? | (a) optimistic (button fires `onVotePoll`, UI flips immediately, reverts on reject); (b) pessimistic (button disables on click until `onVotePoll` resolves) | **(a)** ✅ **SIGNED OFF.** Matches `onLike` optimistic flow. Local mirror gains a `pollVote` field; `engagementSubscribe` doesn't carry poll deltas (separate concern; out of scope per §2.2). |
| **Q-D6** | Sensitive-media gate — per-media or per-post? | (a) per-post (`post.isSensitive` gates ALL media); (b) per-media (`MediaItem.isSensitive` per item — finer-grained) | **(a)** ✅ **SIGNED OFF.** v0.2.0 ships per-post; (b) stays a v0.3+ candidate. Matches Mastodon/Bluesky default and keeps the `Post` shape simple. |
| **Q-D7** | Where do the new demo tabs land? | (a) single tab strip (14 tabs, v0.1 + v0.2 mixed); (b) two stacked `<Tabs>` groups (v0.1 + v0.2 separate); (c) **refresh v0.1 tabs in-place to showcase v0.2 features + add 3 net-new tabs for schema-only concepts; single strip; 12 tabs total** | **(c)** ✅ **SIGNED OFF.** User lock: "if we are replacing v1 with v2 we must update v1 examples to v2 examples — no need them any more." v0.1 tabs are refreshed (Feed gets `viewerMode` switch widget + tags/mentions; Compact gets visibility badge + editedAt; List demonstrates moderator-via-slot; Detail gets repostOf + linkPreview; Realtime gets pin flow; Inline TR gets new TR labels; Custom showcases canPerformAction). Adds 3 new tabs: Repost, Poll, Sensitive. Library API stays backwards-compat — `demo.tsx` rewrite is showcase churn, not API churn. |
| **Q-D8** | F-01 closure — smoke-harness consumer-tsc OR convention doc? | (a) smoke harness extended (preferred per the v0.1.1 spotcheck recommendation); (b) convention documented + lint check; (c) both | **(a)** ✅ **SIGNED OFF.** Convention drift is the smoke harness's job to catch. Documentation alone has a high false-pass rate. |
| **Q-D9** | `defaultPostKebabActions` — split into role-aware helpers, OR extend the existing helper? | (a) keep old + ship 3 separate role-aware helpers (4 total); (b) extend `defaultPostKebabActions` with optional trailing args (`viewerMode?`, `permissions?`, `canPerformAction?`, `mutationHandlers?`) — one helper, fully backwards-compatible | **(b)** ✅ **SIGNED OFF.** Fewer exports, one mental model. Backwards-compatible (new args all optional, trailing); old v0.1 call sites compile unchanged. |
| **Q-D10** | Should `post-editor-01` GATE 1 description be authored in parallel with this addendum or sequenced after? | (a) parallel; (b) sequenced after | **(b)** ✅ **SIGNED OFF.** Editor depends on the final v0.2.0 `Post` schema; locking the card description first prevents thrashing. |

---

### Sign-off block

| Q | Lock | Source |
|---|---|---|
| Q-D1 | Simple `viewerMode?: "owner" \| "viewer"` toggle; no auto-derivation; no moderator tier (slot-driven) | User instruction 2026-05-27 |
| Q-D2 | Scoped under `post-card-01/lib/permissions.ts`; cross-card charter is v0.3+ | Assistant recommendation, confirmed |
| Q-D3 | Nested repost = counts-only, no engagement bar | Assistant recommendation, confirmed |
| Q-D4 | Host pre-fetches `linkPreview`; library is fetch-free | Assistant recommendation, confirmed |
| Q-D5 | Optimistic poll vote | Assistant recommendation, confirmed |
| Q-D6 | Per-post sensitive gate (per-media is v0.3+) | Assistant recommendation, confirmed |
| Q-D7 | Refresh v0.1 demo tabs in-place + 3 new tabs; single strip; 12 tabs total | User instruction 2026-05-27 |
| Q-D8 | Smoke harness extended with consumer-side `tsc --noEmit` | Assistant recommendation, confirmed |
| Q-D9 | Single extended `defaultPostKebabActions` helper | Assistant recommendation, confirmed |
| Q-D10 | `post-editor-01` GATE 1 sequenced after this | Assistant recommendation, confirmed |

**GATE 1 v0.2.0 description: ✅ SIGNED OFF.** All 10 Q-Ps locked. Ready to proceed to GATE 2 plan refresh.

---

## 9. Pre-emptive locks (all inherited from precedents — committed silently per memory)

- **Additive expansion. Zero breaking changes.** No prop rename. No prop removal. No default change. New props are opt-in.
- **Always-uncontrolled.** `post` prop is mount-only. `reset(next)` carries new fields transparently.
- **`React.memo` at export + ref-as-prop.** Unchanged.
- **No new shadcn primitives** beyond v0.1.1 (which already pulled `avatar / button / dropdown-menu / input`). Sensitive-gate uses raw button; poll widget uses raw button + progress (inline `<div>` bars, no shadcn progress yet).
- **No framer-motion.** Sensitive-gate reveal is CSS opacity; poll-result bar fill is CSS width transition.
- **Tailwind v4 translations applied at write-time** for any kasder copy-paste (`bg-gradient-to-X` → `bg-linear-to-X`, `break-words` → `wrap-break-word`, `grayscale-[N%]` → `grayscale-N`).
- **Locked target convention** for `registry.json`: every file `type: "registry:component"`, `target: "components/post-card-01/<sub>"`. Never ship `demo.tsx` / `usage.tsx` / `meta.ts`. `dummy-data.ts` ships only via `-fixtures` sibling.
- **Cross-folder imports still go through `@/registry/components/data/<slug>` producer-side path.** F-01 closure (Q-D8 = (a)) extends the smoke harness, NOT the import paths.
- **`VerifiedBadge` + new `PinnedBadge` + new `VisibilityBadge` + new `MentionText` are RSC-compatible** (no `"use client"`). Only parts that own state get `"use client"`.
- **GATE 3 required** (public-API-touching minor bump). Patch-bump exemption does NOT apply. Spotcheck template, rotating dimension chosen at GATE 3 time (likely Public API given the scope).

---

**Status:** 🟡 Drafted, awaiting user sign-off. Once signed off, proceed to GATE 2 plan refresh — likely ~1.5h, no code, refactoring the existing v0.1.1 plan with the v0.2.0 deltas and locking the implementation order (probably permissions first → schema additions → responsive sweep → engagement extraction → display badges & gates).

Implementation will not begin until both GATE 1 (this doc) and GATE 2 (plan addendum) are signed off, per `.claude/CLAUDE.md` workflow gates.
