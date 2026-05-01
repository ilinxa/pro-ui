# share-bar-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** [`docs/migrations/share-bar-01/`](../../migrations/share-bar-01/) (kasder `kas-social-front-v0` news detail page article column footer — `src/app/(platform)/news/[id]/page.tsx` lines 163–184)
>
> Sibling migration: [`article-meta-01`](../../migrations/article-meta-01/) — top-of-article meta strip from the same page.

## Problem

Every long-form content surface — blog posts, news articles, product pages, video pages — carries a horizontal share strip near the title or footer: a tight cluster of icon-only buttons that open the social platform's share intent in a new window, plus a "copy link" button with success-state feedback. Built ad-hoc per project: hardcoded targets, hardcoded URL templates, no copy-feedback handling, no clipboard fallback for older browsers, no analytics hooks, no shared a11y baseline. The kasder source has placeholder buttons with no actual share logic — building a real version is a meaningful upgrade.

## In scope

- **Data-driven targets array** — consumer specifies which platforms appear and in what order.
- **Built-in URL templates for 9 platforms** — Twitter / Facebook / LinkedIn / Reddit / WhatsApp / Telegram / Email / Threads / Bluesky. Live in a pure module (`parts/templates.ts`).
- **Copy-link button with success/error feedback** — icon flips to `Check` (signal-lime tint) for 2 seconds on success, or `X` on error. Uses `navigator.clipboard.writeText` with a `document.execCommand("copy")` fallback for older / insecure-context browsers.
- **Custom targets** — `kind: "custom"` with arbitrary `onClick` for non-built-in platforms (e.g. Mastodon instance, internal "Send to colleague", etc.).
- **Customizable URL** — `url?` prop overrides `window.location.href` (read at click time, not render time, to avoid SSR / hydration mismatches).
- **Title / text / hashtags / via** — passed into URL templates that accept them.
- **Analytics hooks** — `onShare(targetKind)` fires after successful share-intent open or copy success.
- **a11y** — each icon-only button carries `aria-label`; copy success/error announced via `aria-live`; `<ul>` / `<li>` semantics; external links use `target="_blank" rel="noopener noreferrer"`.
- **Optional section header** — `headingAs` plus `labels.heading` for the small "Share" label above the buttons. Default: no heading.
- **Optional top-divider** — `divider: true` applies `pt-8 border-t border-border` for the standard "below the article body" placement.

## Out of scope

- **Share-count metrics** — no API calls to fetch share counts. Pure action surface.
- **Native Web Share API integration** (`navigator.share()`) — different UX (mobile OS share sheet), different fallback chain. Could ship as a `useNativeShare?: boolean` mode in v0.2 if real demand surfaces.
- **Floating / sticky share rail** — strip only. Consumer wraps in `<aside className="sticky top-24">` for sticky behavior; out of v0.1 scope to ship sticky-rail mode.
- **Editable URL** — share URL is `props.url ?? window.location.href` at click time; not a controlled input.
- **Customizable success-reset duration per target** — uniform `successResetMs` only.
- **Multi-line / wrapping layout for huge target lists** — flex-wrap is allowed but the design assumes 2–10 targets in a single row.
- **Tooltips via shadcn Tooltip** — native `title` attribute in v0.1. (Less rich, no dep, ~free a11y win.)
- **Internationalized URL templates** (e.g. `lang=tr` query params) — out of scope.

## Target consumers

- News article detail pages (the kasder source itself)
- Blog post footers
- Product page social share rows
- Video player share button cluster
- Documentation pages with "Share this guide" affordance
- Any "long-form content with social distribution" surface

## Rough API sketch

```tsx
<ShareBar01
  url="https://example.com/news/sustainable-cities"
  title="Sustainable cities, then and now"
  via="ilinxa_news"
  hashtags={["sustainability", "urbanism"]}
  divider
  targets={[
    { kind: "twitter" },
    { kind: "facebook" },
    { kind: "linkedin" },
    { kind: "whatsapp" },
    { kind: "email" },
    { kind: "copy" },
  ]}
  onShare={(target) => analytics.track("share", { target })}
/>
```

Most-used props: `url`, `title`, `targets`, `onShare`. Rest are escape hatches.

## Example usages

