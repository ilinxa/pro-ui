export default function ArticleMeta01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        A horizontal strip of icon + value pairs that surface key metadata
        about a piece of content immediately under its title or hero. Reach
        for it on news article pages, blog post headers, doc page bylines,
        video player meta lines, podcast episode headers, forum thread
        titles — anywhere long-form content needs a quick metadata summary.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { Calendar, Clock, Eye, User } from "lucide-react"
import { ArticleMeta01 } from "@/registry/components/data/article-meta-01"

export function ArticleHeader() {
  return (
    <ArticleMeta01
      divider
      items={[
        { id: "author", icon: User, value: "Maya Chen", href: "/team/maya-chen" },
        { id: "date", icon: Calendar, value: "Apr 28, 2026" },
        { id: "read", icon: Clock, value: "5 min read", ariaLabel: "5 minute read" },
        { id: "views", icon: Eye, value: "12.4k", ariaLabel: "12,400 views" },
      ]}
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Per-item link</h3>
      <p className="text-muted-foreground">
        Each item accepts an optional <code>href</code> — usually for the
        byline (link to author page) or date (link to permalink / archive).
        Pass <code>linkComponent</code> for router-aware links.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import Link from "next/link"

<ArticleMeta01
  items={[
    { id: "author", icon: User, value: "Maya Chen", href: "/team/maya-chen" },
    { id: "date", icon: Calendar, value: "Apr 28, 2026", href: "/archive/2026-04-28" },
  ]}
  linkComponent={Link}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Layout knobs</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>align</code> — <code>start</code> (default) /{" "}
          <code>center</code> / <code>end</code>. Use <code>center</code> for
          centered meta lines under hero overlays.
        </li>
        <li>
          <code>divider</code> — <code>true</code> applies{" "}
          <code>pb-8 border-b border-border</code> for the &quot;between hero
          and body&quot; placement.
        </li>
        <li>
          <code>gapClass</code> — defaults to <code>gap-6</code>. Override for
          tighter rhythms (e.g. <code>gap-3</code> for video player meta).
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Items render as <code>&lt;li&gt;</code> inside a{" "}
          <code>&lt;ul role=&quot;list&quot;&gt;</code> for free list
          semantics (the explicit role works around Safari&apos;s VoiceOver
          handling of <code>list-style: none</code>).
        </li>
        <li>
          Item icons are decorative (<code>aria-hidden</code>). For
          icon-meaning clarity in screen readers, set <code>ariaLabel</code>{" "}
          on the item — it composes the link&apos;s accessible name when{" "}
          <code>href</code> is set, or wraps the unlinked content in a labeled
          span.
        </li>
        <li>
          Items can omit <code>icon</code> for text-only strips (e.g. category
          / issue / page metadata).
        </li>
        <li>
          Values are pre-formatted <code>ReactNode</code>. Bring your own date
          formatter (<code>Intl.DateTimeFormat</code>, <code>date-fns</code>,
          etc.) and number formatter (<code>Intl.NumberFormat</code>).
        </li>
        <li>
          The component is exported as <code>React.memo</code>. Memoize the{" "}
          <code>items</code> array (or pass a stable reference) for the memo
          to bite — inline <code>items=&#123;[...]&#125;</code> defeats it.
        </li>
      </ul>
    </div>
  );
}
