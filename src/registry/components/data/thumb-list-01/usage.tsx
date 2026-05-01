export default function ThumbList01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        A linked thumbnail-list block — small image + title + meta line per row,
        each row a single link target. Built for sidebars and dropdowns: related
        posts, popular articles, search-suggestion results, &quot;up next&quot;
        media queues, file-picker recents.
      </p>
      <p className="mt-2 text-muted-foreground">
        Use it for short lists (3–10 items typically; cap at ~20). For longer
        result sets reach for <code>data-table</code> or{" "}
        <code>grid-layout-news-01</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { ThumbList01 } from "@/registry/components/data/thumb-list-01"

const items = [
  { id: "1", title: "Sustainable cities", imageSrc: "/img/1.jpg", meta: "5 min read", href: "/news/1" },
  { id: "2", title: "Public transit on the rebound", imageSrc: "/img/2.jpg", meta: "3 min read", href: "/news/2" },
]

export function Example() {
  return <ThumbList01 items={items} labels={{ heading: "Related" }} />
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">No frame (inline)</h3>
      <p className="text-muted-foreground">
        Pass <code>framed={`{false}`}</code> to drop the card chrome. Useful in
        a search-suggestions dropdown, a modal, or any other surface that
        already provides its own framing.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ThumbList01 items={searchHits} framed={false} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom meta rendering</h3>
      <p className="text-muted-foreground">
        The default meta render shows <code>item.meta</code> as a plain string.
        Pass <code>renderMeta(item)</code> to render dates, badges, scores, or
        anything else.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ThumbList01
  items={posts}
  renderMeta={(item) => (
    <time className="text-xs text-muted-foreground mt-1 block" dateTime={item.publishedAt}>
      {formatRelative(item.publishedAt)}
    </time>
  )}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Polymorphic link</h3>
      <p className="text-muted-foreground">
        Per-item <code>href</code> drives navigation. By default the row link
        renders as a native <code>&lt;a&gt;</code>. Pass{" "}
        <code>linkComponent</code> for router-aware links (e.g.{" "}
        <code>next/link</code> or <code>RemixLink</code>).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import Link from "next/link"

<ThumbList01 items={items} linkComponent={Link} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Empty state</h3>
      <p className="text-muted-foreground">
        When <code>items</code> is empty, the default empty fallback renders
        with <code>labels.emptyText</code>. For a richer custom UI, pass{" "}
        <code>emptyState</code> as a ReactNode — it replaces the default
        message.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ThumbList01
  items={[]}
  labels={{
    heading: "Recently viewed",
    emptyText: "Nothing here yet — articles you read will show up.",
  }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Items render as <code>&lt;li&gt;</code> inside a{" "}
          <code>&lt;ul&gt;</code>. The link wraps the row content; keyboard
          focus and hover both shift the title color (
          <code>group-hover:text-primary</code> /{" "}
          <code>group-focus-visible:text-primary</code>).
        </li>
        <li>
          The header icon is decorative (<code>aria-hidden</code>). Pass{" "}
          <code>headerIcon={`{null}`}</code> to hide it entirely.
        </li>
        <li>
          Items without <code>href</code> render as plain rows (no link
          affordance). Useful when you want the visual but not the navigation.
        </li>
        <li>
          Thumbnails default to <code>w-20 h-16</code> (5:4 landscape). Override
          via <code>imageClassName</code> for square / portrait / other shapes.
        </li>
        <li>
          The component is exported as <code>React.memo</code>. Pass stable refs
          for <code>linkComponent</code> / <code>headerIcon</code> /{" "}
          <code>renderMeta</code> for memoization to hold.
        </li>
        <li>
          Don&apos;t reach for this for paginated or virtualized lists — it
          renders all items eagerly. Cap input at ~20.
        </li>
      </ul>
    </div>
  );
}
