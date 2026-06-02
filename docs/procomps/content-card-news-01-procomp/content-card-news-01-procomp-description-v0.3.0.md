# `content-card-news-01` v0.3.0 — Description Addendum (Stage 1)

> **Stage:** 1 of 3 · **Status:** 🟡 Drafted, awaiting sign-off
> **Slug:** `content-card-news-01` (unchanged) · **Target version:** `0.3.0`
> **Release model:** **additive expansion + structural polish** on v0.2.0. Net public-API surface grows substantially; every v0.2.x consumer keeps working unchanged (no rename, no removal, no semantic narrowing). All new props/fields are optional.
>
> **Why this addendum exists.** v0.2.0 ships a magazine-style 5-variant card optimized for the **public reader** surface (a card on `/news`, `/blog`, a homepage). It does NOT model the broader news-domain backend that any modern CMS / editorial product produces:
>
> 1. No **role-aware mode** — same kebab/affordances for editor and reader; editors must hand-roll their own CMS row UI
> 2. No **permissions matrix** — cannot express per-action gating (canEdit / canPublish / canMarkSensitive / canChangeVisibility)
> 3. No **kebab system at all** — the card has zero action affordances beyond the optional `actions` slot
> 4. Schema is leaner than "every standard news/editorial field" — no `publisher`, `status`, `visibility`, `publishedAt/updatedAt`, `isPinned/isBreaking/isExclusive/isLive/isSponsored/isPaywalled`, `sensitivity`, `language`, `tags`, `topics`, `commentsEnabled`, `quotedArticle`, `paywall`, `engagement counts`
> 5. No **sub-feature slot system** — paywall gate, sensitive-content gate, quoted-article mini-card, badge stack all need to be takeover-able
> 6. No **per-entity click handlers** — `onAuthorClick`, `onPublisherClick`, `onCategoryClick`, `onTagClick`, `onTopicClick`, `onTranslate` — host can't wire navigation per nested entity
> 7. No **imperative handle** — CMS dashboards have no programmatic surface (no `triggerPublish`, `triggerPin`, `revealPaywall`, `reset(next)`)
>
> **This addendum** documents only the **delta** v0.2.0 → v0.3.0. The base description ([`content-card-news-01-procomp-description.md`](content-card-news-01-procomp-description.md)) still defines the load-bearing v0.1/v0.2 surface; this file extends it. When v0.3.0 ships GATE 3, the addendum is FOLDED into the base description and removed.
>
> **A+ structural-grade target.** v0.2.0 is B+ today — the magazine-card primitive is solid (overlay-link / polymorphic root / serif typography / soft-fail item shape) but **the news-domain composite is not modeled**. v0.3.0 closes that gap by mirroring the post-card-01 v0.2.0/v0.3.0 trait set into editorial vocabulary. The "Structural A+ checklist" in §11 is the explicit grade criterion.
>
> **Parallelism with post-card-01.** v0.3.0 deliberately mirrors `post-card-01@0.3.2`'s permissions / kebab / mutation-handler / sub-export / handle / slot patterns 1:1, translated into editorial vocab (`editor` instead of `owner`; `publish/unpublish/feature` instead of `pin/markSensitive`; `paywall` instead of `sensitive`). This keeps the family coherent and lets consumers learn one mental model for all cards (post / news / project / event).

---

## 1. Problem (delta)

### 1.1 The editor-vs-viewer asymmetry — the headline ask

Every editorial / news surface has **two conditional sets of UI affordances** depending on whether the viewer is an editor with CRUD permissions on the article or a third-party reader:

| Affordance                                        | Editor / has CRUD     | Reader / third-party |
|---------------------------------------------------|-----------------------|----------------------|
| Kebab — Edit                                      | ✓                     | ✗                    |
| Kebab — Delete                                    | ✓                     | ✗                    |
| Kebab — Publish / Unpublish                       | ✓                     | ✗                    |
| Kebab — Schedule                                  | ✓                     | ✗                    |
| Kebab — Feature / Unfeature                       | ✓                     | ✗                    |
| Kebab — Pin to top / Unpin                        | ✓                     | ✗                    |
| Kebab — Change visibility / access tier           | ✓                     | ✗                    |
| Kebab — Change category                           | ✓                     | ✗                    |
| Kebab — Mark sensitive / Unmark                   | ✓                     | ✗                    |
| Kebab — See analytics                             | ✓                     | ✗                    |
| Kebab — Push to top of feed                       | ✓                     | ✗                    |
| Kebab — Report                                    | ✗                     | ✓                    |
| Kebab — Mute author / hide future content         | ✗                     | ✓                    |
| Kebab — Unfollow topic                            | ✗                     | ✓                    |
| Status badge (Draft / Scheduled / Archived)       | render in editor mode | not rendered         |
| Scheduled-for timestamp                           | render in editor mode | not rendered         |
| Paywall gate over media (preview replaces excerpt)| render if paywalled   | render if paywalled  |
| Sensitive content gate                            | render if sensitive   | render if sensitive  |
| "Featured" / "Pinned" / "Breaking" / "Live" badge | render if flagged     | render if flagged    |

v0.2.0 cannot express any of the editor row. No `onEdit` / `onDelete` / `onPublish` / `onPin` handler. No kebab at all. **This is the load-bearing gap** — every consumer ends up hand-rolling a CMS row, repeated per surface, with each app's drift.