**1. News article detail page** (the kasder source pattern, upgraded):
```tsx
<div className="mt-8 pt-8 border-t border-border">
  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Share</h4>
  <ShareBar01
    url={article.canonicalUrl}
    title={article.title}
    targets={[
      { kind: "twitter" },
      { kind: "facebook" },
      { kind: "linkedin" },
      { kind: "copy" },
    ]}
  />
</div>
```

**2. Article footer with full social set** + analytics:
```tsx
<ShareBar01
  url={article.canonicalUrl}
  title={article.title}
  divider
  headingAs="h4"
  targets={[
    { kind: "twitter" },
    { kind: "facebook" },
    { kind: "linkedin" },
    { kind: "reddit" },
    { kind: "whatsapp" },
    { kind: "telegram" },
    { kind: "threads" },
    { kind: "bluesky" },
    { kind: "email" },
    { kind: "copy" },
  ]}
  onShare={(target) => analytics.track("article.share", { id: article.id, target })}
/>
```

**3. Custom target** (e.g. internal "Send to teammate"):
```tsx
import { Send } from "lucide-react";

<ShareBar01
  url={article.canonicalUrl}
  targets={[
    { kind: "twitter" },
    { kind: "linkedin" },
    {
      kind: "custom",
      id: "send-to-teammate",
      icon: Send,
      ariaLabel: "Send to teammate",
      onClick: () => openInternalShareDialog(article.id),
    },
    { kind: "copy" },
  ]}
/>
```

**4. Compact (Twitter + Copy only)**:
```tsx
<ShareBar01 targets={[{ kind: "twitter" }, { kind: "copy" }]} />
```

**5. Localized**:
```tsx
<ShareBar01
  targets={[{ kind: "twitter" }, { kind: "facebook" }, { kind: "copy" }]}
  labels={{
    heading: "Paylaş",
    copyAria: "Bağlantıyı kopyala",
    copySuccess: "Bağlantı kopyalandı",
    copyError: "Kopyalanamadı",
  }}
  headingAs="h4"
  divider
/>
```

## Success criteria

1. **Real, working share intents** — clicking each social button opens the platform's correct share-intent URL in a new window with `url`, `title`, `via`, `hashtags`, `text` correctly URL-encoded and properly populated where the platform accepts them.
2. **Copy-link works in modern browsers** — `navigator.clipboard.writeText` succeeds in HTTPS contexts; fallback to `document.execCommand("copy")` in older / insecure contexts works for at least Chrome/Firefox/Safari current −2 versions.
3. **Copy success/error feedback is visible AND audible** — icon flip is visible to sighted users; `aria-live="polite"` announcement fires for SR users on success; `role="alert"` for errors.
4. **Cleanup** — the 2s success-reset `setTimeout` is cleared on unmount (no `setState after unmount` warning).
5. **`window.location.href` not read during render** — SSR-safe; `url` prop is consulted first, otherwise `window.location.href` is read in the click handler.
6. **External links secure** — `target="_blank" rel="noopener noreferrer"` on every social button.
7. **Bundle envelope** — ≤ 5KB component code (templates and icon map are mostly inert object literals).
8. **Memoization** — exported as `React.memo`.
9. **Demo coverage** — 5 sub-tabs (default 4-target / full 9-target with analytics / custom target / compact 2-target / localized Turkish).
10. **Verification** — `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean (1 pre-existing rich-card warning OK; no new); SSR `HTTP 200` for `/components/share-bar-01` with all demo tabs rendered.

## Open questions

All resolved during the analysis pass:

1. ✅ **Success tint** — use `text-primary` (signal-lime); no new `--success` token.
2. ✅ **Tooltips** — native `title` attribute (no shadcn Tooltip dep).
3. ✅ **`onShare(targetKind)` callback** — included in v0.1 for analytics.
4. ✅ **Native Web Share API integration** — NOT in v0.1; potential v0.2 addition.

## Why not...

- **Lazy-load URL templates?** — The whole templates module is ~2KB. Eager import is simpler and the savings would be invisible.
- **Compose on a `share-button-01` primitive?** — Would split the component into a list-and-button architecture. The button is tightly coupled to the kind dispatch + copy state; splitting it adds friction without buying anything.
- **Persist copy-success across re-renders?** — The 2s timeout is the affordance; persistence would defeat the point.
- **Accept `url` as a function `() => string`?** — Premature flexibility. The `url` prop OR `window.location.href` covers 100% of realistic cases.
