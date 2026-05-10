export default function FileManagerUsage() {
  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-foreground">
      <section>
        <h3 className="mb-2 text-base font-semibold">When to use</h3>
        <p className="text-muted-foreground">
          <code>FileManager</code> is the Mac-Finder content pane: a grid /
          list view of the current folder with multi-select, cut / copy /
          paste, drag-and-drop, sort, and view-mode switching. Pair it with{" "}
          <code>file-tree</code> in the <code>sidebar</code> slot for the
          dual-pane Finder layout. Standalone use is also supported.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Data shape</h3>
        <p className="text-muted-foreground">
          Same <code>FsNode</code> shape as <code>file-tree</code> — id /
          name / type / parentId / children / ext / size / modifiedAt / icon
          / meta. Consumer owns <code>nodes</code> and{" "}
          <code>currentFolderId</code>; manager fires object-shape callbacks
          on every operation.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Shared clipboard</h3>
        <p className="text-muted-foreground">
          Wrap one or more <code>&lt;FileManager&gt;</code> instances in{" "}
          <code>&lt;FileClipboardProvider&gt;</code> to sync cut / copy /
          paste across instances. Without a provider, each manager keeps its
          own internal clipboard. Controlled mode: pass{" "}
          <code>clipboard</code> + <code>onClipboardChange</code>.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import { FileManager, FileClipboardProvider } from "@/components/file-manager"

<FileClipboardProvider>
  <FileManager nodes={nodes} sidebar={<FileTree nodes={nodes} />} />
</FileClipboardProvider>`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Lazy loading</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import { mergeLoadedChildren } from "@/components/file-manager"

<FileManager
  nodes={nodes}
  currentFolderId={current}
  onCurrentFolderChange={({ folderId }) => setCurrent(folderId)}
  onLoadChildren={async ({ nodeId }) => {
    const kids = await fs.list(nodeId);
    setNodes((prev) => mergeLoadedChildren(prev, nodeId, kids));
    return kids;
  }}
/>`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Keyboard map</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <strong>Arrow keys</strong> move focus (2-D nav in grid mode,
            up/down only in list mode).
          </li>
          <li>
            <strong>Enter</strong> opens a file (<code>onOpen</code>) or
            navigates into a folder.
          </li>
          <li>
            <strong>Backspace</strong> deletes selected items (with confirm),
            or navigates up to parent if no selection.
          </li>
          <li>
            <strong>F2</strong> renames; <strong>Delete</strong> deletes;{" "}
            <strong>Esc</strong> clears selection or cancels rename.
          </li>
          <li>
            <strong>Cmd/Ctrl+X / C / V</strong> cut / copy / paste;{" "}
            <strong>Cmd/Ctrl+A</strong> select all visible.
          </li>
          <li>
            <strong>Cmd/Ctrl+[</strong> back; <strong>Cmd/Ctrl+]</strong>{" "}
            forward.
          </li>
          <li>
            <strong>Type-ahead</strong>: typing letters jumps focus to the
            first matching item name (resets after 800ms).
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Drag-and-drop</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <strong>Within the manager</strong>: drag selected items onto a
            folder. Cycle / self-drop refused; <strong>drops on files are
            rejected</strong> (only folders are valid targets).
          </li>
          <li>
            <strong>From the desktop</strong>: drop OS files onto the manager
            to fire <code>onExternalDrop</code>. <code>targetFolderId</code>{" "}
            is the folder the user dropped on, or the current folder
            otherwise.
          </li>
          <li>
            <strong>Marquee selection</strong>: drag a rectangle on empty
            space to select multiple items. Shift+drag adds to existing
            selection.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Custom chrome</h3>
        <p className="text-muted-foreground">
          Replace the toolbar via <code>renderToolbar</code> (typed context),
          or compose the standalone parts: <code>FileManagerToolbar</code>,
          <code>FileManagerPathBar</code>, <code>FileManagerViewToggle</code>,
          <code>FileManagerIconSizeControl</code>,{" "}
          <code>FileManagerSortMenu</code>,{" "}
          <code>FileManagerSearchInput</code>,{" "}
          <code>FileManagerStatusBar</code>. They read from{" "}
          <code>useFileManager()</code>.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Gotchas</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            Drops on files are rejected; only folders accept drops. Drops on
            empty whitespace are no-ops for internal drag, upload-to-current
            for external drag.
          </li>
          <li>
            Selection clears on navigate by default. Set{" "}
            <code>preserveSelectionOnNavigate=&#123;true&#125;</code> to keep
            it.
          </li>
          <li>
            Cut / copy / paste require <code>onPaste</code> wired. Without a
            paste handler, the manager fires <code>onClipboardChange</code>{" "}
            but paste does nothing.
          </li>
          <li>
            <strong>Dragging files OUT to the desktop</strong> is not
            supported in v0.1.0. Add a Download button via{" "}
            <code>renderContextMenu</code> or the toolbar overflow.
          </li>
          <li>
            List-view virtualizes at <code>virtualizeThreshold</code> items
            (default 200). Grid view does NOT virtualize at v0.1.0.
          </li>
        </ul>
      </section>
    </div>
  );
}
