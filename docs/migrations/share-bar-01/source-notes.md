# share-bar-01 — migration source notes

> Intake doc for [`docs/migrations/share-bar-01/`](./). The user pointed at the kasder news detail-page article column; the assistant drafted this from the source. **Sections tagged `[TO CONFIRM]` are inferred and need user sign-off before the analysis pass.**
>
> **Family context:** part of the news-domain article-column extraction — sibling migrations: [`article-meta-01`](../article-meta-01/) and the upcoming `article-body-01` (Plate-based WYSIWYG, deferred). Together with the sidebar set, they assemble the kasder news detail page.
>
> **No `-news-` infix in the slug** — universal "social share strip" pattern (every blog post / article / video / product page has one).
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** `kas-social-front-v0` (kasder)
- **Path in source:** `src/app/(platform)/news/[id]/page.tsx` lines 163–184 (Share section at the bottom of the article column, above the sidebar boundary)
- **Used in:** the news article detail page, immediately after the Tags section, at the bottom of the article body. One instance per page.
- **Related code:**
  - [`original/news-detail-page.tsx`](./original/news-detail-page.tsx) — the full kasder source page; the share strip lives at lines 163–184 with a `handleCopyLink` callback (lines 33–37) using `navigator.clipboard.writeText(window.location.href)` and a 2-second `Check` icon flip on success

## Role

A horizontal row of social-share buttons + a copy-link button, typically at the bottom of an article (or pinned to the side as a "share rail"). Each social button opens the platform's share intent in a new window with the page's URL prefilled; the copy button writes the URL to the clipboard and flips its icon to a checkmark for ~2 seconds as feedback.

In the source: 4 round icon-only buttons (Facebook / Twitter / LinkedIn / Copy-link), each `variant="outline" size="icon"` from shadcn Button, with lucide icons.

The pattern is universal:
- Blog post footer share strip
- News article footer share strip
- Product page social share row
- Video player share button cluster
- Pinned side share rail (a sticky version of the same strip)

## What I like (preserve)

- **Round icon-only buttons** — `rounded-full` + `size="icon"` from shadcn Button. Compact, no labels needed (icons carry semantic + native chrome of each platform is recognizable).
- **Outline variant** — buttons sit on `bg-card` cleanly without competing visually.
- **Copy-link feedback affordance** — icon flips from `Copy` to `Check` (with `text-success` tint) on success, then reverts after 2s. Crucial UX signal that the action worked silently.
- **Section header** — small `text-sm font-semibold text-muted-foreground mb-3` "Paylaş" / "Share" label. Lightweight; not a full heading.
- **Top border separator** — `mt-8 pt-8 border-t border-border` separates the share section from the tags section above.
- **Horizontal flex with `gap-2`** — tight cluster.
- **No quantity / share-count display** — pure action, not metrics. (Share counts add complexity and are a different concern.)

## What bothers me (rewrite)

- **Hardcoded set of 4 fixed targets** (Facebook / Twitter / LinkedIn / Copy) — must be a data-driven list. Many sites add Reddit / Hacker News / WhatsApp / Telegram / Email / Threads / Bluesky.
- **Hardcoded icons** — `Facebook`, `Twitter`, `Linkedin`, `Copy`, `Check` baked in. Each target should accept its own icon.
- **No actual share URLs** — the kasder source has no `onClick` on the social buttons, just placeholder buttons. Any real version needs the platform-specific share-intent URL templates.
- **Copy-link logic is component-local** — `handleCopyLink` sits in the page, not the share component. The 2s reset timeout is also page-local. This logic must move into the component.
- **`navigator.clipboard.writeText` may not be available** — older browsers, insecure contexts (HTTP), and some embedded webviews don't support it. Component must handle the rejection / unavailability gracefully.
- **`window.location.href` baked in as the URL** — must accept `url: string` as a prop (defaults to `window.location.href` at render time on the client).
- **Hardcoded section header text** (`"Paylaş"`) — Turkish embedded. Must be a configurable label with English default.
- **No `success` token** — kasder uses `text-success` which doesn't exist in pro-ui's globals.css palette. Use `text-primary` (signal-lime) or define a new success token. **[TO CONFIRM]:** OK to use `--primary` for the copy-success flip? Keeps dep count lower; signal-lime is well-suited for "success" semantics.
- **Not memoized** — `React.memo` wrap.
- **No share-intent URL helpers** — each platform needs its own URL template (e.g. Twitter: `https://twitter.com/intent/tweet?url={url}&text={title}`). Must be encoded in the component.
- **No keyboard accessibility on copy feedback** — visual flip alone; SR users don't get notified. Need `aria-live` announcement on copy success.
- **No customization for which platforms appear** — must be data-driven `targets` array.
- **Tooltip on each button** — kasder has none. Useful for icon-only buttons (a11y improvement). **[TO CONFIRM]:** add native `title` attribute (cheap, no dep) OR use shadcn Tooltip (richer, adds dep)? Native `title` is the pro-ui-default-friendly choice; Tooltip is overkill here.

## Constraints / non-goals

- **No share counts** — pure actions, no metrics fetch. (Share counts require platform APIs and are a different surface.)
- **No native Web Share API integration in v0.1** — `navigator.share()` is a totally different UX (mobile OS share sheet) and would supplant the explicit-target pattern. Could add later as a `useNativeShare` boolean prop. YAGNI for v0.1.
- **No analytics emission** — no built-in `onShare(target)` fire-and-forget callback in v0.1. Could add later. **[TO CONFIRM]:** Or expose `onShare?: (targetId: string) => void` even in v0.1 — minimal surface, useful for analytics.
- **Never `next/*`** — share buttons render as `<a>` (with `target="_blank" rel="noopener noreferrer"`) for social targets, not router-aware links. (External destinations only.)
- **No floating / sticky-rail mode in v0.1** — strip only. Sticky behavior is a host-layout concern, achieved via `<aside className="sticky top-24"><ShareBar01 /></aside>`.
- **No customizable copy feedback duration** — locked at 2000ms. (Could expose `successResetMs` later if a real use case emerges.)
- **No server-side rendering of `window.location.href`** — that's not a concern; component reads it at render time on the client. SSR `url` is consumer-supplied.
- **No editable URL** — share URL is `props.url ?? window.location.href` at the time of click; not a controlled input.

## Screenshots / links

- Source: kasder dev env, news detail page article column footer.
- Equivalent in production: any Substack / Medium post share row, GitHub repo "Share" cluster, YouTube video share row.

## Open questions for confirmation

1. **Success-tint color:** OK to use `text-primary` (signal-lime) for the copy-success icon flip? Avoids defining a new `--success` token. **[default: yes]**
2. **Tooltips:** native `title` attribute (no shadcn dep) vs shadcn Tooltip primitive (richer)? **[default: native `title` for v0.1; can upgrade later]**
3. **`onShare(targetId)` callback in v0.1:** include for analytics hooks even though kasder source has nothing? **[default: yes — minimal surface, easy to wire]**
