export { ContentComposer01 } from "./content-composer-01";

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
