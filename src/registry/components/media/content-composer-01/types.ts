import type { ReactNode, Ref } from "react";
import type {
  MediaEditor01Props,
  MediaEditor01Handle,
  MediaEditorState,
  ExportMetadata,
  InitialSource,
  ComposerMode,
  EditTool,
  MediaSource,
  AspectRatio,
} from "@/registry/components/media/media-editor-01/types";
import type { ArticleBodyValue } from "@/registry/components/data/article-body-01/article-body-01";
import type {
  ContentCardItem,
  ContentStatus,
} from "@/registry/components/data/content-card-news-01/types";
import type { FormSchema, Condition } from "@/registry/components/forms/json-form/types";

// Re-export the substrate types the public surface leans on, so consumers
// import them from the content-composer barrel without reaching into the
// substrate procomps directly.
export type { MediaEditorState, ExportMetadata, InitialSource, ArticleBodyValue, ContentCardItem, ContentStatus };
export type { MediaEditor01Props, MediaEditor01Handle };

// ─── Slot kinds + config (description §15) ──────────────────────────────

export type SlotKind = "metadataFields" | "bodySlot" | "mediaSlot";

export interface ComposerConfig {
  /** "news" | "post" | "event" | "project" */
  id: string;
  /** config schema version (semver) */
  version: string;
  title: string;
  /** runtime adapter-registry key */
  adapterId: string;
  steps: ComposerStep[];
  /** subset of ["draft","publish","schedule"] */
  publishModes: PublishMode[];
  presentation?: "inline" | "dialog" | "auto";
  autosave?: { enabled: boolean; debounceMs?: number };
}

export interface ComposerStep {
  id: string;
  title: string;
  /** substrate-registry lookup key */
  slot: SlotKind;
  /** discriminated by `slot` at the consumer site (JSON — no TS narrowing) */
  slotConfig: MetadataSlotConfig | BodySlotConfig | MediaSlotConfig;
  /** BLOCKING gate before advance/publish */
  validation?: StepValidation;
  optional?: boolean;
  /** json-form Condition DSL, reused for whole-step visibility (serializable object form only) */
  visibleWhen?: Condition;
}

export interface StepValidationRule {
  field: string;
  /** bodySlot: min Plate/plaintext length */
  minLength?: number;
  /** mediaSlot: require a hero (exportedUrl present OR dirty) */
  mediaRequired?: boolean;
  message: string;
}

export interface StepValidation {
  /**
   * "all-fields-valid" → delegate to json-form trigger(); "custom" → run `rules`.
   * NOTE: advisory for metadataFields steps — a metadata slot can only validate via
   * trigger()+isValid(), so `mode` there is effectively "all-fields-valid" and a
   * `custom` rule declared on a metadata step is ignored. `custom`+`rules` change
   * behavior only for bodySlot (minLength) and mediaSlot (mediaRequired) steps.
   */
  mode: "all-fields-valid" | "custom";
  rules?: StepValidationRule[];
}

// ─── The three discriminated slot configs (description §4) ──────────────

/** metadataFields → a json-form FormSchema fragment. */
export interface MetadataSlotConfig {
  columns?: 1 | 2;
  /** { fields: FieldDefinition[] } fragment */
  schema: FormSchema;
}

/** bodySlot → article-body-01 (Plate) OR shadcn <Textarea> plaintext fallback. */
export interface BodySlotConfig {
  substrate: "plate" | "plaintext";
  fieldName: string;
  placeholder?: string;
  /** plate-only sentinel; plaintext ignores it and uses "" — defaults to ARTICLE_BODY_EMPTY_VALUE */
  emptyValue?: ArticleBodyValue;
}

/**
 * mediaSlot → 1:1 passthrough of media-editor-01's dials. Every key is a verified
 * MediaEditor01Props prop. The shell spreads these straight onto <MediaEditor01>,
 * EXCEPT `mediaSources` which the substrate CLAMPS to the real MediaSource union
 * before spreading (drops not-yet-valid "library" — §clamp).
 */
