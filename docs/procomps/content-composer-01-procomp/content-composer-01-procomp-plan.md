# content-composer-01 — procomp plan

> Stage 2: how (the implementation contract).
>
> Realizes [`content-composer-01-procomp-description.md`](./content-composer-01-procomp-description.md) section-by-section, no drift. The description is the SPEC (what & why); this plan is the HOW. Do not re-open WHAT/WHY here.
>
> **GATE 1 CLOSED** — description signed off; QP-1..QP-10 locked to the recommended options:
> QP-1 (a) single procomp shell (route-uses are separate pro-pages, NOT in scope) · QP-2 (b) model news + post, **ship news first**; post follows on `media-editor-01` v0.2 `"library"` · QP-3 (c) `presentation` default `"auto"` · QP-4 (b) autosave ON ~800 ms, `onDraftChange` (per-mutation) SPLIT from `onAutosave` (debounced) · QP-5 (c) MOUNT `article-body-01` v0.2.2 as `bodySlot` (NO new procomp); shadcn `<Textarea>` plaintext fallback · QP-6 (c) configs authored-in-TS, JSON-round-trippable SHAPE + hydration layer · QP-7 (a) adapters CO-LOCATED in the config module, pure forward+inverse fns · QP-8 (b) `uploader: (blob, meta) => Promise<{ url }>` primary; `uploadUrl` shorthand · QP-9 (b) BLOCKING between-step gates; publish/schedule re-runs ALL gates; DISTINCT from the non-blocking missing-substrate fallback · QP-10 (b) LAZY upload-on-publish; autosave persists `editorState` + `exportedUrl`, NOT the blob.
>
> **Migration origin:** greenfield, no source app. Single-phase greenfield ship (C1→C18) — NOT a multi-phase git-mv extraction.

---

## Sealed-folder file map (LOCKED)

Data-table shape. `parts/` (UI fragments + custom field renderers), `hooks/` (state + context), `lib/` (pure logic + substrate registry), plus two config-domain subfolders `configs/` (per-content-type `ComposerConfig` + co-located adapter) and `adapters/` (runtime adapter registry).

```
src/registry/components/media/content-composer-01/
├── content-composer-01.tsx          # root forwardRef orchestrator — "use client"          (EXPORTED via barrel)
├── parts/
│   ├── composer-shell.tsx           # step frame + chrome + publish-CTA region              (INTERNAL)
│   ├── composer-dialog.tsx          # presentation="dialog" wrapper (shadcn Dialog + trap)  (INTERNAL)
│   ├── step-indicator.tsx           # <nav aria-label="Composer steps"> + aria-current      (INTERNAL)
│   ├── slot-mount.tsx               # looks up substrate by slot-kind; renders or fallback   (INTERNAL)
│   ├── missing-substrate.tsx        # MissingSubstrateFallback + warnMissingSubstrate        (INTERNAL)
│   ├── publish-bar.tsx              # renders config.publishModes arms; renderPublishCTA slot(INTERNAL)
│   ├── field-tags.tsx               # custom "tags" chip-input FieldRenderer (json-form gap) (EXPORTED — fieldRegistry reuse)
│   ├── field-author-picker.tsx      # custom "author-picker" entity-picker FieldRenderer     (EXPORTED — fieldRegistry reuse)
│   ├── body-substrate-plate.tsx     # React.lazy default-export wrapping <ArticleBodyEditor> (INTERNAL, default-export)
│   └── body-substrate-plaintext.tsx # eager shadcn <Textarea> plaintext fallback            (INTERNAL)
├── hooks/
│   ├── use-composer-state.ts        # controlled/uncontrolled triplet + reducer (fork useKanbanState) (EXPORTED)
│   ├── use-composer-context.ts      # createContext + throwing useComposerStep/useComposerContext      (EXPORTED)
│   ├── use-autosave.ts              # debounced onAutosave effect (skip-initial-mount, ref-stable)     (INTERNAL)
│   ├── use-slot-handles.ts          # the 3 SlotHandle refs + aggregate dirty / validity              (INTERNAL)
│   └── use-body-dirty.ts            # Plate baseline JSON-compare (#1 trap)                            (INTERNAL)
├── lib/
│   ├── reducer.ts                   # composerReducer + makeEmptyDraft (replace = loadDraft arm)       (INTERNAL)
│   ├── phase-reducer.ts             # phaseReducer (ephemeral FSM phase, OUT of the draft)             (INTERNAL)
│   ├── substrates.ts                # default substrate records + findSubstrate                        (EXPORTED)
│   ├── hydration.ts                 # hydrateSchema / stripHydration (QP-6)                            (EXPORTED — consumer configs)
│   ├── clamp-media-sources.ts       # clampMediaSources ("library" → upload-only)                     (INTERNAL)
│   ├── publish-cta.ts               # resolvePublishCtaArms (config.publishModes → UI arms)            (INTERNAL)
│   └── upload.ts                    # uploader / uploadUrl resolution + pendingBlob Map                (INTERNAL)
├── configs/
│   ├── news-composer.config.ts      # ComposerConfig + co-located news adapter pair (QP-7)       NEW  (EXPORTED)
│   └── post-composer.config.ts      # post config (modeled; blocked on media-editor-01 v0.2)     NEW  (EXPORTED)
├── adapters/
│   └── adapter-registry.ts          # adapterId → { toContentItem, fromContentItem } registry         (EXPORTED)
├── types.ts                         # the full type system (§"Type system" below)                     (EXPORTED)
├── dummy-data.ts                    # sample draft + sample ContentCardItem (re-edit demo)       NEW  (EXPORTED via fixtures)
├── demo.tsx                         # docs demo — uses <SwipeTabsList> (NOT raw TabsList)              (docs-site ONLY — NOT shipped)
├── usage.tsx                        # consumer usage notes                                             (docs-site ONLY — NOT shipped)
├── meta.ts                          # ComponentMeta v0.1.0, status alpha, deps audited                 (docs-site ONLY — NOT shipped)
└── index.ts                         # barrel — re-exports the EXPORTED symbols                         (EXPORTED)
```

**Final on-disk file count**: **32** (1 root + 10 parts + 5 hooks + 7 lib + 2 configs + 1 adapter + types.ts + dummy-data.ts + demo.tsx + usage.tsx + meta.ts + index.ts = 26 + 6).

**Final registry roster**: **28 base files** (`type: "registry:component"`, `target: "components/content-composer-01/<sub-path>"`) = on-disk 32 − `demo.tsx`/`usage.tsx`/`meta.ts` (docs-site only) − `dummy-data.ts` (→ fixtures) + 1 fixtures item (`content-composer-01-fixtures`, depends on base, adds `dummy-data.ts`) = **29 distributed artifacts**. `demo.tsx` / `usage.tsx` / `meta.ts` **EXCLUDED** per the locked convention (docs-site only). Counts are plan-time estimates — reconcile at C16 (registry.json) per the manual roster audit, exactly as `media-editor-01` did.

---

## Dependencies (LOCKED)

### Peer / NPM (transitive — declared in `meta.ts` + `registry.json` `dependencies`)

| Dependency | Kind | Notes |
|---|---|---|
| `react` 19.2.x | peer | per registry convention |
| `lucide-react` | NPM | `TriangleAlert` (fallback), `X` (tags chip), step-indicator icons |

The shell's own code imports ONLY `react`, `@/components/ui/*`, `@/lib/utils`, and the three substrate procomps. **Never `next/*`.** Plate / Konva / RHF / Zod arrive transitively through the substrate procomps — declared as `registryDependencies` (below), not re-declared here.

### Internal shadcn primitives (`@/components/ui/*`)

`dialog` (presentation="dialog"), `textarea` (plaintext bodySlot), `button`, `badge` (tags chips), `input` (tags entry), `command` + `popover` (author-picker combobox), `separator`, `scroll-area` (step body). Run `pnpm dlx shadcn@latest add <name>` for any not yet present.

### Cross-procomp wiring (the SECOND inter-procomp registry-dep install path in the library)

All three substrate procomps are mounted by **`@/registry/components/...` ALIAS imports** — the established F-S1 precedent (`json-form/parts/field-richtext.tsx:9-13` and the description §"Substrate decisions" line 48 BOTH use the alias). **Do NOT use relative `../../data/...` paths** — that is the one drift to avoid.

```ts
// VALUE imports — the .tsx component file (rewriter preserves this path; /index + /types get mangled)
import { ArticleBodyEditor, ARTICLE_BODY_EMPTY_VALUE, type ArticleBodyValue }
  from "@/registry/components/data/article-body-01/article-body-01";
import { MediaEditor01 }
  from "@/registry/components/media/media-editor-01/media-editor-01";
import { JsonForm } from "@/registry/components/forms/json-form/json-form";
import { defineFieldRenderer } from "@/registry/components/forms/json-form/lib/define-field-renderer";

// TYPE-only imports (erased at build — depth-tolerant; still list the dep in meta.ts)
import type { MediaEditor01Props, MediaEditor01Handle, MediaEditorState, ExportMetadata,
  InitialSource, ComposerMode, EditTool, MediaSource, AspectRatio }
  from "@/registry/components/media/media-editor-01/types";
import type { FormSchema, Condition, FieldDefinition, JsonFormHandle, FieldRenderer,
  FieldOptionsResolver, ConditionOrFn }
  from "@/registry/components/forms/json-form/types";
import type { ContentCardItem, NewsArticleAuthor, NewsPublisher, ContentSensitivity,
  ContentPaywall, ContentStatus, NewsVisibility }
  from "@/registry/components/data/content-card-news-01/types";
```

`registry.json` MUST add **`registryDependencies`** (NOT `dependencies` — those are NPM peers) listing the live URLs of `json-form`, `article-body-01`, and `media-editor-01`:

```json
"registryDependencies": [
  "https://ilinxa-proui.vercel.app/r/json-form.json",
  "https://ilinxa-proui.vercel.app/r/article-body-01.json",
  "https://ilinxa-proui.vercel.app/r/media-editor-01.json"
]
```

