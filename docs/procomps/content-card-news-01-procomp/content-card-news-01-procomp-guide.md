# content-card-news-01 — procomp guide

> Stage 3: how to use it. Authored alongside the implementation.
>
> See [`content-card-news-01-procomp-description.md`](./content-card-news-01-procomp-description.md) for *why* and [`content-card-news-01-procomp-plan.md`](./content-card-news-01-procomp-plan.md) for *how*.

## When to use

- News / blog / editorial / documentation feeds where the same item shape needs to render at different visual densities (hero on top, grid in main column, list in sidebar).
- Magazine landing pages where featured + main + sidebar layouts compose by swapping `variant`.
- Card-style article previews on a marketing site, internal portal, or release notes page.
- Any place you have an item with `id` + `title` + `image` and want a polished, stylable preview.

## When NOT to use

- **Tabular data** — use `data-table`.
- **Tree-structured content** with editing — use `rich-card`.
- **Article body / full prose page** — that's `detail-page-news-01` (deferred sibling).
- **Cards with deeply nested editable surfaces** (forms inside cards) — the overlay-link pattern can complicate text selection inside form fields. Use a custom non-link card composition instead.
- **Cards with multiple discrete actions as the primary interaction** (e.g. "Approve / Reject / Defer" on each row) — the card surface should not navigate; build a custom `<article>` without the link overlay.

## Composition patterns

### Magazine layout (the canonical use case)

```tsx
<div className="space-y-8">
  <ContentCardNews01 item={featured} variant="featured" href={`/news/${featured.id}`} />
  <div className="grid gap-6 lg:grid-cols-12">
    <div className="space-y-6 lg:col-span-8">
      <ContentCardNews01 item={lead} variant="large" href={`/news/${lead.id}`} />
      <div className="grid gap-6 md:grid-cols-2">
        {middleArticles.map(item => (
          <ContentCardNews01 key={item.id} item={item} variant="medium" href={`/news/${item.id}`} />
        ))}
      </div>
    </div>
    <aside className="lg:col-span-4">
      <div className="rounded-2xl border bg-card p-4">
        {topPopular.map(item => (
          <ContentCardNews01 key={item.id} item={item} variant="list" href={`/news/${item.id}`} />
        ))}
      </div>
    </aside>
  </div>
</div>
```

The 5-variant set is a deliberate vocabulary — featured / large / medium / small / list. Mix freely.

### Sidebar "popular" / "related" lists

`variant="list"` rows live well inside any container. The chevron + truncated excerpt + relative date is calibrated for `~300px` widths.

### With Next.js (or other framework Link)

```tsx
import NextLink from "next/link";

<ContentCardNews01
  item={item}
  variant="medium"
  href={`/news/${item.id}`}
  linkComponent={NextLink}
/>
```

The `linkComponent` defaults to `'a'` (plain anchor — works SSR + CSR fine). Pass your framework's link to opt into SPA navigation.

### With nested actions (overlay-link pattern)

```tsx
<ContentCardNews01
  item={item}
  variant="medium"
  href={`/news/${item.id}`}
  actions={
    <div className="flex gap-2">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          bookmark(item.id);
        }}
        aria-label="Bookmark"
      >
        <Bookmark />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); share(item); }}
        aria-label="Share"
      >
        <Share2 />
      </button>
    </div>
  }
/>
```

The `actions` cluster gets `position: relative; z-index: 10`, sitting above the `<a>` overlay. The buttons have their own click handlers; `stopPropagation` keeps the click from bubbling to the link.

### Without navigation (read-only preview)

```tsx
<ContentCardNews01 item={item} variant="medium" />
```

When `href` is omitted, the link overlay isn't rendered. Card becomes a non-interactive `<article>` — useful for skeletons, disabled states, or static lists.

## Gotchas

### Action buttons must `stopPropagation`

Inside an action button's `onClick`, call `e.preventDefault()` + `e.stopPropagation()` so the click doesn't bubble to the article and trigger the link overlay's default navigation. The Demo's "Actions slot" tab includes the working example. Forgetting `stopPropagation` will navigate-and-click simultaneously — Cmd-click also opens a new tab.

### `categoryStyles` should be a stable reference

