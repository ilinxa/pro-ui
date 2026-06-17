// Tier A — the batteries-included assembly
export { Blackboard01 } from "./blackboard-01";

// Tier B — headless provider + context-connected parts (flat exports)
export { BlackboardRoot } from "./parts/blackboard-root";
export { BlackboardSurface } from "./parts/blackboard-surface";
export { BlackboardPinnedRow } from "./parts/blackboard-pinned-row";
export { BlackboardNoteStream } from "./parts/blackboard-note-stream";
export { BlackboardNoteItem } from "./parts/blackboard-note-item";
export { BlackboardComposer } from "./parts/blackboard-composer";
export { BlackboardNotificationBadge } from "./parts/blackboard-notification-badge";
export { BlackboardBackgroundEditor } from "./parts/blackboard-background-editor";

// Tier C — standalone, context-free primitives
export { HandwrittenNote } from "./parts/handwritten-note";
export { NoteComposer } from "./parts/note-composer";
export { InkColorPicker } from "./parts/ink-color-picker";
export { ChalkWidthPicker } from "./parts/chalk-width-picker";
export { HandwritingFontPicker } from "./parts/handwriting-font-picker";
export { MentionPicker } from "./parts/mention-picker";
export { MentionText } from "./parts/mention-text";
export { UnreadCount } from "./parts/unread-count";
export { BoardBackground } from "./parts/board-background";

// context hook
export { useBlackboard } from "./hooks/use-blackboard";

// constants
export { DEFAULT_PALETTE, DEFAULT_WIDTHS } from "./lib/palette";
export { DEFAULT_FONTS } from "./blackboard-fonts";

// types
export type * from "./types";

// part prop types (for à-la-carte consumers)
export type { HandwrittenNoteProps } from "./parts/handwritten-note";
export type { NoteComposerProps } from "./parts/note-composer";
export type { InkColorPickerProps } from "./parts/ink-color-picker";
export type { ChalkWidthPickerProps } from "./parts/chalk-width-picker";
export type { HandwritingFontPickerProps } from "./parts/handwriting-font-picker";
export type { MentionPickerProps } from "./parts/mention-picker";
export type { MentionTextProps } from "./parts/mention-text";
export type { UnreadCountProps } from "./parts/unread-count";
export type { BoardBackgroundProps } from "./parts/board-background";
export type { BlackboardSurfaceProps } from "./parts/blackboard-surface";