v0.3.0 ships:
- A **two-mode toggle** `viewerMode?: "editor" | "viewer"` (Q-D1 lock — opt-in, no auto-derivation; host explicitly picks)
- An optional `ContentCardPermissions` matrix for per-action granular overrides
- A `canPerformAction(action, item)` universal predicate that wins over the matrix
- A full kebab system with role-aware defaults + moderator section + full takeover slot
- Editor-mutation handlers separated from engagement handlers (same pattern as post-card-01's `PostMutationHandlers`)

Naming choice — `editor` vs `owner` — explained at Q-D2.

### 1.2 The schema breadth gap — "every standard editorial field"

v0.2.0 `ContentCardItem`:

```ts
interface ContentCardItem {
  id; title; image; excerpt?;
  category?; author?; date?; readTime?; views?;
}
```

Missing from a baseline that any modern news/editorial backend would return:

| Field                                          | Why it's standard                                                          | v0.3.0 disposition                                                  |
|------------------------------------------------|----------------------------------------------------------------------------|---------------------------------------------------------------------|
| `slug?: string`                                | URL slug, canonical-URL composition, deep-linking                          | **add (optional)**                                                  |
| `publisher?: NewsPublisher`                    | wire-service / multi-source attribution                                    | **add (optional, sub-type `{ id, name, logo?, slug? }`)**           |
| `authorEntity?: NewsArticleAuthor`             | structured author (separate from existing string `author`)                 | **add (optional, sub-type — `author` string stays for soft-compat)** |
| `publishedAt?` + `updatedAt?` + `scheduledFor?` | lifecycle timestamps; renders relative-time + edited-suffix + schedule chip | **add (all optional)**                                              |
| `status?`                                      | lifecycle — draft/scheduled/published/archived                             | **add (optional, narrow enum)**                                     |
| `visibility?: NewsVisibility`                  | access tier — public/members/subscribers/staff/unlisted + branded extension | **add (extensible string union)**                                   |
| `topics?: string[]`                            | topic taxonomy axis (separate from `category` / `tags`)                    | **add (optional)**                                                  |
| `tags?: string[]`                              | freeform hashtag-style chips                                               | **add (optional)**                                                  |
| `language?: string`                            | BCP-47 — drives the "Translate" kebab item visibility                      | **add (optional)**                                                  |
| `availableTranslations?: string[]`             | for v0.4 picker; v0.3 carries data only                                    | **add (optional, no render yet)**                                   |
| `isPinned?` / `isFeatured?` / `isBreaking?` / `isLive?` / `isExclusive?` / `isSponsored?` | editorial badges | **add (all optional booleans)**                              |
| `sponsorLabel?: string`                        | "Sponsored by X" — paired with `isSponsored`                               | **add (optional)**                                                  |
| `liveUpdateCount?: number` + `lastLiveUpdateAt?` | live-blog "Updated 3m ago · 14 updates" sub-line                           | **add (both optional)**                                             |
| `sensitivity?: ContentSensitivity`             | sensitive-content gate (per-card, not per-image)                           | **add (optional, sub-type `{ isSensitive, reason?, contentWarnings? }`)** |
| `paywall?: ContentPaywall`                     | premium gate over media + preview-replaces-excerpt in body                 | **add (optional, sub-type — see §3.2)**                             |
| `commentsEnabled?: boolean`                    | when false, comment count chip suppressed                                  | **add (optional, default true semantics)**                          |
| `commentCount?: number`                        | engagement count chip                                                      | **add (optional)**                                                  |
| `likeCount?: number` + `isLiked?: boolean`     | engagement-counter pattern                                                 | **add (optional, both)**                                            |
| `bookmarkCount?: number` + `isBookmarked?: boolean` | bookmark-counter pattern                                              | **add (optional, both)**                                            |
| `shareCount?: number`                          | share-counter pattern                                                      | **add (optional)**                                                  |
| `quotedArticle?: ContentCardItem`              | analysis pieces that quote a source article — recursive nested mini-card   | **add (optional, recursive type — same pattern as post-card `repostOf`)** |

v0.3.0 grows the type to **40 fields total** (9 existing + 31 new), all new ones optional. v0.2.x consumers' `ContentCardItem` shape still satisfies. Existing `author: string` field stays alongside new structured `authorEntity` — host can supply either (soft-compat per Q-D8).

### 1.3 No sub-feature slot system

Magazine cards in 2026 need to render up to 5 sub-features within the card body:

1. Editorial **badge stack** (Pinned / Breaking / Live / Exclusive / Sponsored / Featured / status)
2. **Paywall gate** over the media when `paywall.isPaywalled` (preview substitutes for excerpt in the body — title + author + footer stay visible per Q-PG)
3. **Sensitive-content gate** over the media when `sensitivity.isSensitive` (separate motivation from paywall)
4. **Quoted article mini-card** for opinion / commentary pieces
5. **Author byline cluster** with publisher logo + verified badge + role

v0.2.0 has none of these as slots/sub-exports. v0.3.0 ships each as **(default render) + (renderXxx slot for full takeover) + (disableXxxRender opt-out) + (sub-export for standalone use)** — the same 4-axis pattern post-card-01 v0.2.0 locked.

### 1.4 No per-entity click handlers

v0.2.0 has a single `onClick({ item, event })`. News cards have ~6 click-targets nested inside (author, publisher, category, topics, tags, quoted article). Each navigates to a different route in a real product. v0.3.0 adds:

- `onAuthorClick(author)`
- `onPublisherClick(publisher)`
- `onCategoryClick(category)`
- `onTopicClick(topic)`
- `onTagClick(tag)`
- `onQuotedClick(quotedArticle)`
- `onCommentCountClick(articleId)` — navigate to article + jump to comments
- `onLike(articleId, nextLiked)` / `onBookmark(articleId, nextBookmarked)` / `onShare(articleId)` — counter-style engagement (Q-D6 lock — NOT a full engagement-bar composition)
- `onTranslate(articleId, sourceLanguage)`
- `onRevealPaywall(articleId)` (analytics hook + optional CTA navigation)
- `onRevealSensitive(articleId)` (analytics hook)

### 1.5 No imperative handle

CMS dashboards need a programmatic escape hatch. v0.3.0 ships the same `ref` pattern as post-card-01:

```ts
interface ContentCardNews01Handle {
  openKebab: () => void;
  triggerEdit: () => void;
  triggerDelete: () => void;
  triggerPublish: () => void;       // calls onPublish(item.id) — for bulk-publish UIs
  triggerUnpublish: () => void;
  triggerPin: () => void;
  triggerFeature: () => void;
  revealPaywall: () => void;        // local state + onRevealPaywall analytics hook
  revealSensitive: () => void;
  reset: (next: ContentCardItem) => void;
  getCurrentItem: () => ContentCardItem;
}
```

11 handle methods, same mental model as post-card-01.

---

## 2. Scope of v0.3.0

| Block                                           | Status            | Notes                                                                                                                      |
|-------------------------------------------------|-------------------|----------------------------------------------------------------------------------------------------------------------------|
| **Role-aware mode** (`viewerMode` + permissions + canPerformAction predicate) | ✅ in scope | Mirror post-card-01 |
| **Editor-mutation handlers** (onEdit/Delete/Publish/Unpublish/Schedule/Feature/Pin/ChangeVisibility/ChangeCategory/MarkSensitive/SeeAnalytics/PushToTop) | ✅ in scope | Separate from engagement |
| **Reader-mutation handlers** (onReport/BlockAuthor/MuteAuthor/UnfollowTopic) | ✅ in scope    | Reader-side                                                                                                                |
| **Kebab system** (defaults + role-aware items + moderator section + full takeover slot) | ✅ in scope | Reuses `CommentMenuItem` from comment-thread-01 for parallelism                                                          |
| **Schema expansion** (~20 new optional fields)  | ✅ in scope       | All optional — zero v0.2.x consumer break                                                                                  |
| **Paywall gate** (default render + slot + opt-out + sub-export) | ✅ in scope | Separate from sensitive — distinct motivation                                                                  |
| **Sensitive content gate** (default render + slot + opt-out + sub-export) | ✅ in scope | Mirrors post-card-01's SensitiveGate                                                                                 |
| **Editorial badge stack** (Pinned/Featured/Breaking/Live/Exclusive/Sponsored + status) | ✅ in scope | Default render + slot + opt-out; canonical priority order at Q-PC                                              |
| **Quoted article mini-card** (recursive nested) | ✅ in scope       | Mirrors post-card-01 `repostOf`                                                                                            |
| **Per-entity click handlers** (×10 listed §1.4) | ✅ in scope       |                                                                                                                            |
| **Imperative handle** (11 methods)              | ✅ in scope       | `ref` prop, mirrors post-card-01 handle                                                                                    |
| **Comprehensive labels** (~50 i18n keys)        | ✅ in scope       | Grows from 5 → ~50                                                                                                         |
| **Engagement counts** (views/likes/comments/bookmarks/shares as inline chips with handlers) | ✅ in scope (light) | NOT a full engagement-bar composition (Q-D6) — count-chip only                                                |
| **Sub-exports** (NewsBadges, NewsAuthorByline, NewsPaywallGate, ContentSensitiveGate, QuotedArticleCard) | ✅ in scope | Standalone-usable parts                                                                                              |
| **Editor-only status badges** (Draft/Scheduled/Archived chips + scheduledFor timestamp) | ✅ in scope | Render conditionally on `viewerMode === "editor"` + `status` set                                                  |
| **Per-variant feature matrix**                  | ✅ in scope (Q-PA) | Locked in §7                                                                                                               |

Out of scope — see §12 for the full deferred list.

---

## 3. Schema expansion

### 3.1 New top-level fields

```ts
export type ContentStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived";

export type NewsVisibility =
  | "public"
  | "members"
  | "subscribers"
  | "staff"
  | "unlisted"
  | (string & {}); // branded extension — host-specific tiers (gold/platinum/employees-only/etc.)

export interface NewsArticleAuthor {
  id: string;
  name: string;
  role?: string;          // "Senior Editor" / "Contributor" / "Wire Reporter"
  avatar?: string;
  isVerified?: boolean;
}

export interface NewsPublisher {
  id: string;
  name: string;
  logo?: string;
  slug?: string;
}

export interface ContentSensitivity {
  isSensitive: boolean;
  reason?: string;
  contentWarnings?: string[];  // ["graphic", "death", "violence", "nudity"]
}

export interface ContentPaywall {
  isPaywalled: boolean;
  tier?: string;               // matches a value in NewsVisibility
  preview?: string;            // first N words shown above the gate
  ctaLabel?: string;           // "Subscribe to read" / "Members only"
  ctaHref?: string;
}

export interface ContentCardItem {
  // v0.2.0 fields (unchanged)
  id: string;
  title: string;
  image: string;
  excerpt?: string;
  category?: string;
  author?: string;
  date?: string | Date;
  readTime?: number;
  views?: number;

  // v0.3.0 additions — all optional
  slug?: string;
  authorEntity?: NewsArticleAuthor;
  publisher?: NewsPublisher;

  publishedAt?: string | Date | number;
  updatedAt?: string | Date | number;
  scheduledFor?: string | Date | number;

  status?: ContentStatus;
  visibility?: NewsVisibility;
  topics?: string[];
  tags?: string[];
  language?: string;
  availableTranslations?: string[];

  isPinned?: boolean;
  isFeatured?: boolean;
  isBreaking?: boolean;
  isLive?: boolean;
  isExclusive?: boolean;
  isSponsored?: boolean;
  sponsorLabel?: string;

  liveUpdateCount?: number;
  lastLiveUpdateAt?: string | Date | number;

  sensitivity?: ContentSensitivity;
  paywall?: ContentPaywall;

  commentsEnabled?: boolean;
  commentCount?: number;
  likeCount?: number;
  isLiked?: boolean;
  bookmarkCount?: number;
  isBookmarked?: boolean;
  shareCount?: number;

  quotedArticle?: ContentCardItem;
}
```

**v0.2.x soft-compat:** `author: string` stays. New structured `authorEntity?: NewsArticleAuthor` is the recommended forward shape. When both set, `authorEntity` wins; renderer falls back to `author` string. `date` stays; `publishedAt` is the new canonical timestamp (renderer prefers `publishedAt` when both present). Locked at Q-D8.

### 3.2 `ContentPaywall` vs `ContentSensitivity` — why two

Both render a "gate over content" overlay, but motivations diverge:

|                    | Paywall                                       | Sensitive                          |
|--------------------|-----------------------------------------------|------------------------------------|
| **Motivation**     | Monetization — content costs money to access  | Content warning — graphic/upsetting |
| **Default CTA**    | "Subscribe to read" / "Unlock"                | "Show" / "Reveal anyway"           |
| **Gates what**     | Media block (preview replaces excerpt)        | Media only (excerpt + title visible) |
| **Resolved by**    | Subscription tier change / login              | Per-view dismissal                 |
| **Analytics hook** | `onRevealPaywall` → conversion event          | `onRevealSensitive` → warning-accepted event |

Distinct types + distinct slots + distinct sub-exports. Shared visual language (centered overlay with blur backdrop + CTA button) but separately styleable via `paywallClassName` / `sensitiveClassName`. Locked at Q-D9.

---

## 4. Permissions model

Identical structural shape to `PostPermissions` in post-card-01, editorial vocab.

```ts
export type ContentCardPermissionAction =
  | "edit"
  | "delete"
  | "publish"
  | "unpublish"
  | "schedule"
  | "feature"
  | "pin"
  | "changeVisibility"
  | "changeCategory"
  | "markSensitive"
  | "seeAnalytics"
  | "pushToTop"
  | "share"
  | "bookmark"
  | "report"
  | "blockAuthor"
  | "muteAuthor"
  | "unfollowTopic"
  | "moderate";

export interface ContentCardPermissions {
  // editor-side (12 capabilities)
  canEdit?: boolean;
  canDelete?: boolean;
  canPublish?: boolean;
  canUnpublish?: boolean;
  canSchedule?: boolean;
  canFeature?: boolean;
  canPin?: boolean;
  canChangeVisibility?: boolean;
  canChangeCategory?: boolean;
  canMarkSensitive?: boolean;
  canSeeAnalytics?: boolean;
  canPushToTop?: boolean;
  // host-policy gates
  canShare?: boolean;
  canBookmark?: boolean;
  // reader-side
  canReport?: boolean;
  canBlockAuthor?: boolean;
  canMuteAuthor?: boolean;
  canUnfollowTopic?: boolean;
  // moderator
  canModerate?: boolean;
}
```

**Resolution order** (most → least specific) — identical to post-card-01:
1. `canPerformAction(action, item)` returning `true` / `false` — wins everything
2. `permissions[canX]` per-field — `false` denies, `true` allows
3. `viewerMode`-derived defaults (`"editor"` → all editor-side `true`, reader-side `false`; `"viewer"` → inverse)
4. Library-baseline default — v0.2-mode (no `viewerMode` + no `permissions` + no `canPerformAction`): no kebab rendered at all

`canShare` / `canBookmark` are host-policy gates — visible to viewer but host can deny (e.g. `paywall.isPaywalled` posts might hide Share for non-subscribers). `canModerate` is orthogonal — see §5.3.

---

## 5. Kebab system

### 5.1 Default items (when `viewerMode === undefined` AND any handler wired)

- Bookmark / Remove bookmark (if `onBookmark` wired)
- Share (if `onShare` wired)
- Copy link (if `getHref` set)
- Translate (if `item.language` set AND `onTranslate` wired)
- Report (if `onReport` wired)

Same handler-driven gating as post-card-01 v0.1 legacy mode. When no handlers wired, kebab doesn't render.

### 5.2 Editor mode (when `viewerMode === "editor"`)

Items render gated by the permissions matrix. Default editor-mode items in order:
- Edit
- Publish / Unpublish (single slot, label flips on `status === "published"`)
- Schedule
- Feature / Unfeature
- Pin to top / Unpin
- Push to top of feed (rarer action — for breaking-news ops)
- Change visibility
- Change category
- Mark sensitive / Unmark sensitive
- See analytics
- **divider**
- Common items (Bookmark / Share / Copy link / Translate)
- **divider**
- Delete

Order locked at Q-PD.

### 5.3 Reader mode (when `viewerMode === "viewer"`)

- Bookmark / Remove bookmark
- Share
- Copy link
- Translate (if `item.language` set)
- **divider**
- Report
- Mute author
- Block author
- Unfollow topic (if `item.topics?.length`)

### 5.4 Moderator section

Same orthogonal pattern as post-card-01 v0.3.0. When `permissions.canModerate === true` OR `canPerformAction("moderate", item) === true`, AND `moderatorActions(item)` returns ≥1 item, the moderator group renders **between common items and reader-destructive items** with a divider above. Host supplies the actual menu items (e.g. "Take down", "Lock comments", "Flag for review", "Approve flag"). Suppressed when `kebabActions` full-takeover slot is used.

### 5.5 Full takeover

`kebabActions={(item) => CommentMenuItem[]}` — same shape as post-card-01. When supplied, all default items + moderator section + permission gating bypassed; host's items render verbatim. Use case: editorial CMS dashboards with their own action catalog.

---

## 6. Slots / sub-exports / opt-outs

Same 4-axis pattern as post-card-01 v0.2.0 — for each sub-feature: default render + `renderX` slot for full takeover + `disableXRender` opt-out + sub-export of the default part.

| Sub-feature      | Slot                                                                    | Opt-out                  | Sub-export                      |
|------------------|-------------------------------------------------------------------------|--------------------------|----------------------------------|
| Badge stack      | `renderBadges(item, { canModerate })`                                   | `disableBadgesRender`    | `<NewsBadges>`                  |
| Author byline    | `renderAuthor(author, { publisher })`                                   | `disableAuthorRender`    | `<NewsAuthorByline>`            |
| Excerpt          | `renderExcerpt(item)`                                                   | `disableExcerptRender`   | (none — string only)            |
| Paywall gate     | `renderPaywallGate(item, { onReveal })`                                 | `disablePaywallGate`     | `<NewsPaywallGate>`             |
| Sensitive gate   | `renderSensitiveGate(item, { onReveal })`                               | `disableSensitiveGate`   | `<ContentSensitiveGate>`        |
| Quoted article   | `renderQuoted(item, { onClick })`                                       | `disableQuotedRender`    | `<QuotedArticleCard>`           |
| Engagement chips | `renderEngagementCounts(item, { handlers })`                            | `disableEngagementCounts`| `<NewsEngagementCounts>`        |
| Kebab            | `kebabActions(item)`                                                    | (omit all handlers)      | (uses shadcn DropdownMenu)      |

### 6.1 Render slot signature pattern

All `renderX` slots receive `(item, helpers)` where `helpers` carries pre-wired callbacks the host needs (`onReveal`, `onClick`, `handlers` bag, etc.). Same shape as post-card-01.

### 6.2 Engagement integration with `engagement-bar-01` (the news-detail-page pattern)

The card itself defaults to **light count chips** (Q-D6=(a)) — small numbers with click handlers, no realtime, no inline panels. This is correct for feed / index / homepage surfaces where the card is a *teaser linking out to the article*.

For the **news article detail page** (or any surface where the news card IS the engagement surface — e.g. a Reddit-style feed where readers vote/comment inline), the same card composes the full `engagement-bar-01` via the `renderEngagementCounts` slot:

```tsx
import { EngagementBar01 } from "@ilinxa/engagement-bar-01";
import { ContentCardNews01 } from "@ilinxa/content-card-news-01";

<ContentCardNews01
  item={article}
  variant="featured"
  renderEngagementCounts={(item, { handlers }) => (
    <EngagementBar01
      counts={{
        likes: item.likeCount ?? 0,
        comments: item.commentCount ?? 0,
        shares: item.shareCount ?? 0,
        bookmarks: item.bookmarkCount ?? 0,
      }}
      isLiked={item.isLiked}
      isBookmarked={item.isBookmarked}
      onLike={handlers.onLike}
      onComment={handlers.onComment}
      onShare={handlers.onShare}
      onBookmark={handlers.onBookmark}
      // ... realtime subscribe, likers strip, share menu, etc.
    />
  )}
/>
```

**Why a slot, not a built-in mode:**
- Keeps `engagement-bar-01` OFF the news-card's peer-dependency list when consumers only want light counts (the 95% case). No bundle bloat for index-page consumers.
- Same `handlers` bag (`onLike` / `onComment` / `onShare` / `onBookmark`) is pre-wired by the card, so the slot doesn't have to re-derive them — drop-in.
- Engagement data shape on `ContentCardItem` (likeCount / isLiked / commentCount / bookmarkCount / isBookmarked / shareCount) deliberately *matches* engagement-bar-01's counts shape, so passing data through is trivial.
- Consumers who want a different engagement library (their own bar, vendor widget, etc.) use the same slot — the card never assumes which bar.

This is documented in `guide.md` as the canonical "Article detail page composition" pattern, with a worked demo tab `Detail (with engagement bar)`. Locked at Q-D6b — see §11 below.

---

## 7. Per-variant feature matrix (Q-PA lock)

`small` and `list` variants have tight surface area; some new features don't fit. Matrix below locks what renders where:

| Feature                  | featured | large | medium | small  | list   |
|--------------------------|:--------:|:-----:|:------:|:------:|:------:|
| Title                    | ✅       | ✅    | ✅     | ✅     | ✅     |
| Excerpt                  | ✅       | ✅    | ✅     | ❌     | ✅ short |
| Category chip            | ✅       | ✅    | ✅     | ✅     | ✅     |
| Author byline            | ✅       | ✅    | ✅     | ❌     | ✅     |
| Publisher logo           | ✅       | ✅    | ❌     | ❌     | ❌     |
| Date / relative time     | ✅       | ✅    | ✅     | ✅     | ✅     |
| Read time                | ✅       | ✅    | ✅     | ❌     | ✅     |
| View count chip          | ❌       | ❌    | ✅     | ❌     | ❌     |
| Engagement chips (like/comment/bookmark/share) | ✅ | ✅ | ✅ | ❌    | ✅     |
| Badge stack (full)       | ✅       | ✅    | ✅     | 1 only | ✅     |
| Status badge (editor mode) | ✅     | ✅    | ✅     | ❌     | ✅     |
| Kebab                    | ✅       | ✅    | ✅     | ❌     | ✅     |
| Paywall gate             | ✅       | ✅    | ✅     | ❌     | ✅     |
| Sensitive gate           | ✅       | ✅    | ✅     | ✅     | ✅     |
| Quoted article           | ❌       | ❌    | ✅     | ❌     | ✅     |
| Actions slot             | ✅       | ✅    | ✅     | ✅     | ✅     |
| Topic chips              | ✅       | ✅    | ❌     | ❌     | ❌     |
| Tag chips                | ✅       | ✅    | ❌     | ❌     | ❌     |

`small`: 1-badge-only = highest-priority badge wins (see §11 Q-PC priority order). Sensitive still gates because graphic content must always be warned.

---

## 8. Click handlers + handle

### 8.1 New top-level click handlers

```ts
interface ContentCardNews01Props {
  // v0.2.0 onClick stays (whole-card click)
  onClick?: (args: { item: ContentCardItem; event: MouseEvent }) => void;

  // v0.3.0 per-entity click handlers
  onAuthorClick?: (author: NewsArticleAuthor) => void;
  onPublisherClick?: (publisher: NewsPublisher) => void;
  onCategoryClick?: (category: string) => void;
  onTopicClick?: (topic: string) => void;
  onTagClick?: (tag: string) => void;
  onQuotedClick?: (quotedArticle: ContentCardItem) => void;
  onCommentCountClick?: (articleId: string) => void;
  onTranslate?: (articleId: string, sourceLanguage: string) => void;
  onRevealPaywall?: (articleId: string) => void;
  onRevealSensitive?: (articleId: string) => void;

  // v0.3.0 engagement counter handlers (NOT a full engagement bar)
  onLike?: (articleId: string, nextLiked: boolean) => void;
  onBookmark?: (articleId: string, nextBookmarked: boolean) => void;
  onShare?: (articleId: string) => void;
  onComment?: (articleId: string) => void;  // alias for onCommentCountClick — kept for symmetry with post-card-01

  // v0.3.0 editor-mutation handlers
  onEdit?: (articleId: string) => void;
  onDelete?: (articleId: string) => void;
  onPublish?: (articleId: string) => void;
  onUnpublish?: (articleId: string) => void;
  onSchedule?: (articleId: string, currentScheduledFor: Date | undefined) => void;
  onFeature?: (articleId: string, nextFeatured: boolean) => void;
  onPin?: (articleId: string, nextPinned: boolean) => void;
  onChangeVisibility?: (articleId: string, currentVisibility: NewsVisibility | undefined) => void;
  onChangeCategory?: (articleId: string, currentCategory: string | undefined) => void;
  onMarkSensitive?: (articleId: string, nextSensitive: boolean, reason?: string) => void;
  onSeeAnalytics?: (articleId: string) => void;
  onPushToTop?: (articleId: string) => void;

  // v0.3.0 reader-mutation handlers
  onReport?: (articleId: string) => void;
  onBlockAuthor?: (authorId: string) => void;
  onMuteAuthor?: (authorId: string) => void;
  onUnfollowTopic?: (topic: string) => void;
}
```

**Library does NOT ship picker UIs** — `onChangeVisibility`, `onChangeCategory`, `onSchedule` are single triggers that fire when the kebab item is tapped. Host opens its own picker (sheet / dialog / inline form) and calls back into its API. Locked at Q-D7.

### 8.2 Imperative handle (11 methods)

```ts
export interface ContentCardNews01Handle {
  openKebab: () => void;
  triggerEdit: () => void;
  triggerDelete: () => void;
  triggerPublish: () => void;
  triggerUnpublish: () => void;
  triggerPin: () => void;
  triggerFeature: () => void;
  revealPaywall: () => void;
  revealSensitive: () => void;
  reset: (next: ContentCardItem) => void;
  getCurrentItem: () => ContentCardItem;
}
```

Handle methods bypass the permissions matrix (escape hatch for bulk-action UIs). Reset clears local `paywallRevealed` + `sensitiveRevealed` flags.

---

## 9. Labels — ~50 keys

Grows from 5 → ~50. Pattern identical to `DEFAULT_POST_CARD_LABELS`. Key groups:

- **v0.2 labels (5)** — preserved unchanged
- **Kebab labels (~22)** — edit/delete/publish/unpublish/schedule/feature/unfeature/pin/unpin/changeVisibility/changeCategory/markSensitive/unmarkSensitive/seeAnalytics/pushToTop/translate/copyLink/report/blockAuthor/muteAuthor/unfollowTopic
- **Visibility labels (5 + custom fallback)** — public/members/subscribers/staff/unlisted/visibilityCustom
- **Status labels (3)** — statusDraft / statusScheduled / statusArchived (published doesn't render a chip)
- **Editorial badges (6)** — pinnedBadgeLabel / featuredBadgeLabel / breakingBadgeLabel / liveBadgeLabel / exclusiveBadgeLabel / sponsoredBadgeLabelTemplate (`"Sponsored by {name}"` when `sponsorLabel` set, else fallback "Sponsored")
- **Paywall labels (4)** — paywallHeading / paywallDefaultCta / paywallBlurredOverlayAria / paywallPreviewSeparator
- **Sensitive labels (3)** — sensitiveHeading / sensitiveRevealLabel / sensitiveContentWarningTemplate
- **Engagement labels (4)** — likeAriaLabel / commentAriaLabel / bookmarkAriaLabel / shareAriaLabel
- **Live label (1)** — liveUpdatedTemplate (`"Updated {time} · {count} updates"`)

Plus `formatRelativeTime` + `formatDate` callbacks (already in v0.2). Full list in the GATE 2 plan.

---

## 10. Backward compatibility

v0.3.0 is **strictly additive** on v0.2.0. Concrete guarantees:

1. Every v0.2.x `ContentCardItem` shape still type-satisfies — new fields all optional.
2. Every v0.2.x prop survives unchanged. New props are all optional.
3. Existing 5 variants render identically when no new fields/props are passed.
4. `onClick({ item, event })` object shape preserved (F-cross-12 cutover stays locked).
5. `actions` slot preserved.
6. `categoryStyles` preserved.
7. Sub-exports added (none removed). New sub-exports (11): the 6 main parts — `NewsBadges`, `NewsAuthorByline`, `NewsPaywallGate`, `ContentSensitiveGate`, `QuotedArticleCard`, `NewsEngagementCounts` — plus 5 small sibling parts useful standalone (`StatusBadge`, `VisibilityBadge`, `SponsorBadge`, `LiveUpdateLine`, `NewsPublisherRow`). Mirrors post-card-01's pattern of sub-exporting both the composite parts AND the individual badge primitives.
8. Existing string `author` field works alongside new structured `authorEntity` (Q-D8 soft-compat lock).
9. `date` field works alongside new `publishedAt` (renderer prefers `publishedAt` when both present).

Net result: a v0.2.x app can upgrade to v0.3.0 with zero code changes and see no visual delta unless it opts into new fields.

---

## 11. Q-Ds and Q-Ps to lock (Stage 1 sign-off)

These need an answer before GATE 2 plan. Each has a recommended default (marked **`(rec)`**) — say "all defaults" to accept the recommendation set wholesale.

### Q-Ds (data / API shape decisions)

- **Q-D1** Role-aware mode opt-in semantics — `viewerMode === undefined` means v0.2 legacy mode (no kebab, no role-aware items). Host explicitly picks `"editor"` or `"viewer"`. No auto-derivation from `currentUser`. **`(rec)` confirm — mirrors post-card-01.**

- **Q-D2** Naming — `viewerMode: "editor" | "viewer"` vs `"owner" | "viewer"`?
  - (a) `"editor" | "viewer"` — editorial-domain vocab, reads natural in CMS contexts **`(rec)`**
  - (b) `"owner" | "viewer"` — strict parallelism with post-card-01

- **Q-D3** Moderator section — orthogonal `canModerate` + `moderatorActions(item)` slot, divider-separated kebab group. **`(rec)` confirm — mirrors post-card-01 v0.3.0.**

- **Q-D4** Library does NOT ship visibility / category / schedule pickers. Single trigger callbacks; host opens its own UI. **`(rec)` confirm.**

- **Q-D5** Quoted article recursion — `quotedArticle?: ContentCardItem`. Renders as compact mini-card. Nested actions/kebab suppressed. No further recursion (a quoted article's `quotedArticle` is ignored). **`(rec)` confirm — mirrors post-card-01 repostOf.**

- **Q-D6** Engagement model — light count-chip with handlers as DEFAULT, with a slot for full-bar composition.
  - (a) Light counts only (likeCount / commentCount / bookmarkCount / shareCount as chips with click handlers; no realtime, no inline panels) **`(rec)` — default mode**
  - (b) Compose engagement-bar-01 like post-card-01 (full inline panels)
  - (c) Skip engagement entirely — counts not in v0.3, defer

- **Q-D6b** Detail-page composition — `renderEngagementCounts` slot lets consumers compose `<EngagementBar01>` on the news article detail page. Engagement data shape on `ContentCardItem` deliberately matches `engagement-bar-01`'s counts shape so the slot is drop-in (§6.2). `engagement-bar-01` is NOT a peer dep of `content-card-news-01` (consumer imports it themselves when they opt in). **`(rec)` confirm — keeps light-counts the default while making full-bar composition trivial.**

- **Q-D7** Paywall gate — does the gate use the host's CTA button or fire `onRevealPaywall` to let the host navigate?
  - (a) Library renders a default CTA button using `paywall.ctaLabel` + `paywall.ctaHref`; clicking fires `onRevealPaywall(articleId)` **`(rec)` — best of both**
  - (b) Library renders gate visual only; host wires CTA via `renderPaywallGate` slot

- **Q-D8** `author` vs `authorEntity` soft-compat — both fields supported on `ContentCardItem`; `authorEntity` wins when both set. Renderer falls back to `author` string. **`(rec)` confirm.**

- **Q-D9** Paywall + sensitive overlap — keep as two distinct types/slots/sub-exports (different motivation, different CTA). Shared visual language only. **`(rec)` confirm.**

- **Q-D10** Editor-only status badge — `status === "draft" | "scheduled" | "archived"` renders a small status chip in the badge stack ONLY when `viewerMode === "editor"`. Reader never sees status chip. **`(rec)` confirm.**

- **Q-D11** Live update sub-line — `isLive === true` AND `lastLiveUpdateAt` set renders "Updated 3m ago · 14 updates" sub-line below the date. Render in all variants except `small`. **`(rec)` confirm.**

- **Q-D12** Sponsor — `isSponsored` boolean + optional `sponsorLabel` string (renders "Sponsored by {label}"; falls back to "Sponsored" when no label). Full sponsor metadata (logo/link) deferred to v0.4. **`(rec)` confirm.**

### Q-Ps (presentation / UX decisions)

- **Q-PA** Per-variant feature matrix in §7 — **`(rec)` confirm as drafted.**

- **Q-PB** Engagement counts placement — chips render in a bottom-row kicker beside author/date. `medium` variant view-count chip preserved, joined by like/comment/bookmark/share chips when counts set. **`(rec)` confirm.**

- **Q-PC** Badge stacking priority (when multiple flags fire) — `small` variant shows only the highest-priority badge. Recommended priority order (top wins):
  1. `isBreaking`
  2. `isLive`
  3. `isExclusive`
  4. `isFeatured`
  5. `isPinned`
  6. `isSponsored`
  7. `status === "draft" | "scheduled" | "archived"` (editor mode only)
  - **`(rec)` confirm.**

- **Q-PC2 (locked 2026-06-02 post-ship — design split)** Badge **placement** splits the 7 badges into two semantic groups rendered in two physical positions on the card:

  - **State group** (Breaking / Live / Pinned / Sponsored / Status) — render as the **top-right overlay** on the media. They answer *"should I look at this NOW?"* (urgency / admin / commercial disclosure).
  - **Curation group** (Exclusive / Featured) — render as a **kicker row above the title** in the body. They answer *"what kind of journalism is this?"* (editorial product label, canonical newspaper convention).

  Priority order from Q-PC is preserved *within each group* — the split is purely visual layout, not a re-prioritization. `NewsBadges` accepts `group: "all" | "state" | "curation"` (default `"all"` for backward compat with the `small` variant + any consumer rendering the standalone sub-export). v0.3.0 `medium` variant uses the split; `featured` / `large` / `list` keep `group="all"` for now and can adopt the kicker pattern in v0.3.1 if the same conflict surfaces there. **`(rec)` confirm.**

- **Q-PD** Kebab item order in editor mode (§5.2) — **`(rec)` confirm as drafted.**

- **Q-PE** Quoted article render — render in `medium` + `list` only (variants with text-column space). Skip in `featured` (visual focus is the hero), `large` (excerpt takes that space), `small` (no room). **`(rec)` confirm.**

- **Q-PF** Sensitive gate scope — gates the **media only** (excerpt + title still visible above the gated image). Mirrors post-card-01 v0.2 sensitive-gate scope. **`(rec)` confirm.**

- **Q-PG** Paywall gate scope — gates **the media block only**. Title + author byline + footer + engagement counts stay visible above and below the gate. `paywall.preview` substitutes for `item.excerpt` in the body so it reads naturally inline with the rest of the card. (Initial v0.3.0 impl wrapped the whole card body which caused the preview text to overlap the badge stack at the top — corrected in post-ship fix `b9c5447` 2026-06-02; the spec now formally locks the media-only scope. The Q-PG addendum below carries the rationale.) **`(rec)` confirm.**

  **Q-PG addendum (locked 2026-06-02 post-ship):** the per-variant gate placement is:
   - **featured** — gate covers full hero (`absolute inset-0`); content overlay div bumped to `z-20` so title + meta stay visible above the gate's `z-10`
   - **large / medium** — gate wraps just the media block in normal flow above the title-bearing body
   - **list** — list has no image; gate wraps the excerpt block directly (the excerpt IS the media equivalent in list density)

  All four variants substitute `paywall.preview` for `item.excerpt` so consumers don't render a paywall preview AND the full excerpt twice.

- **Q-PH** Locale of default kebab labels — English defaults via `DEFAULT_CONTENT_CARD_NEWS_LABELS`, host overrides via `labels` prop. Same pattern as post-card-01. **`(rec)` confirm.**

- **Q-PI** Touch targets — every interactive (chip, kebab trigger, count chip, paywall CTA) ≥44×44px per WCAG 2.5.5. Same standard as post-card-01 v0.2.0. **`(rec)` confirm.**

### Q-Vs (versioning / scope)

- **Q-V1** Target version — `0.3.0` (minor bump; additive; not v1.0 because permissions matrix is the first instance of a non-post permissions surface — pattern may iterate before promoting to beta). **`(rec)` confirm.**

- **Q-V2** Status — stays `alpha` (existing). Bump to `beta` is a separate decision after one or two more cards adopt the pattern. **`(rec)` confirm.**

- **Q-V3** Shadcn primitive additions — needs `dropdown-menu` (kebab). v0.2 only depends on `badge`. Adding `dropdown-menu` is a `pnpm dlx shadcn add dropdown-menu` away (already present in the project per post-card-01). Adds to meta `dependencies.shadcn`. **`(rec)` confirm.**

- **Q-V4** No new `npm` peer dependencies. `lucide-react` already declared. **`(rec)` confirm.**

---

## 12. Out of scope (deferred)

| Item                                                                | Defer to       | Rationale                                                                                                                                              |
|---------------------------------------------------------------------|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| Related articles ribbon inside the card                             | sibling component (**queued: `related-articles-ribbon-01`**) | Breaks magazine-card visual model. Will ship as its own procomp that consumers stack *under* a content-card-news-01 in their detail-page layout. Added to active component queue per user sign-off 2026-06-02. |
| Multi-contributor byline rendering (`contributors[]`)               | v0.4           | Uncommon; single byline covers 95% of cases.                                                                                                           |
| Translation switcher render (chip / dropdown for `availableTranslations`) | v0.4    | v0.3 carries data on the type but doesn't render. `onTranslate` kebab item is enough surface.                                                          |
| Live blog dedicated variant (full live-blog UX with pulse animation, updates list, autoscroll) | sibling component | Live-blog is a distinct surface; flag-only is sufficient for v0.3.                                                                                    |
| Full sponsor metadata (logo, link, disclosure modal)                | v0.4           | `sponsorLabel` string covers basic native-ad needs.                                                                                                    |
| Full engagement-bar-01 composition as a built-in mode (the card always composes the bar) | never as built-in | Made *connectable* via the `renderEngagementCounts` slot in v0.3 (see §6.2). Consumers opt-in on the detail page by passing `<EngagementBar01>` into the slot. Card stays light by default; engagement-bar-01 stays out of the peer-dep list. |
| Comment-thread-01 composition (embedded inline)                     | never (separate component) | If a host wants comments under an article preview, that's a detail-page composite, not a card.                                                          |
| Bulk-action ribbon (checkbox + multi-select for CMS table view)     | v0.4           | `actions` slot covers single-card; bulk-select is a parent-component concern.                                                                          |
| Drag-to-reorder for pinned content                                  | v0.5+          | Pin-order is a parent-list concern (e.g. `editorial-board-page`).                                                                                      |
| Inline poll widget (like post-card-01)                              | never          | News articles don't carry polls in the card preview.                                                                                                   |
| Inline link-preview card (like post-card-01)                        | never          | News card IS the link-preview equivalent; nested previews aren't editorial UX.                                                                         |
| Mention-text inline highlighting                                    | never          | Editorial body text doesn't have `@mentions` like social posts.                                                                                        |

---

## 13. Structural A+ checklist (grade criterion)

v0.3.0 is committed to closing **all 14** of these — if any are left open at GATE 3, the version doesn't ship.

- [ ] **1.** Role-aware `viewerMode: "editor" | "viewer"` opt-in toggle
- [ ] **2.** `ContentCardPermissions` matrix with 19 capabilities
- [ ] **3.** `canPerformAction(action, item)` universal predicate
- [ ] **4.** Moderator section — orthogonal `canModerate` + `moderatorActions(item)` slot
- [ ] **5.** Editor-mutation handlers (12) — separate from engagement
- [ ] **6.** Reader-mutation handlers (4) — separate from engagement
- [ ] **7.** Full kebab system with role-aware defaults + moderator group + full takeover
- [ ] **8.** Schema expansion — 31 new optional `ContentCardItem` fields
- [ ] **9.** Sub-feature slots × 7 + opt-outs × 7 + sub-exports × 6
- [ ] **10.** Per-entity click handlers (10) — author/publisher/category/topic/tag/quoted/commentCount/translate/revealPaywall/revealSensitive
- [ ] **11.** Light engagement counts (4 chip types) with handlers
- [ ] **12.** Imperative handle with 11 methods
- [ ] **13.** Comprehensive labels (~50 keys) for full i18n
- [ ] **14.** Backward compatibility — every v0.2.x consumer keeps working unchanged

---

## 14. Sign-off

Sign off here means:
- All 12 Q-Ds / 9 Q-Ps / 4 Q-Vs above answered (or "all defaults")
- Stage 2 plan can begin authoring at `content-card-news-01-procomp-plan-v0.3.0.md`

> **Awaiting your sign-off.**

**Reviewer:** _(your name)_
**Date:** _(YYYY-MM-DD)_
**Sign-off answers:**
- Q-Ds: …
- Q-Ps: …
- Q-Vs: …

---

*End of v0.3.0 description addendum.*
