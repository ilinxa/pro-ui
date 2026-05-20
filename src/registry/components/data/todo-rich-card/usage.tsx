export default function TodoRichCardUsage() {
  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-foreground">
      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
        <p className="text-muted-foreground">
          Reach for <code>TodoRichCard</code> when you need a time-aware task
          surface — agent run queues, content schedules, sprint cards,
          workflow tasks. The card carries the standard task fields out of the
          box, paints urgency directly onto the chrome via the time engine, and
          is fully data-interactive (JSON I/O, clipboard, drag-drop).
        </p>
        <p className="mt-2 text-muted-foreground">
          For lightweight tree-row rendering (collapsible sub-items, inline
          checkbox, single-line description preview), reach for the sibling{" "}
          <code>todo-tree</code> procomp — shares the same{" "}
          <code>TodoItem</code> schema so drags + clipboard payload work
          cross-procomp. For kanban, use{" "}
          <code>kanban-board-01</code> + the renderer exported below.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Basic example</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
{`import { TodoRichCard } from "@/components/todo-rich-card";

export function Example() {
  return (
    <TodoRichCard
      defaultValue={{
        id: "task-001",
        name: "Review pull request #482",
        status: "in-progress",
        active: true,
        setAt: "2026-05-19T09:00:00Z",
        expireAt: "2026-05-21T17:00:00Z",
      }}
      editable
    />
  );
}`}
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Auto-color engine</h3>
        <p className="text-muted-foreground">
          The engine normalizes <code>(now − startAt) / (expireAt − startAt)</code>{" "}
          to <code>[0, 1]</code> and maps it through an OKLCH ramp — green at
          0, red at 1. Past <code>expireAt</code> pins to full red. If{" "}
          <code>expireAt</code> is absent, <code>duration</code> is used
          instead. Per-item <code>borderColor</code> overrides the engine for
          that node. Set <code>colorRamp</code> to swap presets:{" "}
          <code>&apos;default&apos; | &apos;muted&apos; | &apos;vivid&apos; |
          &apos;monochrome&apos;</code>{" "}
          — or pass a custom function for full control.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Edit modes</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <strong>editable=false</strong> (default) → click the edit button
            to open a popup with all fields in one form.
          </li>
          <li>
            <strong>editable=true</strong> → click the edit button to toggle
            inline editing on that item. A secondary &quot;Edit in dialog…&quot;
            icon and action-menu item still open the popup.
          </li>
          <li>
            <strong>locked=true</strong> on an item blocks both modes for that
            node. <code>onPermissionDenied</code> fires with{" "}
            <code>reason: &apos;locked&apos;</code>.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Collapsibility</h3>
        <p className="text-muted-foreground">
          Every card has a chevron at the left of its header. Clicking it
          collapses the card&apos;s body (description, time-info, chips, links,
          images) <em>and</em> its nested children — only the header stays
          visible. Per-item, independent at every depth. The collapse flag is
          UI-only state in the component&apos;s reducer (
          <code>collapsedIds: ReadonlySet&lt;string&gt;</code>) — it is{" "}
          <em>not</em> stored on <code>TodoItem</code>, so JSON I/O round-trips
          ignore it. Remounting via <code>key</code> resets all collapse state.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Color override (Dialog)</h3>
        <p className="text-muted-foreground">
          Click the action menu (<code>...</code>) on any card and choose{" "}
          <strong>Override color…</strong> to open a centered Dialog: 8 curated
          OKLCH palette swatches, a free-text input for any CSS color string,
          and an <strong>Auto</strong> button (with sparkle icon) that clears
          the override and hands rendering back to the time engine. Dialog (vs
          Popover) avoids an outside-click race with the action menu&apos;s
          dismissal.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">JSON I/O and clipboard</h3>
        <p className="text-muted-foreground">
          Use the imperative ref handle to <code>copy()</code>,{" "}
          <code>paste()</code>, <code>getValue()</code>, or{" "}
          <code>getTree()</code>. When a card has keyboard focus, Cmd/Ctrl+C
          copies it and Cmd/Ctrl+V pastes from the clipboard as a child. Drag
          a card onto another card&apos;s children area to drop the JSON
          payload as a child. The clipboard uses MIME{" "}
          <code>application/x-ilinxa-todo+json</code> with a{" "}
          <code>text/plain</code> JSON fallback for browsers without custom-MIME
          support.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">SSR + time engine</h3>
        <p className="text-muted-foreground">
          The engine reads <code>new Date()</code> at render time, which means
          server- and client-rendered HTML can compute slightly different
          border colors when <code>now</code> isn&apos;t frozen. The card
          mitigates this with <code>suppressHydrationWarning</code> on the
          article root — the visual flash is sub-frame and the data is
          consistent server→client. For deterministic SSR (snapshot tests,
          server-rendered HTML caching), pass a frozen <code>now</code>:{" "}
          <code>now={"{"}new Date(&quot;2026-05-20T12:00:00Z&quot;){"}"}</code>.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Composing with kanban-board-01</h3>
        <p className="text-muted-foreground">
          The package exports{" "}
          <code>todoRichCardKanbanRenderer</code> — a typed{" "}
          <code>KanbanCardRenderer&lt;TodoItem&gt;</code> with{" "}
          <code>dragHandle: &quot;header&quot;</code> so the kanban grip strip
          handles outer column reorder while the card body keeps its full edit /
          collapse / nested-DnD semantics. Drop it into the{" "}
          <code>KanbanBoard</code> <code>renderers</code> array alongside (or
          instead of) the built-in card renderers. The kanban-board demo on its
          own detail page shows mixed renderers; below is the minimum wiring.
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
{`import { KanbanBoard, kanbanCardRenderer } from "@/components/kanban-board-01";
import { todoRichCardKanbanRenderer } from "@/components/todo-rich-card";
import type { KanbanData } from "@/components/kanban-board-01";

const initial: KanbanData = {
  swimlanes: [],
  columns: [
    {
      id: "col-todo",
      title: "To do",
      color: "slate",
      items: [
        {
          id: "kanban-task-1",
          rendererId: "todo-rich-card",            // matches renderer.id
          data: {
            id: "task-001",
            name: "Review PR #482",
            status: "todo",
            active: true,
            setAt: "2026-05-19T09:00:00Z",
            expireAt: "2026-05-21T17:00:00Z",
          },
        },
      ],
    },
    { id: "col-doing", title: "In progress", color: "lime", items: [] },
    { id: "col-done",  title: "Done",        color: "emerald", items: [] },
  ],
};

export function TodoKanbanExample() {
  return (
    <KanbanBoard
      renderers={[kanbanCardRenderer, todoRichCardKanbanRenderer]}
      defaultData={initial}
      aria-label="Todo kanban"
    />
  );
}`}
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          <code>rendererId: &quot;todo-rich-card&quot;</code> on each kanban
          item must match{" "}
          <code>todoRichCardKanbanRenderer.id</code> — the board uses this to
          look up the renderer for each item. Items with no matching renderer
          show a placeholder card.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Other composition targets</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <strong>flow-canvas-01</strong> (via{" "}
            <code>todo-rich-card-in-flow</code> sibling adapter, shipping
            separately): exposes a NodeRenderer that wraps this card.
          </li>
          <li>
            <strong>todo-tree</strong> (sibling procomp, shipping separately):
            lightweight tree-row alternative that shares the same{" "}
            <code>TodoItem</code> schema and DnD payload so drags cross-procomp.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Gotchas</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            Images and links are <em>read-only</em> in inline edit mode in
            v0.1 — use the popup to add / remove them.
          </li>
          <li>
            No undo/redo in v0.1. Wire optimistic-undo yourself or wait for
            v0.2+.
          </li>
          <li>
            One item edits at a time. Opening a new edit closes any open one.
          </li>
        </ul>
      </section>
    </div>
  );
}
