# author-card-01 — consumer guide

> Stage 3: how to use it. Authored alongside the implementation.
>
> Component lives at [`src/registry/components/marketing/author-card-01/`](../../../src/registry/components/marketing/author-card-01/).

## Install

From any consumer app:

```bash
pnpm dlx shadcn@latest add @ilinxa/author-card-01
```

The `@ilinxa/author-card-01-fixtures` sibling adds the `dummy-data.ts` file used by the docs-site demo. Skip it if you have your own data.

## Quick start

```tsx
import { AuthorCard01 } from "@/registry/components/marketing/author-card-01";

export function ArticleSidebar() {
  return (
    <AuthorCard01
      name="Maya Chen"
      role="Senior Editor"
      bio="Specializes in sustainable urbanism and environmental journalism."
      imageSrc="/authors/maya.jpg"
      imageAlt="Maya Chen"
    />
  );
}
```

That's the kasder pattern: card-framed, primary-tone fallback (signal-lime tint on the avatar circle if `imageSrc` is omitted), `<h3>` heading reading "About the author", three text fields underneath.

## API reference

```ts
interface AuthorCard01Props {
  name: string;                                            // required
  role: string;                                            // required
  bio?: string;                                            // optional; section hidden when absent
  imageSrc?: string;                                       // optional; falls back to icon when absent
  imageAlt?: string;                                       // defaults to `name`
  fallbackIcon?: ComponentType<{ className?: string }>;    // defaults to lucide User
  href?: string;                                           // when set, whole card becomes a link
  linkComponent?: ElementType;                             // defaults to "a"; pass next/link / RemixLink for SPA nav
  tone?: "primary" | "accent" | "muted";                   // defaults to "primary"
  headingAs?: "h2" | "h3" | "h4";                          // defaults to "h3"
  labels?: { heading?: string };                           // defaults to { heading: "About the author" }
  className?: string;
  headingClassName?: string;
  nameClassName?: string;
  bioClassName?: string;
}
```

`AUTHOR_CARD_DEFAULT_LABELS` is exported for consumers who want to extend the defaults.

## Recipes

### Clickable card with `next/link`

```tsx
import Link from "next/link";

<AuthorCard01
  name="Daniel Park"
  role="Product Designer"
  bio="Currently designing onboarding flows."
  imageSrc="/team/daniel.jpg"
  href="/team/daniel-park"
  linkComponent={Link}
/>
```

The whole surface navigates. Hover lifts the border subtly; keyboard focus shows a ring (`focus-visible:ring-ring focus-visible:ring-offset-2`). The accessible name is the author's name (via `aria-labelledby`).

### Non-person bylines

For collective / pseudonymous / institutional authors, swap the fallback icon:

```tsx
import { Users } from "lucide-react";

<AuthorCard01
  name="The Editorial Team"
  role="Collective"
  bio="Reporting from across the newsroom."
  fallbackIcon={Users}
  tone="muted"
/>
```

### i18n

All visible chrome strings ship through `labels`. The data fields (`name` / `role` / `bio`) are consumer data — pass localized strings directly:

```tsx
<AuthorCard01
  name="Aylin Demir"
  role="Kıdemli Editör"
  bio="Sürdürülebilir şehircilik ve çevre konularında uzmanlaşmış."
  labels={{ heading: "Yazar Hakkında" }}
/>
```

### Within the news-domain sidebar

```tsx
<aside className="lg:col-span-4">
  <div className="sticky top-24 space-y-8">
    <AuthorCard01 {...author} />
    <ThumbList01 items={relatedArticles} labels={{ heading: "Related" }} />
    <NewsletterCard01 onSubmit={subscribe} />
  </div>
</aside>
```

All three components share the same card chrome (`rounded-2xl p-6 border border-border/50`), the same heading rhythm (`text-lg font-serif font-bold`), and the same family tones — they compose without retuning.

## Tones

| `tone`     | Avatar background  | Avatar icon         | Use when…                               |
|------------|--------------------|---------------------|-----------------------------------------|
| `primary`  | `bg-primary/10`    | `text-primary`      | default — most editorial contexts       |
| `accent`   | `bg-accent`        | `text-accent-foreground` | softer surface — secondary content |
| `muted`    | `bg-muted`         | `text-muted-foreground` | neutral — team pages, dense lists  |

Tones only affect the icon-fallback path. When `imageSrc` is provided, the image renders as-is (the tinted circle is hidden).

## A11y

- Whole card link uses `aria-labelledby={nameId}` pointing to the name `<p>`. Heading text is decorative.
- Icon fallback has `aria-hidden="true"`. Name carries identity.
- Image has `loading="lazy"` and an `alt` (defaults to `name`).
- Focus-visible ring renders only on the link variant.
- Heading level is configurable for landmark compatibility (`h2` / `h3` / `h4`; default `h3`).

## Performance

- The component is exported as `React.memo`. For memoization to hold, pass stable references for `linkComponent` and `fallbackIcon` (don't create them inline on every render). Inline arrow components defeat the memoization.
- The avatar image uses `loading="lazy"` — no impact on initial paint when below the fold.
- No client-only APIs; the component renders fully on the server.

## Known limits / v0.2 candidates

- **Image error fallback** — broken `src` shows the browser default broken-image icon. v0.2 candidate: optional `imagePlaceholder?: ReactNode`.
- **Avatar size** — fixed at `w-16 h-16`. v0.2 candidate: `size?: "sm" | "md" | "lg"` if real use cases emerge.
- **Footer slot** — no support for trailing CTAs ("Follow", "View all posts") inside the card. Consumer can wrap externally; YAGNI for v0.1.
- **Avatar groups / multiple authors** — single author only. Out of scope.
- **Skeleton loading** — consumers wrap their own `Skeleton` while data loads.

## Migration origin

Extracted from `kas-social-front-v0` (`src/app/(platform)/news/[id]/page.tsx`, lines 191–205). The kasder source has the block inline with hardcoded Turkish copy; this version is data-driven, English-default, and polymorphic. See [`docs/migrations/author-card-01/analysis.md`](../../migrations/author-card-01/analysis.md) for the full extraction notes.
