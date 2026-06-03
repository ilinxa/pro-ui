export default function StoryComposer01Usage() {
  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-foreground">
      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
        <p className="text-muted-foreground">
          <code>StoryComposer01</code> is the creation surface for
          Instagram-style stories. It composes with{" "}
          <code>StoryRail01</code> (discovery) and{" "}
          <code>StoryViewer01</code> (consumption) to form the full story
          system, but doesn't depend on them. Use it whenever you need
          camera-first capture + on-canvas editing + one-tap publish.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Quick start</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import { useState } from "react"
import { StoryComposer01 } from "@/components/story-composer-01"

export function Example() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>Create story</button>
      <StoryComposer01
        isOpen={open}
        onClose={() => setOpen(false)}
        uploadUrl="/api/stories/upload"
        onPublished={(story) => {
          // story.items[0].src = the uploaded media URL
          console.log("uploaded:", story)
          setOpen(false)
        }}
      />
    </>
  )
}`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Capture modes</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <strong>Photo</strong> — camera tap → instant editor with the
            default toolbar (Text / Draw / Stickers / Filters / Adjust). Crop
            is opt-in via{" "}
            <code>enabledTools={'{[…, "crop"]}'}</code> — stories are 9:16-locked,
            so default flows don't need it.
          </li>
          <li>
            <strong>Video</strong> — long-press hold OR tap-to-toggle shutter.
            Auto-stop at <code>maxVideoDuration</code> (default 30s). Edit
            stage shows a two-handle trim bar; overlays bake into the final
            video on publish.
          </li>
          <li>
            <strong>Text</strong> — 8 gradient backgrounds + centered text +
            font + color picker. Renders to PNG on publish.
          </li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          Hide modes you don't want via{" "}
          <code>hideModes={'{["video","text"]}'}</code>.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Publish</h3>
        <p className="text-muted-foreground">
          Two paths — pick one:
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <code>uploadUrl="/api/upload"</code> — composer POSTs FormData
            ({"{ file, metadata }"}) with progress events.
          </li>
          <li>
            <code>uploader={"{async (blob, meta) => …}"}</code> — custom
            uploader for signed-URL flows (S3 PUT, Cloudinary, Mux). Must
            return <code>{"{ url, thumbnailUrl? }"}</code>.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Pan + zoom</h3>
        <p className="text-muted-foreground">
          Drag (single pointer — mouse or 1 finger) to pan; a drag that starts
          on a text/sticker overlay moves that overlay instead, and a tap never
          pans. Zoom 1× → 4× via 2-finger pinch (touch) or mouse wheel anchored
          to the cursor (desktop — native non-passive, beats the
          browser&apos;s Ctrl+wheel page-zoom). Arrow keys pan in the arrow
          direction; <code>+</code> / <code>-</code> / <code>0</code> zoom in /
          out / reset. Disabled while drawing or cropping.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Imperative handle</h3>
        <p className="text-muted-foreground">
          Pass a <code>ref</code> to drive the composer programmatically:{" "}
          <code>takePhoto</code>, <code>switchCamera</code>,{" "}
          <code>startRecording</code>, <code>addText</code>,{" "}
          <code>addSticker</code>, <code>applyFilter</code>,{" "}
          <code>publish</code>, <code>exportBlob</code>, and more (14
          methods total).
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">More</h3>
        <p className="text-muted-foreground">
          Full reference + slot extension points + accessibility notes live
          in <code>docs/procomps/story-composer-01-procomp/story-composer-01-procomp-guide.md</code>.
        </p>
      </section>
    </div>
  );
}