export interface MediaSlotConfig {
  fieldName: string;
  enabledModes: ComposerMode[];
  enabledTools: EditTool[];
  /** broad so a config can declare "library" ahead of media-editor v0.2; the substrate clamps it. */
  mediaSources: (MediaSource | (string & {}))[];
  aspect: AspectRatio;
  /** default "inline" inside the composer (§2) */
  presentation?: "inline" | "dialog" | "auto";
  cropAspects?: AspectRatio[];
  maxFileSizeMb?: number;
}

// ─── Body value + draft (description §6) — JSON-clean, NO blob ───────────

/** The asymmetry the SlotHandle hides: richtext = ArticleBodyValue (Plate node array); plaintext = string. */
export type BodySlotValue =
  | { kind: "richtext"; value: ArticleBodyValue }
  | { kind: "plaintext"; value: string };

/**
 * MediaEditorState minus the non-serializable live Blob (videoBlob: Blob). The draft
 * persists THIS, never the raw MediaEditorState. On re-edit the shell re-attaches the
 * blob from its Map (or re-fetches from exportedUrl) before calling handle.loadState().
 */
export type SerializableMediaEditorState = Omit<MediaEditorState, "videoBlob"> & {
  videoBlob: null;
};

export interface MediaSlotValue {
  /** durable uploaded https URL (post-upload) — the persistable handle */
  exportedUrl?: string;
  /** transient key into the shell-held Map<string,Blob>; consumed once at upload */
  pendingBlobRef?: string;
  /** .metadata leg of export() */
  exportMetadata?: ExportMetadata;
  /** blob-free editor snapshot for re-edit */
  editorState?: SerializableMediaEditorState;
}

export type ComposerStepValue =
  | { slot: "metadataFields"; value: Record<string, unknown> }
  | { slot: "bodySlot"; value: BodySlotValue }
  | { slot: "mediaSlot"; value: MediaSlotValue };

export interface ComposerDraft {
  contentType: string;
  /** keyed by step id; discriminated by slot kind */
  steps: Record<string, ComposerStepValue>;
  /** "draft"|"scheduled"|"published"|"archived" → ContentCardItem.status (same CLOSED enum) */
  status: ContentStatus;
  /** ISO; set by the schedule arm */
  scheduledFor?: string;
  /** set on first publish; preserved on re-edit so a PATCH targets the row */
  contentId?: string;
  /** PERSISTED so re-open resumes the step */
  cursor: number;
}

// ─── Substrate registry + render args (description §3) ──────────────────

export type SlotConfigFor<K extends SlotKind> = K extends "metadataFields"
  ? MetadataSlotConfig
  : K extends "bodySlot"
    ? BodySlotConfig
    : K extends "mediaSlot"
      ? MediaSlotConfig
      : never;

export type SlotValueFor<K extends SlotKind> = K extends "metadataFields"
  ? Record<string, unknown>
  : K extends "bodySlot"
    ? BodySlotValue
    : K extends "mediaSlot"
      ? MediaSlotValue
      : never;

export interface SlotRenderArgs<K extends SlotKind = SlotKind> {
  slotConfig: SlotConfigFor<K>;
  value: SlotValueFor<K> | undefined;
  onChange: (next: SlotValueFor<K>) => void;
  ctx: ComposerStepCtx;
  /** the shell threads a ref the substrate populates with a uniform SlotHandle */
  handleRef: Ref<SlotHandle<SlotValueFor<K>>>;
}

export interface SlotSubstrate<K extends SlotKind = SlotKind> {
  kind: K;
  render: (args: SlotRenderArgs<K>) => ReactNode;
}

/** Strongly-typed map keyed by the 3 closed kinds (NOT Map<string,Any> like kanban). */
export type SlotSubstrateMap = Partial<{ [K in SlotKind]: SlotSubstrate<K> }>;

// ─── SlotHandle (description §3/§9) — uniform across all three slots ─────

