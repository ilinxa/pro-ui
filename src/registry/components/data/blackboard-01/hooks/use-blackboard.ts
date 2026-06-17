"use client";

import { createContext, useContext } from "react";
import type { RefObject, ReactNode } from "react";
import type {
  Blackboard01Labels,
  BlackboardAuthor,
  BlackboardMember,
  BlackboardNote,
  BoardBackground,
  HandwritingFont,
  InkColor,
  NoteDraft,
  NoteStyle,
  NoteWidth,
} from "../types";

/** The value shared by every context-connected part. Built by `useBlackboardController`. */
export interface BlackboardContextValue {
  labels: Required<Blackboard01Labels>;
  currentUser: BlackboardAuthor;
  members: BlackboardMember[];
  canWrite: boolean;

  // display
  streamNotes: BlackboardNote[]; // chronological (oldest→newest); pinned lifted out
  pinnedNotes: BlackboardNote[];
  newestFirst: boolean;
  isPinned: (id: string) => boolean;
  showAuthorOnHover: boolean;
  mentionsCurrentUser: (note: BlackboardNote) => boolean;

  // palette / fonts
  palette: InkColor[];
  fonts: HandwritingFont[];
  widths: NoteWidth[];
  allowFreeColor: boolean;

  // composer / draft
  composerRef: RefObject<HTMLTextAreaElement | null>;
  draft: NoteDraft;
  setDraftText: (text: string) => void;
  setDraftStyle: (patch: Partial<NoteStyle>) => void;
  post: () => void;
  posting: boolean;
  composerMode: "always" | "double-click";
  composerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;

  // lazy load
  scrollRef: RefObject<HTMLDivElement | null>;
  sentinelRef: RefObject<HTMLDivElement | null>;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  loadOlderEnabled: boolean;
  loadOlder: () => Promise<void>;
  onReachedBottom: () => void;
  scrollToLatest: () => void;

  // unread
  unreadCount: number;
  markAllSeen: () => void;

  // pin / delete / retry
  canPin: boolean;
  togglePin: (note: BlackboardNote) => void;
  canDelete: boolean;
  deleteNote: (note: BlackboardNote) => void;
  retryPost: (id: string) => void;

  // background
  background: BoardBackground;
  setBackground: (bg: BoardBackground) => void;
  editableBackground: boolean;

  renderWriteDenied?: () => ReactNode;
  renderEmpty?: () => ReactNode;
}

const BlackboardContext = createContext<BlackboardContextValue | null>(null);

export { BlackboardContext };

/** Read the blackboard context. Throws if used outside `<BlackboardRoot>`. */
export function useBlackboard(): BlackboardContextValue {
  const ctx = useContext(BlackboardContext);
  if (ctx === null) {
    throw new Error("useBlackboard must be used within <BlackboardRoot> (or <Blackboard01>).");
  }
  return ctx;
}

export const DEFAULT_BLACKBOARD_LABELS: Required<Blackboard01Labels> = {
  composerPlaceholder: "Write a note…",
  post: "Post",
  loadOlder: "Load older notes",
  loadingOlder: "Loading…",
  pinnedHeading: "Pinned",
  empty: "Nothing on the board yet",
  unreadAria: (n) => `${n} unread ${n === 1 ? "note" : "notes"}`,
  mentionYou: "@you",
  colorLabel: "Ink color",
  widthLabel: "Chalk width",
  fontLabel: "Handwriting",
  pin: "Pin",
  unpin: "Unpin",
  delete: "Delete",
  retry: "Retry",
  doubleClickHint: "Double-click to write a note",
  closeComposer: "Close composer",
  authoredBy: (name) => name,
  backgroundLabel: "Board background",
  backgroundColor: "Color",
  backgroundImage: "Image",
  backgroundImageUrl: "Image URL",
};

export const DEFAULT_BACKGROUND: BoardBackground = {
  kind: "color",
  value: "oklch(0.18 0.04 250)",
};
