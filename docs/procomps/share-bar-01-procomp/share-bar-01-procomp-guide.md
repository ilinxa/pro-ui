# share-bar-01 — consumer guide

> Stage 3: how to use it.
>
> Component lives at [`src/registry/components/marketing/share-bar-01/`](../../../src/registry/components/marketing/share-bar-01/).

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/share-bar-01
```

The `@ilinxa/share-bar-01-fixtures` sibling adds the demo dummy-data file.

## Quick start

```tsx
import { ShareBar01 } from "@/registry/components/marketing/share-bar-01";

export function ArticleFooter({ article }) {
  return (
    <ShareBar01
      url={article.canonicalUrl}
      title={article.title}
      headingAs="h4"
      divider
      targets={[
        { kind: "twitter" },
        { kind: "facebook" },
        { kind: "linkedin" },
        { kind: "copy" },
      ]}
    />
  );
}
```

That's it — clicking each social button opens the platform's share intent in a new window with the URL prefilled. Clicking **Copy link** writes the URL to the clipboard and flips the icon to a check for 2 seconds.

## API reference

```ts
type ShareKind =
  | "twitter" | "facebook" | "linkedin" | "reddit"
  | "whatsapp" | "telegram" | "email" | "threads" | "bluesky";

type ShareTarget =
  | { kind: ShareKind; icon?: ComponentType; ariaLabel?: string }
  | { kind: "copy"; icon?: ComponentType; ariaLabel?: string }
  | { kind: "custom"; id: string; icon: ComponentType; ariaLabel: string; onClick: () => void };

interface ShareBar01Props {
  targets: ReadonlyArray<ShareTarget>;            // required
  url?: string;                                   // default window.location.href at click time
  title?: string;
  text?: string;
  via?: string;
  hashtags?: ReadonlyArray<string>;
  onShare?: (targetKind: string) => void;
  onCopySuccess?: () => void;
  onCopyError?: (err: unknown) => void;
  successResetMs?: number;                        // default 2000
  divider?: boolean;                              // default false
  headingAs?: "h2" | "h3" | "h4" | null;          // default null
  labels?: {
    heading?: string;     // default "Share"
    copyAria?: string;    // default "Copy link"
    copySuccess?: string; // default "Link copied"
    copyError?: string;   // default "Couldn't copy link"
  };
  className?: string;
  headerClassName?: string;
  buttonClassName?: string;
}
```

`SHARE_BAR_DEFAULT_LABELS` and `SHARE_TEMPLATES` are also exported for consumers who want to extend defaults or call URL builders directly.

## Built-in platforms

| Kind | Default icon | Notes |
|---|---|---|
| `twitter` | TwitterX (X glyph) | Accepts `title`, `via`, `hashtags` |
| `facebook` | Facebook glyph | URL only |
| `linkedin` | LinkedIn glyph | URL only |
| `reddit` | Reddit glyph | Accepts `title` |
| `whatsapp` | lucide `MessageCircle` | URL + title in body |
| `telegram` | lucide `Send` | Accepts `title` |
| `email` | lucide `Mail` | `mailto:` with `subject`+`body` |
| `threads` | Threads glyph | URL + title in body |
| `bluesky` | Bluesky glyph | URL + title in body |
| `copy` | lucide `Copy` (flips to `Check` / `X` on success/error) | Special: writes to clipboard |

Brand glyphs (Twitter X / Facebook / LinkedIn / Reddit / Threads / Bluesky) are inline SVGs in `parts/brand-icons.tsx` — Lucide-react no longer ships brand icons, so we embed the paths directly. WhatsApp / Telegram / Email / Copy use first-party Lucide icons. Override any icon via `target.icon`.

## Recipes

### Custom target

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

### Analytics

```tsx
<ShareBar01
  targets={[{ kind: "twitter" }, { kind: "facebook" }, { kind: "copy" }]}
  onShare={(target) => analytics.track("article.share", { id: article.id, target })}