`content-card-news-01` is a **type-level dependency only** (the adapter's forward target) — list it in `meta.ts` `dependsOn` but it need NOT be a runtime `registryDependency` (types are erased; the consumer only needs its `types.ts` to typecheck, which the page that mounts the news config already installs).

### F-cross-13 substrate verification (C1 task)

Before coding, grep the transitive shadcn primitives each substrate pulls (`dialog`, `textarea`, json-form's `select`/`command`/`popover`, Plate, media's `slider`/`popover`) for the Radix-vs-Base-UI divergence class (F-cross-13: `asChild`/`PopoverAnchor`/controlled-mode triplet traps). Record findings in the C1 commit message. Defensively pre-wire the controlled-mode triplet on any new primitive the composer chrome introduces (`Dialog`, `Command`, `Popover` for author-picker). Expect sub-traps at C18 consumer-tsc smoke per the established 4-ship pattern.

---

## Type system (LOCKED — references description §5/§6/§7/§9/§15)

Normative. All substrate-touching types **re-use the imported real signatures** (above) — zero redeclaration. Lives in `types.ts`.

### Slot kinds + config (description §15)

```ts
import type { ReactNode, Ref } from "react";
import type { MediaEditor01Props, MediaEditor01Handle, MediaEditorState, ExportMetadata,
  InitialSource, ComposerMode, EditTool, MediaSource, AspectRatio }
  from "@/registry/components/media/media-editor-01/types";
import type { ArticleBodyValue } from "@/registry/components/data/article-body-01/article-body-01";
import type { ContentCardItem, ContentStatus } from "@/registry/components/data/content-card-news-01/types";
import type { FormSchema, Condition } from "@/registry/components/forms/json-form/types";

export type { MediaEditorState, ExportMetadata, InitialSource, ArticleBodyValue, ContentCardItem };

export type SlotKind = "metadataFields" | "bodySlot" | "mediaSlot";

export interface ComposerConfig {
  id: string;                 // "news" | "post" | "event" | "project"
  version: string;            // config schema version (semver)
  title: string;
  adapterId: string;          // runtime adapter-registry key
  steps: ComposerStep[];
  publishModes: PublishMode[];          // subset of ["draft","publish","schedule"]
  presentation?: "inline" | "dialog" | "auto";
  autosave?: { enabled: boolean; debounceMs?: number };
}

export interface ComposerStep {
  id: string;
  title: string;
  slot: SlotKind;             // substrate-registry lookup key
  slotConfig: MetadataSlotConfig | BodySlotConfig | MediaSlotConfig; // discriminated by `slot` at the consumer site (JSON — no TS narrowing)
  validation?: StepValidation;          // BLOCKING gate before advance/publish
  optional?: boolean;
  visibleWhen?: Condition;    // json-form Condition DSL, reused for whole-step visibility (serializable object form only)
}

export interface StepValidationRule {
  field: string;
  minLength?: number;        // bodySlot: min Plate/plaintext length
  mediaRequired?: boolean;   // mediaSlot: require a hero (exportedUrl present OR dirty)
  message: string;
}

export interface StepValidation {
  mode: "all-fields-valid" | "custom";  // "all-fields-valid" → delegate to json-form trigger(); "custom" → run `rules`
  rules?: StepValidationRule[];
}
```

### The three discriminated slot configs (description §4)

```ts
/** metadataFields → a json-form FormSchema fragment. */
export interface MetadataSlotConfig {
  columns?: 1 | 2;
  schema: FormSchema;        // { fields: FieldDefinition[] } fragment
}

/** bodySlot → article-body-01 (Plate) OR shadcn <Textarea> plaintext fallback. */
export interface BodySlotConfig {
  substrate: "plate" | "plaintext";
  fieldName: string;
  placeholder?: string;
  emptyValue?: ArticleBodyValue;  // plate-only sentinel; plaintext ignores it and uses "" — defaults to ARTICLE_BODY_EMPTY_VALUE
}

/**
 * mediaSlot → 1:1 passthrough of media-editor-01's dials. Every key is a verified
 * MediaEditor01Props prop (media-editor-01/types.ts:400-475). The shell spreads these
 * straight onto <MediaEditor01>, EXCEPT `mediaSources` which the substrate CLAMPS to the
 * real MediaSource union before spreading (drops not-yet-valid "library" — §clamp).
 */
export interface MediaSlotConfig {
  fieldName: string;
  enabledModes: ComposerMode[];                 // ("photo"|"video"|"text")[]
  enabledTools: EditTool[];                     // 6-tool union
  mediaSources: (MediaSource | (string & {}))[]; // broad so a config can declare "library" ahead of media v0.2; substrate clamps
  aspect: AspectRatio;                          // "9:16"|"1:1"|"16:9"|"4:5"|"free"
  presentation?: "inline" | "dialog" | "auto";  // default "inline" inside the composer (§2)
  cropAspects?: AspectRatio[];
  maxFileSizeMb?: number;
}
```

### Body value + draft (description §6) — JSON-clean, NO blob

```ts
// The asymmetry the SlotHandle hides: richtext = ArticleBodyValue (Plate node array); plaintext = string.
export type BodySlotValue =
  | { kind: "richtext"; value: ArticleBodyValue }
  | { kind: "plaintext"; value: string };

/**
 * MediaEditorState minus the non-serializable live Blob (videoBlob:Blob, media-editor-01/types.ts:218).
 * The draft persists THIS, never the raw MediaEditorState. On re-edit the shell re-attaches the blob
 * from its Map (or re-fetches from exportedUrl) before calling handle.loadState().
 */
export type SerializableMediaEditorState = Omit<MediaEditorState, "videoBlob"> & { videoBlob: null };

export interface MediaSlotValue {
  exportedUrl?: string;                       // durable uploaded https URL (post-upload) — the persistable handle
  pendingBlobRef?: string;                    // transient key into the shell-held Map<string,Blob>; consumed once at upload
  exportMetadata?: ExportMetadata;            // .metadata leg of export()
  editorState?: SerializableMediaEditorState; // blob-free editor snapshot for re-edit
}

export type ComposerStepValue =
  | { slot: "metadataFields"; value: Record<string, unknown> } // json-form values bag (JSON-clean)
  | { slot: "bodySlot"; value: BodySlotValue }
  | { slot: "mediaSlot"; value: MediaSlotValue };

export interface ComposerDraft {
  contentType: string;
  steps: Record<string, ComposerStepValue>;   // keyed by step id; discriminated by slot kind
  status: ContentStatus;                       // "draft"|"scheduled"|"published"|"archived" → ContentCardItem.status (same CLOSED enum)
  scheduledFor?: string;                       // ISO; set by the schedule arm
  contentId?: string;                          // set on first publish; preserved on re-edit so PATCH targets the row
  cursor: number;                              // PERSISTED so re-open resumes the step
}
```

### Substrate registry + render args (description §3) — strongly typed per kind, NOT erased

```ts
export type SlotConfigFor<K extends SlotKind> =
  K extends "metadataFields" ? MetadataSlotConfig :
  K extends "bodySlot" ? BodySlotConfig :
  K extends "mediaSlot" ? MediaSlotConfig : never;

export type SlotValueFor<K extends SlotKind> =
  K extends "metadataFields" ? Record<string, unknown> :
  K extends "bodySlot" ? BodySlotValue :
  K extends "mediaSlot" ? MediaSlotValue : never;

export interface SlotRenderArgs<K extends SlotKind = SlotKind> {
  slotConfig: SlotConfigFor<K>;
  value: SlotValueFor<K> | undefined;
  onChange: (next: SlotValueFor<K>) => void;
  ctx: ComposerStepCtx;
  handleRef: Ref<SlotHandle<SlotValueFor<K>>>; // the shell threads a ref the substrate populates with a uniform SlotHandle
}

export interface SlotSubstrate<K extends SlotKind = SlotKind> {
  kind: K;
  render: (args: SlotRenderArgs<K>) => ReactNode;
}

/** Strongly-typed map keyed by the 3 closed kinds (NOT Map<string,Any> like kanban). */
export type SlotSubstrateMap = Partial<{ [K in SlotKind]: SlotSubstrate<K> }>;
```

### SlotHandle (description §3/§9) — uniform across all three asymmetric slots

```ts
export interface SlotHandle<TValue = unknown> {
  getValue: () => TValue;            // current slot value for the ComposerDraft snapshot
  getIsDirty: () => boolean;         // aggregated into the shell's OR-of-three dirty
  validate: () => Promise<boolean>;  // BLOCKING gate primitive (QP-9). metadata → await trigger() then isValid()
  loadValue: (value: TValue) => void;// re-seed on autosave-restore / re-edit. RESETS the dirty baseline
}
```

### Adapter (description §5) — pure forward+inverse fns, NOT components

```ts
export interface ContentTypeAdapter<TItem> {
  contentType: string;
  toContentItem: (draft: ComposerDraft, ctx: { now: Date; currentUser?: { id: string; name: string } }) => TItem;
  fromContentItem: (item: TItem) => { draft: Partial<ComposerDraft>; mediaInitialSource?: InitialSource };
}
export type AdapterRegistry = Record<string, ContentTypeAdapter<ContentCardItem>>;
```

### Publish intent + FSM surface (description §7)

```ts
export type PublishMode = "draft" | "publish" | "schedule";
export type PublishIntent =
  | { mode: "draft" }
  | { mode: "publish" }
  | { mode: "schedule"; publishAt: Date }; // required + must be future

export type ComposerPhase =
  | "idle" | "editing" | "autosaving" | "validating" | "draft-saved"
  | "scheduling" | "scheduled" | "publishing" | "published" | "publish-error";

export interface GateResult {
  ok: boolean;
  firstInvalidStepId?: string;
  firstInvalidField?: string;
  errors?: Record<string, string[]>;          // per-step error messages
}
```

### Per-mount context (description §10) — workspace useAreaContext model

```ts
export interface ComposerCtx {
  contentType: string;
  phase: ComposerPhase;
  cursor: number;
  steps: ComposerStep[];
  isDirty: boolean;
  stepErrors: Record<string, string[]>;
  publishModes: PublishMode[];
  goToStep: (n: number) => Promise<GateResult>;
  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
  schedule: (at: Date) => Promise<void>;
}

/** Returned by useComposerStep() — throws outside a step subtree. */
export interface ComposerStepCtx {
  stepId: string;
  contentType: string;
  mode: "inline" | "dialog";
  isDirty: boolean;
  stepErrors: string[];
}
```

### Public component props + handle (description §9 — verbatim)

```ts
export interface ContentComposer01Props {
  // The config (JSON)
  config: ComposerConfig;
  substrates?: SlotSubstrateMap;                 // defaults shipped + spreadable + overridable

  // Re-edit
  initialItem?: ContentCardItem;                 // drives the INVERSE adapter (item.image → media initialSource)
  initialBody?: BodySlotValue;                   // persisted body — NOT on ContentCardItem (§5)

  // Presentation
  presentation?: "inline" | "dialog" | "auto";   // default "auto"
  isOpen?: boolean;                              // dialog mode only
  onClose?: () => void;                          // dialog mode only

  // Draft state (controlled triplet — copy useKanbanState)
  value?: ComposerDraft;
  defaultValue?: ComposerDraft;
  onChange?: (draft: ComposerDraft) => void;

  // Autosave (split: per-mutation vs debounced — QP-4)
  autosave?: boolean;                            // default true
  onDraftChange?: (draft: ComposerDraft) => void;            // per mutation
  onAutosave?: (draft: ComposerDraft) => void | Promise<void>; // debounced (~800ms)

  // Lifecycle exits (emit assembled ContentItem; affordance-gated by callback presence)
  onSaveDraft?: (item: ContentCardItem) => void | Promise<void>;
  onPublish?:  (item: ContentCardItem) => void | Promise<void>;
  onSchedule?: (item: ContentCardItem, publishAt: Date) => void | Promise<void>;

  // The SHELL owns upload (DELTA vs media-editor-01 — QP-8)
  uploader?: (blob: Blob, meta: ExportMetadata) => Promise<{ url: string }>; // primary
  uploadUrl?: string;                                                        // convenience shorthand

  // Slots (escape hatches)
  renderPublishCTA?: (ctx: ComposerCtx) => ReactNode;
  renderStepChrome?: (ctx: ComposerCtx) => ReactNode;

  ref?: Ref<ContentComposer01Handle>;
}

export interface ContentComposer01Handle {
  saveDraft(): Promise<void>;
  publish(): Promise<void>;
  schedule(at: Date): Promise<void>;
  goToStep(n: number): Promise<GateResult>;
  getIsDirty(): boolean;
  getDraft(): ComposerDraft;
  loadDraft(draft: ComposerDraft): void;
}
```

### Exported hook + helper signatures (description §10)

```ts
export interface UseComposerStateArgs {
  contentType: string;
  value?: ComposerDraft;
  defaultValue?: ComposerDraft;
  onChange?: (next: ComposerDraft) => void;     // === onDraftChange (per-mutation, both modes)
}
export type UseComposerContext = () => ComposerCtx;   // throws outside the composer subtree
export type UseComposerStep = () => ComposerStepCtx;  // throws outside a step subtree
export type FindSubstrate = <K extends SlotKind>(substrates: SlotSubstrateMap, key: K) => SlotSubstrate<K> | undefined;
```

---

## FSM transition table + reducer (description §7)

Two **orthogonal** axes (§7 "status axis orthogonal to the step cursor; step nav lives UNDER editing"):

- **`ComposerPhase`** — ephemeral runtime machine state. **NOT** persisted in `ComposerDraft`; modeled as a separate `phaseReducer` so the draft stays pure JSON (§6 "ONE JSON-serializable draft").
- **`ComposerDraft.status`** (`ContentStatus`) — the persisted publish axis; written only by the draft reducer's `set-status` on the terminal-ish arms; maps 1:1 to `ContentCardItem.status`.
- **`cursor`** — persisted step axis; mutated **only** while `phase === "editing"` (free backward, gated forward).

**`schedule` = `publish` with a future `publishAt`** (§7) — NOT a separate terminal. One `intentAccepted` action discriminated on `PublishIntent.mode` fans out to `publishing` vs `scheduling`.

### Transition table

| # | From | → To | Trigger | Guard | Effect | Persisted-status |
|---|---|---|---|---|---|---|
| T1 | `idle` | `editing` | mount with `config` | — | seed draft from `defaultValue`/`value`/`fromContentItem(initialItem)`; `cursor=0` | stays `"draft"` (or inverse-adapter value on re-edit) |
| T2 | `editing` | `editing` | `next()` / `goToStep(n>cursor)` | **`canAdvance(step)`** — runs the BLOCKING gate (§gates) | PASS: `setCursor(n)` + focus first interactive. FAIL: **refused** (stays), focus first invalid field, announce | — |
| T3 | `editing` | `editing` | `goToStep(n≤cursor)` | none — backward is free | `setCursor(n)` | — |
| T4 | `editing` | `editing` | any `SlotHandle` onChange | — | `dispatch(set-step-value)`; fire `onDraftChange`; rearm autosave debounce | — |
| T5 | `editing` | `autosaving` | debounce fires AND `getAggregateIsDirty()` | `autosave !== false` AND `onAutosave` wired | `await onAutosave(snapshot)`; on success **re-baseline every slot** (clears dirty) | unchanged |
| T6 | `autosaving` | `editing` | autosave settled | — | re-baselined on success; on reject keep dirty + retry next debounce | unchanged |
| T7 | `editing` | `validating` | `saveDraft()` / `publish()` / `schedule(at)` | — | run **ALL** steps' gates (§gates, "re-run all") | — |
| T8 | `validating` | `editing` | any gate FAILS | — | jump cursor to first invalid step; focus first invalid field; announce | unchanged |
| T9 | `validating` | `draft-saved` | gates pass AND intent `{mode:"draft"}` | — | `await onSaveDraft(toContentItem(draft))` | **`set-status("draft")`** |
| T10 | `validating` | `publishing` | gates pass AND intent `{mode:"publish"}` | `onPublish` wired | upload-on-publish (`handle.export()` → `uploader` → write `exportedUrl`); `await onPublish(item)` | (set on success, T13) |
| T11 | `validating` | `scheduling` | gates pass AND `{mode:"schedule",publishAt}` | `onSchedule` wired AND `publishAt` future | upload-on-publish; `await onSchedule(item, publishAt)` | (set on success, T14) |
| T12 | `draft-saved` | `editing` | ack settles (microtask) | — | transient ack — settle back to editing | — |
| T13 | `publishing` | `published` | `onPublish` resolves | — | `set-content-id` if first publish | **`set-status("published")`**; `publishedAt=now` (adapter) |
| T14 | `scheduling` | `scheduled` | `onSchedule` resolves | — | `set-content-id` if first publish | **`set-status("scheduled")`**; `scheduledFor=publishAt` (adapter) |
| T15 | `publishing`/`scheduling` | `publish-error` | `onPublish`/`onSchedule` rejects | — | surface error; keep draft + uploaded url (no re-upload on retry) | unchanged |
| T16 | `publish-error` | `validating` | retry | — | re-run all gates (idempotent) | unchanged |
| T17 | `publish-error` | `editing` | dismiss / fix | — | return to editing at current cursor | unchanged |

**Orthogonality invariant:** `cursor` is read/written only in T2/T3 (`editing`); persisted `status` only in T9/T13/T14. No transition writes both.

### Draft reducer (`lib/reducer.ts`) — owns the serializable draft only

```ts
import type { ComposerDraft, ComposerStepValue, ContentStatus } from "../types";

export type ComposerAction =
  | { type: "replace"; draft: ComposerDraft }                            // hydration / loadDraft / fromContentItem re-seed / autosave restore (kanban `replace` arm)
  | { type: "set-step-value"; stepId: string; value: ComposerStepValue } // per-mutation (T4)
  | { type: "set-cursor"; cursor: number }                              // cursor-under-editing (gated forward, enforced by shell before dispatch)
  | { type: "set-status"; status: ContentStatus }                       // persisted-status projection (T9/T13/T14)
  | { type: "set-scheduled-for"; scheduledFor: string | undefined }
  | { type: "set-content-id"; contentId: string };

export function composerReducer(state: ComposerDraft, action: ComposerAction): ComposerDraft {
  switch (action.type) {
    case "replace":
      return action.draft;                                              // full swap — no merge (kanban semantics)
    case "set-step-value":
      return { ...state, steps: { ...state.steps, [action.stepId]: action.value } };
    case "set-cursor":
      return state.cursor === action.cursor ? state : { ...state, cursor: action.cursor };
    case "set-status":
      return state.status === action.status ? state : { ...state, status: action.status };
    case "set-scheduled-for":
      return { ...state, scheduledFor: action.scheduledFor };
    case "set-content-id":
      return { ...state, contentId: action.contentId };
    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}

export function makeEmptyDraft(contentType: string): ComposerDraft {
  return { contentType, steps: {}, status: "draft", cursor: 0 };        // kanban EMPTY analog (use-kanban-state.ts:7)
}
```

### Phase reducer (`lib/phase-reducer.ts`) — ephemeral, OUT of the draft

```ts
import type { ComposerPhase, PublishIntent } from "../types";

export type PhaseAction =
  | { type: "start" } | { type: "autosave-begin" } | { type: "autosave-end" }
  | { type: "validate-begin" } | { type: "gate-fail" }
  | { type: "intent-accepted"; intent: PublishIntent }
  | { type: "draft-ack" } | { type: "publish-resolved" } | { type: "schedule-resolved" }
  | { type: "publish-rejected" } | { type: "retry" } | { type: "dismiss-error" };

export function phaseReducer(phase: ComposerPhase, action: PhaseAction): ComposerPhase {
  switch (action.type) {
    case "start":            return phase === "idle" ? "editing" : phase;
    case "autosave-begin":   return phase === "editing" ? "autosaving" : phase;
    case "autosave-end":     return phase === "autosaving" ? "editing" : phase;
    case "validate-begin":   return phase === "editing" || phase === "publish-error" ? "validating" : phase;
    case "gate-fail":        return phase === "validating" ? "editing" : phase;
    case "intent-accepted": {
      if (phase !== "validating") return phase;
      // schedule = publish + future publishAt; ONE action fans out — NOT a separate terminal machine
      return action.intent.mode === "draft" ? "draft-saved"
           : action.intent.mode === "publish" ? "publishing" : "scheduling";
    }
    case "draft-ack":        return phase === "draft-saved" ? "editing" : phase;
    case "publish-resolved": return phase === "publishing" ? "published" : phase;
    case "schedule-resolved":return phase === "scheduling" ? "scheduled" : phase;
    case "publish-rejected": return phase === "publishing" || phase === "scheduling" ? "publish-error" : phase;
    case "retry":            return phase === "publish-error" ? "validating" : phase;
    case "dismiss-error":    return phase === "publish-error" ? "editing" : phase;
    default: {
      const _exhaustive: never = action;
      return phase;
    }
  }
}
```

### `useComposerState` (`hooks/use-composer-state.ts`) — verbatim fork of kanban `useKanbanState`

```ts
import * as React from "react";
import type { ComposerDraft, ComposerPhase } from "../types";
import { composerReducer, makeEmptyDraft, type ComposerAction } from "../lib/reducer";
import { phaseReducer, type PhaseAction } from "../lib/phase-reducer";

export interface UseComposerStateReturn {
  draft: ComposerDraft;
  dispatch: (action: ComposerAction) => void;
  phase: ComposerPhase;
  dispatchPhase: (action: PhaseAction) => void;
}

export function useComposerState({
  contentType, value, defaultValue, onChange,
}: {
  contentType: string;
  value?: ComposerDraft;
  defaultValue?: ComposerDraft;
  onChange?: (next: ComposerDraft) => void;
}): UseComposerStateReturn {
  // ALWAYS keep an internal reducer (kanban pattern) — used only when uncontrolled.
  const [internal, internalDispatch] = React.useReducer(
    composerReducer,
    defaultValue ?? makeEmptyDraft(contentType),
  );
  const isControlled = value !== undefined;
  const draft = isControlled ? value! : internal;

  // latest-onChange ref — stable dispatch identity across parent re-renders (media-editor-01.tsx:165-173).
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const dispatch = React.useCallback((action: ComposerAction) => {
    // GOTCHA: reduce over the DERIVED draft, NOT `internal` — controlled-mode correctness (use-kanban-state.ts:25).
    const next = composerReducer(isControlled ? value! : internal, action);
    if (!isControlled) internalDispatch(action);  // internal store only when uncontrolled
    onChangeRef.current?.(next);                   // per-mutation onDraftChange — BOTH modes (use-kanban-state.ts:26-27)
  }, [isControlled, value, internal]);

  // ephemeral FSM phase — NOT persisted (kept out of ComposerDraft, §6).
  const [phase, dispatchPhase] = React.useReducer(phaseReducer, "idle" as ComposerPhase);

  return { draft, dispatch, phase, dispatchPhase };
}
```

Shell wiring (mirrors `kanban-board-01.tsx:47-48`):
```ts
const { draft, dispatch, phase, dispatchPhase } = useComposerState({
  contentType: config.adapterId, value, defaultValue, onChange: onDraftChange,
});
const substrateMap = { ...DEFAULT_SUBSTRATES, ...substrates };  // Partial<Record<SlotKind, SlotSubstrate>>
```

---

## SlotHandle uniformity contract (description §3)

The uniform `SlotHandle { getValue, getIsDirty, validate, loadValue }` hides three asymmetric substrates. The shell reads all three identically; each substrate populates its `handleRef` in its `render` closure (`useRef`, captured via `onReady` for json-form, via `ref` for media).

| Slot | `getValue` | `getIsDirty` | `validate` | `loadValue` |
|---|---|---|---|---|
| `metadataFields` | `formApi.getValues()` | `formApi.isDirty()` | `await formApi.trigger()` **then** `formApi.isValid()` | `formApi.reset(v)` (clears dirty + history) |
| `bodySlot` | current `BodySlotValue` | **shell-derived** baseline JSON-compare (§autosave) — Plate has NO dirty signal | config `minLength` over flattened text vs `ARTICLE_BODY_EMPTY_VALUE` | `setBodyValue(v)` + **reset baseline** |
| `mediaSlot` | `{ editorState: handle.getState() with videoBlob nulled, exportedUrl, pendingBlobRef }` | `handle.getIsDirty()` | shell-owned: `!!value.exportedUrl \|\| handle.getIsDirty()` (only if config marks the hero required) | `handle.loadState(reconstituted)` + media re-opens via `initialSource:{kind:"url"}` |

Per-slot substrate adapter signatures (the three default substrate records in `lib/substrates.ts`, exported spreadable like `kanbanCardRenderer`):

```ts
export const jsonFormSubstrate: SlotSubstrate<"metadataFields"> = { kind: "metadataFields", render: (args) => /* mounts <JsonForm> */ null };
export const articleBodySubstrate: SlotSubstrate<"bodySlot"> = { kind: "bodySlot", render: (args) => /* lazy <ArticleBodyEditor> or <Textarea> per slotConfig.substrate */ null };
export const mediaEditorSubstrate: SlotSubstrate<"mediaSlot"> = { kind: "mediaSlot", render: (args) => /* mounts <MediaEditor01> + clampMediaSources */ null };

export const DEFAULT_SUBSTRATES: SlotSubstrateMap = {
  metadataFields: jsonFormSubstrate,
  bodySlot: articleBodySubstrate,   // dispatches plate-vs-plaintext on slotConfig.substrate
  mediaSlot: mediaEditorSubstrate,
};

export const findSubstrate: FindSubstrate = (substrates, key) => substrates[key]; // analogous to kanban findRenderer (kanban-board-01.tsx:216), but a keyed-MAP object-index — NOT an array .find()
```

**`getValue` for media composes the shell-side wrapper** (`exportedUrl` / `pendingBlobRef` are shell concepts media-editor doesn't know) and **nulls `videoBlob`** before persisting — `snapshotForPersist` strips the non-serializable Blob. `loadValue(v)` clears dirty per RHF/media reset semantics; the FSM must NOT infer "unsaved" purely from aggregate dirty immediately after a reset-load.

**Video-restore blob re-attach (locked invariant — like the Plate baseline-reset).** Because `getValue` nulls `videoBlob`, `loadValue` for a **video-mode** draft MUST re-attach a real `Blob` into `videoBlob` BEFORE `handle.loadState(reconstituted)` — sourced from the shell-held `Map<string,Blob>` via `pendingBlobRef`, or re-fetched from `exportedUrl` (`fetch(url).then(r => r.blob())`). Without it, video re-edit restores with an empty source. **Photo mode** round-trips through the `imageSrc` string only (no blob re-attach). The SlotHandle table's `mediaSlot.loadValue` cell assumes this step.

json-form `onReady` ref-guard capture (json-form.tsx:108-121) — capture `formApi` once post-mount, do NOT read the `ref` in an effect:
```ts
<JsonForm onReady={({ formApi }) => { handleRef.current = makeJsonFormSlotHandle(formApi); }} ... />
```

---

## Autosave + dirty split (description §8, QP-4)

The QP-4 split is **structural** — two callbacks at two altitudes, NOT one callback at two frequencies.

| Callback | When | Where it lives | Debounce |
|---|---|---|---|
| `onDraftChange(draft)` | every draft mutation | the synchronous `onChange?.(next)` INSIDE `useComposerState` dispatch | none — per-mutation by contract |
| `onAutosave(draft)` | debounce fires AND dirty AND `phase ∈ {editing, draft-saved}` | a **separate** effect on `draft`, skip-initial-mount | `config.autosave.debounceMs ?? 800` |

**Rule (load-bearing):** the debounce must NOT live inside the dispatch callback — that callback IS the per-mutation `onDraftChange` path. The autosave debounce is a downstream effect watching `draft` (mirrors `workspace.tsx:104-118` ref-stable callback + `prevDraftRef` skip-initial-mount).

```ts
// hooks/use-autosave.ts
const onAutosaveRef = React.useRef(onAutosave);
React.useEffect(() => { onAutosaveRef.current = onAutosave; }, [onAutosave]);
const prevDraftRef = React.useRef<ComposerDraft | null>(null);
const phaseRef = React.useRef(phase);                                          // fire-time phase (see timer guard)
React.useEffect(() => { phaseRef.current = phase; }, [phase]);

React.useEffect(() => {
  if (prevDraftRef.current === null) { prevDraftRef.current = draft; return; } // skip initial mount
  prevDraftRef.current = draft;
  if (autosave === false || !onAutosaveRef.current) return;                    // affordance-gate (QP-4)
  if (phase !== "editing" && phase !== "draft-saved") return;                  // only while editing/draft (§8)
  if (!getAggregateIsDirty()) return;                                          // dirty-gated
  const ms = config.autosave?.debounceMs ?? 800;
  const id = setTimeout(async () => {
    // Re-check phase AT FIRE TIME: the effect cleanup (deps [draft, phase]) clears the timer
    // on a phase change, but this guard also closes the React-batching window where a Publish/
    // Schedule could flip phase between the timer firing and cleanup running — so the in-flight
    // `await onAutosave` side-effect is never started against a publishing draft.
    if (phaseRef.current !== "editing" && phaseRef.current !== "draft-saved") return;
    dispatchPhase({ type: "autosave-begin" });               // T5
    try {
      await onAutosaveRef.current!(snapshotForPersist(draft)); // snapshot nulls videoBlob, drops blob; keeps exportedUrl + editorState + cursor + status
      rebaselineAllSlots();                                  // ← re-baseline on success — THE #1 trap
    } finally {
      dispatchPhase({ type: "autosave-end" });               // T6
    }
  }, ms);
  return () => clearTimeout(id);
}, [draft, phase]);
```

**Dirty = OR across the three SlotHandles:**
```ts
function getAggregateIsDirty(): boolean {
  return (["metadataFields","bodySlot","mediaSlot"] as const).some((k) => slotHandles.current[k]?.getIsDirty() === true);
}
```

### Plate baseline mechanism (#1 implementation trap — LOAD-BEARING)

`<ArticleBodyEditor>` exposes **NO** dirty surface (props are `value/defaultValue/onChange/onSave/readOnly/placeholder/onImageUpload/...hideToolbar/autoFocus` only). The shell derives bodySlot dirty by baseline JSON-compare, reusing article-body-01's OWN content key (`article-body-01.tsx:148-154` — `JSON.stringify` is adequate; Plate JSON has no functions/cycles):

```ts
// hooks/use-body-dirty.ts
function bodyContentKey(v: BodySlotValue): string {
  try { return typeof v.value === "string" ? v.value : JSON.stringify(v.value); }
  catch { return String(Math.random()); }  // over-sync on the cycle edge, never skip
}
// dirty = bodyContentKey(current) !== baselineRef.current
// Empty sentinels (both pinned, used by bodyValidate's blocking gate):
//   richtext-empty → flattened-text length 0 vs ARTICLE_BODY_EMPTY_VALUE
//   plaintext-empty → trimmed empty string ("")
// A bodySlot step with an empty value fails the config minLength gate identically for either substrate.
```

**The trap:** `baselineRef` MUST reset after **every successful save/autosave** (in `rebaselineAllSlots()`) AND on `loadValue()`. If it does NOT reset, the body reports permanently-dirty, `getAggregateIsDirty()` stays `true`, the autosave effect keeps firing, and **autosave loops forever.** This is the single most error-prone line in the procomp — a plan-locked invariant.

The two slots that own dirty re-baseline natively: json-form via `formApi.reset(formApi.getValues())`; media is clean post-export+upload (or on `loadState`). `rebaselineAllSlots()` calls all three.

> Media-dirty rearm uses `onDirtyChange(true)`, NOT `onEditAction` — media-editor v0.1.x emits only nav/lifecycle EditActions (mode-change/tool-open/tool-close/reset); content-mutation events land in its v0.2. Wiring autosave to `onEditAction` would silently miss text/sticker/draw/filter/adjust/crop edits.

---

## Validation gates — evaluation ORDER (description §7, QP-9)

Config-sourced, **BLOCKING**, run **imperatively** at advance/publish (not continuous). Forward-gated / backward-free. Publish/Schedule re-runs **ALL** gates. **Explicitly DISTINCT** from the non-blocking missing-substrate fallback (§next).

> **`StepValidation.mode` is advisory for `metadataFields` steps.** A metadata slot can only validate one way — `formApi.trigger()` + `isValid()` — so `evaluateStepGate` runs that uniformly and `mode: "all-fields-valid"` is the effective (and only) behavior there. `mode: "custom"` + `rules` change behavior **only** for `bodySlot` (minLength vs the empty sentinel) and `mediaSlot` (`mediaRequired`) steps; a `custom` rule declared on a `metadataFields` step is silently ignored. (GATE-2 follow-up option: narrow `StepValidation` per slot kind so this can't be mis-declared.)

### Navigation directions

```ts
async function goToStep(target: number): Promise<GateResult> {
  if (phase !== "editing") return { ok: false };
  if (target <= draft.cursor) { dispatch({ type: "set-cursor", cursor: target }); return { ok: true }; } // BACKWARD = FREE
  for (let i = draft.cursor; i < target; i++) {                  // forward: every intervening step must pass
    const res = await evaluateStepGate(i);
    if (!res.ok) { jumpToFirstInvalid(i, res); return res; }     // STAYS + surfaces errors (T2 blocked)
  }
  dispatch({ type: "set-cursor", cursor: target });
  focusFirstInteractive(config.steps[target].id);
  return { ok: true };
}
```

### Single-step gate

```ts
async function evaluateStepGate(stepIndex: number): Promise<GateResult> {
  const step = config.steps[stepIndex];
  if (step.optional && isStepEmpty(stepIndex)) return { ok: true };                           // optional + untouched → pass
  if (step.visibleWhen && !evalCondition(step.visibleWhen, allValues())) return { ok: true }; // hidden step → skip gate
  const handle = slotHandles.current[step.slot];
  if (!handle) return { ok: true };  // missing substrate is a RENDER fallback (§fallback), NOT a gate fail — never block on it
  const valid = await handle.validate();                                                      // the uniform SlotHandle.validate()
  return valid ? { ok: true } : { ok: false, firstInvalidStepId: step.id };
}
```

### Per-slot `validate()` — ORDER MATTERS for metadata

```ts
// metadataFields → json-form. trigger() THEN isValid(). validationMode defaults to "onTouched" —
// a NEVER-TOUCHED required field reports valid until trigger() force-validates ALL fields (§7 verbatim).
metadataValidate = async () => { const t = await formApi.trigger(); return t && formApi.isValid(); };

// bodySlot → config minLength over flattened Plate text vs the empty sentinel
bodyValidate = async () => {
  const rule = stepConfig.validation?.rules?.find((r) => r.minLength != null);
  if (!rule?.minLength) return true;
  if (bodyContentKey(current) === bodyContentKey({ kind: "richtext", value: ARTICLE_BODY_EMPTY_VALUE })) return false;
  return flattenPlainText(current).length >= rule.minLength;
};

// mediaSlot → required hero present OR dirty (capture-in-progress counts)
mediaValidate = async () => {
  if (!stepConfig.validation?.rules?.some((r) => r.mediaRequired)) return true;
  return !!current.exportedUrl || mediaHandle.getIsDirty();
};
```

### Publish / Schedule re-runs ALL gates (§7 verbatim)

Save-draft does NOT gate. Publish/Schedule run **every** step's gate in cursor order before exiting `editing` (T7):

```ts
async function runAllGates(): Promise<GateResult> {                 // T7 editing → validating
  dispatchPhase({ type: "validate-begin" });
  for (let i = 0; i < config.steps.length; i++) {
    const res = await evaluateStepGate(i);
    if (!res.ok) { dispatch({ type: "set-cursor", cursor: i }); jumpToFirstInvalid(i, res); dispatchPhase({ type: "gate-fail" }); return res; } // T8
  }
  return { ok: true };                                              // → intent-accepted (T9/T10/T11)
}
```

**Gate-evaluation ORDER (locked spine):** (1) `goToStep(higher)` → `evaluateStepGate` per intervening step, ascending; first fail STAYS+focuses. (2) `goToStep(≤cursor)` → no gate. (3) `publish`/`schedule` → `runAllGates` over ALL steps, ascending; first fail sets cursor + focuses, aborts. (4) per step: optional+empty → pass; hidden → pass; **missing substrate → pass** (render concern); else `await handle.validate()`. (5) per slot: metadata = `trigger()` then `isValid()`; body = minLength vs `ARTICLE_BODY_EMPTY_VALUE`; media = `!!exportedUrl || getIsDirty()`.

Focus-jump (description §11): `jumpToFirstInvalid` sets cursor, focuses `formApi.focus(field)` for metadata or the step region for body/media, and announces via the `role="status"` live region.

---

## Non-blocking missing-substrate fallback (description §3 gotcha)

**DISTINCT from the blocking gate.** A referenced slot-kind with no registered substrate renders a **visible degraded fallback + one-shot `console.warn`** (kanban `MissingRendererFallback` model) — **NEVER a throw, NEVER a gate block.**

| | Missing-substrate fallback | Validation gate |
|---|---|---|
| Trigger | a step's `slot` key has no substrate-registry entry | a step's `validate()` returns `false` |
| Behavior | render degraded card + `console.warn` once | **block** the forward transition; stay + focus |
| Blocks navigation? | **NO** — degraded render | **YES** |
| At the gate | `if (!handle) return { ok: true }` — passes | the actual block path |

```ts
// parts/missing-substrate.tsx — VERBATIM port of kanban-board-01/parts/missing-renderer.tsx
const warned = new Set<string>();   // MODULE-LEVEL — warns once per slot-kind per process, NOT per render (kanban missing-renderer.tsx:17)
export function warnMissingSubstrate(slotKind: string) {
  if (warned.has(slotKind)) return;
  warned.add(slotKind);
  if (typeof console !== "undefined") console.warn(`[content-composer-01] No substrate registered for slot="${slotKind}". Provide one via the substrates prop (defaults ship for metadataFields/bodySlot/mediaSlot).`);
}
export function MissingSubstrateFallback({ slotKind }: { slotKind: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-xs">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-destructive">Substrate not found</span>
        <span className="font-mono text-[10px] text-muted-foreground">{slotKind}</span>
      </div>
    </div>
  );
}
```

Lookup site (`parts/slot-mount.tsx`, mirrors kanban `item-renderer.tsx:15`):
```ts
const substrate = findSubstrate(mergedSubstrates, step.slot);
if (!substrate) { warnMissingSubstrate(step.slot); return <MissingSubstrateFallback slotKind={step.slot} />; } // degraded — nav still works
return substrate.render({ slotConfig: step.slotConfig, value, onChange, ctx, handleRef });
```

---

## Config hydration layer + custom FieldRenderers (description §4 round-trip + §15, QP-6)

A config stays a pure `.json` file only while its `json-form` fragment is purely declarative. The hydration layer is the seam that lets a TS-authored config carry function escape-hatches while keeping the declarative SHAPE JSON-round-trippable.

### Serializable / non-serializable split (`lib/hydration.ts`)

EVERY `FieldDefinition` key is JSON-serializable EXCEPT these function-valued hydration targets: `validate`, `validateAsync`, `compute`, `options` (only when `FieldOptionsResolver`), and `visibleWhen`/`enabledWhen`/`requiredWhen` (only the **fn arm** of `ConditionOrFn` — the `Condition` OBJECT form survives JSON). Plus form-level `FormSchema.validate` (fn) + `zodSchema` (Zod instance). `expression` (string) survives; `compute` is the fn escape-hatch.

```ts
import type { FieldDefinition, FormSchema, FieldOptionsResolver, ConditionOrFn }
  from "@/registry/components/forms/json-form/types";

export interface FieldHydration {
  validate?: FieldDefinition["validate"]; validateAsync?: FieldDefinition["validateAsync"];
  compute?: FieldDefinition["compute"]; options?: FieldOptionsResolver;
  visibleWhen?: Extract<ConditionOrFn, Function>; enabledWhen?: Extract<ConditionOrFn, Function>;
  requiredWhen?: Extract<ConditionOrFn, Function>;
}
export interface SchemaHydration { validate?: FormSchema["validate"]; zodSchema?: FormSchema["zodSchema"]; }
export interface ComposerConfigHydration {
  fields: Record<string /* field.name */, FieldHydration>;
  __schema__?: SchemaHydration;
}

/** Re-attach function escape-hatches onto a deserialized FormSchema, by field name. Pure. Called BEFORE the schema reaches <JsonForm>. */
export function hydrateSchema(plain: FormSchema, hydration?: ComposerConfigHydration): FormSchema {
  if (!hydration) return plain;
  const fields = plain.fields.map((f) => { const h = hydration.fields[f.name]; return h ? { ...f, ...h } : f; });
  const sh = hydration.__schema__;
  return { ...plain, fields, ...(sh?.validate ? { validate: sh.validate } : {}), ...(sh?.zodSchema ? { zodSchema: sh.zodSchema } : {}) };
}

/** Inverse — strip all function keys to recover the pure JSON shape (round-trip invariant: stripHydration(hydrateSchema(plain,h)).plain ≡ plain). */
export function stripHydration(schema: FormSchema): { plain: FormSchema; hydration: ComposerConfigHydration } { /* per the function-key list above */ }
```

For the **news config specifically**: `slug` uses `expression: "{title}"` (serializable — NO hydration); `sensitivity.reason`'s `visibleWhen: { field: "sensitivity.isSensitive", truthy: true }` is the Condition OBJECT form (serializable — NO hydration). **The news v0.1 config needs ZERO hydration entries** — the seam exists for future `post`/`event`/`project` configs needing `compute` / async `options`.

> Loader must call `hydrateSchema` BEFORE the schema reaches `<JsonForm>` (so RHF/Zod see the real fns).

### Custom FieldRenderers for json-form gaps — `tags` + `author-picker`

json-form's built-in `FieldType` covers text/choice/date/code/slider/rating/richtext/computed/hidden/section/divider only — NO chip-input-with-create, NO entity-picker. Both ship as **content-composer-owned** custom `FieldRenderer`s, registered via `JsonFormProps.fieldRegistry` (the supported extension path), referenced from JSON by `type` string (`FieldType` allows arbitrary `(string & {})`). Set `dependsOn: []` on these fields (they don't read `allValues`) to opt into snapshot mode.

```tsx
// parts/field-tags.tsx — chip-input-with-create
export const tagsFieldRenderer = defineFieldRenderer<string[]>({
  displayName: "ComposerTagsField",
  impl: ({ value, onChange, onBlur, disabled, readOnly, ariaProps }) => {
    const tags = Array.isArray(value) ? (value as string[]) : [];   // defensive (RHF holds whatever it holds — defineFieldRenderer narrows types only, not runtime)
    const [draft, setDraft] = useState("");
    const add = () => { const t = draft.trim(); if (t && !tags.includes(t)) onChange([...tags, t]); setDraft(""); };
    return (
      <div role="group" aria-labelledby={ariaProps.labelledBy} className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1">{t}
            <button type="button" aria-label={`Remove ${t}`} disabled={disabled || readOnly} onClick={() => onChange(tags.filter((x) => x !== t))}><X className="size-3" /></button>
          </Badge>
        ))}
        <Input value={draft} disabled={disabled || readOnly} className="h-7 w-32 flex-1" onChange={(e) => setDraft(e.target.value)} onBlur={onBlur}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} placeholder="Add tag…" />
      </div>
    );
  },
});

// parts/field-author-picker.tsx — entity-picker (manages its OWN async fetch outside json-form's options machinery).
// SECOND generic carries the composer-owned `authorSource` config so `field.config.authorSource` is STRONGLY TYPED
// (not an implicit `unknown` widening). `authorSource` is a CONTENT-COMPOSER-OWNED config convention — NOT a
// json-form built-in: the real `FieldConfig` (json-form/types.ts:46-53) is closed (code/date/rating/richText only).
type AuthorEntity = { id: string; name: string; avatar?: string };
export const authorPickerFieldRenderer = defineFieldRenderer<
  AuthorEntity | null,
  { authorSource?: (query: string) => Promise<AuthorEntity[]> }
>({
  displayName: "ComposerAuthorPickerField",
  impl: ({ value, onChange, onBlur, disabled, ariaProps, field }) =>
    /* Popover<Command> combobox; read value; onChange(entity); onBlur() on close; wrap trigger in role=group aria-labelledby={ariaProps.labelledBy}.
       field.config.authorSource (composer-owned async loader, typed via the TConfig generic above) supplies options;
       absent → read-only chip. */ null,
});
```

Registration in `jsonFormSubstrate.render()` — pass ONLY the custom renderers; json-form spreads them over its default registry internally (do NOT re-spread `defaultJsonFormRegistry`):
```tsx
<JsonForm
  schema={hydratedSchema}
  fieldRegistry={{ tags: tagsFieldRenderer, "author-picker": authorPickerFieldRenderer }}
  submitButton={false}                                  // shell owns publish CTA
  onSubmit={() => {}}                                   // REQUIRED prop (json-form/types.ts:316) — no-op
  onReady={({ formApi }) => { handleRef.current = makeJsonFormSlotHandle(formApi); }}
  onChange={({ values }) => onChange(values)}
  onChangeDebounce={0}                                  // per-mutation onDraftChange; shell owns the 800ms autosave debounce
  values={controlledValues}                             // controlled echo (ChangeBridge stableStringify echo-guard makes this loop-safe — json-form.tsx:226-247)
/>
```

> Every custom `type` string MUST have a matching `fieldRegistry` entry or json-form renders the `__fallback__` renderer at runtime. (The description also lists `location`/`milestones` as future gap renderers — same mechanism, deferred past news v0.1.)

---

## News adapter pair (against `ContentCardItem`) (description §5)

Co-located in `configs/news-composer.config.ts` (QP-7), exported as a pure forward+inverse pair, selected by `config.adapterId === "news-content-item"` from `adapters/adapter-registry.ts`. Forward target = the **real shipped `ContentCardItem`** (`content-card-news-01/types.ts:144`).

```ts
const NEWS_STEP = { headline: "headline", hero: "hero", body: "body", meta: "meta", gates: "gates" } as const;
```

### Forward — `toContentItem(draft, ctx) → ContentCardItem`

Authors the **REQUIRED 3** + the authored-optional set; assembles nested objects from dotted json-form fields (guarding each nested object's REQUIRED field — omit the whole object if absent); derives status as a 1:1 pass-through (`ComposerDraft.status` IS `ContentStatus`); and **OMITS** (never sets, not zeroes) the 8 runtime/backend-derived fields so the page's PATCH/merge preserves engagement.

```ts
function toContentItem(draft: ComposerDraft, ctx: { now: Date; currentUser?: { id: string; name: string } }): ContentCardItem {
  const headline = metaBag(draft, NEWS_STEP.headline), meta = metaBag(draft, NEWS_STEP.meta), gates = metaBag(draft, NEWS_STEP.gates);
  const media = mediaValue(draft, NEWS_STEP.hero);

  // ── REQUIRED (3) ──
  const id = draft.contentId ?? `news-${ctx.now.getTime()}`;        // preserve across re-edit; mint fallback on first author
  const title = str(headline.title);
  if (!title) throw new Error("news adapter: `title` required — gate should have blocked publish.");
  const image = str(media?.exportedUrl);                           // the UPLOADED hero URL — see the publish-time flag below
  if (!image) throw new Error("news adapter: `image` (uploaded hero URL) missing — shell must upload before toContentItem (QP-10).");

  const status: ContentStatus = draft.status;                      // 1:1 pass-through (same CLOSED 4-enum)
  const authorEntity = buildAuthorEntity(meta);                   // guards id+name; omits if absent
  const publisher = buildPublisher(meta);                        // guards id+name
  const sensitivity = buildSensitivity(gates);                   // emits only when isSensitive===true
  const paywall = buildPaywall(gates);                           // emits only when isPaywalled===true

  return {
    id, title, image, status,
    ...(str(headline.slug) ? { slug: str(headline.slug) } : {}),
    ...(str(headline.excerpt) ? { excerpt: str(headline.excerpt) } : {}),   // authored lead — NOT a body projection (body is the separate leg)
    ...(str(meta.category) ? { category: str(meta.category) } : {}),
    ...(num(meta.readTime) !== undefined ? { readTime: num(meta.readTime) } : {}),
    ...(str(meta.language) ? { language: str(meta.language) } : {}),
    ...(strArr(meta.topics) ? { topics: strArr(meta.topics) } : {}),
    ...(strArr(meta.tags) ? { tags: strArr(meta.tags) } : {}),
    ...(str(gates.visibility) ? { visibility: gates.visibility as NewsVisibility } : {}),  // EXTENSIBLE — any string passes
    ...(bool(gates.isPinned) ? { isPinned: true } : {}),
    ...(bool(gates.isFeatured) ? { isFeatured: true } : {}),
    ...(bool(gates.isBreaking) ? { isBreaking: true } : {}),
    ...(bool(gates.isExclusive) ? { isExclusive: true } : {}),
    ...(bool(gates.isSponsored) ? { isSponsored: true } : {}),
    ...(str(gates.sponsorLabel) ? { sponsorLabel: str(gates.sponsorLabel) } : {}),
    ...(authorEntity ? { authorEntity } : {}),
    ...(publisher ? { publisher } : {}),
    ...(sensitivity ? { sensitivity } : {}),
    ...(paywall ? { paywall } : {}),
    ...timestampsForStatus(draft, ctx),                            // FSM-driven publishedAt/scheduledFor/updatedAt
  };
  // ── OMITTED (NOT zeroed): likeCount/commentCount/shareCount/bookmarkCount/views/isLiked/isBookmarked/quotedArticle.
  //    Literally never assign the keys — `views: 0` would CLOBBER real engagement on the page's PATCH/merge re-edit.
}
```

Nested builders guard the REQUIRED field then omit the whole object when absent (`NewsArticleAuthor.id+name`, `NewsPublisher.id+name`, `ContentSensitivity.isSensitive===true`, `ContentPaywall.isPaywalled===true`). Sensitivity/paywall emit ONLY when the toggle is explicitly ON (an off toggle means "no gate" → omit, not `{isSensitive:false}`). Timestamps are FSM-driven, not authored fields:

```ts
function timestampsForStatus(draft: ComposerDraft, ctx: { now: Date }) {
  const nowIso = ctx.now.toISOString();
  switch (draft.status) {
    case "published": return { publishedAt: nowIso, updatedAt: nowIso };
    case "scheduled": return draft.scheduledFor ? { scheduledFor: draft.scheduledFor, updatedAt: nowIso } : { updatedAt: nowIso };
    case "draft":     return { updatedAt: nowIso };
    case "archived":  return { updatedAt: nowIso };  // FLAG: no composer path reaches "archived" — reachable only via inverse re-seed; edit-touch only
  }
}
```

### Inverse — `fromContentItem(item) → { draft, mediaInitialSource }`

Re-seeds authored fields into the metadata step bags (re-nesting `authorEntity`/`publisher` as whole objects for the custom author-picker renderer; re-seeding `sensitivity`/`paywall` as DOTTED keys for the switch/text/select fields), points the media slot at the existing hero via `mediaInitialSource: { kind:"url", url:item.image, mode:"photo" }`, and emits **NO body step** — body re-seeds via the separate `initialBody` leg.

```ts
function fromContentItem(item: ContentCardItem): { draft: Partial<ComposerDraft>; mediaInitialSource?: InitialSource } {
  const draft: Partial<ComposerDraft> = {
    contentType: "news",
    contentId: item.id,                              // preserved so re-publish PATCHes the same record
    status: item.status ?? "draft",
    ...(item.scheduledFor !== undefined ? { scheduledFor: toIso(item.scheduledFor) } : {}),
    steps: {
      [NEWS_STEP.headline]: { slot: "metadataFields", value: { title: item.title, ...(item.slug !== undefined ? { slug: item.slug } : {}), ...(item.excerpt !== undefined ? { excerpt: item.excerpt } : {}) } },
      [NEWS_STEP.meta]: { slot: "metadataFields", value: { ...optKeys(item, ["category","topics","tags","readTime","language"]), ...(item.authorEntity ? { authorEntity: item.authorEntity } : {}), ...(item.publisher ? { publisher: item.publisher } : {}) } },
      [NEWS_STEP.gates]: { slot: "metadataFields", value: { ...optKeys(item, ["visibility","isPinned","isFeatured","isBreaking","isExclusive","isSponsored","sponsorLabel"]), ...flattenDotted("sensitivity", item.sensitivity), ...flattenDotted("paywall", item.paywall), ...(item.scheduledFor !== undefined ? { scheduledFor: toIso(item.scheduledFor) } : {}) } },
      [NEWS_STEP.hero]: { slot: "mediaSlot", value: { exportedUrl: item.image } },  // re-seed exportedUrl so the required gate passes without re-capture
      // NO `body` step — body re-seeds via initialBody, not here.
    },
  };
  return { draft, mediaInitialSource: { kind: "url", url: item.image, mode: "photo" } };
}
```

### Two-directional body leg (§5 — load-bearing)

Body is **NOT** on `ContentCardItem` (the card carries only `excerpt`). **Out:** the shell exposes the raw `BodySlotValue`; the wrapping pro-page persists it to its own body column (`toContentItem` does NOT emit body — display-card projection only; HTML egress via `serializeArticleBodyToHtml(value)` — listed in description §5 as an adapter responsibility — is **consciously descoped to page-side / v0.2** here: the serializer is async/server-leaning and is NOT reachable from the `.tsx` tail import the plan locks, so the news-v0.1 client never calls it). **In:** `fromContentItem` CANNOT source body — the page reads the persisted `ArticleBodyValue` from its body column and feeds the shell separately via `initialBody?: BodySlotValue`. `ContentCardItem`-shaped fields round-trip through the adapter; the body round-trips through this separate seam.

### Exported adapter

```ts
export const newsContentItemAdapter: ContentTypeAdapter<ContentCardItem> = { contentType: "news", toContentItem, fromContentItem };
```

> **`image` is the one required field the news flow conditionally produces** — under QP-10 (lazy upload-on-publish) `exportedUrl` is empty until the shell runs `uploader()` at publish time. `toContentItem` is therefore a **publish-time-only projection**, not an any-time snapshot: the shell must `editorRef.export()` → `uploader(blob, meta)` → write `exportedUrl` → THEN call `toContentItem`. The adapter throws if `image` is missing (it is non-optional; no safe placeholder URL exists). Re-edit is fine: `image` is already a URL on the existing item, the gate passes without re-upload.

---

## media-editor-01 clamp-unknown-source rule (description §15 + §"two examples" #5)

The `post` config DECLARES `mediaSources: ["upload","library"]`, but media-editor-01's real `MediaSource` is `"camera" | "upload"` only (`media-editor-01/types.ts:129`; `"library"` deferred to its v0.2). The mediaSlot substrate must **CLAMP** the unknown `"library"` to upload-only WITHOUT crashing.

**Precedent:** media-editor-01 does NO validation of `mediaSources` — it reads membership only (`mediaSources.includes("camera")`, `.includes("upload")` — `media-editor-01.tsx:211/:304-305/:1161`). An unknown `"library"` simply fails every `.includes()` (and leaks into the dev-debug `sources:` display string at :1166-1167 if passed unfiltered). So the clamp is a **pre-filter on the way in**, mirroring the dial's own no-crash degradation — NOT a new rejection path.

```ts
// lib/clamp-media-sources.ts
import type { MediaSource } from "@/registry/components/media/media-editor-01/types";
const KNOWN: readonly MediaSource[] = ["camera", "upload"];

/** Drop any mediaSource media-editor-01 v0.1.x doesn't understand (e.g. "library"). Never throws.
 *  Falls back to ["upload"] if the filtered set is empty so the slot is never sourceless. */
export function clampMediaSources(declared: readonly string[] | undefined): MediaSource[] {
  const known = (declared ?? KNOWN).filter((s): s is MediaSource => s === "camera" || s === "upload");
  return known.length ? known : ["upload"];
}
```

Applied in `mediaEditorSubstrate.render()` — **1:1 dial passthrough; `mediaSources` is the ONLY transformed key** (every other dial is also membership-filtered inside media-editor, so over-declared arrays degrade the same way — only `mediaSources` needs an explicit clamp because `"library"` is the one value a real config emits ahead of capability):

```tsx
<MediaEditor01
  ref={mediaRefFromHandleRef}
  enabledModes={slotConfig.enabledModes}
  enabledTools={slotConfig.enabledTools}
  mediaSources={clampMediaSources(slotConfig.mediaSources)}   // ← ONLY transformed dial
  aspect={slotConfig.aspect}
  cropAspects={slotConfig.cropAspects}
  maxFileSizeMb={slotConfig.maxFileSizeMb}
  presentation="inline"                                       // forced inline inside the composer (§2) — never portals a dialog in the composer surface
  initialSource={mediaInitialSource}
  onDirtyChange={(d) => onMediaDirty(d)}                      // rearm trigger (v0.1.x onEditAction is nav/lifecycle only)
/>
```

**Export is pull-only:** the substrate holds the `MediaEditor01Handle` ref; the shell calls `handle.export()` (polymorphic — picks `exportImage`/`exportVideo` by mode; returns `Promise<{ blob, metadata }>`) ONLY at publish/schedule, feeds the blob to the QP-8 `uploader`, and writes the returned `url` as `exportedUrl`. The blob lives in the shell-held `Map<string,Blob>` via `pendingBlobRef` between edits — NEVER in `ComposerDraft` JSON. Result: news (`["upload"]`) passes untouched; post (`["upload","library"]`) degrades to `["upload"]` silently. Post ships fully only once media-editor-01 v0.2 adds `"library"` — the SAME shell + config stay valid in the interim.

---

## Cross-procomp `.tsx` import + lazy-load recipe (description §5/§14, QP-5)

### Import path — the `@/registry/...` ALIAS `.tsx` path (NOT relative, NOT the barrel)

Verified against the repo's F-S1 precedent (`json-form/parts/field-richtext.tsx:9-13`) AND the description line 48 — BOTH use the `@/registry/components/...` alias:

```ts
// parts/body-substrate-plate.tsx — copy field-richtext.tsx VERBATIM
import { ArticleBodyEditor, ARTICLE_BODY_EMPTY_VALUE, type ArticleBodyValue }
  from "@/registry/components/data/article-body-01/article-body-01";   // the .tsx file path
```

Only `ArticleBodyEditor`, `ARTICLE_BODY_EMPTY_VALUE`, and type `ArticleBodyValue` are reachable from this `.tsx` tail re-export. `ARTICLE_BODY_DEFAULT_PLACEHOLDER` and `serializeArticleBodyToHtml` are NOT in the tail — pass the placeholder as a **literal string**; the (async, server-only) serializer is out of news-v0.1 client scope.

### Lazy-load (React.lazy the ~165 KB Plate bundle; keep `<Textarea>` eager)

```tsx
// parts/body-substrate-plate.tsx — MUST `export default` (lazy import resolves the default)
export default function BodySubstratePlate({ value, onChange, slotConfig, uploader, ariaProps }: BodySubstrateProps) {
  const safe = Array.isArray(value) ? (value as ArticleBodyValue) : ARTICLE_BODY_EMPTY_VALUE;  // guard like field-richtext
  return (
    <div role="group" aria-labelledby={ariaProps.labelledBy}>     {/* Plate owns a contenteditable — no id; bind via aria-labelledby (§11) */}
      <ArticleBodyEditor
        value={safe}
        onChange={(next) => onChange({ kind: "richtext", value: next })}
        placeholder={slotConfig.placeholder ?? "Write the article…"}  // literal, NOT the unreachable DEFAULT_PLACEHOLDER
        onImageUpload={uploader ? (file) => uploader(file).then((r) => ({ src: r.url })) : undefined}
      />            {/* ADAPT: ImageUploadResult key is `src`; the composer uploader returns `url` — rename or images silently drop */}
    </div>
  );
}
```

```ts
// lib/substrates.ts — Plate lazy, plaintext eager
import { lazy } from "react";
const BodySubstratePlate = lazy(() => import("../parts/body-substrate-plate"));  // ~165KB chunk, only when a richtext body mounts
import { BodySubstratePlaintext } from "../parts/body-substrate-plaintext";       // shadcn <Textarea>, eager
// articleBodySubstrate.render wraps <BodySubstratePlate> in <Suspense> (ArticleBodyEditor also has an internal boundary).
```

The plaintext fallback `BodySlotValue` is a plain STRING; richtext is an ARRAY — `BodySlotValue` is the discriminated union; `getValue`/`getIsDirty`/`loadValue`/`validate` branch on `kind`. **`ArticleBodyEditor` has NO dirty signal** — shell-derived via JSON baseline-compare (§autosave); baseline MUST reset after every save/autosave (#1 trap).

---

## Composition pattern / client-vs-server (description §14)

- `"use client"` at the procomp boundary (`content-composer-01.tsx`).
- Konva-touching parts arrive via the lazy `media-editor-01` slot (already `dynamic(..., { ssr: false })` internally) — the composer does NOT re-wrap it.
- The Plate bundle is `React.lazy`-loaded (`parts/body-substrate-plate.tsx`) so configs without a `bodySlot` don't pay the ~165 KB cost.
- No `next/*` anywhere — registry portability. Presentation resolver (`auto` → inline when embedded / dialog standalone) is a pure helper, mirrors media-editor's own resolver, independent of the mediaSlot's forced `presentation="inline"`.

---

## Implementation order (commit chain)

Single greenfield phase. News ships at C12; the post config is authored-but-deferred at C13 (blocked on media-editor-01 v0.2 `"library"`).

| # | Commit | Lands |
|---|---|---|
| **C1** | `chore(content-composer-01): scaffold + F-cross-13 substrate verify` | `pnpm new:component media/content-composer-01`. Skeleton root that throws. Manifest entry. F-cross-13 grep of transitive primitives (`dialog`/`textarea`/json-form `select`/`command`/`popover`/Plate/media `slider`/`popover`); record divergence findings in the commit message. tsc clean. |
| **C2** | `feat(content-composer-01): types.ts + index.ts barrel scaffold` | Full `types.ts` per §Type-system: `SlotKind`, `ComposerConfig`, `ComposerStep`, the 3 slot configs (1:1 media dials), `BodySlotValue`, `ComposerDraft` + `ComposerStepValue`, `SerializableMediaEditorState` + `MediaSlotValue`, `SlotSubstrate {kind,render}` + `SlotSubstrateMap`, `SlotHandle`, `ContentTypeAdapter<TItem>`, `PublishMode`/`PublishIntent`/`ComposerPhase`/`GateResult`, `ComposerCtx`/`ComposerStepCtx`, props + handle. Types-only barrel. tsc clean. |
| **C3** | `feat(content-composer-01): useComposerState (fork useKanbanState) + reducer + phase-reducer` | `hooks/use-composer-state.ts` (controlled/uncontrolled triplet — reduce over `state` not `internal`) + `lib/reducer.ts` (`composerReducer` + `replace` arm + `makeEmptyDraft`) + `lib/phase-reducer.ts` (FSM transitions per §7). tsc + lint clean. |
| **C4** | `feat(content-composer-01): substrate registry + missing-substrate fallback + findSubstrate` | `lib/substrates.ts` (typed `Partial<Record<SlotKind,SlotSubstrate>>`, `DEFAULT_SUBSTRATES`, `findSubstrate`) + `parts/slot-mount.tsx` + `parts/missing-substrate.tsx` (module-level `Set` dedupe `console.warn`, NEVER throw). |
| **C5** | `feat(content-composer-01): useComposerContext + step indicator + shell frame + dialog` | `hooks/use-composer-context.ts` (createContext + throwing `useComposerStep`/`useComposerContext`, workspace model, useMemo'd value) + `parts/composer-shell.tsx` + `parts/composer-dialog.tsx` (shadcn Dialog + focus trap) + `parts/step-indicator.tsx` (labeled nav + aria-current). Backward nav free; forward nav stubbed-gated. |
| **C6** | `feat(content-composer-01): jsonForm substrate + hydration layer + tags/author-picker renderers` | `lib/hydration.ts` (`hydrateSchema`/`stripHydration`) + jsonFormSubstrate (mounts `<JsonForm>` `submitButton={false}`, no-op `onSubmit`, `onReady`-captured handle, `onChangeDebounce={0}`, controlled `values`) + `parts/field-tags.tsx` + `parts/field-author-picker.tsx` via `fieldRegistry`. SlotHandle: `getValue→getValues()`, `getIsDirty→isDirty()`, `validate→trigger()+isValid()`, `loadValue→reset()`. |
| **C7** | `feat(content-composer-01): bodySlot substrate (lazy Plate + eager Textarea) + baseline dirty` | `parts/body-substrate-plate.tsx` (default-export, `@/registry` alias `.tsx` import, `url→src` uploader adapt) + `parts/body-substrate-plaintext.tsx` + `hooks/use-body-dirty.ts` (JSON baseline-compare; reset-after-save). Lazy registration in `lib/substrates.ts`. |
| **C8** | `feat(content-composer-01): mediaSlot substrate + clampMediaSources + pull-only export` | `lib/clamp-media-sources.ts` + mediaEditorSubstrate (1:1 dial passthrough, `presentation="inline"` forced, `ref<MediaEditor01Handle>`). SlotHandle composes `{ editorState: getState()-with-videoBlob-nulled, exportedUrl, pendingBlobRef }`; `loadValue→loadState()`; dirty→`getIsDirty()`. |
| **C9** | `feat(content-composer-01): blocking validation gates + canAdvance + focus-jump` | Config-sourced BLOCKING gates run imperatively at advance/publish (metadata `trigger()`+`isValid()`; body minLength vs `ARTICLE_BODY_EMPTY_VALUE`; media `!!exportedUrl\|\|getIsDirty()`). Block STAYS + jumps focus to first invalid step/field + `role="status"` announce. DISTINCT from the non-blocking fallback. |
| **C10** | `feat(content-composer-01): autosave + aggregate dirty/validity split` | `hooks/use-autosave.ts` (debounced ~800ms effect, skip-initial-mount, re-baseline-on-success) + `hooks/use-slot-handles.ts` (dirty = OR across 3 SlotHandles). `onDraftChange` (per-mutation, in dispatch) SPLIT from `onAutosave` (debounced). |
| **C11** | `feat(content-composer-01): FSM publish/schedule + uploader + lazy upload-on-publish` | `lib/upload.ts` (`uploader`/`uploadUrl` resolution + `Map<string,Blob>` consumed once at publish) + `lib/publish-cta.ts` (`resolvePublishCtaArms`) + `parts/publish-bar.tsx`. Publish/schedule re-runs ALL gates; pulls media via `handle.export()`; uploads blob→url→`exportedUrl`→`ContentCardItem.image`. Schedule = publish + future `publishAt`. |
| **C12** | `feat(content-composer-01): news config + co-located news adapter pair` | `configs/news-composer.config.ts` (the §news JSON shape + co-located `toContentItem`/`fromContentItem` against `ContentCardItem` — OMIT counts; nested `sensitivity`/`paywall` from dotted fields; `mediaInitialSource:{kind:"url",url:item.image,mode:"photo"}`) + `adapters/adapter-registry.ts`. Body via separate `initialBody` leg. |
| **C13** | `feat(content-composer-01): post config (modeled, deferred) + clamp proof` | `configs/post-composer.config.ts` (`["upload","library"]` → clamp proof; `"plaintext"` body; omitted `gates` step; `publishModes:["draft","publish"]`). Proves config-only divergence; ships fully behind media-editor-01 v0.2. |
| **C14** | `feat(content-composer-01): demo.tsx (SwipeTabsList) + dummy-data + presentation resolver` | demo tabs (News / Re-edit round-trip / Dialog / Dark) using the docs-site `<SwipeTabsList>` wrapper (NOT raw `<TabsList>`). `dummy-data.ts` (sample draft + sample `ContentCardItem`). Presentation resolver (auto→inline-in-CMS / dialog-standalone). |
| **C15** | `feat(content-composer-01): usage.tsx + meta.ts v0.1.0 + manifest sync` | `usage.tsx` + `meta.ts` v0.1.0 status `alpha`, deps audited (`pnpm validate:meta-deps` clean — incl json-form/article-body-01/media-editor-01 transitive). `/components/content-composer-01` renders all demo tabs. |
| **C16** | `chore(content-composer-01): registry.json — base + fixtures + registryDependencies` | Base item (23 `registry:component`, `target: components/content-composer-01/<sub-path>`, NO demo/usage/meta) + fixtures item (`dummy-data.ts`). `registryDependencies` = json-form + article-body-01 + media-editor-01 URLs. `pnpm registry:build` clean + manual roster audit (reconcile counts). |
| **C17** | `chore(content-composer-01): GATE 3 readiness spotcheck v0.1.0` | Author `docs/procomps/content-composer-01-procomp/reviews/<date>-v0.1.0-spotcheck.md`. 4 fixed dims + rotating = **composition integrity** (LOCKED per description §GATE-3). AI-assisted acceptable (procomp v0.1.0). Findings → patches. Verdict ≥ Pass-with-follow-ups. |
| **C18** | `chore(content-composer-01): consumer-tsc smoke + STATUS + decision file + guide + push` | `pnpm dlx shadcn@latest add @ilinxa/content-composer-01` into tmp consumer → consumer `pnpm tsc --noEmit` clean (path-b; expect/fix F-cross-13 sub-traps). Author `content-composer-01-procomp-guide.md`. Update `.claude/STATUS.md` + decision file. Push to master. |

**Estimated commit budget**: 18 commits (single greenfield phase). Final on-disk file count: 28. Final registry roster: 23 base + 1 fixtures = 24 distributed artifacts.

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| **Plate autosave loop** — Plate has no dirty signal; a missed baseline-reset reports permanently-dirty → autosave fires forever (#1 trap, §8). | `rebaselineAllSlots()` resets `baselineRef` after every successful save/autosave AND on `loadValue()`. Browser-test the autosave-then-idle path at C10 (no repeated `onAutosave` after settle). |
| **Blob in the draft** — `MediaEditorState.videoBlob` is a live Blob; `JSON.stringify(draft)` would throw/corrupt on autosave. | `snapshotForPersist` nulls `videoBlob` + drops `pendingBlobRef`'s Blob (keeps the string key); `SerializableMediaEditorState` enforces `videoBlob: null` at the type level. |
| **`image` missing at publish** — QP-10 lazy upload means `exportedUrl` is empty until publish; `ContentCardItem.image` is non-optional. | `toContentItem` is a publish-time-only projection; the shell uploads (`export()`→`uploader()`→write `exportedUrl`) BEFORE calling it; the adapter throws with a clear message if `image` is absent. |
| **`url` vs `src` uploader mismatch** — `ArticleBodyEditor.onImageUpload` wants `{ src }`; the composer uploader returns `{ url }`. Both are valid object shapes, so TS won't catch it. | The bodySlot substrate renames `url→src` before passing `onImageUpload` (§lazy-load). Flagged in the C7 commit + GATE 3 composition-integrity dim. |
| **F-cross-13 sub-traps** — second inter-procomp registry-dep install; new primitives (`Dialog`/`Command`/`Popover`) may hit Radix-vs-Base-UI divergence. | C1 grep + defensive controlled-mode triplet pre-wiring; path-b consumer-tsc smoke at C18; expect a v0.1.1 smoke patch per the 4-ship pattern. |
| **`onChangeDebounce={0}` echo loop** — controlled `values`-prop round-trip back through `onChange` at debounce 0. | **Source-verified safe:** json-form's `ChangeBridge` carries a `stableStringify` structural-equality guard that breaks the controlled-mode echo loop (json-form.tsx, ~226-247). Runtime-smoke at C10 as belt-and-suspenders. |
| **alpha substrate dependency** — `article-body-01` is alpha v0.2.2. | Project-accepted (json-form already depends on it); flagged in the Dependencies table so GATE 3 isn't surprised. |

### Alternatives considered

- **Type-erased substrate registry (kanban `AnyKanbanCardRenderer<any>`)** — rejected per description §3: there are exactly 3 closed, known slot-kinds, so a strongly-typed `Partial<Record<SlotKind, SlotSubstrate>>` catches prop-flow mistakes at compile time. Kanban erases because the board never reads card data; the composer DOES read each slot's value shape.
- **Single `status` field (no separate `ComposerPhase`)** — rejected per description §7's explicit "status axis orthogonal to step cursor": the ephemeral phase (autosaving/validating/publishing) must not pollute the JSON-serializable draft. Two reducers keep the draft pure.
- **Eager upload-on-step-leave** — rejected per QP-10: lazy-on-publish avoids orphaned uploads from abandoned drafts. Eager is a v0.2 config flag.

### Open follow-ups (candidate v0.1.1+)

- `location`/`geo` + `milestones` (array/repeater) custom FieldRenderers — needed by future `event`/`project` configs (out of news v0.1 scope).
- Eager upload-on-step-leave config flag (v0.2).
- Fine-grained media-edit autosave once media-editor-01 v0.2 emits content-mutation `onEditAction` events.

---

## Edge cases

| Case | Behavior |
|---|---|
| Config references a slot-kind with no registered substrate | Degraded `MissingSubstrateFallback` card + one-shot `console.warn`; navigation still works; gate passes on `!handle` (NON-blocking). |
| `post` config declares `mediaSources: ["upload","library"]` | `clampMediaSources` drops `"library"` → `["upload"]`; no crash, no cosmetic leak; SAME shell stays valid until media-editor-01 v0.2. |
| Optional step left untouched (`gates`) | `evaluateStepGate` returns `{ ok: true }` for `optional && isStepEmpty` — does not block publish. |
| Hidden step (`visibleWhen` false) | Skipped from gate evaluation AND from the rendered step sequence. |
| Re-edit of an item with engagement counts | `toContentItem` OMITS `likeCount`/`views`/… (never sets); the page's PATCH/merge preserves them. |
| Re-edit, body not in `ContentCardItem` | `fromContentItem` emits no body step; page re-seeds via `initialBody`. |
| Never-touched required metadata field at publish | `formApi.trigger()` force-validates (validationMode `"onTouched"` would otherwise report valid) → gate correctly fails. |
| Schedule with a past `publishAt` | `resolvePublishCtaArms` disables the schedule arm until a future `scheduledFor` exists; `isScheduleIntentValid` re-checks before T11. |
| Hard-refresh with a pending un-uploaded capture | Capture lost (blob not persisted); autosave persisted `editorState`+`exportedUrl` only — documented acceptable v0.1 per QP-10. |
| `loadValue` after re-edit | Slot dirty resets to false even though draft differs from server — FSM must not infer "unsaved" purely from aggregate dirty immediately post-reset-load. |

---

## Accessibility (description §11)

### Keyboard
- Step nav fully keyboard-operable; advancing focuses the first interactive element of the new step.
- Dialog mode: Escape closes (through the discard guard); focus trapped within the dialog.
- Tags chip-input: Enter/comma adds a chip; each chip's remove button is a focusable `<button>` with `aria-label`.

### ARIA
- Step indicator: labeled `<nav aria-label="Composer steps">`; current step `aria-current="step"`.
- Body editor: `<ArticleBodyEditor>` exposes no `id` (Plate owns a contenteditable) — wrapped in `role="group"` + `aria-labelledby` (the `field-richtext.tsx` wrap). Each metadata/media step's label binds the same way.
- Blocked gate: error announced via a `role="status"` live region; focus moves to the first invalid field.
- Dialog mode: `aria-labelledby`/`aria-describedby` on the shadcn Dialog.

### Focus management
- Advance → first interactive of the new step. Gate fail → first invalid field + announce.
- Dialog-vs-inline split: dialog = focus trap + Escape; inline = no trap (lives in page flow) but the shell still owns the unsaved-edits navigation guard.

### WCAG 2.1 AA target
- [ ] All interactive elements keyboard-reachable + visible focus ring.
- [ ] Step transitions announce + move focus predictably.
- [ ] Color is not the only state signal (gate errors carry text + icon).
- [ ] `prefers-reduced-motion: reduce` → the orchestrated step-reveal (`reveal-up` + 60ms stagger) falls back to instant transitions.
- [ ] Live region announces gate failures.

---

## Verification gates per commit

1. `pnpm tsc --noEmit` — clean after every commit.
2. `pnpm lint` — clean (no new warnings introduced by the commit's files).
3. `pnpm validate:meta-deps` — clean once `meta.ts` lands (C15); re-run after C16 (removing/adding any shipped file cascades to orphaned deps — the media-editor-01 v0.1.1 lesson).
4. `pnpm build` — production build succeeds (C15+).
5. `pnpm registry:build` — regenerates `public/r/*.json`; spot-check `content-composer-01.json` (C16).
6. Docs render — `/components` lists it; `/components/content-composer-01` renders all demo tabs (C15).
7. Per-commit browser test — the visual walkthrough is the de-facto gate (the media-editor-01 lesson: every chrome issue was invisible to tsc/lint/build). Smoke each new surface in the demo as it lands.

---

## GATE 3 readiness review

Author `docs/procomps/content-composer-01-procomp/reviews/<YYYY-MM-DD>-v0.1.0-spotcheck.md` using [`docs/reviews/templates/review-spotcheck.md`](../../reviews/templates/review-spotcheck.md). 4 fixed dims (Planning docs / Registry distribution / Meta+manifest sync / Verification) + **1 rotating dim LOCKED = composition integrity** (per description §GATE-3): this shell composes three substrates — verify prop-flow correctness across them, no leaked substrate internals, clean state lifting (no prop-drilling hacks), and correct dirty/validity aggregation across the heterogeneous `SlotHandle`s. Self-review acceptable for a v0.1.0 procomp; AI-assisted pass recommended given the composition surface. Verdict must be `Pass` or `Pass with follow-ups` to close; each follow-up tagged with owner + bump target.

Per-tier smoke (pro-component, runtime): F-cross-11 path-b consumer-tsc — `pnpm dlx shadcn add @ilinxa/content-composer-01` succeeds AND consumer-side `pnpm tsc --noEmit` clean post-install (C18).

---

## Workflow gates

- **GATE 1** ✅ — description signed off (QP-1..QP-10 locked).
- **GATE 2** — this plan. **Run TWO re-validation passes** per the project norm (initial draft + post-fix re-audit; expect 3–5 substantive findings on a plan). Sign-off required before `pnpm new:component`.
- **GATE 3** — readiness spotcheck (above); verdict ≥ `Pass with follow-ups` before push to master.

---

## Re-validation passes (project norm — two per gate doc)

> **Pass 1 (initial self-audit)** and **Pass 2 (post-fix re-audit)** must both run on this plan before GATE 2 sign-off. The "Re-validation pass catches real issues" norm holds: never rubber-stamp draft → sign-off. Expect 3–5 substantive findings per plan. Composition tiers surface MORE findings, not fewer — composition is where drift hides.
>
> **Watch-items already flagged for the re-validation passes** (resolve or explicitly accept before sign-off):
> 1. `image` is a publish-time-only field (QP-10) — confirm the shell's publish sequence (export→upload→write→assemble) is locked in C11 before C12's adapter relies on it.
> 2. `url`→`src` uploader rename for `onImageUpload` — a shape-compatible silent-drop trap; confirm the C7 adapt.
> 3. `onChangeDebounce={0}` + controlled `values` echo-loop — source-verified safe (ChangeBridge `stableStringify` guard); C6/C10 runtime smoke as confirmation.
> 4. `loadValue` clears dirty — confirm the FSM doesn't treat post-reset-load as pristine when the draft differs from server.
> 5. `archived` status has no composer authoring path — confirm it's page-owned and the adapter handles it as an edit-touch only.
> 6. File/registry counts (28 / 23 / 24) are estimates — reconcile at C16.
