# content-composer-01 — consumer guide

> Stage 3: how to *use* it. Companion to the [description](./content-composer-01-procomp-description.md) (what & why) and the [plan](./content-composer-01-procomp-plan.md) (how it's built).
>
> **Status:** v0.1.0 alpha. News config ships first; post is modeled but deferred (clamp proof). Install: `pnpm dlx shadcn@latest add @ilinxa/content-composer-01`.

---

## The mental model

`content-composer-01` is a **shell**, not a form. You give it one declarative
`ComposerConfig` (a content type) and a few callbacks; it runs the whole
authoring lifecycle:

```
ComposerConfig (steps) ──▶  ContentComposer01 shell  ──▶  ContentCardItem (via adapter)
                              │
       metadataFields ───────▶ json-form
       bodySlot       ───────▶ article-body-01 (Plate) | <Textarea>
       mediaSlot      ───────▶ media-editor-01
```

Each step names a **slot kind**; a **substrate** renders it. The three default
substrates ship; you can override them via the `substrates` prop. Adding a new
content type is a new config object — not a new component.

---

## Quick start (news)

```tsx
import {
  ContentComposer01,
  createNewsComposerConfig,
} from "@/components/content-composer-01"

const config = createNewsComposerConfig({
  authorSource: (q) => fetchAuthors(q),   // optional async author loader
})

export function NewsComposer() {
  return (
    <ContentComposer01
      config={config}
      uploader={async (blob, meta) => ({ url: await upload(blob, meta.mimeType) })}
      onAutosave={(draft) => persistDraft(draft)}
      onSaveDraft={(item) => save(item)}    // item.status === "draft"
      onPublish={(item) => save(item)}      // item.status === "published"
      onSchedule={(item, at) => schedule(item, at)}
    />
  )
}
```

The news config has five steps: **Headline** (title required) → **Cover image**
(hero, required) → **Article** (Plate body, required) → **Details** → **Visibility
& gates** (optional).

---

## The lifecycle

| Action | Gates? | What happens |
|---|---|---|
| Autosave | no | debounced (~800ms) `onAutosave(draft)` while editing; persists editor state + uploaded URL, **never the blob** |
| Save draft | no field gates | uploads the captured hero, assembles, `onSaveDraft(item)` with `status:"draft"` |
| Publish | **all** | re-runs every step gate; uploads hero; `onPublish(item)` with `status:"published"` |
| Schedule | **all** | publish + a future `publishAt`; `onSchedule(item, at)` with `status:"scheduled"` |

**Forward navigation is gated; backward is free.** A blocked gate keeps you on
the step, focuses the first field, and announces the error via a live region.

**Upload is lazy** (QP-10): the hero blob is captured when you leave the media
step and uploaded only at save/publish/schedule — it never enters the draft JSON.
Provide either `uploader: (blob, meta) => Promise<{ url }>` (primary) or the
`uploadUrl` shorthand (POSTs multipart, expects `{ url }` back).

---

## Re-editing

```tsx
<ContentComposer01
  config={config}
  initialItem={existingArticle}     // drives the inverse adapter (hero ← item.image)
  initialBody={persistedBodyValue}  // the body is NOT on ContentCardItem
  uploader={uploader}
  onPublish={(item) => patch(item)}
/>
```

On re-publish the adapter **omits** the runtime/engagement fields
(`likeCount` / `commentCount` / `shareCount` / `bookmarkCount` / `views` /
`isLiked` / `isBookmarked` / `quotedArticle`) — it never zeroes them — so your
PATCH/merge preserves the real numbers. The article body round-trips through the
separate `initialBody` leg, not through `ContentCardItem`.

---

## Draft state

Controlled triplet, like every stateful procomp:

```tsx
<ContentComposer01 config={config} value={draft} onChange={setDraft} ... />     // controlled
<ContentComposer01 config={config} defaultValue={seed} onDraftChange={...} ... /> // uncontrolled
```

`onDraftChange` fires per mutation; `onAutosave` is the debounced downstream
callback (the QP-4 split). For a fully custom shell, use the headless
`useComposerState` hook.

---

## Presentation

`presentation`: `"inline"` (default) | `"dialog"` | `"auto"`. Dialog mode needs
`isOpen` + `onClose`:

```tsx
<ContentComposer01 config={config} presentation="dialog" isOpen={open} onClose={close} ... />
```

---

## Extending

- **Override a substrate:** `substrates={{ ...DEFAULT_SUBSTRATES, metadataFields: myCustom }}`.
- **Custom json-form fields:** the shell ships `tagsFieldRenderer` (chip input)
  and `authorPickerFieldRenderer` (entity combobox). Register your own via the
  schema's `fieldRegistry` convention.
- **Escape hatches:** `renderPublishCTA(ctx)` and `renderStepChrome(ctx)`.
- **Read live state** from a custom field/slot with `useComposerStep()` /
  `useComposerContext()` (they throw outside their subtree).

---

## Adding a content type

A new type is one config + one adapter:

```ts
const eventConfig: ComposerConfig = {
  id: "event",
  adapterId: "event-content-item",   // register an adapter under this id
  steps: [ /* metadataFields | bodySlot | mediaSlot */ ],
  publishModes: ["draft", "publish", "schedule"],
}
```

The `post` config (`postComposerConfig`) is shipped as a **modeled-but-deferred**
example: it declares `mediaSources: ["upload","library"]`, and the media
substrate clamps the not-yet-supported `"library"` to upload-only at runtime (no
crash). Its backend mapping ships once `media-editor-01` v0.2 lands `"library"`.

---

## v0.1 scope notes & known limits

- **Inline body images** fall back to Plate's URL-prompt — the composer
  `uploader` is `ExportMetadata`-shaped (media-specific), so it isn't wired to
  Plate's image upload in v0.1. A dedicated body-image uploader is a v0.1.x
  follow-up.
- **Non-active step gates** check required-field presence; full json-form
  validation (pattern / custom validators) runs live on the step you're editing.
- **Publisher** and **auto-slug-from-title** are deferred (the slug is a plain
  optional field in v0.1).
- **Video re-edit restore** (blob re-attach) is deferred — news v0.1 is
  photo-only; a video config exercises that path.
- The composer imports no `next/*` — it stays portable for the future NPM
  extraction. Konva / Plate arrive (and lazy-load) through the substrate procomps.