In long feeds, the card is `React.memo`'d. Inline-creating a `categoryStyles` map per render breaks memoization (new reference every render = always re-render). Hoist it out of the render or memoize:

```tsx
// Hoist outside component
const categoryStyles = { Sustainability: "...", /* ... */ };

// Or memoize inside
const categoryStyles = useMemo(() => ({ /* ... */ }), []);
```

### Image lazy-loading defaults differ by variant

`featured` defaults to `loading="eager"` (it's typically above-the-fold and the LCP element). All other variants default to `loading="lazy"`. Override via the `loading` prop:

```tsx
<ContentCardNews01 item={item} variant="medium" loading="eager" />
```

### `font-serif` falls back gracefully

If Playfair Display fails to load (Google Fonts down at build, network unreachable), the title falls back to the rest of the `--font-serif` chain (`Lora`, `ui-serif`, `Georgia`, `serif`). The `display: 'swap'` in the next/font config ensures fallback fonts render immediately while Playfair loads.

### Featured-variant badge backdrop-blur is automatic

Don't try to override the dark-bg badge wrapper; it's built into `parts/featured.tsx` because the dark gradient overlay would otherwise render `bg-success/10` etc. illegibly. If you need a different category-badge treatment on featured, pass `categoryStyles` keys with explicit dark-bg-friendly classes (e.g. `bg-emerald-600 text-white`).

### `min-w-0` matters in flex contexts

The `small` and `list` variants use `min-w-0` on the content container so `line-clamp-*` works correctly inside flex children. If you wrap a card in a flex layout that *also* truncates, double-check the parent's `min-w-0`.

### RTL support is basic

ArrowRight / chevron icons flip via `rtl:rotate-180`. Other layout choices (image left, content right in `large`) follow Tailwind's writing-direction-aware utilities. If you have specific RTL design intent (e.g. you want featured's "Read More" CTA to be at the *right* in LTR but visually "trailing" still in RTL), pass a custom `className` with explicit `rtl:` overrides.

## Migration notes

This component supersedes the kasder `kas-social-front-v0` `NewsCard.tsx`. The migration:

- **Preserved:** 5-variant set, serif title typography, category-color map pattern, featured gradient overlay, eye-icon view chip on medium, kicker footer, image scale-on-hover, all spacing rhythms.
- **Rewrote:** `next/link` → `linkComponent` slot, hardcoded URL → `href` prop, Turkish strings → English defaults + `labels` prop, `tr-TR` locale → `formatRelativeTime` / `formatDate` callbacks, `categoryColors` map with Turkish keys → `categoryStyles` prop, `NewsType` → `ContentCardItem` (soft-fail optional fields), single-`Link`-wrap → overlay-link pattern with `actions` slot, no React.memo → memoized, no focus-visible ring → full-card focus ring, hardcoded image attributes → lazy + decoding-async + per-variant aspect ratios, no `motion-safe:` → all transitions wrapped.
- **Added:** `actions` slot for nested interactives, `--font-serif` global token (Playfair Display default), backdrop-blur badge wrapper on featured for dark-bg legibility.

The original lives in [`docs/migrations/content-card-news-01/original/`](../../migrations/content-card-news-01/original/) for historical reference; never imported.

## Open follow-ups

### v0.2 candidates

