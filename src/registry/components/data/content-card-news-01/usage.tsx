export default function ContentCardNews01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>ContentCardNews01</code> when you need a magazine-style
        article preview that flexes across different layout densities — a
        featured hero, a 2-col horizontal article, a vertical grid cell, a
        sidebar thumb, or a list row — all driven by a single{" "}
        <code>variant</code> prop. Built for news, blog, editorial, or
        documentation feeds.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { ContentCardNews01 } from "@/registry/components/data/content-card-news-01";

<ContentCardNews01
  item={{
    id: "1",
    title: "Headline",
    image: "/cover.jpg",
    excerpt: "Lead paragraph…",
    category: "Sustainability",
    author: "A. Yilmaz",
    date: "2026-05-01",
    readTime: 8,
  }}
  variant="medium"
  href="/news/1"
  categoryStyles={{
    Sustainability: "bg-emerald-500/10 text-emerald-600",
  }}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Five variants</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>featured</code> — full-bleed hero card with image overlay,
          serif title, full meta row, and a Read-More CTA. The badge wears a
          <code> bg-black/40 backdrop-blur-sm</code> wrapper for legibility.
        </li>
        <li>
          <code>large</code> — 2-column horizontal card. Image left,
          serif title + excerpt + meta right. Good as the lead article in a
          main column under a featured hero.
        </li>
        <li>
          <code>medium</code> — vertical card with image-on-top, optional
          view-chip overlay, and a kicker footer (separator + author/date).
          The default workhorse for grid cells.
        </li>
        <li>
          <code>small</code> — compact horizontal thumb tile. Sidebar density;
          no excerpt, no actions slot.
        </li>
        <li>
          <code>list</code> — full-width row with badge + title + truncated
          excerpt + chevron. The chevron is replaced by the actions slot when
          provided.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Polymorphic root</h3>
      <p className="text-muted-foreground">
        The card renders <code>{"<a>"}</code> by default. Pass your
        framework&apos;s link via <code>linkComponent</code> for SPA
        navigation:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import NextLink from "next/link";

<ContentCardNews01
  item={item}
  href={\`/news/\${item.id}\`}
  linkComponent={NextLink}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Nested interactives — actions slot
      </h3>
      <p className="text-muted-foreground">
        The card uses an overlay-link pattern: a real{" "}
        <code>{"<a>"}</code> covers the whole card via{" "}
        <code>position: absolute; inset: 0</code>. This keeps the entire
        surface clickable AND lets you embed independently-clickable buttons
        via the <code>actions</code> prop. The actions cluster gets{" "}
        <code>position: relative; z-index: 10</code> so it sits above the
        overlay.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ContentCardNews01
  item={item}
  variant="medium"
  href={\`/news/\${item.id}\`}
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
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); share(item); }} aria-label="Share">
        <Share2 />
      </button>
    </div>
  }
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        Inside the action button&apos;s <code>onClick</code>, call{" "}
        <code>e.preventDefault()</code> +{" "}
        <code>e.stopPropagation()</code> so the click doesn&apos;t bubble to
        the link overlay&apos;s default navigation. The Demo&apos;s &quot;Actions
        slot&quot; tab includes a working example.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Localization — labels + formatters
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ContentCardNews01
  item={item}
  variant="featured"
  labels={{ readMore: "Devamını Oku", minutesRead: "dk okuma" }}
  formatRelativeTime={(d) => myI18n.formatRelative(d)}
  formatDate={(d) => d.toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  })}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Soft-fail on missing fields</h3>
      <p className="text-muted-foreground">
        Only <code>id</code>, <code>title</code>, and <code>image</code> are
        required. Missing <code>excerpt</code>, <code>category</code>,{" "}
        <code>author</code>, <code>date</code>, <code>readTime</code>, or{" "}
        <code>views</code> are gracefully omitted — no empty placeholders, no
        layout glitches.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Customizing the title font
      </h3>
      <p className="text-muted-foreground">
        The title uses Tailwind&apos;s <code>font-serif</code> utility which
        maps to the pro-ui-wide <code>--font-serif</code> CSS variable
        (default: Playfair Display). Override at any DOM scope:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`/* App-wide override */
:root { --font-serif: "Lora", Georgia, serif; }

/* Section-scoped override */
<section style={{ "--font-serif": '"Cormorant Garamond"' } as any}>
  <ContentCardNews01 ... />
</section>

/* Per-card override */
<ContentCardNews01
  item={item}
  titleClassName="font-sans tracking-tight"
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          The link overlay&apos;s accessible name is the heading text via{" "}
          <code>aria-labelledby</code>; override with <code>ariaLabel</code>.
        </li>
        <li>
          Focus-visible ring covers the whole card surface (uses{" "}
          <code>:has(a:focus-visible)</code>), not just the invisible link
          rectangle.
        </li>
        <li>
          Decorative icons (Calendar, Clock, User, Eye, ArrowRight) are{" "}
          <code>aria-hidden</code>.
        </li>
        <li>
          The view-chip on <code>medium</code> announces &quot;N views&quot;
          via <code>aria-label</code>.
        </li>
        <li>
          All transitions wrapped in <code>motion-safe:</code> — reduced-motion
          users see static cards.
        </li>
      </ul>
    </div>
  );
}
