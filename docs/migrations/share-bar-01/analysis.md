# share-bar-01 — migration analysis

> Extraction pass for [`docs/migrations/share-bar-01/`](./). Filled by the assistant after reading [`original/news-detail-page.tsx`](./original/news-detail-page.tsx) and [`source-notes.md`](./source-notes.md). Reviewed and signed off by user before the procomp gate begins.
>
> Pipeline: [`docs/migrations/README.md`](../README.md).

## Design DNA to PRESERVE

1. **Round icon-only buttons** — `rounded-full` + `size="icon"` from shadcn Button.
2. **Outline variant** — sits on `bg-card` cleanly without competing visually.
3. **Copy-link icon flip feedback** — `Copy` → `Check` (tinted) for ~2 seconds on success.
4. **Section header pattern** — small `text-sm font-semibold text-muted-foreground mb-3` "Share" label.
5. **Top border separator (optional)** — `pt-8 border-t border-border` separates the share section from prior content.
6. **Horizontal flex with `gap-2`** — tight cluster; doesn't sprawl.
7. **No share-count metrics** — pure action surface.

## Structural debt to REWRITE

1. **Hardcoded set of 4 fixed targets** (Facebook / Twitter / LinkedIn / Copy) — must be a data-driven `targets` array.
2. **Hardcoded icons** — each target accepts its own icon via `icon: ComponentType<{ className?: string }>`.
3. **No actual share URLs in source** — kasder buttons are placeholders. Component must encode share-intent URL templates per target. Use a typed `kind` discriminator (`"twitter" | "facebook" | "linkedin" | "reddit" | "whatsapp" | "telegram" | "email" | "threads" | "bluesky" | "url"` for the URL builder, `"copy"` for the copy-link button, `"custom"` for arbitrary `onClick`).
4. **Copy logic page-local** — `handleCopyLink` + 2s reset must move into the component.
5. **`navigator.clipboard.writeText` may be unavailable** — older browsers, insecure (HTTP) contexts, embedded webviews. Component must `try/catch` the clipboard write; show error feedback via `aria-live` and a brief icon flip (e.g. lucide `X`); fall back to `document.execCommand("copy")` on a hidden textarea as a last-ditch attempt.
6. **`window.location.href` baked in** — must accept `url?: string` prop (defaults to `window.location.href` on the client at click time, NOT at render time — render-time would lock the URL to the SSR'd path which may differ from the runtime URL).
7. **Hardcoded section header text** (`"Paylaş"`) — must ride through `labels.heading?` with English default `"Share"`.
8. **`text-success` doesn't exist** — kasder uses an undefined token. Use `text-primary` (signal-lime) for the success flip. Confirmed in source-notes.
9. **Not memoized** — `React.memo` wrap.

## Dependency audit

| Dep | Source uses | Plan |
|---|---|---|
| `react` | yes | yes |
| `lucide-react` | `Facebook`, `Twitter`, `Linkedin`, `Copy`, `Check`, `Share2`, `X` | yes — declared dep, defaults provided |
| `@/components/ui/button` | yes | yes — declared shadcn dep |
| `@/lib/utils` (`cn`) | no | yes — class merging |
| `next/link` | no | not needed |

One shadcn primitive (`Button`). Same dep footprint as `newsletter-card-01`'s CTA.

## Dynamism gaps

1. `targets: ShareTarget[]` — required. Each target:
   ```ts
   type ShareTarget =
     | { kind: "twitter" | "facebook" | "linkedin" | "reddit" | "whatsapp" | "telegram" | "email" | "threads" | "bluesky"; icon?: ComponentType; ariaLabel?: string }
     | { kind: "copy"; icon?: ComponentType; ariaLabel?: string }
     | { kind: "custom"; id: string; icon: ComponentType; onClick: () => void; href?: string; ariaLabel: string };
   ```
2. `url?: string` — share URL. Default: `window.location.href` at click time.
3. `title?: string` — used by Twitter / Email / Threads templates (subject / tweet text).
4. `text?: string` — body text for templates that take it (Email / WhatsApp).
5. `via?: string` — Twitter handle for `via=` param.
6. `hashtags?: string[]` — Twitter hashtags.
7. `onShare?: (targetKind: string) => void` — fired after a successful share-intent open (or successful copy). Minimal surface for analytics.
8. `onCopySuccess?: () => void` / `onCopyError?: (err: unknown) => void` — granular hooks if `onShare` is too coarse.
9. `successResetMs?: number` — default `2000`. Override the copy-success icon flip duration.
10. `divider?: boolean` — default `false`. When `true`, applies `pt-8 border-t border-border` to the root.
11. `labels?: { heading?: string; copyAria?: string; copySuccess?: string; copyError?: string }` — defaults `{ heading: "Share", copyAria: "Copy link", copySuccess: "Link copied", copyError: "Couldn't copy" }`.
12. `headingAs?: "h2" | "h3" | "h4" | null` — default `null`. The kasder source uses a small label (`<h4>` styled like `text-sm`) — but it's not really a heading semantically. Default to `null` (no heading), let consumer pass `"h4"` if they want. Documented in guide.
13. `className?` (root), `headerClassName?`, `buttonClassName?`.

## Optimization gaps

1. **Memoization** — wrap default export in `React.memo`. Pure for given props.
2. **Stable handlers** — internal copy logic uses `useCallback` for the click handler; targets without explicit `onClick` get stable handlers via the kind dispatch.
3. **Cleanup** — the 2s reset timeout must be cleared on unmount (avoid `setState after unmount` warning). `useRef<number>` + `clearTimeout` in cleanup.
4. **SSR-safe** — `window.location.href` must NOT be read during render (would crash SSR). Read it inside the click handler (after hydration, runs on client only). Component renders fully on the server.
5. **No client-only mount required** — no `"use client"` boundary needed at the component level if consumer wraps in client boundary; but since the click handlers ARE client-only, the component itself ships with `"use client"` directive.

## Accessibility gaps

1. **Each button is icon-only** — needs an `aria-label`. Default per kind (e.g. `"Share on Twitter"`, `"Copy link"`); overridable via `target.ariaLabel`.
2. **Copy-success state needs `aria-live`** — sighted users see the icon flip; SR users need an announcement. Add `<span role="status" aria-live="polite" className="sr-only">{labels.copySuccess}</span>` rendered conditionally during the 2s success window.
3. **Copy-error state** — same pattern with `role="alert"` (assertive) for errors.
4. **`<ul>` / `<li>` semantics** — kasder uses bare `<div>`. Switch to `<ul role="list">` + `<li>` (with the `role="list"` Safari workaround per `article-meta-01` precedent).
5. **External link buttons** — `target="_blank" rel="noopener noreferrer"` mandatory.
6. **Section heading** — when `headingAs` is set, the heading carries the section's accessible name. When unset (default), no implicit landmark.

## Share-intent URL templates (referenced into the implementation)

```ts
const TEMPLATES = {
  twitter: ({ url, title, via, hashtags }) =>
    `https://twitter.com/intent/tweet?${new URLSearchParams({
      url,
      ...(title && { text: title }),
      ...(via && { via }),
      ...(hashtags?.length && { hashtags: hashtags.join(",") }),
    })}`,
  facebook: ({ url }) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  linkedin: ({ url }) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  reddit: ({ url, title }) =>
    `https://reddit.com/submit?${new URLSearchParams({ url, ...(title && { title }) })}`,
  whatsapp: ({ url, title }) =>
    `https://wa.me/?text=${encodeURIComponent([title, url].filter(Boolean).join(" "))}`,
  telegram: ({ url, title }) =>
    `https://t.me/share/url?${new URLSearchParams({ url, ...(title && { text: title }) })}`,
  email: ({ url, title, text }) =>
    `mailto:?${new URLSearchParams({
      ...(title && { subject: title }),
      body: [text, url].filter(Boolean).join("\n\n"),
    })}`,
  threads: ({ url, title }) =>
    `https://www.threads.net/intent/post?${new URLSearchParams({
      text: [title, url].filter(Boolean).join(" "),
    })}`,
  bluesky: ({ url, title }) =>
    `https://bsky.app/intent/compose?${new URLSearchParams({
      text: [title, url].filter(Boolean).join(" "),
    })}`,
};
```

These live in `parts/templates.ts` as a pure module — testable independently, no React deps.

## Proposed procomp scope

**Slug:** `share-bar-01`
**Category:** `marketing` (matches `newsletter-card-01` / `author-card-01` — content-marketing surfaces).
**Status:** alpha 0.1.0.

**Files (~10):**
- `share-bar-01.tsx` — root, memoized, owns copy state + timeout cleanup
- `parts/share-button.tsx` — single icon-only button with kind dispatch
- `parts/templates.ts` — pure share-intent URL builders
- `parts/icons.ts` — default icon map per kind (lucide-react)
- `types.ts` — `ShareTarget` discriminated union + props
- `dummy-data.ts` — 3 sample target sets (full-9 / minimal-3 / custom-only)
- `demo.tsx` — 5 sub-tabs
- `usage.tsx`, `meta.ts`, `index.ts` — standard

**Public API draft:**

```ts
export interface ShareBar01Props {
  targets: ReadonlyArray<ShareTarget>;
  url?: string;                                       // default: window.location.href at click time
  title?: string;
  text?: string;
  via?: string;
  hashtags?: string[];
  onShare?: (targetKind: string) => void;
  onCopySuccess?: () => void;
  onCopyError?: (err: unknown) => void;
  successResetMs?: number;                            // default 2000
  divider?: boolean;                                  // default false
  headingAs?: "h2" | "h3" | "h4" | null;              // default null
  labels?: {
    heading?: string;
    copyAria?: string;
    copySuccess?: string;
    copyError?: string;
  };
  className?: string;
  headerClassName?: string;
  buttonClassName?: string;
}
```

**Bundle envelope:** ≤ 5KB component code (templates + icon map are mostly inert object literals).

## Recommendation

**Ship as a standalone pro-component.** Universal pattern, modest scope, well-defined edges. Migration is a meaningful upgrade — kasder source has placeholder buttons with no actual share logic; this version ships a real, tested, a11y-correct share strip.

**Confirmed defaults from source-notes:**
1. ✅ Use `text-primary` (signal-lime) for copy-success tint, not a new `--success` token.
2. ✅ Native `title` attribute for tooltips in v0.1 (no shadcn Tooltip dep).
3. ✅ Include `onShare(targetKind)` callback for analytics in v0.1.

**Open call:** Include `Web Share API` (`navigator.share()`) integration as a v0.1 escape hatch — `useNativeShare?: boolean` prop that, when true, replaces the entire button row with a single "Share" button that calls `navigator.share()`? **Recommendation: NO for v0.1.** Different UX, different a11y story, different fallback chain. Ship the explicit-target version; add `useNativeShare` mode in v0.2 if real consumers ask.
