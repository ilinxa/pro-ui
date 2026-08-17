export { CardTree } from "./card-tree";

// v0.1 types
export type {
  CodeAreaValue,
  FlatFieldType,
  FlatFieldValue,
  ImageValue,
  LevelStyle,
  ListValue,
  PredefinedKey,
  QuoteValue,
  CardTreeHandle,
  CardTreeJsonNode,
  CardTreeProps,
  TableValue,
} from "./types";

// v0.2 event types
export type {
  CardAddedEvent,
  CardRemovedEvent,
  CardRenamedEvent,
  FieldAddedEvent,
  FieldEditedEvent,
  FieldRemovedEvent,
  PredefinedAddedEvent,
  PredefinedEditedEvent,
  PredefinedRemovedEvent,
} from "./types";

// v0.3 types — permissions, search, dnd, custom keys, meta renderers, audit trail.
// These shipped into types.ts in v0.3 but were never re-exported here, so every
// one of them was unreachable from the package root until v0.6 (guide §7.1 and
// §meta-renderers both showed root imports that could not compile).
export type {
  AuditTrailConfig,
  CardTreePermissions,
  CustomKeyContext,
  CustomPredefinedKey,
  DndScopes,
  EffectivePermissions,
  MetaRenderer,
  MetaRendererContext,
  PermissionDenialReason,
  PermissionRule,
  ReservedKey,
  SearchMatch,
  SearchMatchType,
  SearchOptions,
  SearchResult,
} from "./types";

// v0.3 event types
export type {
  CardDuplicatedEvent,
  CardMovedEvent,
  MetaAddedEvent,
  MetaChangedEvent,
  MetaRemovedEvent,
} from "./types";

// v0.4 validator types
export type {
  CardTreeMasterValidator,
  CardTreeValidationError,
  CardTreeValidationResponse,
  CardTreeValidators,
  ValidationFailedEvent,
} from "./types";

// constants
export { PREDEFINED_KEYS, RESERVED_KEYS } from "./types";

// optional sibling exports (v0.3 search bar + v0.4 undo toolbar)
export { CardTreeSearchBar } from "./parts/search-bar";
export { CardTreeUndoToolbar } from "./parts/undo-toolbar";

// component metadata
