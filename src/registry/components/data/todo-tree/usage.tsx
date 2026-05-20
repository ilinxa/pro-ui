export default function TodoTreeUsage() {
  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-foreground">
      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
        <p className="text-muted-foreground">
          Reach for <code>TodoTree</code> when you need a lightweight outline
          of tasks — sub-issue lists, side-panel todos, hierarchical task
          pickers. It shares the <code>TodoItem</code> schema with{" "}
          <code>@ilinxa/todo-rich-card</code>, so drags + clipboard payload
          flow between the two components automatically.
        </p>
        <p className="mt-2 text-muted-foreground">
          For time-aware urgency coloring, multi-image / multi-link rendering,
          and the full edit popup, use <code>todo-rich-card</code> directly.
          For kanban-style boards, compose{" "}
          <code>@ilinxa/kanban-board-01</code> with{" "}
          <code>todoRichCardKanbanRenderer</code> (see the todo-rich-card
          detail page).
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Scaffold status</h3>
        <p className="text-muted-foreground">
          <strong>v0.1.0 is being scaffolded across commits C1–C11</strong>{" "}
          (see the procomp plan). The current state is C1 (scaffold) —
          type catalog locked, manifest entry registered, demo placeholder
          renders. Full implementation lands across C2–C8. This usage doc
          will be expanded as each commit lands.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Locked surface (from GATE 1 + GATE 2)</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            Two-line row: chevron + status-indicator + checkbox + bold name +
            person label (top); thin truncated description (bottom).
          </li>
          <li>Recursive children, per-row collapsibility (chevron).</li>
          <li>
            Multi-select (Shift-click range + Cmd/Ctrl-click toggle + Cmd-A);
            bulk-toggle-active, bulk-remove, bulk-edit callbacks.
          </li>
          <li>
            Default toolbar with search (200ms debounce) + sort + filter
            (status / person / active).
          </li>
          <li>
            Dual DnD: <code>@dnd-kit</code> for internal drag (full touch
            support via long-press 300ms) + native HTML5 <code>dataTransfer</code>{" "}
            for cross-procomp drag with todo-rich-card (shared{" "}
            <code>application/x-ilinxa-todo+json</code> MIME).
          </li>
          <li>
            Virtualization auto-enables at ≥200 rows; suspends during drag.
          </li>
          <li>
            8 slot props (renderRow / renderName / renderDescription /
            renderPerson / renderStatusIndicator / renderToolbar /
            renderEmptyState / renderDragOverlay) — slot wins over prop
            variants.
          </li>
          <li>26-method imperative handle + headless <code>useTodoTreeState</code> hook.</li>
          <li>
            17 events, all object-args; full WAI-ARIA tree pattern with
            Delete/Backspace remove + arrow nav.
          </li>
        </ul>
      </section>
    </div>
  );
}
