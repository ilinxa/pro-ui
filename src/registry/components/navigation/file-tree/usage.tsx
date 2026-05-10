export default function FileTreeUsage() {
  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-foreground">
      <section>
        <h3 className="mb-2 text-base font-semibold">When to use</h3>
        <p className="text-muted-foreground">
          <code>FileTree</code> is a vertical, expand-collapse tree for
          hierarchical content — file system, project structure, schema
          namespace, asset library. Reach for it whenever your sidebar (or
          picker dialog, or schema browser) needs the VS Code shape: chevrons,
          format-aware icons, keyboard nav, optional CRUD. Pair it with{" "}
          <code>folder-manager</code> as the dual-pane Finder layout.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Data shape</h3>
        <p className="text-muted-foreground">
          The component is fully controlled — consumer owns the{" "}
          <code>nodes</code> array, mutations happen via callbacks, consumer
          updates state. <code>children</code> has three semantically distinct
          values: <code>undefined</code> = not yet loaded (triggers{" "}
          <code>onLoadChildren</code>), <code>[]</code> = known-empty,{" "}
          <code>FsNode[]</code> = pre-loaded.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`type FsNode = {
  id: string;            // stable across renders
  name: string;          // displayed label
  type: "file" | "folder";
  parentId?: string | null;
  children?: FsNode[];   // undefined | [] | FsNode[]
  ext?: string;          // explicit extension (else derived from name)
  size?: number;
  modifiedAt?: string;
  icon?: ReactNode;      // pre-rendered override
  meta?: Record<string, unknown>;
}`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Lazy loading</h3>
        <p className="text-muted-foreground">
          Provide <code>onLoadChildren</code> for folders whose children
          aren&apos;t pre-fetched. The hook sets <code>loadingFolderIds</code>{" "}
          while the promise pends and shows the inline spinner; when it
          resolves, you splice the new children into <code>nodes</code>{" "}
          (we export <code>mergeLoadedChildren()</code> to do the immutable
          splice).
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import { mergeLoadedChildren } from "./file-tree"

<FileTree
  nodes={nodes}
  onLoadChildren={async ({ nodeId }) => {
    const kids = await fs.list(nodeId);
    setNodes((prev) => mergeLoadedChildren(prev, nodeId, kids));
    return kids;
  }}
/>`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Selection + keyboard</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <strong>Single</strong> by default;{" "}
            <code>selectionMode=&quot;multi&quot;</code> for Cmd/Ctrl+click
            toggle and Shift+click range.
          </li>
          <li>
            <strong>↑ / ↓</strong> moves focus among visible rows;{" "}
            <strong>→ / ←</strong> expands/collapses or moves into/out of a
            folder.
          </li>
          <li>
            <strong>Enter</strong> opens a file (<code>onOpen</code>) or
            toggles a folder; <strong>Space</strong> toggles selection;{" "}
            <strong>F2</strong> renames; <strong>Delete</strong> deletes (with
            confirm); <strong>Cmd/Ctrl+A</strong> selects all visible rows;{" "}
            <strong>Esc</strong> clears selection.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Drag-and-drop</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <strong>Within the tree</strong>: drag a row onto a folder
            (drop indicator = ring) or above/below another row (line). Cycle
            and self-drop are pre-validated — <code>onMove</code> only fires
            for legal drops. Name-collision is your call (handle it inside
            <code>onMove</code>).
          </li>
          <li>
            <strong>From the desktop</strong>: drop OS files onto the tree to
            fire <code>onExternalDrop</code>. Wire your upload flow there.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Custom chrome</h3>
        <p className="text-muted-foreground">
          Replace the default header wholesale via <code>renderHeader</code>{" "}
          (which gets a typed context with <code>actions</code> and the same
          flags), or compose subsets using the standalone parts:{" "}
          <code>FileTreeHeader</code>, <code>FileTreeNewFileButton</code>,{" "}
          <code>FileTreeNewFolderButton</code>,{" "}
          <code>FileTreeRefreshButton</code>,{" "}
          <code>FileTreeCollapseAllButton</code>. They read from{" "}
          <code>useFileTree()</code>.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Gotchas</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <code>onMove</code> fires after structural validation but before
            you&apos;ve updated <code>nodes</code> — you must apply the move
            yourself.
          </li>
          <li>
            <code>onLoadChildren</code> rejection shows an inline error row +
            retry button under the folder. Throw a real <code>Error</code> with
            a useful message.
          </li>
          <li>
            Cut / copy / paste are <strong>not</strong> in v0.1.0 — they land
            with <code>folder-manager</code> via a shared clipboard. Use
            drag-to-move and right-click delete in the meantime.
          </li>
          <li>
            <code>showHidden</code> defaults to <code>false</code>; nodes whose
            name starts with <code>.</code> are filtered. Override with{" "}
            <code>isHidden</code> for app-specific rules.
          </li>
        </ul>
      </section>
    </div>
  );
}
