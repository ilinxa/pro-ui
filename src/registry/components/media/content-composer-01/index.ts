export { ContentComposer01 } from "./content-composer-01";

// Headless state (description §10) — for consumers building a custom shell.
export {
  useComposerState,
  type UseComposerStateReturn,
} from "./hooks/use-composer-state";

// Per-mount + per-step context hooks (throw outside their subtree). Exposed so
// consumers' custom field/slot renderers can read the live composer state.
export {
  useComposerContext,
  useComposerStep,
} from "./hooks/use-composer-context";

// Config hydration layer (QP-6) — for consumers deserializing JSON configs and
// re-attaching function escape-hatches before building a ComposerConfig.
export {
  hydrateSchema,
  stripHydration,
  type ComposerConfigHydration,
  type FieldHydration,
  type SchemaHydration,
  type ConditionFn,
} from "./lib/hydration";

// Composer-owned custom json-form field renderers (the two json-form gaps).
// Exported for `fieldRegistry` reuse in consumer schemas.
export { tagsFieldRenderer } from "./parts/field-tags";
export {
  authorPickerFieldRenderer,
  type AuthorEntity,
  type AuthorSourceConfig,
} from "./parts/field-author-picker";

// Default substrate registry + lookup — spreadable + overridable via the
// `substrates` prop. The three records map each closed SlotKind to its mount.
export {
  DEFAULT_SUBSTRATES,
  findSubstrate,
  jsonFormSubstrate,
  articleBodySubstrate,
  mediaEditorSubstrate,
} from "./lib/substrates";

// Content-type configs + the runtime adapter registry. The news config is a
// factory (inject `authorSource`); `newsComposerConfig` is the default instance.
export {
  createNewsComposerConfig,
  newsComposerConfig,
  newsContentItemAdapter,
  type NewsComposerConfigOptions,
} from "./configs/news-composer.config";
// post config — modeled + deferred (clamp proof; ships behind media-editor v0.2).
export { postComposerConfig } from "./configs/post-composer.config";
export { getAdapter, ADAPTER_REGISTRY } from "./adapters/adapter-registry";

// Public type surface (description §9/§10). Implementation-internal hooks +
// substrate records (useComposerState, default substrates, findSubstrate, …)
// are added to this barrel as they land across the C3–C12 chain.
export type {
  // Component
  ContentComposer01Props,
  ContentComposer01Handle,
  // Config + steps
  ComposerConfig,
  ComposerStep,
  StepValidation,
  StepValidationRule,
  SlotKind,
  MetadataSlotConfig,
  BodySlotConfig,
  MediaSlotConfig,
  // Draft + values
  ComposerDraft,
  ComposerStepValue,
  BodySlotValue,
  MediaSlotValue,
  SerializableMediaEditorState,
  // Substrate registry
  SlotSubstrate,
  SlotSubstrateMap,
  SlotRenderArgs,
  SlotHandle,
  SlotConfigFor,
  SlotValueFor,
  // Adapter
  ContentTypeAdapter,
  AdapterRegistry,
  // Lifecycle
  PublishMode,
  PublishIntent,
  ComposerPhase,
  GateResult,
  // Context
  ComposerCtx,
  ComposerStepCtx,
  // Hook + helper signatures
  UseComposerStateArgs,
  UseComposerContext,
  UseComposerStep,
  FindSubstrate,
  // Re-exported substrate types
  ContentCardItem,
  ArticleBodyValue,
  InitialSource,
  ExportMetadata,
  MediaEditorState,
} from "./types";
