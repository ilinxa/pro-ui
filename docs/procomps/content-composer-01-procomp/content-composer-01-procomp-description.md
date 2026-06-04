# content-composer-01 — procomp description

> Stage 1: what & why.
>
> **Greenfield — no source app, no migration intake.** There is no app to port from (confirmed). This is a new shell procomp authored against three already-shipped substrates: `json-form`, `article-body-01` (Plate), and `media-editor-01` (the recently-extracted Konva capture+edit surface, v0.1.2). It generalizes the "controllable surface area via orthogonal capability dials" pattern that `media-editor-01` proved at the editor level, lifting it to a **per-content-type JSON config**.
>
> Migration origin: n/a — greenfield.

## Problem

Every content type in a CMS — a news article, a social post, an event, a project — is authored through a *different ad-hoc flow*: a different set of fields, a different body editor, a different hero-image surface, a different publish gate, a different draft/autosave story. The flows drift. Each one re-implements step navigation, dirty tracking, autosave, validation gates, and a draft→publish→schedule lifecycle from scratch, slightly differently, with slightly different bugs.

The three editing *surfaces* are already solved as library procomps:

- structured fields → `json-form` (declarative `FormSchema` → Zod → RHF)
- rich body text → `article-body-01` (Plate WYSIWYG, JSON value)
- hero/cover media → `media-editor-01` (capture + on-canvas edit + export)

What is **not** solved is the **shell** that composes them: the thing that owns *how a draft moves from blank to published*, mounts the right surfaces in the right order per content type, gates progression on validation, autosaves, and assembles the collected data into a backend item. Building one bespoke shell per content type is the drift trap. Building one configurable shell — where **a new content type is one JSON file, not one new component** — is the fix.

That is `content-composer-01`: a **single procomp shell** that mounts three substrate slots per step, driven entirely by a JSON config, with cross-cutting lifecycle owned centrally.

