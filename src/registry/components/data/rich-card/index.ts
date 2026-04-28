export { RichCard } from "./rich-card";

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
  RichCardHandle,
  RichCardJsonNode,
  RichCardProps,
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
  RichCardMasterValidator,
  RichCardValidationError,
  RichCardValidationResponse,
  RichCardValidators,
  ValidationFailedEvent,
} from "./types";

// constants
export { PREDEFINED_KEYS, RESERVED_KEYS } from "./types";

// optional sibling exports (v0.3 search bar + v0.4 undo toolbar)
export { RichCardSearchBar } from "./parts/search-bar";
export { RichCardUndoToolbar } from "./parts/undo-toolbar";

// component metadata
export { meta } from "./meta";
