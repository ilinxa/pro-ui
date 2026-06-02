export default function MediaEditor01Usage() {
  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-foreground">
      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
        <p className="text-muted-foreground">
          <code>MediaEditor01</code> is the reusable capture + edit surface
          underneath <code>StoryComposer01</code>. Reach for it directly
          when you need an Instagram-style editor for a non-story context —
          a CMS hero re-edit, a chat attachment editor, the second step of
          a multi-step content composer. Four capability dials
          (<code>enabledModes</code> / <code>enabledTools</code> /{" "}
          <code>mediaSources</code> / <code>aspect</code>) plus
          inline/dialog presentation let you pull as little or as much
          editor surface as your context needs. Story-composer-01 is a thin
          wrapper around this in v0.2.0.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Quick start</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import { useRef, useState } from "react"
import { MediaEditor01, type MediaEditor01Handle } from "@/components/media-editor-01"

export function Example() {
  const editorRef = useRef<MediaEditor01Handle>(null)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>Edit photo</button>
      <MediaEditor01
        ref={editorRef}
        aspect="9:16"
        presentation="dialog"
        isOpen={open}
        onClose={() => setOpen(false)}
        enabledModes={["photo", "video"]}
      />
    </>
  )
}`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Capability dials</h3>
        <p className="text-muted-foreground">
          Four orthogonal props that gate the editor surface. Defaults are
          the maximal configuration.
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <code>enabledModes</code> — array of{" "}
            <code>&quot;photo&quot;</code> / <code>&quot;video&quot;</code>{" "}
            / <code>&quot;text&quot;</code>. Empty array = no capture
            surface (pure-edit; pair with <code>initialSource</code>).
          </li>
          <li>
            <code>enabledTools</code> — array of{" "}
            <code>&quot;text&quot;</code> / <code>&quot;draw&quot;</code> /{" "}
            <code>&quot;stickers&quot;</code> /{" "}
            <code>&quot;filters&quot;</code> /{" "}
            <code>&quot;adjust&quot;</code> / <code>&quot;crop&quot;</code>.
            Filters the toolbar and skips the corresponding layer at export.
          </li>
          <li>
            <code>mediaSources</code> — array of{" "}
            <code>&quot;camera&quot;</code> / <code>&quot;upload&quot;</code>
            . Without camera you get an upload-only dropzone.
          </li>
          <li>
            <code>aspect</code> — <code>&quot;9:16&quot;</code> /{" "}
            <code>&quot;1:1&quot;</code> / <code>&quot;16:9&quot;</code> /{" "}
            <code>&quot;4:5&quot;</code> / <code>&quot;free&quot;</code>.
            Locks the canvas aspect ratio and the default crop choice.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">
          Initial source (CMS re-edit / draft restore)
        </h3>
        <p className="text-muted-foreground">
          Pass <code>initialSource</code> to skip the capture surface and
          land directly in the edit canvas with the source pre-loaded.
          Three accepted shapes:
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <code>{`{ kind: "url", url, mode }`}</code> — editor{" "}
            <code>fetch()</code>es the URL. Same-origin or CORS-friendly
            only; CORS failure surfaces via{" "}
            <code>onInitialSourceError</code> as{" "}
            <code>{`{ kind: "cors" }`}</code>.
          </li>
          <li>
            <code>{`{ kind: "blob", blob, mode }`}</code> — consumer-owned
            blob. Escape hatch for non-CORS URLs (pre-fetch on the server,
            pass the Blob through).
          </li>
          <li>
            <code>{`{ kind: "file", file }`}</code> — mode auto-detected
            from <code>file.type</code> (<code>image/*</code> → photo,{" "}
            <code>video/*</code> → video; anything else fires{" "}
            <code>{`{ kind: "unsupported-file-type" }`}</code>).
          </li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          The resolved mode must be a member of <code>enabledModes</code>;
          a mismatch fires{" "}
          <code>{`{ kind: "mode-not-enabled" }`}</code>.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">
          Presentation: inline / dialog / auto
        </h3>
        <p className="text-muted-foreground">
          <code>inline</code> renders bare in the parent layout — used by
          step-2-of-multi-step composers and CMS hero editors.{" "}
          <code>dialog</code> wraps in shadcn dialog (mobile-fullscreen /
          desktop-modal sized by aspect) — used by story-composer-01,
          chat-panel.
        </p>
        <p className="mt-2 text-muted-foreground">
          <code>auto</code> picks <code>inline</code> when{" "}
          <code>enabledModes</code> is empty (pure-edit context, no capture
          chrome to manage), otherwise <code>dialog</code>. Dialog mode
          requires <code>isOpen</code> + <code>onClose</code> — a dev-only
          console.error fires if either is missing.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Export</h3>
        <p className="text-muted-foreground">
          Call the imperative handle from your publish flow. Each method
          returns <code>{`{ blob, metadata }`}</code>.
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`// Photo / text-mode → image. Default: image/jpeg, quality 0.9.
const { blob, metadata } = await editorRef.current.exportImage({
  format: "image/jpeg",        // or "image/png" | "image/webp"
  quality: 0.9,
  onProgress: (p) => …,        // fires (0) at start, (1) on completion
})

// Video — perf-shortcut returns the raw blob when no overlays have
// been added; otherwise re-encodes through MediaRecorder with the
// Konva overlay baked in per frame.
const out = await editorRef.current.exportVideo({
  onProgress: (p) => …,        // ~10 ticks across the re-encode
})

// Polymorphic — dispatches on the current mode.
const out = await editorRef.current.export()`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Imperative handle</h3>
        <p className="text-muted-foreground">
          22 methods total — inspect (<code>getIsDirty</code>,{" "}
          <code>getMode</code>, <code>getState</code>,{" "}
          <code>loadState</code>), capture (<code>switchCamera</code>,{" "}
          <code>takePhoto</code>, <code>startRecording</code>,{" "}
          <code>stopRecording</code>, <code>importFromGallery</code>), edit
          (<code>addText</code>, <code>addSticker</code>,{" "}
          <code>setAdjustments</code>, <code>applyFilter</code>,{" "}
          <code>clearLayer</code>, <code>undo</code>, <code>redo</code>),
          export (<code>exportImage</code>, <code>exportVideo</code>,{" "}
          <code>export</code>), and lifecycle (<code>reset</code>,{" "}
          <code>open</code>, <code>close</code>).
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">More</h3>
        <p className="text-muted-foreground">
          Full reference, accessibility notes, and integration patterns
          live in{" "}
          <code>
            docs/procomps/media-editor-01-procomp/media-editor-01-procomp-guide.md
          </code>{" "}
          (lands at C15).
        </p>
      </section>
    </div>
  );
}
