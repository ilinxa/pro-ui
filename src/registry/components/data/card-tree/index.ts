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
