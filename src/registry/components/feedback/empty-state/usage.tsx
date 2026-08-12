export default function EmptyStateUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>EmptyState</code> anywhere a surface can render
        nothing: an empty table/list, a no-results search, a failed fetch, an
        offline banner, a permission wall, or first-run onboarding. The host
        decides <em>when</em> it&apos;s empty and supplies copy + handlers;
        <code>EmptyState</code> only renders the designed answer — icon or
        illustration, title, description, up to two actions, and an optional
        footer hint. Omit <code>action</code>/<code>secondaryAction</code>{" "}
        for a read-only variant — the buttons simply don&apos;t render.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Host example — search-empty inside a data table
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { EmptyState } from "@/components/empty-state";

export function ProjectsTable({ rows, filters, onClearFilters }) {
  if (rows.length === 0 && filters.active) {
    return (
      <EmptyState
        variant="search"
        size="sm"
        title={\`No results for "\${filters.query}"\`}
        description="Try a different term or clear the active filters."
        action={{ label: "Clear filters", onClick: onClearFilters }}
      />
    );
  }

  return <Table rows={rows} />;
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Variants</h3>
      <p className="text-muted-foreground">
        Six semantic tones, each with its own default lucide icon — override
        with <code>icon</code>, or replace the tile entirely with{" "}
        <code>media</code> (an illustration slot; when set, the icon and its
        halo are omitted).
      </p>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>default</code> — no data yet (<code>Inbox</code>).
        </li>
        <li>
          <code>search</code> — no results for a filter/query (
          <code>SearchX</code>); pairs with a &quot;Clear filters&quot; action.
        </li>
        <li>
          <code>error</code> — something failed (<code>TriangleAlert</code>);
          pairs with a &quot;Retry&quot; action.
        </li>
        <li>
          <code>offline</code> — no connection (<code>WifiOff</code>).
        </li>
        <li>
          <code>permission</code> — locked content (<code>Lock</code>).
        </li>
        <li>
          <code>first-use</code> — onboarding tone (<code>Sparkles</code>),
          decorative spinning dashed ring around the tile.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Actions</h3>
      <p className="text-muted-foreground">
        <code>action</code> / <code>secondaryAction</code> accept either an
        object — <code>{`{ label, onClick?, href?, disabled? }`}</code> —
        rendered as a real <code>Button</code> (or a plain{" "}
        <code>{`<a>`}</code> styled via <code>buttonVariants</code> when{" "}
        <code>href</code> is set), or any <code>ReactNode</code> for full
        control over the rendered element.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Sizes</h3>
      <p className="text-muted-foreground">
        <code>sm</code> for inline/card-level empties, <code>md</code> for a
        section, <code>lg</code> for a full-page state. Controls type scale,
        icon-tile scale, and vertical padding.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Frame</h3>
      <p className="text-muted-foreground">
        <code>frame=&quot;dashed&quot;</code> adds a dropzone-style dashed border;{" "}
        <code>frame=&quot;card&quot;</code> raises the root onto a <code>bg-card</code>{" "}
        surface. Default <code>&quot;none&quot;</code> renders bare (for slotting into
        a table body or an already-framed container). A real drag-and-drop
        dropzone is a separate future component — don&apos;t wire drop handlers
        onto <code>frame=&quot;dashed&quot;</code> alone.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Title renders a real heading (<code>headingLevel</code>, default{" "}
          <code>3</code>) so empty states participate in the page outline.
        </li>
        <li>
          <code>role=&quot;status&quot; aria-live=&quot;polite&quot;</code> is applied only for
          the transient variants — <code>search</code>, <code>error</code>,{" "}
          <code>offline</code> — where content changed after a user action.
          Static walls (<code>permission</code>, <code>first-use</code>) stay
          plain landmarks; announcing them on mount would be noise.
        </li>
        <li>
          The icon tile, bloom, and decorative ring are{" "}
          <code>aria-hidden</code>. Actions are real, keyboard-reachable
          buttons/links.
        </li>
        <li>
          Entrance animation uses <code>motion-safe:</code> variants — no
          motion for <code>prefers-reduced-motion</code> users, or when{" "}
          <code>animated={"{false}"}</code>.
        </li>
      </ul>
    </div>
  );
}
