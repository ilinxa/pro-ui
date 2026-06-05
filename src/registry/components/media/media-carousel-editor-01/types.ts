import type {
  AspectRatio,
  ExportMetadata,
  InitialSource,
  MediaEditor01Handle,
  MediaEditor01Props,
  MediaEditorState,
} from "@/registry/components/media/media-editor-01/media-editor-01";
// ↑ The SOLE cross-procomp module surface (F-01). Types come from the .tsx
//   entry's tail re-export band — NOT a `/types` subpath (the rewriter mangles
//   that). `ValidationError` is NOT in that band, so the carousel defines its
//   own `MediaCarouselError` below and media-editor-01 stays untouched.

// Re-export the media-editor-01 types this procomp surfaces, so sibling files
// pull them from the local types barrel and the external module path stays in
// as few files as possible.
export type {
  AspectRatio,
  ExportMetadata,
  InitialSource,
  MediaEditor01Handle,
  MediaEditorState,
};

export type MediaKind = "image" | "video";
export type MediaCarouselSource = "upload" | "library"; // "library" clamped in v0.1

/**
 * Own error type — media-editor-01's `ValidationError` is not re-exported from
 * its `.tsx` entry, and we keep media-editor-01 untouched. Structurally aligned.
 */
export interface MediaCarouselError {
  // The cap has its own `onMaxItemsExceeded` channel — this type is per-file
  // validation only.
  kind: "unsupported-type" | "file-too-large";
  message: string;
  file?: File;
}

/**
 * One item in the carousel. `url` is the CURRENT displayable source — an object
 * URL for local/edited media, or a remote URL for re-edit seeds. After an
 * edit-apply, `url`/`blob` reflect the flattened export and `editorState`
 * retains the editable layers so a re-open can `loadState` them (photo path).
 */
export interface MediaCarouselItem {
  id: string;
  kind: MediaKind;
  url: string;
  /** Present for local/edited media; absent for a remote-only re-edit seed. */
  blob?: Blob;
  /** Present once edited (photo path; `videoBlob` is always nulled). */
  editorState?: MediaEditorState;
  /** From the last `export()` of this item. */
  exportMeta?: ExportMetadata;
  width?: number;
  height?: number;
  fileName?: string;
}

export interface MediaCarouselEditor01Labels {
  dropzoneTitle?: string;
  dropzoneBrowse?: string;
  dropzoneHint?: string;
  addMore?: string;
  edit?: string;
  editDone?: string;
  editCancel?: string;
  editSaving?: string;
  editError?: string;
  remove?: string;
  reorderHint?: string;
  maxReached?: string;
  videoNotEditable?: string;
  finishEditingHint?: string;
  /** Template with `{n}` / `{total}` / `{kind}`. */
  itemAria?: string;
}

export const DEFAULT_CAROUSEL_LABELS: Required<MediaCarouselEditor01Labels> = {
  dropzoneTitle: "Drag photos & videos here",
  dropzoneBrowse: "Browse",
  dropzoneHint: "or drop up to {max} files",
  addMore: "Add more",
  edit: "Edit",
  editDone: "Done",
  editCancel: "Cancel",
  editSaving: "Saving…",
  editError: "Couldn't save your edit. Try again.",
  remove: "Remove",
  reorderHint: "Drag to reorder",
  maxReached: "Maximum {max} items reached",
  videoNotEditable: "Video editing arrives in v0.2",
  finishEditingHint: "Finish editing to reorder or add media",
  itemAria: "Media item {n} of {total}, {kind}",
};

export interface MediaCarouselEditor01Props {
  // value
  value?: MediaCarouselItem[];
  defaultValue?: MediaCarouselItem[];
  onChange?: (items: MediaCarouselItem[]) => void;

  // capability dials
  maxItems?: number; // default 10
  maxFileSizeMb?: number; // default 50 (mirrors media-editor-01)
  accept?: MediaKind[]; // default ["image","video"]
  sources?: MediaCarouselSource[]; // default ["upload"]; "library" clamped/no-op
  aspect?: AspectRatio | "auto"; // default "auto" → derive from item 1 dims

  // forwarded subset of media-editor-01 dials (edit panel). Crop aspect is OWNED
  // by `aspect` here (shared-aspect guarantee) — deliberately not in this Pick.
  editorProps?: Pick<
    MediaEditor01Props,
    "enabledTools" | "stickers" | "fonts" | "colorPresets" | "filterPresets" | "labels"
  >;

  labels?: Partial<MediaCarouselEditor01Labels>;
  className?: string;
  /**
   * Revoke object URLs this component created when it unmounts. Default true.
   * Set false ONLY when a host preserves the live items across remounts and
   * takes over final cleanup (e.g. content-composer's carousel cache).
   */
  revokeOnUnmount?: boolean;

  // events
  onItemAdd?: (item: MediaCarouselItem) => void;
  onItemRemove?: (id: string) => void;
  onReorder?: (items: MediaCarouselItem[]) => void;
  onSelect?: (id: string | null) => void;
  onEditOpen?: (id: string) => void;
  onEditApply?: (item: MediaCarouselItem) => void;
  onEditCancel?: (id: string) => void;
  onValidationError?: (error: MediaCarouselError) => void;
  onMaxItemsExceeded?: (attempted: number, max: number) => void;
}

export interface MediaCarouselEditor01Handle {
  getItems: () => MediaCarouselItem[];
  /**
   * Pull-only: resolves a defensive copy of the COMMITTED ordered items (already
   * flattened on edit-apply). An open-but-unapplied edit is NOT included — the
   * host should gate publish while editing.
   */
  export: () => Promise<MediaCarouselItem[]>;
  addFiles: (files: File[] | FileList) => void;
  removeItem: (id: string) => void;
  select: (id: string | null) => void;
  openEditor: (id: string) => void;
  /** Revoke all owned object URLs; clears items. Also auto-runs on unmount. */
  reset: () => void;
}
