export default function CarouselComposerUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>CarouselComposer</code> when an author needs to
        assemble <strong>one or more</strong> media items into an ordered set —
        an Instagram-style feed post, an album, a product gallery, or chat
        attachments. It mixes photos and videos in a single rail, reorders by
        drag-and-drop, and edits any item through a shared{" "}
        <code>media-editor</code> panel. For a single hero image/video, use{" "}
        <code>media-editor</code> directly; to <em>display</em> a finished
        set, use <code>media-carousel</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { CarouselComposer } from "@/components/carousel-composer"

export function PostMedia() {
  const [items, setItems] = React.useState([])
  return (
    <CarouselComposer
      value={items}
      onChange={setItems}
      maxItems={10}
      editorProps={{ enabledTools: ["crop", "filters", "adjust"] }}
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Pull-only export</h3>
      <p className="text-muted-foreground">
        Edits flatten into each item on <em>Done</em>, so the rail and preview
        always show publish-ready media. Call{" "}
        <code>ref.current.export()</code> at publish time to get the committed
        ordered array (an open, unapplied edit is excluded — gate your publish
        button while editing).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Intake is file-based — the file&apos;s MIME type decides{" "}
          <code>image</code> vs <code>video</code>, so there are no photo/video
          capture tabs.
        </li>
        <li>
          All items share one aspect (Instagram behaviour). <code>aspect</code>{" "}
          defaults to <code>&quot;auto&quot;</code> (derived from item 1);
          override with a fixed <code>AspectRatio</code>.
        </li>
        <li>
          Editing mounts a single <code>media-editor</code> instance, loaded
          serially per item — never N at once.
        </li>
        <li>
          v0.1: video items support preview / reorder / remove; full video
          editing tracks media-editor maturity. <code>&quot;library&quot;</code>{" "}
          source is clamped to upload-only.
        </li>
        <li>
          Object URLs created during intake/edit are revoked on remove, replace,
          reset, and unmount.
        </li>
      </ul>
    </div>
  );
}
