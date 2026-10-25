export default function StoryComposerUsage() {
  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-foreground">
      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
        <p className="text-muted-foreground">
          <code>StoryComposer</code> is the creation surface for
          Instagram-style stories: pick (or capture) media, edit it on a 9:16
          canvas, publish. It composes with <code>StoryRail</code> (discovery)
          and <code>StoryViewer</code> (consumption) but doesn&apos;t depend on
          them. It wraps <code>MediaEditor</code>.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Quick start</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import { useState } from "react"
import { StoryComposer } from "@/components/story-composer"

export function Example() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>Create story</button>
      <StoryComposer
        isOpen={open}
        onClose={() => setOpen(false)}
        uploadUrl="/api/stories/upload"
        onPublished={(story, result) => {
          // result = exactly what your upload returned
          setOpen(false)
        }}
      />
    </>
  )
}`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Camera (opt-in)</h3>
        <p className="text-muted-foreground">
          The default install is upload-only — no camera code and no{" "}
          <code>getUserMedia</code>. To add the camera, install{" "}
          <code>@ilinxa/media-editor-capture</code> and pass it in:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import { mediaCapture } from "@/components/media-editor/features/capture"

<StoryComposer capture={mediaCapture} … />`}</code>
        </pre>
        <p className="mt-2 text-muted-foreground">
          <code>acceptMediaTypes</code> limits what can be picked;{" "}
          <code>videoOutput={'{{ mimeTypes: ["video/mp4"] }}'}</code> limits
          what is recorded or re-encoded. An unedited video is uploaded as the
          original file.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Modes and tools</h3>
        <ul className="ms-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <strong>Photo</strong> / <strong>Video</strong> — pick (or capture)
            then edit with Text / Draw / Stickers / Filters / Adjust. Crop is
            opt-in via <code>enabledTools</code>. Videos are not edited: a video
            draft has no tool chips and uploads as the original file.
          </li>
          <li>
            <strong>Text</strong> — gradient background + centred text; PNG on
            publish.
          </li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          Hide modes with <code>hideModes={'{["video","text"]}'}</code>.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Publish</h3>
        <ul className="ms-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <code>uploadUrl</code> — POSTs FormData (<code>file</code>,{" "}
            <code>metadata</code>, <code>uploadFields</code>, caption and your
            fields) with progress.
          </li>
          <li>
            <code>uploader={"{async (blob, meta, fields) => …}"}</code> — your
            own upload (signed URLs etc.); return at least{" "}
            <code>{"{ url }"}</code>.
          </li>
          <li>
            <code>caption</code> / <code>renderPublishFields</code> — Publish
            opens a details step first; <code>canPublish(fields)</code> gates
            it.
          </li>
          <li>
            On failure: Retry, or Cancel back to the editor with the draft
            intact; <code>getErrorMessage</code> sets the message.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Imperative handle</h3>
        <p className="text-muted-foreground">
          <code>publish</code>, <code>exportBlob</code>, <code>reset</code>,{" "}
          <code>close</code>, <code>addText</code>, <code>addSticker</code>,{" "}
          <code>setAdjustments</code>, <code>applyFilter</code>. The capture
          methods and <code>open</code> are not implemented (they warn in
          development) — use <code>isOpen</code> and the in-UI controls.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">More</h3>
        <p className="text-muted-foreground">
          Full reference, labels, and the 0.5 → 0.6 migration table live in{" "}
          <code>docs/procomps/story-composer-procomp/story-composer-procomp-guide.md</code>.
        </p>
      </section>
    </div>
  );
}
