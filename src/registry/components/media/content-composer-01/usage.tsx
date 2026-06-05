export default function ContentComposer01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>ContentComposer01</code> when you need a multi-step
        content-authoring surface in a CMS — one shell that composes structured
        metadata fields (<code>json-form</code>), a rich body (
        <code>article-body-01</code> / Plate or a plaintext fallback), and a
        captured/edited hero (<code>media-editor-01</code>). Each content type is
        one declarative <code>ComposerConfig</code>; adding a type is a JSON file,
        not a new component. The shell owns step navigation, the blocking gates,
        autosave, the draft → publish → schedule lifecycle, and the upload.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  ContentComposer01,
  createNewsComposerConfig,
} from "@/components/content-composer-01"

const newsConfig = createNewsComposerConfig({
  // async author loader for the author-picker field (optional)
  authorSource: (q) => fetchAuthors(q),
})

export function NewsComposer() {
  return (
    <ContentComposer01
      config={newsConfig}
      // the SHELL owns upload — pass a fn (or the uploadUrl shorthand)
      uploader={async (blob, meta) => {
        const url = await uploadToStorage(blob, meta.mimeType)
        return { url }
      }}
      onAutosave={(draft) => persistDraft(draft)}     // debounced (~800ms)
      onSaveDraft={(item) => saveContentItem(item)}   // status: "draft"
      onPublish={(item) => saveContentItem(item)}     // status: "published"
      onSchedule={(item, at) => scheduleItem(item, at)}
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Re-editing an item</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ContentComposer01
  config={newsConfig}
  initialItem={existingArticle}     // drives the inverse adapter
  initialBody={persistedBodyValue}  // body is NOT on ContentCardItem
  uploader={uploader}
  onPublish={(item) => patchContentItem(item)}
/>`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        On re-publish the adapter <em>omits</em> engagement counts (
        <code>likeCount</code>, <code>views</code>, …) — it never zeroes them — so
        your PATCH/merge preserves the real numbers.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Configs are data.</strong> Two ship: <code>news</code> (single
          hero via <code>mediaSlot</code>) and <code>post</code> (multi-media via
          <code>mediaCarouselSlot</code> → <code>media-carousel-editor-01</code> —
          drop/browse N photo+video, reorder, per-item edit). Post authoring is
          fully live; only its publish path (the <code>post-content-item</code>{" "}
          adapter + multi-blob upload-at-publish) is deferred to the v0.3 post
          backend. Adding a type is a JSON file, not a new component.
        </li>
        <li>
          <strong>Upload is lazy.</strong> The hero blob is captured when you
          leave the media step and uploaded only at save/publish/schedule — never
          stored in the draft JSON. Autosave persists the editor state + the
          uploaded URL, not the blob.
        </li>
        <li>
          <strong>Gates are blocking.</strong> Forward navigation runs each
          step&apos;s gate; backward is free. Publish/schedule re-run every gate.
          A referenced slot with no registered substrate renders a degraded
          fallback (non-blocking) instead.
        </li>
        <li>
          <strong>Draft state is a controlled triplet</strong> (
          <code>value</code> / <code>defaultValue</code> / <code>onChange</code>)
          — or stay headless with <code>useComposerState</code>.
        </li>
        <li>
          Override or extend substrates via the <code>substrates</code> prop;
          custom <code>json-form</code> fields ship as <code>tagsFieldRenderer</code>
          {" "}+ <code>authorPickerFieldRenderer</code>.
        </li>
      </ul>
    </div>
  );
}