- **Skeleton companion** (`<ContentCardNews01.Skeleton variant="medium" />`) for loading states matching each variant's shape.
- **`onCategoryClick`** prop for filterable category badges (would require lifting the badge OUT of the link overlay).
- **Image-with-fallback** built-in (currently consumer's responsibility via `imageClassName`).

### v0.3 candidates (now landed — see v0.3.0 section below)

These were the original v0.3 candidates carried forward from v0.1 — v0.3.0 actually went much wider (full backend-shaped feature parity with post-card-01). The original candidates below are still queued for v0.4+:

- 6th variant (`compact-row` — list with thumbnail) for medium-density tables.
- Sibling `media-card-news-01` for video / podcast preview cards.
- Theme-aware view-chip (currently always `bg-black/60` regardless of theme).

---

## v0.3.0 — backend-shaped editorial features (2026-06-02)

v0.3.0 mirrors the post-card-01 v0.3.2 trait set translated into editorial vocabulary. **Strictly additive on v0.2** — every v0.2.x consumer keeps working unchanged.

See [`content-card-news-01-procomp-description-v0.3.0.md`](./content-card-news-01-procomp-description-v0.3.0.md) for the full A+ trait set and [`content-card-news-01-procomp-plan-v0.3.0.md`](./content-card-news-01-procomp-plan-v0.3.0.md) for the implementation contract.

### Role-aware mode

```tsx
<ContentCardNews01
  item={article}
  variant="medium"
  viewerMode="editor"   // "editor" | "viewer" | undefined (legacy, no kebab)
  onEdit={(id) => router.push(`/cms/articles/${id}/edit`)}
  onDelete={(id) => api.delete(id)}
  onPublish={(id) => api.publish(id)}
  onSchedule={(id, currentScheduledFor) => openScheduler(id, currentScheduledFor)}
  onFeature={(id, nextFeatured) => api.feature(id, nextFeatured)}
  onPin={(id, nextPinned) => api.pin(id, nextPinned)}
  // ... 12 editor handlers total
/>
```

- `viewerMode === undefined` → v0.2 legacy (no kebab unless an explicit `kebabActions` slot is supplied)
- `viewerMode === "editor"` → kebab shows Edit / Publish / Schedule / Feature / Pin / Change visibility / Change category / Mark sensitive / See analytics / Delete (gated by which handlers are wired + the permissions matrix)
- `viewerMode === "viewer"` → kebab shows Bookmark / Share / Copy link / Translate / Report / Mute author / Block author / Unfollow topic

### Permissions matrix

Override the mode-derived defaults per action:

```tsx
<ContentCardNews01
  viewerMode="editor"
  permissions={{
    canDelete: false,        // editor but can't delete (junior reporter)
    canPublish: false,       // editor but needs editor-in-chief approval
    canShare: true,
    canBookmark: true,
  }}
  // Or use the universal predicate (wins over the matrix):
  canPerformAction={(action, item) => {
    if (action === "delete" && item.isPinned) return false;  // pinned articles can't be deleted
    return undefined;  // fall through to matrix → mode → legacy
  }}
/>
```

Resolution order: predicate → matrix → mode → legacy. Returning `undefined` from the predicate falls through to the next layer.

### Paywall gate

```tsx
const paywalledArticle: ContentCardItem = {
  // ...
  paywall: {
    isPaywalled: true,
    tier: "subscribers",
    preview: "The first 30 words show above the gate to entice a click",
    ctaLabel: "Subscribe to read",
    ctaHref: "/subscribe",  // optional — when set, CTA renders as <a href>
  },
};

<ContentCardNews01
  item={paywalledArticle}
  variant="medium"
  onRevealPaywall={(articleId) => analytics.track("paywall_cta_clicked", { articleId })}
  linkComponent={NextLink}  // polymorphic — CTA uses this when ctaHref is set
/>
```

The gate over excerpt + media renders automatically when `paywall.isPaywalled === true`. When `ctaHref` is set, the CTA is an `<a>` and fires `onRevealPaywall` BEFORE navigation (analytics fires first). When unset, the CTA is a `<button>` that fires `onRevealPaywall` only — host shows their own paywall UI in response.

### Sensitive content gate

```tsx
const sensitiveArticle: ContentCardItem = {
  // ...
  sensitivity: {
    isSensitive: true,
    reason: "Documentary imagery of disaster aftermath",
    contentWarnings: ["graphic imagery", "displacement"],
  },
};

<ContentCardNews01
  item={sensitiveArticle}
  variant="medium"
  onRevealSensitive={(articleId) => analytics.track("sensitive_warning_accepted", { articleId })}
/>
```

The gate sits over the **media only** (excerpt + title still visible). Reveal is per-card-per-session; reset via the handle:

```tsx
const ref = useRef<ContentCardNews01Handle>(null);
// ... later:
ref.current?.reset(article);  // clears sensitiveRevealed + paywallRevealed
```

### Editorial badge stack

```tsx
const article: ContentCardItem = {
  // ...
  isBreaking: true,     // highest priority
  isLive: true,
  isFeatured: true,
  isPinned: true,
  isSponsored: true,
  sponsorLabel: "GreenTech Industries",
  status: "scheduled",   // editor-mode only
  scheduledFor: "2026-06-05T09:00:00Z",
  lastLiveUpdateAt: new Date(),
  liveUpdateCount: 14,
};
```

Frozen priority order: Breaking → Live → Exclusive → Featured → Pinned → Sponsored → status (editor mode only). The `small` variant shows only the highest-priority badge per the per-variant feature matrix.

### Quoted article mini-card (analysis pieces)

```tsx
const analysisItem: ContentCardItem = {
  // ...
  quotedArticle: originalArticle,  // recursive nest
};

<ContentCardNews01
  item={analysisItem}
  variant="medium"
  onQuotedClick={(quoted) => router.push(`/news/${quoted.id}`)}
/>
```

Renders in `medium` + `list` variants only. Recursion-strip applies — a quoted article's own `quotedArticle` is ignored.

### Engagement counts → engagement-bar-01 composition

**Default behavior** (feed / index pages): light count chips.

```tsx
<ContentCardNews01
  item={article}
  variant="medium"
  onLike={(id, nextLiked) => api.like(id, nextLiked)}
  onCommentCountClick={(id) => router.push(`/news/${id}#comments`)}
  onShare={(id) => openShareSheet(id)}
  onBookmark={(id, nextBookmarked) => api.bookmark(id, nextBookmarked)}
/>
```

**Detail page composition** — compose `<EngagementBar01>` for the full bar:

```tsx
import { EngagementBar01 } from "@ilinxa/engagement-bar-01";

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

`engagement-bar-01` is **NOT** a peer dep of content-card-news-01 — consumers who only want light counts don't pull it in. Engagement data shape on `ContentCardItem` matches engagement-bar-01's counts shape so the slot is drop-in. See description §6.2 for the full pattern.

### Imperative handle (CMS bulk-action UIs)

```tsx
const ref = useRef<ContentCardNews01Handle>(null);

<ContentCardNews01 ref={ref} item={article} viewerMode="editor" onEdit={...} onDelete={...} />

// Bulk-publish from a CMS table toolbar:
ref.current?.triggerPublish();
ref.current?.triggerFeature();
ref.current?.triggerPin();

// External state push (e.g. realtime update from the server):
ref.current?.reset(updatedArticle);   // clears paywallRevealed + sensitiveRevealed flags

// Read current state:
const current = ref.current?.getCurrentItem();
```

11 methods total — `openKebab`, `triggerEdit/Delete/Publish/Unpublish/Pin/Feature`, `revealPaywall`, `revealSensitive`, `reset`, `getCurrentItem`. Handle methods bypass the permissions matrix (escape hatch).

### Sub-exports (use parts standalone)

11 sub-exports available from the barrel:

```tsx
import {
  // Composite parts (use one-by-one when you don't want the full card)
  NewsBadges,
  NewsAuthorByline,
  NewsPaywallGate,
  ContentSensitiveGate,
  QuotedArticleCard,
  NewsEngagementCounts,
  NewsKebab,
  // Small badge primitives
  StatusBadge,
  VisibilityBadge,
  SponsorBadge,
  LiveUpdateLine,
  NewsPublisherRow,
  // Helpers
  defaultContentCardKebabActions,
  resolveContentCardPermissions,
  stripQuotedRecursion,
  DEFAULT_LABELS,
} from "@ilinxa/content-card-news-01";
```

### Per-variant feature matrix

`small` variant skips kebab/paywall/engagement/byline/publisher/quoted (too compact). All other variants render the full v0.3 feature surface gated by the data. See description §7 for the locked matrix.

### Backward compatibility guarantee

Every v0.2.x card keeps rendering identically when no new props are passed. Drop-in test verified at GATE 3. Existing `author: string` + `date` fields stay supported alongside new structured `authorEntity` + `publishedAt` (structured wins when both set).

### Known limitations

- **No virtualization** at the card level — that's the layout's job (`grid-layout-news-01` will support `virtualize: 'auto'` when it ships).
- **No browser test runner** — verification is demo-driven. Pure modules (`defaultRelativeTime`, `defaultDateFormat`) are trivially testable when Vitest lands.
- **Text-selection inside the card** can be awkward because the link overlay sits above text. Click-and-drag to select the excerpt may register as a click-and-navigate. Workaround: select text by double-click-and-drag instead, or use the article detail page for serious copying.
