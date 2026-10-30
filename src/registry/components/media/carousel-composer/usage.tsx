export default function CarouselComposerUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>CarouselComposer</code> when an author needs to
        assemble <strong>one or more</strong> media items into an ordered set —
        an Instagram-style feed post, an album, a product gallery, or chat
        attachments. It mixes photos and videos in a single rail, reorders by
        drag-and-drop, and can edit images through the optional editing
        add-on. For a single hero image/video, use <code>media-editor</code>{" "}
        directly; to <em>display</em> a finished set, use{" "}
        <code>media-carousel</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { CarouselComposer, PLATFORM_SAFE_MIME, type MediaCarouselItem } from "@/components/carousel-composer";

export function PostMedia() {
  const [items, setItems] = React.useState<MediaCarouselItem[]>([]);
  return (
    <CarouselComposer
      value={items}
      onChange={setItems}
      maxItems={10}
      acceptMime={PLATFORM_SAFE_MIME} // no WebM
      maxVideoSeconds={60}
      enableAltText
    />
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Image editing (add-on)</h3>
      <p className="text-muted-foreground">
        Editing is a separate registry item, so a plain install pulls no
        media-editor or Konva. Install{" "}
        <code>@ilinxa/carousel-composer-editing</code> and pass it in; without
        it there is no Edit button. <code>canEditItem</code> decides per item
        (videos are never edited — their output is the original file).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { carouselEditing, type CarouselEditorProps } from "@/components/carousel-composer/features/editing";

const editorProps: CarouselEditorProps = { enabledTools: ["crop", "filters", "adjust"] };

<CarouselComposer
  value={items}
  onChange={setItems}
  editing={carouselEditing}
  editorProps={editorProps}
  canEditItem={(item) => item.status !== "uploading"}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">One shared aspect, any ratio</h3>
      <p className="text-muted-foreground">
        Every item shares the carousel&apos;s aspect — the preview, the rail
        thumbs, the edit panel and an edit&apos;s export follow it.{" "}
        <code>aspectOptions</code> shows a switch while item 1 is selected;{" "}
        <code>enablePan</code> lets the author drag a photo inside the frame
        (its <code>cropOffset</code>); <code>export()</code> gives each image
        the <code>crop</code> for the aspect — centred unless panned — so every
        item can be uploaded at it.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<CarouselComposer
  value={items}
  onChange={setItems}
  aspect={aspect}                 // "original" | "1:1" | "4:5" | "1.91:1" | any "W:H" | "auto" | "free"
  onAspectChange={setAspect}
  aspectOptions={["original", "1:1", "4:5", "1.91:1"]}
  enablePan                       // drag / arrow keys move the item's cropOffset
  enableAltText="all"             // videos get a description too
  reorderButtons                  // move earlier / later, shown on hover or focus
  onEditingChange={setEditing}    // keep your dialog open while editing
  editing={carouselEditing}
/>

const items = await ref.current.export(); // each image: crop = { x, y, width, height }
ref.current.moveItem(id, 1);              // the same move without UI`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Upload status</h3>
      <p className="text-muted-foreground">
        Upload on add and write the state onto the item — the carousel shows a
        progress indicator, the error with a Retry, and announces each status
        change politely. Controlled hosts set it in <code>value</code>;
        uncontrolled hosts call <code>ref.current.updateItem(id, patch)</code>.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const patch = (id, p) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));

async function upload(item) {
  patch(item.id, { status: "uploading", progress: 0, error: undefined });
  try {
    const { url } = await api.upload(item.blob, { onProgress: (progress) => patch(item.id, { progress }) });
    patch(item.id, { status: "uploaded", url });
  } catch (e) {
    patch(item.id, { status: "error", error: e.message });
  }
}

<CarouselComposer value={items} onChange={setItems} onItemAdd={upload} onRetry={upload} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Labels and locale</h3>
      <p className="text-muted-foreground">
        Every string is in <code>labels</code>; strings that carry a value are
        functions. <code>errors</code> and <code>drag</code> merge key by key.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<CarouselComposer
  locale="tr"
  labels={{
    dropzoneTitle: "Fotoğraf ve videoları buraya sürükleyin",
    dropzoneHint: (max) => \`veya en fazla \${max} dosya bırakın\`,
    maxReached: (max) => \`En fazla \${max} öğe eklenebilir\`,
    itemAria: ({ position, total, kind }) => \`\${total} öğeden \${position}., \${kind === "video" ? "video" : "fotoğraf"}\`,
    errors: { videoTooLong: ({ maxSeconds }) => \`Video en fazla \${maxSeconds} sn olabilir.\` },
  }}
/>`}</code>
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
      <ul className="ms-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Intake is file-based — the file&apos;s MIME type decides{" "}
          <code>image</code> vs <code>video</code>, so there are no photo/video
          capture tabs. <code>&quot;library&quot;</code> in{" "}
          <code>sources</code> is ignored.
        </li>
        <li>
          All items share one aspect (Instagram behaviour). <code>aspect</code>{" "}
          defaults to <code>&quot;auto&quot;</code> (derived from item 1);
          override with a fixed <code>CarouselAspectRatio</code>.
        </li>
        <li>
          A video gets a JPEG poster frame (<code>posterAt</code>, default
          0.5 s; <code>false</code> for none) and a duration badge; the video
          itself is never re-encoded.
        </li>
        <li>
          Object URLs created during intake / edit (items and posters) are
          revoked on remove, replace, reset, and unmount.
        </li>
      </ul>
    </div>
  );
}
