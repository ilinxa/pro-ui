import type { CSSProperties, ReactNode, Ref } from "react";

// ── identity ───────────────────────────────────────────────

export interface BlackboardAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  /** Optional per-author default ink (palette key or raw CSS color). */
  inkColor?: string;
}

/** Mention-able team roster (a superset of authors). Drives the @-picker. */
export interface BlackboardMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

// ── note styling (the three writing controls) ──────────────

/** Chalk thickness. Maps to real font-weight where the font has weights, else a faux text-stroke. */
export type NoteWidth = "thin" | "regular" | "bold";

export interface NoteStyle {
  /** Palette key (e.g. "lime") or a raw CSS color when `allowFreeColor`. */
  color: string;
  width: NoteWidth;
  /** A `HandwritingFont.key`. */
  font: string;
}

export interface HandwritingFont {
  /** Stable id stored on the note ("kalam", "caveat", …). */
  key: string;
  /** Picker label ("Kalam"). */
  label: string;
  /** The CSS var the family is exposed through ("--bb-font-kalam"). */
  cssVar: string;
  /** True ⇒ real font-weight for width; false ⇒ faux text-stroke. */
  hasWeights?: boolean;
}

/** An ink swatch offered in the composer. */
export interface InkColor {
  /** Stable key stored on the note ("chalk", "lime", …). */
  key: string;
  label: string;
  /** Resolved CSS color (an oklch / hex / var()). */
  value: string;
}

// ── mentions ───────────────────────────────────────────────

export interface Mention {
  memberId: string;
  /** The "@name" exactly as written. */
  display: string;
  /** Char offset into `note.text`. */
  start: number;
  /** Length of the `display` substring. */
  length: number;
}

// ── the note ───────────────────────────────────────────────

export interface BlackboardNote {
  id: string;
  text: string;
  author: BlackboardAuthor;
  /** ISO 8601. */
  createdAt: string;
  updatedAt?: string;
  style: NoteStyle;
  /**
   * Uncontrolled pin flag. Ignored when the `pinnedNoteIds` prop is supplied
   * (that prop is the controlled source of truth).
   */
  pinned?: boolean;
  mentions?: Mention[];
  meta?: Record<string, unknown>;
  /** @internal Set on optimistic notes awaiting a server id; cleared on reconcile. */
  pending?: boolean;
  /** @internal Set when an optimistic post failed; surfaces a retry affordance. */
  failed?: boolean;
}

// ── board background ───────────────────────────────────────

export type BoardBackground =
  | { kind: "color"; value: string }
  | { kind: "image"; url: string; overlay?: number };

// ── note draft (composer ↔ callbacks) ──────────────────────

export interface NoteDraft {
  text: string;
  style: NoteStyle;
  mentions: Mention[];
}

// ── labels (i18n surface) ──────────────────────────────────

export interface Blackboard01Labels {
  composerPlaceholder: string;
  post: string;
  loadOlder: string;
  loadingOlder: string;
  pinnedHeading: string;
  empty: string;
  unreadAria: (n: number) => string;
  mentionYou: string;
  colorLabel: string;
  widthLabel: string;
  fontLabel: string;
  pin: string;
  unpin: string;
  delete: string;
  retry: string;
  doubleClickHint: string;
  closeComposer: string;
  authoredBy: (name: string) => string;
  backgroundLabel: string;
  backgroundColor: string;
  backgroundImage: string;
  backgroundImageUrl: string;
}

// ── imperative handle ──────────────────────────────────────

export interface Blackboard01Handle {
  scrollToLatest(): void;
  /** Push an inbound real-time note (dedup-safe against ids + pending optimistic notes). */
  appendNote(note: BlackboardNote): void;
  focusComposer(): void;
  markAllSeen(): void;
}

// ── root / assembly props ──────────────────────────────────

/**
 * Props shared by the headless `BlackboardRoot` provider and the `Blackboard01`
 * assembly. The assembly adds the `show*` chrome toggles.
 */
export interface BlackboardRootProps {
  /** Controlled stream, oldest → newest. */
  notes: BlackboardNote[];
  currentUser: BlackboardAuthor;
  /** Mention roster; empty/undefined ⇒ no @-picker. */
  members?: BlackboardMember[];
  /** Default true. false ⇒ composer disabled (with `renderWriteDenied`). */
  canWrite?: boolean;

  // lazy load older (scroll-up)
  onLoadOlder?(beforeNoteId: string | null, limit: number): Promise<BlackboardNote[]>;
  hasMoreOlder?: boolean;
  /** Default 10. */
  loadOlderPageSize?: number;

  // write / persist (auto-save = debounced; NO network here)
  onPostNote?(draft: NoteDraft): void | Promise<BlackboardNote>;
  onUpdateNote?(id: string, patch: Partial<NoteDraft>): void;
  onDeleteNote?(id: string): void;
  onDraftChange?(draft: NoteDraft): void;
  /** Debounce for `onDraftChange`. Default 600. */
  autoSaveDelayMs?: number;

  // pin — `pinnedNoteIds` (controlled) wins; else `note.pinned` (uncontrolled).
  pinnedNoteIds?: string[];
  onPinNote?(id: string): void;
  onUnpinNote?(id: string): void;

  // mentions — fires AFTER onPostNote resolves, with the reconciled note id.
  onMention?(noteId: string, memberIds: string[]): void;

  // unread marker
  unreadCount?: number;
  lastSeenNoteId?: string | null;
  onSeen?(latestNoteId: string): void;

  // board theming
  background?: BoardBackground;
  defaultBackground?: BoardBackground;
  onBackgroundChange?(bg: BoardBackground): void;
  editableBackground?: boolean;

  // writing palette constraints
  palette?: InkColor[];
  fonts?: HandwritingFont[];
  widths?: NoteWidth[];
  allowFreeColor?: boolean;
  defaultStyle?: Partial<NoteStyle>;

  // behaviour
  /** Default false (newest at bottom). */
  newestFirst?: boolean;
  /** Default true. */
  showAuthorOnHover?: boolean;
  /**
   * How the composer is revealed. `"double-click"` (default) keeps the board clean
   * and opens the composer when the user double-clicks the surface; `"always"` keeps
   * it docked at the bottom. Ignored when there's no composer (no `onPostNote`).
   */
  composerMode?: "always" | "double-click";

  // escape hatches
  renderWriteDenied?(): ReactNode;
  renderEmpty?(): ReactNode;
  labels?: Partial<Blackboard01Labels>;

  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<Blackboard01Handle>;
}

export interface Blackboard01Props extends Omit<BlackboardRootProps, "children"> {
  // chrome toggles (compound assembly)
  /** Default = `!!onPostNote`. */
  showComposer?: boolean;
  /** Default true. */
  showNotificationBadge?: boolean;
  /** Default = `editableBackground`. */
  showBackgroundEditor?: boolean;
  /** Default true. */
  showPinnedRow?: boolean;
}
