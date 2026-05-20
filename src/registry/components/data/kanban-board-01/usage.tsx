export default function KanbanBoard01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>KanbanBoard</code> when you need a column-based board with
        drag-and-drop reordering, optional swimlanes, optional CRUD, and the
        flexibility to host any card from this registry (or your own custom
        components) as first-class items in any column.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Key concepts</h3>
      <ul className="ml-5 list-disc space-y-1.5 text-muted-foreground">
        <li>
          <strong>Items are pure JSON.</strong> A column&apos;s <code>items[]</code>{" "}
          is an array of <code>{`{ id, rendererId, data, swimlaneId?, locked? }`}</code>{" "}
          records. The board never holds JSX in its data layer.
        </li>
        <li>
          <strong>Renderers are pluggable.</strong> Two ship built-in
          (<code>kanbanCardRenderer</code>, <code>kanbanNoteRenderer</code>);
          register more via the <code>renderers</code> prop. Each declares an{" "}
          <code>id</code> and a <code>render(data, ctx)</code>.
        </li>
        <li>
          <strong>Drag works for items and columns.</strong> Items reorder within
          a column, move across columns, and (when swimlanes are provided) move
          across swimlane cells. Column headers themselves are draggable for
          reorder.
        </li>
        <li>
          <strong>CRUD is opt-in.</strong> Pass <code>onItemCreate</code> and an
          inline &quot;+ Add&quot; row appears under each column. Same pattern for
          edit, delete, and column CRUD callbacks.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { KanbanBoard } from "@/components/kanban-board-01";
import { kanbanCardRenderer } from "@/components/kanban-board-01/parts/kanban-card";
import { kanbanNoteRenderer } from "@/components/kanban-board-01/parts/kanban-note";

export function Example() {
  return (
    <KanbanBoard
      renderers={[kanbanCardRenderer, kanbanNoteRenderer]}
      defaultData={{
        columns: [
          {
            id: "todo",
            title: "To do",
            items: [
              { id: "c1", rendererId: "kanban-card", data: { title: "Wire auth flow" } },
              { id: "n1", rendererId: "kanban-note", data: { title: "Reminder", body: "Coordinate with infra." } },
            ],
          },
          { id: "doing", title: "In progress", color: "lime", items: [] },
          { id: "done",  title: "Done",        color: "emerald", items: [], allowReorder: false },
        ],
      }}
    />
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Movement controls</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>column.allowReorder: false</code> — items cannot reorder within
          this column.
        </li>
        <li>
          <code>column.allowIncoming: false</code> — items cannot be dropped into
          this column from elsewhere.
        </li>
        <li>
          <code>column.allowOutgoing: false</code> — items cannot leave this
          column.
        </li>
        <li>
          <code>column.acceptsRendererIds: [...]</code> — only host the listed
          renderer kinds.
        </li>
        <li>
          <code>item.locked: true</code> — pin an individual item; it cannot be
          dragged anywhere.
        </li>
        <li>
          <code>readOnly</code> at the board level kills all DnD and CRUD
          affordances; items remain clickable.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Mixing rich cards (renderer adapter)</h3>
      <p className="text-muted-foreground">
        Any sibling registry component can be plugged in as a third renderer with
        all of its features intact. The demo wires <code>&lt;RichCard&gt;</code>{" "}
        from <code>@ilinxa/rich-card</code> — same pattern works for any rich
        card you author. Set <code>dragHandle: &quot;header&quot;</code> for
        renderers that own internal pointer interactions so the kanban grip
        appears on top and the body stays interactive:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { RichCard, type RichCardJsonNode } from "@ilinxa/rich-card";

function makeRichCardRenderer(
  onChange: (id: string, next: RichCardJsonNode) => void,
): KanbanCardRenderer<RichCardJsonNode> {
  return {
    id: "rich-card",
    label: "Rich card",
    dragHandle: "header",   // ← thin grip strip; body stays interactive
    render: (data, ctx) => (
      <RichCard
        key={ctx.itemId}
        defaultValue={data}
        editable
        onChange={(tree) => onChange(ctx.itemId, tree)}
      />
    ),
  };
}

<KanbanBoard
  renderers={[kanbanCardRenderer, kanbanNoteRenderer, makeRichCardRenderer(updateData)]}
  defaultData={{ /* items reference rendererId: "kanban-card" | "kanban-note" | "rich-card" */ }}
/>`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        <strong>dragHandle modes:</strong> <code>&quot;shell&quot;</code>{" "}
        (default) makes the whole card the drag activator — right for plain
        content cards. <code>&quot;header&quot;</code> renders a small grip strip
        on top and leaves the body fully interactive — right for renderers with
        click-to-edit fields, embedded inputs, or their own internal DnD.
      </p>
      <p className="mt-2 text-muted-foreground">
        <strong>Pre-built renderer — todo items:</strong>{" "}
        <code>@ilinxa/todo-rich-card</code> exports a ready-to-use{" "}
        <code>todoRichCardKanbanRenderer</code> (typed as{" "}
        <code>KanbanCardRenderer&lt;TodoItem&gt;</code>,{" "}
        <code>dragHandle: &quot;header&quot;</code>) — no factory wrapper
        needed. Drop it directly into <code>renderers={"{[...]}"}</code> and
        give each item <code>rendererId: &quot;todo-rich-card&quot;</code> with
        a <code>TodoItem</code>-shaped <code>data</code> payload. See the
        todo-rich-card detail page for the live kanban demo + the full code
        recipe.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Keyboard</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>Tab</code> cycles focus through items and column headers.
        </li>
        <li>
          <code>Space</code> on a focused item lifts it (DnD mode); arrow keys
          move; <code>Space</code> drops; <code>Escape</code> cancels.
        </li>
        <li>
          <code>Enter</code> on a focused item fires <code>onItemClick</code>.
        </li>
      </ul>
    </div>
  );
}
