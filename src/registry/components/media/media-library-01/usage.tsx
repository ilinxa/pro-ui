export default function MediaLibrary01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>MediaLibrary01</code> when you need a Google-Drive-style asset
        manager — folders + files, lazy loading, drag-drop upload, drag-to-move,
        right-click menus, and rich multi-type preview. It composes the shipped viewers
        (<code>pdf-viewer</code>, <code>code-block</code>, <code>markdown-editor</code>,{" "}
        <code>video-player-01</code>) and a folder <code>file-tree</code> — you supply the
        data + the backend callbacks.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Full (batteries-included)</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { MediaLibrary01 } from "@/components/media-library-01"

export function Example() {
  return (
    <MediaLibrary01
      nodes={tree}
      storage={{ used: 12.8e9, total: 50e9 }}
      onLoadChildren={(folderId) => fetchFolder(folderId)}
      onUpload={(files, folderId, progress) => uploadToCdn(files, folderId, progress)}
      onMove={(ids, target) => moveAssets(ids, target)}
      onRename={(id, name) => renameAsset(id, name)}
      onDelete={(ids) => deleteAssets(ids)}
      onCreateFolder={(parentId, name) => createFolder(parentId, name)}
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Lighter (drop the parts you don&apos;t need)
      </h3>
      <p className="text-muted-foreground">
        Like shadcn&apos;s sidebar, every part is an export. Compose{" "}
        <code>&lt;MediaLibraryRoot&gt;</code> with only the pieces you want — omitting{" "}
        <code>&lt;MediaLibraryLightbox /&gt;</code> /{" "}
        <code>&lt;MediaLibraryDetailsPane /&gt;</code> also tree-shakes the heavy viewers
        (pdf.js / CodeMirror / marked) out of your bundle.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  MediaLibraryRoot,
  MediaLibraryBreadcrumbs,
  MediaLibraryFolderRow,
  MediaLibraryFileGrid,
} from "@/components/media-library-01"

<MediaLibraryRoot nodes={tree} onMove={moveAssets} preview={false}>
  <MediaLibraryBreadcrumbs />
  <MediaLibraryFolderRow />
  <MediaLibraryFileGrid />
</MediaLibraryRoot>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Just the preview</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { FilePreview } from "@/components/media-library-01"

// Anywhere — no library shell. Routes by MIME/extension to the right viewer.
<FilePreview node={{ id: "1", name: "readme.md", type: "file",
  mimeType: "text/markdown", url: "/files/readme.md" }} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Data:</strong> nodes are <code>MediaNode</code> (a superset of the shared{" "}
          <code>FsNode</code>) — give files a <code>url</code> + <code>mimeType</code> for
          preview, and <code>width</code>/<code>height</code> for the dimension badge.
        </li>
        <li>
          <strong>Text preview</strong> (code / JSON / txt / Markdown) is fetched from the
          node&apos;s <code>url</code>; pass <code>resolveTextContent</code> for auth /
          signed URLs.
        </li>
        <li>
          <strong>Capabilities are opt-in:</strong> omit <code>onUpload</code> /{" "}
          <code>onMove</code> / <code>onDelete</code> / <code>onRename</code> /{" "}
          <code>onCreateFolder</code> and the matching buttons, menu items, and dnd
          disappear (read-only gallery).
        </li>
        <li>
          <strong>Uploads</strong> call <code>onUpload</code> once per file; report that
          file&apos;s percent via the <code>progress</code> callback and resolve with the
          real <code>MediaNode[]</code>.
        </li>
        <li>Cut → paste-into-folder moves items; copy/duplicate is deferred to v0.2.</li>
      </ul>
    </div>
  );
}