Concrete consumer scenarios (driving the config model — **illustrative, not prescriptive**: the matrix maps known intent at description time; final per-config choices are locked in each content type's own JSON config):

| Consumer scenario | Modes | Tools | Aspect | Source | Presentation |
|---|---|---|---|---|---|
| news hero | photo | crop / filters / adjust | 16:9 locked | upload only | inline (step 2) |
| post hero | photo | crop / filters / adjust / text / stickers | 1:1 locked | upload + library | inline |
| event cover | photo | crop / filters / adjust | 16:9 or 4:5 | upload | inline |

Each row is **one JSON composer config** that the shell loads. The divergence between rows is **data, not code** — different dial values, different tool arrays, different aspect, a different metadata-step set. The shell has zero per-content-type branches. `news` ships first (it needs **zero** `media-editor-01` changes); `post` is modeled now but **blocked on `media-editor-01` v0.2's `"library"` source** and ships as a follow-on JSON file.

**Target consumers.** The direct integrator is the wrapping CMS **pro-page** (e.g. `news-editor-page-01`) inside `cms-panel-01` entity-CRUD routes — that page owns the route, auth, data hooks, and permission gates, and mounts this shell at its editor region. End users are **CMS authors**. The shell is **never** mounted by an app route directly.

## Substrate decisions (locked, not re-litigated)

| Concern | Choice | Source / precedent |
|---|---|---|
| Structured-field slot (`metadataFields`) | `json-form` — declarative `FormSchema` fragment per step → Zod → RHF | `src/registry/components/forms/json-form/` (`FieldDefinition`/`FormSchema`, `types.ts`) |
| Rich-body slot (`bodySlot`) | `article-body-01` `<ArticleBodyEditor>` (Plate); plaintext fallback = shadcn `<Textarea>` | `src/registry/components/data/article-body-01/` v0.2.2 (alpha, **already shipped**) |
| Media slot (`mediaSlot`) | `media-editor-01` `<MediaEditor01>` — four dials + `presentation` + `initialSource` | `src/registry/components/media/media-editor-01/` v0.1.2 (**already shipped + extracted**) |
| Slot-mounting model | **Renderer registry** — runtime array of `{ id, render }` records keyed by slot-kind string; config references substrates by KEY only | `workspace` (`WorkspaceComponent[]` + `useAreaContext`) + `kanban-board-01` (`KanbanCardRenderer[]` + `useRendererMap`) |
| Controlled/uncontrolled draft state | `value? + defaultValue? + onChange?` triplet; internal reducer when uncontrolled | `kanban-board-01` `useKanbanState` (copy verbatim) |
| Adapter contract | Per-content-type **bidirectional pure functions** mapping collected draft ↔ backend item (and inverse, for CMS re-edit) | new (this procomp); output target = `ContentCardItem` |

The shell does NOT re-open any substrate's internals. The point is to *compose* the substrates, not reconsider them.

**bodySlot needs NO new procomp.** `article-body-01` is already shipped (v0.2.2) and is already proven to mount cross-procomp — `json-form` mounts `<ArticleBodyEditor>` as its `richtext` field via the `.tsx` import path (see `json-form/parts/field-richtext.tsx`). The shell copies that recipe: import from `@/registry/components/data/article-body-01/article-body-01` (the `.tsx`, NOT the barrel — the F-S1 path-rewriter bug mangles cross-procomp `/index`/`/types`), lazy-load the ~165 KB Plate bundle. Embedding Plate directly, or building a new `body-editor-01` first, is **unnecessary**.

## What this procomp does NOT own (boundary with consumers)

This is the most important section of the description. The shell is a composition seam; the split is what makes "one JSON file per content type" work.

**content-composer-01 (the shell) OWNS:**
- Step navigation (ordered steps, cursor, next/back).
- Dialog-vs-inline mode (`presentation`).
- Autosave (debounced; default-on; persists collected per-slot data + cursor + status + `publishAt`).
- Dirty tracking — **aggregated** across all three heterogeneous slots (OR over per-slot bindings against a per-slot last-saved baseline).
- The **draft → publish → schedule** state machine + the between-step **validation gates** (blocking).
- WHEN to publish (the publish-intent transition).
- **The upload** — `uploader` / `uploadUrl` / signed URLs / S3 / Cloudinary / Mux. The shell takes `media-editor-01`'s exported blob and uploads it.
- Post-export **ContentItem assembly** — the forward + inverse adapters.
- The **publish CTA** itself (rendered by the shell or a consumer-supplied slot).

**Substrate slots OWN (mounted, not understood by the shell):**
- `metadataFields` → `json-form` — field rendering + per-field validation internals. The shell passes `submitButton={false}` (the shell owns the publish CTA, json-form never renders its own submit) and drives `formApi.trigger()`/`isValid()` imperatively at gate time.
- `bodySlot` → `article-body-01` — rich-text editing + **in-body** image upload (`ArticleBodyEditor.onImageUpload`, distinct from the hero upload). Plaintext fallback → shadcn `<Textarea>`.
- `mediaSlot` → `media-editor-01` — capture / on-canvas edit / **export** of the hero/cover media. Export is **pull-only** (no `onExport` prop) — the shell holds the `MediaEditor01Handle` and calls `.export()` at publish time.

**Consumer + server OWN (the wrapping pro-page — e.g. `news-editor-page-01` — NOT the shell):**
- Route lifecycle; data hooks (`{ data, loading, error, refetch, mutate }`).
- Backend persistence; signed-URL minting; virus scan; CDN.
- The **5-role permission gates** (`useCmsPermissions().can("cms.posts.publish")` etc.).
- Panel chrome (`page-header-section-01`, breadcrumbs).
- Persisting the **full Plate body value** into its own backend body column (`ContentCardItem` carries only `excerpt`, not body — see §5).

The shell has **NO direct DB/API access.** It emits an assembled `ContentItem` + a publish-intent, exactly as `media-editor-01` emits a blob.

> **DELTA vs `media-editor-01` (read this — the two siblings' boundaries look contradictory otherwise):** `media-editor-01` has **NO** `uploadUrl` / `uploader` / `onPublished` (its NOTABLY-ABSENT block). The content-composer **shell DOES own upload** — it is precisely the layer that takes `media-editor-01`'s exported `{ blob, metadata }` and writes the resulting URL into `ContentCardItem.image`. media-editor exports a blob; the composer uploads it. Not a contradiction — a layering.

> **Gotcha (load-bearing):** the substrate registry is a **runtime** array of `{ id, render }` records passed as a prop — NEVER serializable JSON. React render fns are not serializable. The JSON config references substrates **by string slot-kind key only** (`"metadataFields"` / `"bodySlot"` / `"mediaSlot"`). Modeling substrates inside the `.json` breaks the entire architecture. Missing-substrate at a referenced key = visible degraded fallback + one-shot `console.warn` (kanban `MissingRendererFallback` model), **never a throw** — distinct from a step-validation failure, which **is** a blocking gate. Do not conflate the two.

## Success criteria (how we know it's done)

v0.1 is **done** when:

- **End-to-end news author → publish.** A blank `news-composer.json` mount collects all steps and emits a valid `ContentCardItem` through `onPublish` — required `id` / `title` / `image` present; nested `sensitivity` / `paywall` assembled from dotted fields; runtime counts (`likeCount`/`views`/…) **omitted, not zeroed**.
- **Re-edit round-trips.** `initialItem` + the inverse adapter rehydrate the authored metadata and re-open the hero via `media-editor-01` `initialSource`; the body re-seeds from the separately-supplied `initialBody` (§5); a re-publish PATCHes without wiping engagement counts.
- **Autosave persists + restores.** A debounced `onAutosave` snapshot round-trips the per-slot values **and** the step `cursor`; re-open resumes the same step.
- **Heterogeneous aggregation is correct.** Dirty + validity aggregate correctly across all three asymmetric slots (json-form `isValid`, the shell-derived Plate dirty baseline, media `getIsDirty`); a blocking gate jumps focus to the first invalid step/field.
- **Config-only divergence holds.** `post-composer.json` (modulo the `media-editor-01` v0.2 `"library"` block) runs through the **same shell** with **zero** per-content-type code branches.
- **Gates green.** tsc + lint + `validate:meta-deps` + `pnpm build` clean; consumer-tsc clean post-install (path-b smoke).

## In scope (v0.1)

### 1. Step navigation

Ordered steps from `config.steps`. A `cursor` index lives in the serializable draft so re-open resumes the same step. Forward navigation (`next` / `goToStep(n)`) is **gated** by `canAdvance(currentStep)` (§7). Backward navigation is **free** (no gate going back, so users can fix earlier steps). Each step declares exactly **one** of the three slot kinds.

### 2. Dialog-vs-inline mode

`presentation: "inline" | "dialog" | "auto"` (default `"auto"`). Inline when embedded in a CMS composer step; dialog (shadcn `dialog` + focus trap) standalone. **Note:** `media-editor-01`'s own dialog mode is unused inside the composer — the hero is always mounted `inline` at a step; the *composer* is the dialog when `presentation: "dialog"`. The shell owns the cross-step / close-composer **discard guard** (`media-editor-01`'s `confirmOnDiscard` is dialog-only, so inline-mounted media has no discard guard — the shell reads `editorRef.getIsDirty()` before allowing navigation away).

### 3. The three substrate slots

Each slot is a uniform runtime substrate record `{ kind, render(args) => ReactNode }`, **strongly typed per slot-kind** (NOT type-erased like kanban's `AnyKanbanCardRenderer<any>` — there are exactly three KNOWN, closed kinds). Each `render` receives `(slotConfig, value, onChange, ctx, handleRef)`; the shell holds a `handleRef` per slot exposing a uniform `SlotHandle { getValue, getIsDirty, validate, loadValue }` so the state machine reads all three identically — hiding their asymmetry:

| Slot | Substrate | dirty read | validity read | re-seed (re-edit) |
|---|---|---|---|---|
| `metadataFields` | `<JsonForm>` | `formApi.isDirty()` | `formApi.trigger()` + `isValid()` | `formApi.reset(v)` |
| `bodySlot` | `<ArticleBodyEditor>` / `<Textarea>` | **shell-derived** (ref/struct diff vs loaded baseline — Plate has no dirty signal) | config min-length over flattened text | key-bump remount with `defaultValue` |
| `mediaSlot` | `<MediaEditor01>` | `handle.getIsDirty()` + `onDirtyChange` | required? `!!value.exportedUrl \|\| handle.getIsDirty()` | `handle.loadState()` + `initialSource:{kind:"url"}` |

The three default substrate adapters ship from the barrel (like `kanbanCardRenderer`), **spreadable + overridable** via a `substrates?` prop — consumers can swap the body editor.

### 4. JSON config schema

A content type is one `ComposerConfig` JSON object: `{ id, version, title, adapterId, steps[], publishModes[], presentation?, autosave? }`. Each step: `{ id, title, slot, slotConfig, validation?, optional?, visibleWhen? }`. Per-slot `slotConfig`:
- `metadataFields` → a `json-form` `FormSchema` **fragment** (`{ fields: FieldDefinition[] }`).
- `bodySlot` → `{ substrate: "plate" | "plaintext", placeholder?, emptyValue?, fieldName }`.
- `mediaSlot` → a **1:1 passthrough** of `media-editor-01`'s dials: `{ enabledModes, enabledTools, mediaSources, aspect, presentation?, cropAspects?, maxFileSizeMb?, fieldName }` — the shell spreads these straight onto `<MediaEditor01>` props (every key verified on `MediaEditor01Props`).

**Adding a content type later = ONE new JSON file, NO new component.** The config carries zero React — only slot-kind keys + schema fragments + an `adapterId`. (Renderer-registry precedent: `workspace` preset-swap selects a serializable layout blob by id; the runtime registry supplies the render fns.)

**JSON round-trip caveat:** a config stays a *pure* `.json` file only while its `json-form` fragment is **purely declarative** (validators block, declarative `Condition` DSL, `expression`-form computed). The moment it needs a function escape-hatch — `compute` / `validate` / function-`Condition` / async `options` / `zodSchema` — it must move to a TS module OR carry a **hydration layer** that re-attaches functions by field name. The config loader is designed with this hydration seam.

### 5. Per-content-type adapters

Each content type ships a **bidirectional pure-function pair** (NOT a component), selected by `config.adapterId` from a runtime registry:

```ts
interface ContentTypeAdapter<TItem> {
  contentType: string;
  /** forward: collected draft → backend item (for publish/save). */
  toContentItem: (draft: ComposerDraft, ctx: { now: Date; currentUser?: { id: string; name: string } }) => TItem;
  /** inverse: backend item → partial draft + media initialSource (for CMS re-edit). */
  fromContentItem: (item: TItem) => { draft: Partial<ComposerDraft>; mediaInitialSource?: InitialSource };
}
```

The **news adapter's output target is the real `ContentCardItem`** (`content-card-news-01/types.ts:144`, exported via `index.ts`). It authors:
- **Required:** `id`, `title`, `image` (the uploaded hero URL).
- **Authored-optional:** `slug`, `excerpt`, `category`, `authorEntity: NewsArticleAuthor`, `publisher: NewsPublisher`, `publishedAt` / `scheduledFor` / `updatedAt`, `readTime`, `status: ContentStatus` (the state-machine output), `visibility: NewsVisibility`, `topics`, `tags`, `language`.
- **Editorial gate/badge fields:** `isPinned` / `isFeatured` / `isBreaking` / `isExclusive` / `isSponsored`, `sponsorLabel`, `sensitivity: ContentSensitivity`, `paywall: ContentPaywall`.
- **OMITTED (runtime/backend-derived — NEVER authored):** `likeCount` / `commentCount` / `shareCount` / `bookmarkCount` / `views` / `isLiked` / `isBookmarked` / `quotedArticle`. The forward adapter must *omit* (not zero) them; the page does a **merge/PATCH** update so a re-edit doesn't wipe them.

**Inverse adapter (CMS re-edit):** `fromContentItem(item)` re-seeds authored fields into the metadata step AND sets the media leg `mediaInitialSource: { kind:"url", url:item.image, mode:"photo" }` so `media-editor-01` re-opens the hero without re-capture.

**Body is NOT on `ContentCardItem`** (the card carries only `excerpt`). `toContentItem` is the **display-card projection**; the full Plate `ArticleBodyValue` egresses separately — the shell exposes the raw `BodySlotValue` and the wrapping pro-page persists it to its own body column. For an HTML export boundary (RSS/email/OG) the adapter calls `serializeArticleBodyToHtml(value)`; Plate JSON, never HTML, is the storage format.

**The body leg is two-directional (re-edit can't source body from `initialItem`).** Because body isn't on `ContentCardItem`, `fromContentItem` can't rehydrate it. The wrapping pro-page reads the persisted `ArticleBodyValue` from its own body column and feeds it into the shell **separately** — via an `initialBody?: BodySlotValue` prop (or a `bodySlot` entry on an augmented `initialItem`) — exactly mirroring the outbound `BodySlotValue` it persisted. **Out:** shell → page (body column). **In:** page → shell (re-seed). The `ContentCardItem`-shaped fields round-trip through the adapter; the body round-trips through this separate seam.

### 6. Collected-data model

ONE JSON-serializable draft, keyed by step id:

```ts
interface ComposerDraft {
  contentType: string;
  steps: Record<string, ComposerStepValue>; // discriminated by slot kind
  status: "draft" | "scheduled" | "published" | "archived"; // → ContentCardItem.status
  scheduledFor?: string;     // ISO; set by the schedule arm
  contentId?: string;        // set on first publish; preserved on re-edit
  cursor: number;            // PERSISTED so re-open resumes the step
}
type ComposerStepValue =
  | { slot: "metadataFields"; value: Record<string, unknown> }   // json-form values bag (JSON-clean)
  | { slot: "bodySlot"; value: { kind: "richtext"; value: ArticleBodyValue } | { kind: "plaintext"; value: string } }
  | { slot: "mediaSlot"; value: { exportedUrl?: string; pendingBlobRef?: string; exportMetadata?: ExportMetadata; editorState?: MediaEditorState } };
```

**The media blob is NOT in the draft.** `media-editor-01`'s `getState()` carries a `Blob` (`videoBlob`) + possibly a `blob:` URL — non-serializable. The media slot persists `exportedUrl` (post-upload) + `editorState` (re-editable) + a transient `pendingBlobRef` key into a shell-held `Map<string, Blob>` consumed once at upload time. `json-form` values + Plate value are JSON-clean and persist directly.

### 7. Draft / publish / schedule state machine + validation gates

A small explicit FSM with the **status axis orthogonal to the step cursor** (step nav lives *under* `editing`):

```
idle → editing
editing → editing            (next / goToStep — GATED by canAdvance; blocked transition STAYS + surfaces errors)
editing → autosaving         (debounce fires AND dirty; background, non-blocking)
editing → validating         (user hits Save-draft / Publish / Schedule — runs ALL gates)
validating → editing         (gate FAIL — jump to first invalid step)
validating → draft-saved | scheduling | publishing   (per publish-intent)
publishing → published       (status "published"; publishedAt = now)
scheduling → scheduled       (status "scheduled"; scheduledFor = publishAt)
publishing|scheduling → publish-error → validating (retry) | editing (fix)
```

**Schedule is NOT a separate terminal state** — it is **publish with a future `publishAt`**. One publish-intent transition, discriminated payload:

```ts
type PublishMode = "draft" | "publish" | "schedule";  // SUBSET sourced from config.publishModes
type PublishIntent =
  | { mode: "draft" }
  | { mode: "publish" }
  | { mode: "schedule"; publishAt: Date }; // required + must be future; needs a scheduledFor field in some step
```

The shell renders only the publish-CTA arms present in `config.publishModes` (news: `["draft","publish","schedule"]`; post: `["draft","publish"]`).

**Validation gates** are config-sourced, **BLOCKING**, run **imperatively** at advance/publish time (not continuous):
- `metadataFields`: `await formApi.trigger()` (force-validate all — `validationMode` defaults to `"onTouched"`, so a never-touched required field won't show invalid until `trigger()`) then `isValid()`.
- `bodySlot`: config-declared `minLength` / non-empty check over the Plate value (vs `ARTICLE_BODY_EMPTY_VALUE`).
- `mediaSlot`: if config marks the hero required, `!!value.exportedUrl || handle.getIsDirty()`.

Publish/Schedule re-run **all** steps' gates before exiting `editing`.

### 8. Autosave + dirty tracking

Autosave is debounced (default-on), fires `onAutosave(snapshot)` only while `editing`/`draft` and only when dirty since the last save; re-baselines every slot on success (clearing dirty). The **high-frequency `onDraftChange`** (per-mutation) is **split from** the **debounced `onAutosave`** by design (workspace deferred this split and told consumers to debounce — content-composer designs it in from v0.1 since autosave is a locked concern). Dirty = OR across the three `SlotHandle`s; `onDirtyChange(true)` from any slot (re)arms the debounce. **#1 implementation trap:** Plate has no dirty signal — the shell derives it by reference-comparing the live `onChange` value against the last-saved baseline; the baseline **must** reset after every successful save or the body reports permanently-dirty and autosave loops.

### 9. Public API sketch

```ts
export interface ContentComposer01Props {
  // === The config (JSON) ===
  config: ComposerConfig;
  /** Runtime substrate registry; defaults shipped + spreadable + overridable. */
  substrates?: Partial<Record<SlotKind, SlotSubstrate>>;

  // === Re-edit ===
  initialItem?: ContentCardItem;   // drives the INVERSE adapter (item.image → media initialSource)
  /** Persisted Plate/plaintext body for re-edit — body is NOT on ContentCardItem, so it re-seeds via this separate leg (§5). */
  initialBody?: BodySlotValue;

  // === Presentation ===
  presentation?: "inline" | "dialog" | "auto";  // default "auto"
  isOpen?: boolean;                // dialog mode only
  onClose?: () => void;            // dialog mode only

  // === Draft state (controlled triplet — copy useKanbanState) ===
  value?: ComposerDraft;
  defaultValue?: ComposerDraft;
  onChange?: (draft: ComposerDraft) => void;

  // === Autosave (split: per-mutation vs debounced) ===
  autosave?: boolean;              // default true
  onDraftChange?: (draft: ComposerDraft) => void;          // per mutation
  onAutosave?: (draft: ComposerDraft) => void | Promise<void>; // debounced (~800ms)

  // === Lifecycle exits (emit the assembled ContentItem; affordance-gated by callback presence) ===
  onSaveDraft?: (item: ContentCardItem) => void | Promise<void>;
  onPublish?:  (item: ContentCardItem) => void | Promise<void>;
  onSchedule?: (item: ContentCardItem, publishAt: Date) => void | Promise<void>;

  // === The SHELL owns upload (DELTA vs media-editor-01) ===
  uploader?: (blob: Blob, meta: ExportMetadata) => Promise<{ url: string }>; // primary contract
  uploadUrl?: string;              // convenience shorthand (default PUT/POST)

  // === Slots (escape hatches) ===
  renderPublishCTA?: (ctx: ComposerCtx) => ReactNode;
  renderStepChrome?: (ctx: ComposerCtx) => ReactNode;

  ref?: Ref<ContentComposer01Handle>;
}

export interface ContentComposer01Handle {
  saveDraft(): Promise<void>;
  publish(): Promise<void>;
  schedule(at: Date): Promise<void>;
  goToStep(n: number): Promise<GateResult>;  // returns block result
  getIsDirty(): boolean;
  getDraft(): ComposerDraft;
  loadDraft(draft: ComposerDraft): void;
}
```

**NOTABLY ABSENT** (intentionally — pro-page / consumer owned):
- No data fetching / `refetch` / `mutate`.
- No backend client, no signed-URL minting.
- No permission model (`can(...)` belongs to the page).
- No per-content-type hardcoded UI; no panel chrome.

### 10. Exported hooks + sealed parts

Exported via the barrel for consumers building custom shells: `useComposerState()` (the controlled/uncontrolled draft reducer + FSM), `useComposerContext()` / `useComposerStep()` (per-mount context via React Context + throwing hook, workspace `useAreaContext` model — returns `{ stepId, contentType, mode, isDirty, stepErrors }`; throws outside a step subtree). Default substrate adapters (`jsonFormSubstrate`, `articleBodySubstrate`, `plaintextSubstrate`, `mediaEditorSubstrate`) export as spreadable records. A `findSubstrate(substrates, key)` public helper mirrors kanban's `findRenderer`.

### 11. Accessibility

- **Focus management across step transitions:** advancing focuses the first interactive element of the new step; a blocked gate moves focus to the first invalid field + announces the error (`role="status"` live region).
- **Dialog-vs-inline focus-trap split:** dialog mode = shadcn `dialog` focus trap + Escape + `aria-labelledby`/`aria-describedby`; inline mode = no trap (it lives in the page flow), but the shell still owns the unsaved-edits navigation guard.
- **Body editor a11y wrap:** `<ArticleBodyEditor>` exposes no `id` (Plate manages a contenteditable) — the shell wraps it in `role="group"` + `aria-labelledby` (the `field-richtext.tsx` a11y wrap), as must each metadata/media step's label binding.
- **Step indicator** is a labeled `nav` (`aria-label="Composer steps"`) with the current step marked `aria-current="step"`.
- **Reduced motion** (`prefers-reduced-motion: reduce`): the one orchestrated step-reveal (`reveal-up` + stagger) falls back to instant transitions.

### 12. Design-system token compliance

Holds the `.claude/CLAUDE.md` Design system mandate:
- **Fonts:** Onest (sans) chrome, JetBrains Mono (mono) code-like surfaces. Never system fonts.
- **Accent:** `--primary` = signal-lime paired with near-black `--primary-foreground`. Lime is the publish/active-step accent only — never on body text.
- **Surfaces:** step chrome / toolbars use `--card`; popovers use `--popover`. Canvas/background uses `--background` (cool off-white / graphite-cool).
- **Forbidden:** pure-white page backgrounds (the composer is inline-mounted in a CMS — verify the host surface is non-pure-white per CLAUDE.md); purple-on-white gradient clichés; neon-saturated lime.

All token usage via Tailwind v4 CSS variables; no hardcoded hex; no `tailwind.config.*`.

### 13. Browser test matrix

Manual matrix per the documented-headless-patterns convention (no automated browser tests). Most of the heavy media surface lives inside the `media-editor-01` slot (its own matrix applies); the shell adds:

| Feature | Chrome desktop | Safari iOS | Chrome Android |
|---|---|---|---|
| Step nav + gate block/advance | ✅ | ✅ | ✅ |
| Dialog mode (focus trap, Escape, safe-area) | ✅ | ✅ verify safe-area | ✅ |
| Inline mode + unsaved-edits guard | ✅ | ✅ | ✅ |
| Autosave debounce + re-baseline | ✅ | ✅ | ✅ |
| `media-editor-01` slot (upload → export → upload) | ✅ | ⚠️ codec/WebP quirks (media-editor matrix) | ✅ |
| Plate body editor mount + a11y wrap | ✅ | ✅ | ✅ |
| `prefers-reduced-motion` step reveal | ✅ | ✅ | ✅ |

> **Desktop Safari** shares the Safari-iOS WebKit caveats for the shell's *own* chrome — the `dialog` focus-trap, the `datetime` metadata field, and the Plate contenteditable behave per WebKit, distinct from Chromium. Validate the shell chrome on desktop Safari too (the canvas-heavy media surface is covered by `media-editor-01`'s own matrix).

Smoke is documented patterns + consumer-tsc clean post-install (path-b) per shipped-procomp convention. As the **second** inter-procomp registry-dep install path in the library (after `media-editor-01 ← story-composer-01`), expect F-cross-13 sub-traps against the newly-pulled-in primitives — defensively pre-wire.

### 14. SSR

`"use client"` at the procomp boundary. Konva-touching parts arrive via the lazy-loaded `media-editor-01` slot (already `dynamic(..., { ssr: false })` internally); the Plate bundle is `React.lazy`-loaded so configs without a `bodySlot` don't pay the ~165 KB cost.

### 15. Key type sketches

```ts
export type SlotKind = "metadataFields" | "bodySlot" | "mediaSlot";

export interface ComposerConfig {
  id: string;                 // "news" | "post" | "event" | "project"
  version: string;            // config schema version
  title: string;
  adapterId: string;          // runtime registry key → { toContentItem, fromContentItem }
  steps: ComposerStep[];
  publishModes: PublishMode[];          // subset of ["draft","publish","schedule"]
  presentation?: "inline" | "dialog" | "auto";
  autosave?: { enabled: boolean; debounceMs?: number };
}

export interface ComposerStep {
  id: string;
  title: string;
  slot: SlotKind;             // the substrate-registry lookup key
  slotConfig: MetadataSlotConfig | BodySlotConfig | MediaSlotConfig; // discriminated by `slot`
  validation?: StepValidation;          // BLOCKING gate before advance/publish
  optional?: boolean;
  visibleWhen?: Condition;    // json-form Condition DSL, reused for whole-step visibility
}

// mediaSlot config = 1:1 with media-editor-01 dials (names verbatim from MediaEditor01Props)
export interface MediaSlotConfig {
  fieldName: string;
  enabledModes: ("photo" | "video" | "text")[];
  enabledTools: ("text" | "draw" | "stickers" | "filters" | "adjust" | "crop")[];
  mediaSources: ("camera" | "upload")[];   // "library" NOT yet valid (media-editor-01 v0.2) — clamp unknowns
  aspect: "9:16" | "1:1" | "16:9" | "4:5" | "free";
  presentation?: "inline" | "dialog" | "auto";   // default "inline" inside the composer
  cropAspects?: ("9:16" | "1:1" | "16:9" | "4:5" | "free")[];
  maxFileSizeMb?: number;
}
```

## The two configs, modeled concretely

The two-examples-force-honesty rule. Both validate the schema; divergence is **data-only**.

### `news-composer.json` (ships FIRST — zero `media-editor-01` changes)

```json
{
  "id": "news",
  "version": "1.0.0",
  "title": "News Article",
  "adapterId": "news-content-item",
  "presentation": "inline",
  "autosave": { "enabled": true, "debounceMs": 800 },
  "publishModes": ["draft", "publish", "schedule"],
  "steps": [
    { "id": "headline", "title": "Headline & summary", "slot": "metadataFields",
      "slotConfig": { "columns": 1, "schema": { "fields": [
        { "name": "title", "type": "text", "label": "Headline",
          "validators": { "required": "A headline is required", "maxLength": { "value": 140, "message": "Under 140 characters" } } },
        { "name": "slug", "type": "computed", "label": "URL slug", "expression": "{title}", "editable": true },
        { "name": "excerpt", "type": "textarea", "label": "Lead / summary", "rows": 3,
          "validators": { "maxLength": { "value": 300, "message": "Lead under 300 characters" } } }
      ] } },
      "validation": { "mode": "all-fields-valid" } },

    { "id": "hero", "title": "Hero image", "slot": "mediaSlot",
      "slotConfig": { "fieldName": "hero",
        "enabledModes": ["photo"], "enabledTools": ["crop", "filters", "adjust"],
        "mediaSources": ["upload"], "aspect": "16:9", "presentation": "inline",
        "cropAspects": ["16:9"], "maxFileSizeMb": 12 },
      "validation": { "mode": "custom", "rules": [ { "field": "hero", "mediaRequired": true, "message": "News articles need a hero image" } ] } },

    { "id": "body", "title": "Article body", "slot": "bodySlot",
      "slotConfig": { "substrate": "plate", "fieldName": "body", "placeholder": "Write the article…",
        "emptyValue": [ { "type": "p", "children": [ { "text": "" } ] } ] },
      "validation": { "mode": "custom", "rules": [ { "field": "body", "minLength": 1, "message": "Article body cannot be empty" } ] } },

    { "id": "meta", "title": "Metadata & taxonomy", "slot": "metadataFields",
      "slotConfig": { "columns": 2, "schema": { "fields": [
        { "name": "category", "type": "select", "label": "Category", "validators": { "required": true },
          "options": [ { "value": "world", "label": "World" }, { "value": "tech", "label": "Technology" }, { "value": "business", "label": "Business" } ] },
        { "name": "topics", "type": "multi-select", "label": "Topics", "searchable": true,
          "options": [ { "value": "ai", "label": "AI" }, { "value": "climate", "label": "Climate" } ] },
        { "name": "tags", "type": "tags", "label": "Tags",
          "description": "CUSTOM RENDERER (gap) — chip-input with free-text-add; registered via fieldRegistry" },
        { "name": "readTime", "type": "number", "label": "Read time (min)", "min": 1, "max": 120 },
        { "name": "language", "type": "select", "label": "Language", "defaultValue": "en",
          "options": [ { "value": "en", "label": "English" }, { "value": "tr", "label": "Türkçe" } ] },
        { "name": "_byline", "type": "section", "label": "Byline" },
        { "name": "authorEntity", "type": "author-picker", "label": "Author",
          "description": "CUSTOM RENDERER (gap) — entity-picker; not a built-in json-form type" }
      ] } } },

    { "id": "gates", "title": "Publishing & gates", "slot": "metadataFields", "optional": true,
      "slotConfig": { "columns": 2, "schema": { "fields": [
        { "name": "visibility", "type": "select", "label": "Visibility", "defaultValue": "public",
          "options": [ { "value": "public", "label": "Public" }, { "value": "members", "label": "Members" }, { "value": "subscribers", "label": "Subscribers" }, { "value": "staff", "label": "Staff" }, { "value": "unlisted", "label": "Unlisted" } ] },
        { "name": "isBreaking", "type": "switch", "label": "Breaking news" },
        { "name": "isFeatured", "type": "switch", "label": "Featured" },
        { "name": "isExclusive", "type": "switch", "label": "Exclusive" },
        { "name": "sensitivity.isSensitive", "type": "switch", "label": "Sensitive content" },
        { "name": "sensitivity.reason", "type": "text", "label": "Sensitivity reason",
          "visibleWhen": { "field": "sensitivity.isSensitive", "truthy": true } },
        { "name": "paywall.isPaywalled", "type": "switch", "label": "Paywalled" },
        { "name": "paywall.tier", "type": "select", "label": "Paywall tier",
          "visibleWhen": { "field": "paywall.isPaywalled", "truthy": true },
          "options": [ { "value": "subscribers", "label": "Subscribers" } ] },
        { "name": "scheduledFor", "type": "datetime", "label": "Schedule for",
          "description": "Required only when publishing via the Schedule action" }
      ] } } }
  ]
}
```

Dotted names (`sensitivity.isSensitive`, `paywall.tier`) auto-nest via json-form's path-trie → map straight onto `ContentCardItem`'s nested `ContentSensitivity` / `ContentPaywall`. `slug` is a JSON-serializable `computed`/`expression` field. **The `tags` and `author-picker` field types are GAPS** — json-form has no chip-input-with-create and no entity-picker; both ship as content-composer-owned custom `FieldRenderer`s registered via `fieldRegistry` (the supported extension path), referenced from JSON by type string.

### `post-composer.json` (follow-on — BLOCKED on `media-editor-01` v0.2 `"library"`)

```json
{
  "id": "post",
  "version": "1.0.0",
  "title": "Post",
  "adapterId": "post-content-item",
  "presentation": "inline",
  "autosave": { "enabled": true, "debounceMs": 800 },
  "publishModes": ["draft", "publish"],
  "steps": [
    { "id": "hero", "title": "Photo", "slot": "mediaSlot",
      "slotConfig": { "fieldName": "hero",
        "enabledModes": ["photo"],
        "enabledTools": ["crop", "filters", "adjust", "text", "stickers"],
        "mediaSources": ["upload", "library"],
        "aspect": "1:1", "presentation": "inline", "cropAspects": ["1:1"], "maxFileSizeMb": 8 },
      "validation": { "mode": "custom", "rules": [ { "field": "hero", "mediaRequired": true, "message": "Add a photo" } ] } },

    { "id": "caption", "title": "Caption", "slot": "bodySlot",
      "slotConfig": { "substrate": "plaintext", "fieldName": "body", "placeholder": "Write a caption…" },
      "validation": { "mode": "custom", "rules": [ { "field": "body", "minLength": 1, "message": "Caption cannot be empty" } ] } },

    { "id": "meta", "title": "Details", "slot": "metadataFields",
      "slotConfig": { "columns": 1, "schema": { "fields": [
        { "name": "visibility", "type": "select", "label": "Audience", "defaultValue": "public",
          "options": [ { "value": "public", "label": "Public" }, { "value": "members", "label": "Members" } ] },
        { "name": "tags", "type": "tags", "label": "Tags" }
      ] } } }
  ]
}
```

**What the two examples force into the open (the divergences are all data):**

1. **Different dials** — news `aspect:"16:9"` / tools `[crop,filters,adjust]` / `["upload"]`; post `aspect:"1:1"` / tools `[crop,filters,adjust,text,stickers]` / `["upload","library"]`.
2. **Different body substrate** — news `"plate"`, post `"plaintext"` (same `bodySlot` mechanism, different `substrate` value).
3. **A missing step, not a code branch** — post simply omits the `gates` step (no breaking/sensitivity/paywall/schedule). The divergence is structural absence, never a `if (type === "post")`.
4. **Different `publishModes`** — news has the `schedule` arm; post does not. The shell renders only the CTA arms in the array.
5. **The `"library"` source declared ahead of capability** — `media-editor-01`'s real `MediaSource` is `"camera" | "upload"` only. The post config DECLARES `["upload","library"]`; the media substrate must **clamp** the unknown `"library"` (degrade to upload-only) **without crashing** — exactly how media-editor already clamps its dials. This is the concrete cross-procomp version dependency: **post can't fully ship until `media-editor-01` v0.2.**

## Out of scope for v0.1

- **POST / EVENT / PROJECT configs** — modeled now, shipped as follow-on JSON files (NO new component). POST is hard-**blocked on `media-editor-01` v0.2** (`"library"` `MediaSource`).
- **`media-editor-01` `"library"` media source** — upstream gap (its v0.2). News needs upload-only, so it ships unblocked.
- **A visual config-BUILDER UI** — configs are authored as TS/JSON by hand in v0.1.
- **Real backend upload IMPLEMENTATION** — the shell defines the `uploader` CONTRACT + calls it; the consumer/server implements S3/Cloudinary/Mux/signed-URL.
- **Array/repeater (milestones), tags chip-input, byline entity-picker, location/geo** — json-form lacks all four (no array field, no chip-input-with-create, no entity-picker, no geo). They ship as content-composer-owned custom `FieldRenderer`s registered via `fieldRegistry`, scoped per-config. The `project`/`event` configs (future) need the array renderer in particular.
- **A declarative adapter field-MAPPING** — adapters stay as CODE (referenced by `adapterId`), because they do non-trivial transforms (Plate→excerpt, blob-URL resolution, `ContentStatus` derivation, nested `ContentSensitivity` assembly) a declarative map can't express.
- **Content types beyond the four named** — `course` / `podcast-episode` etc. = future JSON files.
- **Eager upload-on-step-leave** — v0.1 uploads lazily at publish (avoids orphaned uploads from abandoned drafts; autosave persists `editorState`, re-editable, not the blob). Eager upload is a v0.2 config flag.
- **Fine-grained media-edit autosave granularity** — `media-editor-01`'s `onEditAction` emits only nav/lifecycle events (mode-change/tool-open/tool-close/reset) in v0.1.x; content-mutation events arrive in its v0.2. Media autosave is checkpoint-on-dirty-toggle, not per-edit.

## Q-Ps for sign-off

Ten calls. Each carries a RECOMMENDED option; QP-1 is a **confirm-only** checkbox (the tier is already locked, not re-litigated here).

| Q-P | Fork | Recommended |
|---|---|---|
| **QP-1** Tier confirm | procomp shell vs section/page | **(a) procomp** — the shell is one composable unit; each CMS-route USE = a separate pro-page (`news-editor-page-01`), a future `cms-panel-01` constituent. *Confirm the lock.* |
| **QP-2** v0.1 scope | news-only vs news+post modeled | **(b) MODEL news + post, SHIP news first.** POST is blocked on `media-editor-01` v0.2 (`"library"`); modeling both now forces schema honesty. |
| **QP-3** `presentation` default | inline / dialog / auto | **(c) `"auto"`** — inline when embedded in a CMS step, dialog standalone. Mirrors `media-editor-01`. |
| **QP-4** Autosave default | off / on | **(b) ON**, ~800 ms debounce, with `onDraftChange` (per-mutation) SPLIT from `onAutosave` (debounced). No-op unless `onAutosave` is wired (affordance-gating). |
| **QP-5** `bodySlot` source | embed Plate directly / NEW body-editor procomp / MOUNT `article-body-01` | **(c) MOUNT `article-body-01` v0.2.2** — already shipped, already proven cross-procomp inside json-form. **NO new procomp is a prerequisite.** Plaintext fallback mounts shadcn `<Textarea>`. |
| **QP-6** Config authoring | runtime-JSON only / TS only / TS-with-JSON-round-trip | **(c) authored-in-TS, JSON-round-trippable SHAPE + a hydration layer** that re-attaches function escape-hatches (validate/compute/fn-conditions/async-options) by field name. Pure-declarative configs round-trip cleanly. |
| **QP-7** Adapter location | co-located in config module / separate registry item | **(a) co-located** in the per-content-type config module, exported as pure forward+inverse functions (collected draft ↔ `ContentCardItem`), NOT components. |
| **QP-8** Upload contract | `uploadUrl` string / `uploader` fn / signed-URL mint | **(b) `uploader: (blob, meta) => Promise<{ url }>`** as the primary contract (covers S3/Cloudinary/Mux/signed-URL — consumer implements); `uploadUrl` as a convenience shorthand. |
| **QP-9** Step validation | warn-and-advance / blocking | **(b) BLOCKING** between-step gate (locked); forward advance blocks on invalid, free backward nav; publish/schedule re-runs ALL gates. Explicitly DISTINCT from the non-blocking missing-substrate fallback. |
| **QP-10** Media autosave timing | eager (step-leave) / lazy (publish) | **(b) LAZY** — upload at publish; autosave persists `editorState` (re-editable) + `exportedUrl`, NOT the blob. A pending capture is lost on hard-refresh before publish (acceptable v0.1, documented). Eager = v0.2 flag. |

**Sign-off summary** (all locked to recommended on confirmation):

| Q-P | Decision |
|---|---|
| QP-1 | (a) procomp shell — route-uses become separate pro-pages. |
| QP-2 | (b) Model news + post; ship news first; post follows on `media-editor-01` v0.2. |
| QP-3 | (c) `presentation` default `"auto"`. |
| QP-4 | (b) Autosave ON, 800 ms, `onDraftChange`/`onAutosave` split. |
| QP-5 | (c) Mount `article-body-01` — no new procomp; `<Textarea>` plaintext fallback. |
| QP-6 | (c) TS-authored, JSON-round-trippable shape + hydration layer. |
| QP-7 | (a) Adapters co-located in the config module, exported as pure fns. |
| QP-8 | (b) `uploader` fn primary; `uploadUrl` shorthand. |
| QP-9 | (b) Blocking between-step gates; re-run all on publish. |
| QP-10 | (b) Lazy upload-on-publish. |

## Dependencies (peer / internal)

| Dependency | Kind | Notes |
|---|---|---|
| `json-form` | internal procomp | `metadataFields` substrate. Already shipped. The config's `FormSchema` fragments target its `FieldDefinition` DSL. |
| `article-body-01` | internal procomp | `bodySlot` substrate (Plate). **alpha v0.2.2** — acceptable per project norms (json-form already depends on it); flagged so GATE 3 isn't surprised. Cross-procomp import via the `.tsx` path (F-S1). |
| `media-editor-01` | internal procomp | `mediaSlot` substrate. **v0.1.2 today; POST blocked on its v0.2** (`"library"` source). `mediaSlot` config = 1:1 dial passthrough; export is pull-only via the ref handle. |
| `content-card-news-01` | internal procomp | The news adapter's OUTPUT target type (`ContentCardItem`). Type-level dependency only. |
| `workspace`, `kanban-board-01` | pattern precedent | Renderer-registry + controlled/uncontrolled-state model. No code dependency. |
| `dialog`, `textarea` (+ json-form/Plate/media transitive shadcn primitives) | shadcn primitive | F-cross-13 surface — second inter-procomp registry-dep install path in the library; defensively pre-wire. |

> **Forward reference (NOT a present dependency):** each CMS-route use becomes a pro-page (`news-editor-page-01`) following `cms-panel-01`'s BESPOKE-editor pattern (`/posts` mounts `article-body-01`; `news-editor-page-01` mounts `content-composer-01` the same way). That page — NOT the shell — owns the 5-role permission gates, data hooks, and panel chrome. `cms-panel-01` is itself still GATE-1-awaiting-sign-off; the shell procomp ships **independently** of the panel.

## Workflow / verification gates this procomp must pass

- **GATE 1 — this document.** Description signed off (QP-1..QP-10 locked). No code until GATE 2.
- **GATE 2 — `content-composer-01-procomp-plan.md`.** Must lock: the `ComposerConfig` / `ComposerDraft` / `SlotSubstrate` / `SlotHandle` type system; the FSM transition table + reducer; the autosave/dirty split + Plate baseline-reset; the gate-evaluation order; the hydration-layer + `fieldRegistry` custom-renderer wiring (tags/author-picker); the news adapter pair against `ContentCardItem`; the `media-editor-01` clamp-unknown-source rule; the cross-procomp `.tsx` import + lazy-load recipe. Two re-validation passes per the project norm.
- **GATE 3 — readiness spotcheck** (`docs/procomps/content-composer-01-procomp/reviews/<YYYY-MM-DD>-v0.1.0-spotcheck.md`). 4 fixed dims + 1 rotating; **rotating dim = composition integrity** (this shell composes three substrates — prop-flow correctness, no leaked internals, clean state lifting, dirty/validity aggregation across heterogeneous slots). Verdict ≥ `Pass with follow-ups` to close.