/>
```

`onShare(targetKind)` fires after a successful share-intent open or successful copy. For granular hooks, use `onCopySuccess` / `onCopyError`.

### URL templates with title + hashtags + via

```tsx
<ShareBar01
  url={article.canonicalUrl}
  title={article.title}
  text={article.excerpt}
  via="ilinxa_news"
  hashtags={["sustainability", "urbanism"]}
  targets={[
    { kind: "twitter" },     // uses title, via, hashtags
    { kind: "reddit" },      // uses title
    { kind: "whatsapp" },    // appends title to URL in WhatsApp body
    { kind: "email" },       // subject = title, body = text + URL
    { kind: "copy" },
  ]}
/>
```

### Localized

```tsx
<ShareBar01
  targets={[{ kind: "twitter" }, { kind: "facebook" }, { kind: "copy" }]}
  headingAs="h4"
  divider
  labels={{
    heading: "Paylaş",
    copyAria: "Bağlantıyı kopyala",
    copySuccess: "Bağlantı kopyalandı",
    copyError: "Bağlantı kopyalanamadı",
  }}
/>
```

### Sticky share rail

The component is just a strip — wrap it in a sticky container for a side rail:

```tsx
<aside className="hidden lg:block fixed left-4 top-1/2 -translate-y-1/2">
  <ShareBar01
    targets={[
      { kind: "twitter" },
      { kind: "linkedin" },
      { kind: "copy" },
    ]}
    className="flex flex-col"   // override the row layout to vertical
  />
</aside>
```

Note: vertical layout requires custom `className` since the default is `flex-wrap items-center`. May want to bake a `direction?: "row" | "column"` prop in v0.2 if real demand.

### Override an icon

```tsx
import { Bird } from "lucide-react";   // example: replace TwitterX with a generic bird

<ShareBar01
  targets={[
    { kind: "twitter", icon: Bird, ariaLabel: "Share on the bird app" },
    { kind: "copy" },
  ]}
/>
```

## URL resolution

- If `url` prop is provided, that's what gets shared.
- Otherwise `window.location.href` is read **at click time** on the client (never during render). SSR-safe.
- `title`, `text`, `via`, `hashtags` are passed into URL templates that accept them (each platform uses what it understands).

## Copy fallback chain

1. `navigator.clipboard.writeText(url)` — modern browsers, HTTPS contexts.
2. **Fallback:** `document.execCommand("copy")` on a hidden textarea — older browsers, insecure HTTP contexts, embedded webviews.
3. If both fail, `setCopyState("error")` fires; the icon flips to `X` (`text-destructive`) for `successResetMs` (default 2000ms); `onCopyError` callback fires; `aria-live="alert"` announces the error.

## A11y

- Each icon-only button has a `title` (sighted hover tooltip) + `aria-label` (SR label) — both default per kind, both overridable.
- External-link buttons open with `target="_blank" rel="noopener noreferrer"`.
- Buttons render as `<li>` inside `<ul role="list">`.
- Copy success → `<span role="status" aria-live="polite">{labels.copySuccess}</span>`.
- Copy error → `<span role="alert">{labels.copyError}</span>`.
- The 2-second success-reset timer is cleared on unmount (no `setState after unmount` warning).

## Performance

- Exported as `React.memo`. Memoize the `targets` array (or use a module-level constant) for the memo to bite.
- `"use client"` boundary at the component level — uses `useState`, `useEffect`, `navigator.clipboard`.
- URL templates module is pure (~50 LOC, ~1KB) and tree-shakable; only the templates for the kinds you use end up in your bundle.

## Known limits / v0.2 candidates

- `useNativeShare?: boolean` — replaces button row with a single Share button calling `navigator.share()` (mobile-OS share sheet).
- Sticky-rail variant with `direction="column"`.
- Per-target `successResetMs` override.
- Share-count display (would require API integration).
- Internationalized URL templates (`?lang=tr` etc.).
- shadcn Tooltip integration for richer tooltips than native `title`.
- Threads + Bluesky icons — currently inline SVGs in `parts/brand-icons.tsx`. If Lucide adds first-party glyphs, switch.

## Migration origin

Extracted from `kas-social-front-v0` (`src/app/(platform)/news/[id]/page.tsx`, lines 163–184). The kasder source has 4 placeholder buttons with no actual share logic; this version is a meaningful upgrade: real URL templates for 9 platforms, working clipboard with fallback, copy success/error feedback (visual + audible), analytics hooks, custom targets. See [`docs/migrations/share-bar-01/analysis.md`](../../migrations/share-bar-01/analysis.md) for the full extraction notes.
