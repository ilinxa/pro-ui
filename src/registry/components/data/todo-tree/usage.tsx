"use client";

export default function TodoTreeUsage() {
  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-foreground">
      <Section title="When to use">
        <p>
          <code>TodoTree</code> is the lightweight sibling to{" "}
          <code>@ilinxa/todo-rich-card</code>. Same fixed{" "}
          <code>TodoItem</code> schema, but renders a thin two-line row (bold
          name + truncated description) instead of the time-driven card chrome.
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Sub-issue / outline lists where dozens to hundreds of rows must scan quickly.</li>
          <li>Side panels next to a primary editor (file-tree-style layout).</li>
          <li>Hierarchical task pickers, often with a rich editor opening on row click.</li>
          <li>Bulk management screens (multi-select + bulk-toggle / bulk-remove).</li>
        </ul>
        <p>
          For time-aware urgency coloring or the full edit popup, use{" "}
          <code>todo-rich-card</code>. For kanban boards, compose{" "}
          <code>@ilinxa/kanban-board-01</code> with{" "}
          <code>todoRichCardKanbanRenderer</code>.
        </p>
      </Section>

      <Section title="Quick start">
        <Code>{`import { TodoTree } from "@ilinxa/todo-tree";
import type { TodoItem } from "@ilinxa/todo-rich-card";

const items: TodoItem[] = [
  {
    id: "t-1",
    name: "Ship Q3 plan",
    status: "in-progress",
    active: true,
    setAt: "2026-05-18T09:00:00Z",
    children: [
      { id: "t-1a", name: "Draft outline", status: "done", active: true, setAt: "2026-05-18T09:00:00Z" },
    ],
  },
];

<TodoTree
  defaultValue={items}
  statusOptions={[
    { value: "todo", label: "To do", variant: "outline" },
    { value: "in-progress", label: "In progress", variant: "secondary" },
    { value: "done", label: "Done", variant: "default" },
  ]}
  onChange={({ items, reason }) => save(items)}
/>`}</Code>
      </Section>

      <Section title="Controlled vs uncontrolled">
        <p>
          Both modes work; the three-defenses pattern protects controlled
          consumers from echo storms and mid-drag setState races
          (microtask-defer + structural resync guard + drag-active
          notification suppression).
        </p>
        <Code>{`// Uncontrolled
<TodoTree defaultValue={items} onChange={({ items }) => save(items)} />

// Controlled — value wins, defaultValue ignored
<TodoTree value={items} onChange={({ items }) => setItems(items)} />`}</Code>
      </Section>

      <Section title="With editor: TodoTreeWithEditor">
        <p>
          Pair the tree with a Dialog-mounted{" "}
          <code>TodoRichCard</code> in one line. Clicking a row opens the
          matching card editable; live-saves propagate back into the tree
          (Q-P1 auto-persistence).
        </p>
        <Code>{`import { TodoTreeWithEditor } from "@ilinxa/todo-tree";

<TodoTreeWithEditor
  defaultValue={items}
  statusOptions={statusOptions}
  onChange={({ items }) => save(items)}
/>`}</Code>
        <p>
          For stricter integrations (confirm dialog before edit, custom
          editor surface) compose <code>{`<TodoTree>`}</code> + your own
          dialog using the <code>onItemClick</code> callback.
        </p>
      </Section>

      <Section title="Imperative handle (26 methods)">
        <Code>{`const ref = useRef<TodoTreeHandle>(null);

// Tree state
ref.current?.getValue();
ref.current?.setValue(newItems);

// Item ops
ref.current?.addItem(item, { parentId: "t-1", index: 0 });
ref.current?.addChild("t-1", item);
ref.current?.removeItem("t-1a");
ref.current?.removeItems(["t-1a", "t-1b"]);
ref.current?.toggleActive("t-1", false);
ref.current?.toggleActiveBulk(["t-1", "t-2"], true);

// Focus + lookup
ref.current?.focusItem("t-1");
ref.current?.getItemById("t-1");

// Collapse
ref.current?.expandItem("t-1");
ref.current?.collapseItem("t-1");
ref.current?.toggleCollapse("t-1");
ref.current?.expandAll();
ref.current?.collapseAll();
ref.current?.isCollapsed("t-1");

// Selection
ref.current?.selectItem("t-1");
ref.current?.deselectItem("t-1");
ref.current?.selectRange("t-1", "t-3");
ref.current?.selectAll(); // visible only
ref.current?.clearSelection();
ref.current?.getSelectedIds();

// Toolbar state
ref.current?.setQuery("review");
ref.current?.setSort({ kind: "name", direction: "asc" });
ref.current?.setFilter({ statuses: ["done"] });
ref.current?.clearAllFilters();`}</Code>
      </Section>

      <Section title="Headless mode: useTodoTreeState">
        <p>
          The same engine that powers <code>{`<TodoTree>`}</code> is also a
          hook. Drive your own toolbar / row layout / external state manager
          off the returned value, or feed it back into the default shell
          via the <code>state</code> prop.
        </p>
        <Code>{`import { useTodoTreeState, TodoTree } from "@ilinxa/todo-tree";

function MyTree() {
  const state = useTodoTreeState({
    defaultValue: items,
    onChange: ({ items }) => save(items),
  });

  // Drive a custom search input:
  // <input value={state.query} onChange={(e) => state.setQuery(e.target.value)} />

  // OR feed back into the default shell:
  return <TodoTree state={state} />;
}`}</Code>
      </Section>

      <Section title="Slot props (8)">
        <ul className="ml-5 list-disc space-y-1">
          <li><code>renderRow</code> — full row paint; receives <code>defaultRender</code>.</li>
          <li><code>renderName</code> / <code>renderDescription</code> / <code>renderPerson</code> — per-field overrides.</li>
          <li><code>renderStatusIndicator</code> — receives the matched <code>statusOption</code>.</li>
          <li><code>renderToolbar</code> — wraps or replaces the toolbar; receives <code>defaultToolbar</code> + <code>state</code>.</li>
          <li><code>renderEmptyState</code> — replaces the default placeholder; receives <code>hasFilter</code>.</li>
          <li><code>renderDragOverlay</code> — replaces the cursor-follow visual; receives the dragged <code>item</code>.</li>
        </ul>
      </Section>

      <Section title="Keyboard map">
        <ul className="ml-5 list-disc space-y-1 font-mono text-xs">
          <li>↑ / ↓ — previous / next visible row</li>
          <li>→ — expand collapsed row OR move to first child</li>
          <li>← — collapse expanded row OR move to parent</li>
          <li>Home / End — first / last visible row</li>
          <li>Space — toggle active state of focused row</li>
          <li>Enter — select + fire <code>onItemClick</code></li>
          <li>Delete / Backspace — remove focused row</li>
          <li>Cmd/Ctrl + A — select all visible</li>
          <li>Cmd/Ctrl + Click — toggle row in selection</li>
          <li>Shift + Click — range select from anchor</li>
          <li>Escape — clear selection</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 mt-0 text-base font-semibold">{title}</h3>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}