export interface SlotHandle<TValue = unknown> {
  /** current slot value for the ComposerDraft snapshot */
  getValue: () => TValue;
  /** aggregated into the shell's OR-of-three dirty */
  getIsDirty: () => boolean;
  /** BLOCKING gate primitive (QP-9). metadata → await trigger() then isValid() */
  validate: () => Promise<boolean>;
  /** re-seed on autosave-restore / re-edit. RESETS the dirty baseline */
  loadValue: (value: TValue) => void;
  /**
   * mediaSlot ONLY — pull-only export so the shell can upload the captured hero
   * at publish/schedule (QP-10 lazy upload). Other slots omit it; the shell
   * duck-types its presence.
   */
  export?: () => Promise<{ blob: Blob; metadata: ExportMetadata }>;
}

// ─── Adapter (description §5) — pure forward+inverse fns, NOT components ──

export interface ContentTypeAdapter<TItem> {
  contentType: string;
  toContentItem: (
    draft: ComposerDraft,
    ctx: { now: Date; currentUser?: { id: string; name: string } },
  ) => TItem;
  fromContentItem: (item: TItem) => {
    draft: Partial<ComposerDraft>;
    mediaInitialSource?: InitialSource;
  };
}

export type AdapterRegistry = Record<string, ContentTypeAdapter<ContentCardItem>>;

// ─── Publish intent + FSM surface (description §7) ──────────────────────

export type PublishMode = "draft" | "publish" | "schedule";

export type PublishIntent =
  | { mode: "draft" }
  | { mode: "publish" }
  | { mode: "schedule"; publishAt: Date };

export type ComposerPhase =
  | "idle"
  | "editing"
  | "autosaving"
  | "validating"
  | "draft-saved"
  | "scheduling"
  | "scheduled"
  | "publishing"
  | "published"
  | "publish-error";

export interface GateResult {
  ok: boolean;
  firstInvalidStepId?: string;
  firstInvalidField?: string;
  /** per-step error messages */
  errors?: Record<string, string[]>;
}

// ─── Per-mount context (description §10) — workspace useAreaContext model ─

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

// ─── Public component props + handle (description §9) ───────────────────

export interface ContentComposer01Props {
  // The config (JSON)
  config: ComposerConfig;
  /** defaults shipped + spreadable + overridable */
  substrates?: SlotSubstrateMap;

  // Re-edit
  /** drives the INVERSE adapter (item.image → media initialSource) */
  initialItem?: ContentCardItem;
  /** persisted body — NOT on ContentCardItem (§5) */
  initialBody?: BodySlotValue;

  // Presentation
  presentation?: "inline" | "dialog" | "auto";
  isOpen?: boolean;
  onClose?: () => void;

  // Draft state (controlled triplet — copy useKanbanState)
  value?: ComposerDraft;
  defaultValue?: ComposerDraft;
  onChange?: (draft: ComposerDraft) => void;

  // Autosave (split: per-mutation vs debounced — QP-4)
  autosave?: boolean;
  /** per mutation */
  onDraftChange?: (draft: ComposerDraft) => void;
  /** debounced (~800ms) */
  onAutosave?: (draft: ComposerDraft) => void | Promise<void>;

  // Lifecycle exits (emit the assembled ContentItem; affordance-gated by callback presence)
  onSaveDraft?: (item: ContentCardItem) => void | Promise<void>;
  onPublish?: (item: ContentCardItem) => void | Promise<void>;
  onSchedule?: (item: ContentCardItem, publishAt: Date) => void | Promise<void>;

  // The SHELL owns upload (DELTA vs media-editor-01 — QP-8)
  /** primary upload contract */
  uploader?: (blob: Blob, meta: ExportMetadata) => Promise<{ url: string }>;
  /** convenience shorthand */
  uploadUrl?: string;

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

// ─── Exported hook + helper signatures (description §10) ─────────────────

export interface UseComposerStateArgs {
  contentType: string;
  value?: ComposerDraft;
  defaultValue?: ComposerDraft;
  /** === onDraftChange (per-mutation, both modes) */
  onChange?: (next: ComposerDraft) => void;
}

/** throws outside the composer subtree */
export type UseComposerContext = () => ComposerCtx;
/** throws outside a step subtree */
export type UseComposerStep = () => ComposerStepCtx;
export type FindSubstrate = <K extends SlotKind>(
  substrates: SlotSubstrateMap,
  key: K,
) => SlotSubstrate<K> | undefined;
