# author-card-01 — migration source notes

> Intake doc for [`docs/migrations/author-card-01/`](./). The user pointed at the kasder news detail-page sidebar; the assistant drafted this doc from that source + the user's brief comment ("could be a simple reusable component"). **Sections tagged `[TO CONFIRM]` are inferred and need user sign-off before the analysis pass.**
>
> **Family context:** sibling sub-extraction from the kasder news detail-page sidebar. Cousin migration: [`thumb-list-01`](../thumb-list-01/) extracts the "Related News" block from the same sidebar. The third sidebar block (newsletter signup) was already shipped as [`newsletter-card-01`](../../../src/registry/components/marketing/newsletter-card-01/).
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** `kas-social-front-v0` (kasder)
- **Path in source:** `src/app/(platform)/news/[id]/page.tsx` lines 191–205 (Author Card sidebar block)
- **Used in:** the news article detail page sidebar, sticky-positioned alongside the article body. One instance per page.
- **Related code:**
  - [`original/news-detail-page.tsx`](./original/news-detail-page.tsx) — the full kasder source page; the Author Card lives in the `<aside>` between the meta block and the related-news list

## Role

A small "About the Author" sidebar block on a news article page. Surfaces the writer's identity (avatar / name / role / short bio) so the reader can see who wrote what they're reading and place it in context. Generic enough to apply far beyond news: blog bylines, contributor pages, comment headers, doc page authors, team-page entries, expert-Q&A cards.

The kasder version uses an icon-fallback avatar (no real photo), name, hardcoded role ("Kıdemli Editör" / Senior Editor), and a hardcoded bio sentence under it. In production this would be data-driven per author.

## What I like (preserve)

- Card-framed (`bg-card rounded-2xl p-6 border border-border/50`) — visually distinct from the article body. **[TO CONFIRM]**
- Editorial header rhythm: `text-lg font-serif font-bold` heading at the top — matches `newsletter-card-01` / `category-cloud-01` rhythm.
- Avatar-on-the-left, name-and-role-stacked-on-the-right two-column layout for the identity row.
- Avatar fallback: tinted circle with a Lucide `User` icon when no image is provided (the kasder version actually only uses the fallback — no real photo).
- Bio text below the identity row, separated by `mt-4` — secondary-tone (`text-muted-foreground`).
- Subtle border + soft tint distinguishes the card without competing with the article body.

## What bothers me (rewrite)

- Hardcoded role string (`"Kıdemli Editör"`) — must be a prop.
- Hardcoded bio text (`"Sürdürülebilir şehircilik..."`) — must be a prop.
- Hardcoded heading text (`"Yazar Hakkında"`) — must be a configurable label, defaulting to English.
- No real avatar image support — only the icon fallback. Add `imageSrc` prop with the fallback as default.
- No way to make the card link to the author's profile / page. Polymorphic root via `linkComponent` slot would solve this without forcing `next/link`.
- No heading-level configurability — current code is `<h3>` always; consumers may need `<h2>` (top-level page surface) or `<h4>` (deeply-nested context).
- Not memoized — re-renders even when props are reference-equal.
- No Turkish/locale awareness — pure English defaults with `labels` object override (matches the news-domain family convention).
- Avatar tint ties the icon to `--primary` (signal-lime) — fine as a default, but consumers may want a per-author accent or a neutral tone. Add a `tone` prop (primary / accent / muted) matching the newsletter-card pattern.

## Constraints / non-goals

- **Single card only** — never a list mode. (Lists of authors compose this.)
- **Never `next/*`** — registry mandate. Polymorphic root via `linkComponent: ElementType`, image as native `<img>`.
- **No portrait-style variants** — keep it horizontal (avatar on left). Vertical/centered variants belong to a separate `profile-card-XX` if the need ever arises.
- **No social links / contact buttons inside the card** — those are a different component (could compose via a `footer` slot if needed; YAGNI for now).
- **No editor-mode** — read-only display. Edit-author UIs belong elsewhere.

## Screenshots / links

- Source page screenshot: not captured (kasder dev env).
- Equivalent block in production: any blog "About the author" sidebar pattern — e.g. Substack post author card, Medium post author card.
