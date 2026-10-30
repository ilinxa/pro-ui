import type { ComponentType } from "react";

// carousel-composer 0.3.0 — the base imports NOTHING from media-editor. Image
// editing is an opt-in feature item (`@ilinxa/carousel-composer-editing`,
// installed into `features/editing/`) passed in through the `editing` prop.
// The editor-shaped fields on an item (`editorState`, `exportMeta`) are typed
// here without media-editor's types; the add-on exports typed readers
// (`editorStateOf`, `exportMetaOf`).

export type MediaKind = "image" | "video";
/** `"library"` is accepted for forward compatibility and ignored: intake is upload-only. */
export type MediaCarouselSource = "upload" | "library";

/**
 * The carousel's shared frame aspect — the same values as media-editor's
 * `CropAspect` (0.4.0; was the five `AspectRatio` values): the named ratios,
 * `"free"` (each item keeps its own ratio, no crop), `"original"` (item 1's own
 * ratio, 1:1 until its size is known) and any `"W:H"` with finite positive
 * numbers, e.g. `"1.91:1"`. An invalid `"W:H"` falls back to `"1:1"` (one dev
 * warning).
 */
export type CarouselAspectRatio =
  | "9:16"
  | "1:1"
  | "16:9"
  | "4:5"
  | "free"
  | "original"
  | `${number}:${number}`;

/** A crop rectangle in an item's media pixels (its current `url`). */
export interface CarouselCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
/** @deprecated Use `CarouselAspectRatio` (0.2 re-exported media-editor's `AspectRatio` from this file). */
export type AspectRatio = CarouselAspectRatio;

/**
 * Image and video types the ilinxa Social Platform accepts (no WebM). Pass it as
 * `acceptMime={PLATFORM_SAFE_MIME}`; the default stays permissive (any `image/*`
 * or `video/*`).
 */
export const PLATFORM_SAFE_MIME: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
];

export type MediaCarouselErrorKind =
  | "unsupported-type"
  | "file-too-large"
  | "video-too-long";

/** A file refused at intake. The cap has its own `onMaxItemsExceeded` channel. */
export interface MediaCarouselError {
  kind: MediaCarouselErrorKind;
  /** The message shown to the user, from `labels.errors`. */
  message: string;
  file?: File;
  /** `"video-too-long"`: the video's length and the limit, in seconds. */
  durationSeconds?: number;
  maxSeconds?: number;
}

/** Host-owned upload state. The host uploads on add and sets these on the item. */
export type MediaCarouselItemStatus = "pending" | "uploading" | "uploaded" | "error";

/**
 * What the carousel itself reads from an editor export. The editing add-on stores
 * media-editor's full `ExportMetadata` here (a superset); read it typed with the
 * add-on's `exportMetaOf(item)`.
 */
export interface CarouselExportMeta {
  width: number;
  height: number;
  mimeType: string;
  durationMs?: number;
}

/**
 * One item in the carousel. `url` is the CURRENT displayable source — an object
 * URL for local/edited media, or a remote URL (re-edit seeds, uploaded media).
 */
export interface MediaCarouselItem {
  id: string;
  kind: MediaKind;
  url: string;
  /** Present for local / edited media; absent for a remote-only item. For an added video it is the original `File`, never re-encoded. */
  blob?: Blob;
  /**
   * Editable layers from the last edit (images only), written and read by the
   * editing add-on — media-editor's `MediaEditorState`. Opaque to the base; read
   * it with `editorStateOf(item)` from `@/components/carousel-composer/features/editing`.
   */
  editorState?: unknown;
  /**
   * The blob behind `editorState`'s image, kept at edit-apply so a re-edit can
   * re-open it after the previous editor's object URLs are revoked. In-memory only.
   */
  sourceBlob?: Blob;
  /** From the last edit's export. */
  exportMeta?: CarouselExportMeta;
  width?: number;
  height?: number;
  fileName?: string;

  /**
   * Alt text. Edited in the preview when `enableAltText` lets this item be
   * described (images by default; 0.5.0: videos too with `"all"`), and the
   * preview's image or video is named by it.
   */
  alt?: string;
  /** Upload state, set by the host (controlled `value`, or the handle's `updateItem`). */
  status?: MediaCarouselItemStatus;
  /** Upload progress from 0 to 1, shown while `status` is `"uploading"`. */
  progress?: number;
  /** Error text for `status: "error"`, shown with a Retry when `onRetry` is wired. */
  error?: string;
  /** Video length in seconds, read on add. */
  duration?: number;
  /** A JPEG frame grabbed on add (videos, `posterAt`). */
  posterBlob?: Blob;
  /** Object URL of `posterBlob`, created and revoked by the carousel. */
  posterUrl?: string;
  /**
   * 0.4.0, filled by `handle.export()` only: the centred crop of this item's
   * media (`width` × `height` pixels) at the shared aspect — the whole image
   * when it already has that ratio (an edit exports at it). Absent for videos,
   * for `"free"`, and while the item's size is unknown. Upload the region (or
   * crop server-side) to publish every item at the shared aspect.
   */
  crop?: CarouselCropRect;
  /**
   * 0.5.0. Where the shared frame sits on an image whose ratio differs from the
   * shared aspect: a focal point from 0 to 1 on each axis (`0.5` = centred, the
   * default). Only the axis the image overflows on has an effect. Set by
   * dragging the preview when `enablePan` is on (or by the host); the preview,
   * the rail thumb and `export()`'s `crop` all follow it. Kept when only `url`
   * changes (an upload swapping a local URL for the uploaded one); cleared when
   * the image itself changes — an applied edit (which bakes this framing into
   * the new image) or an `updateItem` patch that changes `width` / `height`.
   */
  cropOffset?: CarouselCropOffset;
}

/**
 * 0.5.0. A focal point inside an image, each axis from 0 to 1 of the image's own
 * pixels: `x` 0 = its left edge, 1 = its right edge (an image is never mirrored,
 * so this does not flip in RTL); `y` 0 = top, 1 = bottom.
 */
export interface CarouselCropOffset {
  x: number;
  y: number;
}

/** Fields a host may change through the handle's `updateItem`. */
export type MediaCarouselItemPatch = Partial<Omit<MediaCarouselItem, "id" | "kind">>;

/** What an edit-apply writes onto the item. */
export interface ApplyEditPatch {
  url: string;
  blob?: Blob;
  editorState?: unknown;
  sourceBlob?: Blob;
  exportMeta?: CarouselExportMeta;
  width?: number;
  height?: number;
}

// ─── Labels ──────────────────────────────────────────────────────────────────

export interface CarouselComposerErrorLabels {
  /** A file whose type is not an image or video, or not in `acceptMime`. */
  unsupportedType: (info: { file: File; type: string }) => string;
  /** An image or video when `accept` leaves that kind out. */
  kindNotAccepted: (info: { file: File; kind: MediaKind }) => string;
  fileTooLarge: (info: { file: File; sizeMb: number; maxMb: number }) => string;
  videoTooLong: (info: { file: File; seconds: number; maxSeconds: number }) => string;
}

/** Drag-and-drop screen-reader text. Positions are 1-based. */
export interface CarouselComposerDragLabels {
  /** How to drag with the keyboard — read when a drag handle gets focus. */
  instructions: string;
  pickedUp: (position: number, total: number) => string;
  over: (position: number, overPosition: number, total: number) => string;
  dropped: (position: number, total: number) => string;
  droppedInPlace: (position: number) => string;
  cancelled: (position: number) => string;
}

export interface CarouselComposerLabels {
  dropzoneTitle: string;
  dropzoneBrowse: string;
  dropzoneHint: (max: number) => string;
  /** Shown in the dropzone while files are read. */
  dropzoneBusy: string;
  addMore: string;
  /** The preview's Edit button (only with the editing add-on). */
  edit: string;
  editDone: string;
  editCancel: string;
  editSaving: string;
  editError: string;
  /**
   * @deprecated Use `removeItem`. Still names the rail's remove buttons when `removeItem` is not
   * passed (0.2 translations keep working); otherwise unused.
   */
  remove: string;
  /** Accessible name of a rail thumb's remove button. `position` is 1-based. */
  removeItem: (info: { position: number; total: number; kind: MediaKind }) => string;
  /** The rail's drag handle. */
  reorderHint: string;
  maxReached: (max: number) => string;
  /** Caption on a video in the preview when the editing add-on is installed. */
  videoNotEditable: string;
  finishEditingHint: string;
  /** Name of a rail thumb. `position` is 1-based. The default adds `pending` / `uploading` / `error` and the alt text. */
  itemAria: (info: {
    position: number;
    total: number;
    kind: MediaKind;
    alt?: string;
    status?: MediaCarouselItemStatus;
  }) => string;
  /** The error panel's dismiss button. */
  dismissErrors: string;
  /** Announced after files are added. */
  itemsAdded: (count: number) => string;
  /** Announced after an item is removed. */
  itemRemoved: string;
  drag: CarouselComposerDragLabels;
  /** The alt-text field (`enableAltText`). */
  altLabel: string;
  altPlaceholder: string;
  altCounter: (length: number, max: number) => string;
  /** Accessible name of a progress indicator. `progress` is 0–1; `position` is 1-based. */
  uploadProgress: (progress: number, info: { position: number; total: number }) => string;
  /** Shown for `status: "error"` when the item has no `error` text. */
  uploadFailed: string;
  retry: string;
  /** Announced (politely) when an item's `status` changes. `position` is 1-based. */
  uploadStatus: (info: {
    status: MediaCarouselItemStatus;
    position: number;
    total: number;
    error?: string;
  }) => string;
  /** Accessible name of a video's duration badge, e.g. "Duration 0:45". */
  durationLabel: (formatted: string) => string;
  /**
   * 0.4.0. Accessible name of the aspect switch (`aspectOptions`). Optional so a
   * full 0.3 labels object still type-checks; default "Aspect ratio".
   */
  aspectSwitch?: string;
  /**
   * 0.4.0. Name of one aspect option. `format` renders a number in `locale`.
   * Default: "Original", "Free", otherwise the ratio with locale digits
   * (`"1.91:1"`). Optional (see `aspectSwitch`).
   */
  aspectOption?: (aspect: CarouselAspectRatio, format: (n: number) => string) => string;
  /**
   * 0.5.0. Placeholder of the alt field for a video (`enableAltText="all"`).
   * Optional (see `aspectSwitch`); default "Describe this video for people who
   * can't see it".
   */
  altPlaceholderVideo?: string;
  /**
   * 0.5.0. Accessible name of the pannable preview (`enablePan`), read with its
   * keyboard hint. Optional; default "Reposition photo. Drag, or use the arrow
   * keys."
   */
  panHint?: string;
  /**
   * 0.5.0. Names of the non-drag reorder buttons (`reorderButtons`). `position`
   * is 1-based. Logical, not physical: "earlier" is towards item 1 in any
   * direction. Optional; defaults "Move item N earlier" / "Move item N later".
   */
  moveEarlier?: (info: { position: number; total: number }) => string;
  moveLater?: (info: { position: number; total: number }) => string;
  /** 0.5.0. Announced after a button move. Optional; default "Item moved to position N of M." */
  moved?: (position: number, total: number) => string;
  errors: CarouselComposerErrorLabels;
}

/** What `labels` accepts: any subset; `errors` and `drag` merge key by key. */
export type CarouselComposerLabelsInput = Partial<
  Omit<CarouselComposerLabels, "errors" | "drag">
> & {
  errors?: Partial<CarouselComposerErrorLabels>;
  drag?: Partial<CarouselComposerDragLabels>;
};

/** English defaults. Partial overrides merge over these (`errors` / `drag` key by key). */
export const defaultCarouselComposerLabels: CarouselComposerLabels = {
  dropzoneTitle: "Drag photos & videos here",
  dropzoneBrowse: "Browse",
  dropzoneHint: (max) => `or drop up to ${max} files`,
  dropzoneBusy: "Adding media…",
  addMore: "Add more",
  edit: "Edit",
  editDone: "Done",
  editCancel: "Cancel",
  editSaving: "Saving…",
  editError: "Couldn't save your edit. Try again.",
  remove: "Remove",
  removeItem: ({ position, total }) => `Remove item ${position} of ${total}`,
  reorderHint: "Drag to reorder",
  maxReached: (max) => `Maximum ${max} items reached`,
  videoNotEditable: "Video editing isn't available.",
  finishEditingHint: "Finish editing to reorder or add media",
  itemAria: ({ position, total, kind, alt, status }) => {
    const state =
      status === "uploading" || status === "error" || status === "pending"
        ? `, ${status}`
        : "";
    return `Media item ${position} of ${total}, ${kind}${state}${alt ? `: ${alt}` : ""}`;
  },
  dismissErrors: "Dismiss",
  itemsAdded: (count) => (count === 1 ? "1 item added" : `${count} items added`),
  itemRemoved: "Item removed",
  drag: {
    instructions:
      "To pick up an item, press the space bar. While dragging, use the arrow keys to move it. Press space again to drop it in its new position, or press escape to cancel.",
    pickedUp: (position) => `Picked up item ${position}.`,
    over: (position, overPosition) =>
      `Item ${position} over position ${overPosition}.`,
    dropped: (position, total) => `Item dropped at position ${position} of ${total}.`,
    droppedInPlace: (position) => `Item ${position} dropped.`,
    cancelled: (position) => `Reorder cancelled; item ${position} returned.`,
  },
  altLabel: "Alt text",
  altPlaceholder: "Describe this image for people who can't see it",
  altCounter: (length, max) => `${length}/${max}`,
  uploadProgress: (progress, { position, total }) =>
    `Item ${position} of ${total} uploading, ${Math.round(progress * 100)}%`,
  uploadFailed: "Upload failed",
  retry: "Retry",
  uploadStatus: ({ status, position, total, error }) => {
    switch (status) {
      case "pending":
        return `Item ${position} of ${total} waiting to upload`;
      case "uploading":
        return `Item ${position} of ${total} uploading`;
      case "uploaded":
        return `Item ${position} of ${total} uploaded`;
      case "error":
        return `Item ${position} of ${total} failed to upload${error ? `: ${error}` : ""}`;
    }
  },
  durationLabel: (formatted) => `Duration ${formatted}`,
  aspectSwitch: "Aspect ratio",
  aspectOption: (aspect, format) => {
    if (aspect === "original") return "Original";
    if (aspect === "free") return "Free";
    const [w, h] = aspect.split(":");
    return `${format(Number(w))}:${format(Number(h))}`;
  },
  altPlaceholderVideo: "Describe this video for people who can't see it",
  panHint: "Reposition photo. Drag, or use the arrow keys.",
  moveEarlier: ({ position }) => `Move item ${position} earlier`,
  moveLater: ({ position }) => `Move item ${position} later`,
  moved: (position, total) => `Item moved to position ${position} of ${total}.`,
  errors: {
    unsupportedType: ({ type }) => `Unsupported file type: ${type || "unknown"}`,
    kindNotAccepted: ({ kind }) =>
      `${kind === "image" ? "Image" : "Video"} files are not accepted here.`,
    fileTooLarge: ({ sizeMb, maxMb }) =>
      `File is ${sizeMb.toFixed(1)} MB — maximum is ${maxMb} MB.`,
    videoTooLong: ({ seconds, maxSeconds }) =>
      `Video is ${Math.round(seconds)} s — maximum is ${maxSeconds} s.`,
  },
};

/** @deprecated Use `defaultCarouselComposerLabels` (0.3.0 turned the three `{max}` / `{n}` templates into functions). */
export const DEFAULT_CAROUSEL_LABELS = defaultCarouselComposerLabels;

// ─── Editing seam (feature item) ──────────────────────────────────────────────

/** What the editing panel receives. A superset of a `renderEditor({ item, onApply, onCancel })` slot. */
export interface CarouselEditorPanelProps {
  item: MediaCarouselItem;
  /**
   * The shared aspect, ready for media-editor's canvas `aspect` and
   * `cropAspects`: a named ratio, `"free"`, or `"W:H"` (0.4.0 — `"original"`
   * arrives resolved to item 1's ratio as `"W:H"`). Breaking in 0.4.0: a custom
   * panel that switched over the five 0.3 values must handle `"W:H"`.
   */
  aspect: Exclude<CarouselAspectRatio, "original">;
  /** `aspect` as width / height (0.4.0); `null` for `"free"`. */
  aspectRatio: number | null;
  labels: Pick<CarouselComposerLabels, "editDone" | "editCancel" | "editSaving" | "editError">;
  /** `CarouselComposerProps.editorProps`, passed through untouched. */
  editorProps?: Readonly<Record<string, unknown>>;
  /** Commit an edit: replaces the item's `url` / `blob` and stores the edit fields. */
  onApply: (id: string, patch: ApplyEditPatch) => void;
  onCancel: () => void;
  /**
   * 0.5.0. Report that the panel is preparing or saving (loading its source,
   * encoding an export). While a panel reports busy the carousel swallows
   * Escape before any dialog sees it, so a host dialog around the carousel does
   * not close mid-preparation. Report `false` when done; unmounting clears it.
   * The shipped editing panel reports its load and its Done export.
   */
  onBusyChange?: (busy: boolean) => void;
}

/**
 * Image editing, injected: `editing={carouselEditing}` from
 * `@/components/carousel-composer/features/editing` (registry item
 * `@ilinxa/carousel-composer-editing`), or your own `{ Panel }`. Without it the
 * preview has no Edit button.
 */
export interface CarouselEditingExtension {
  Panel: ComponentType<CarouselEditorPanelProps>;
}

// ─── Props / handle ───────────────────────────────────────────────────────────

export interface CarouselComposerProps {
  // value
  value?: MediaCarouselItem[];
  defaultValue?: MediaCarouselItem[];
  onChange?: (items: MediaCarouselItem[]) => void;

  // capability dials
  /** Default 10. */
  maxItems?: number;
  /** Default 50. */
  maxFileSizeMb?: number;
  /** Which kinds are accepted. Default `["image", "video"]`. */
  accept?: MediaKind[];
  /**
   * Exact MIME allow-list, also used for the file input's `accept`. Default: any
   * `image/*` / `video/*` (filtered by `accept`). `PLATFORM_SAFE_MIME` refuses WebM.
   */
  acceptMime?: readonly string[];
  /** Refuse videos longer than this, in seconds (read from the file on add). Default: no limit. */
  maxVideoSeconds?: number;
  /** Default `["upload"]`; `"library"` is ignored. */
  sources?: MediaCarouselSource[];
  /**
   * The shared frame aspect of every item (preview, rail thumbs, edit, reported
   * crop). `"auto"` = the nearest of `aspectOptions` (named / `"W:H"` entries;
   * without options the four standard ratios) to item 1's ratio, 1:1 until it
   * is known. 0.4.0: controlled when set — a pick in the aspect switch calls
   * `onAspectChange` and waits for the new value.
   */
  aspect?: CarouselAspectRatio | "auto";
  /** 0.4.0. Starting aspect when `aspect` is not set. Default `"auto"`. */
  defaultAspect?: CarouselAspectRatio | "auto";
  /** 0.4.0. Fires when the user picks an option in the aspect switch. */
  onAspectChange?: (aspect: CarouselAspectRatio) => void;
  /**
   * 0.4.0. Shows an aspect switch on the main preview while item 1 is selected
   * and nothing is being edited (Instagram: the first photo decides). At least
   * two valid entries; invalid ones are dropped (one dev warning). Without it
   * there is no switch.
   */
  aspectOptions?: CarouselAspectRatio[];
  /**
   * 0.5.0. Lets the author drag an image inside the shared frame (Instagram):
   * pointer drag or arrow keys on the main preview move the item's
   * `cropOffset`. Images whose ratio differs from the shared aspect only; no
   * zoom. Default false (every image centred, as before).
   */
  enablePan?: boolean;
  /** 0.5.0. Fires when a pan gesture (or arrow key) settles on a new `cropOffset`. */
  onCropOffsetChange?: (id: string, offset: CarouselCropOffset) => void;

  // reorder
  /**
   * 0.5.0. Adds a "move earlier / move later" button pair to each rail thumb —
   * shown while the thumb is hovered or one of the pair has focus (Tab reaches
   * it), so the rail at rest looks as
   * before — as a keyboard, pointer, assistive-technology and test path that
   * needs no drag or layout. Default false.
   */
  reorderButtons?: boolean;

  // editing (feature item)
  /** Image editing add-on. Without it there is no Edit button and `openEditor` does nothing (one dev warning). */
  editing?: CarouselEditingExtension;
  /** Which items can be edited. Default: images. A video is never editable (its output is the original file). */
  canEditItem?: (item: MediaCarouselItem) => boolean;
  /**
   * Passed to the editing panel untouched — with the add-on, media-editor props
   * (`enabledTools`, `stickers`, `fonts`, `colorPresets`, `filterPresets`, `labels`);
   * type it with the add-on's `CarouselEditorProps`. Ignored without `editing` (one dev warning).
   */
  editorProps?: Readonly<Record<string, unknown>>;

  // alt text
  /**
   * Show an alt-text field (with its counter) for the selected item. Default
   * false. `true` / `"images"`: images only. 0.5.0: `"all"` describes videos
   * too; a function decides per item.
   */
  enableAltText?: boolean | "images" | "all" | ((item: MediaCarouselItem) => boolean);
  /** Default 200. */
  maxAltLength?: number;

  // upload status
  /** Shows a Retry on an item with `status: "error"`. */
  onRetry?: (item: MediaCarouselItem) => void;

  // video
  /** Seconds into a video to grab its poster frame; `false` = no poster. Default 0.5. */
  posterAt?: number | false;
  /** Formats a video's duration badge. Default `m:ss` (`h:mm:ss` past an hour), digits in `locale`. */
  formatDuration?: (seconds: number) => string;
  /** BCP 47 tag for the default duration format. Default `"en"`. */
  locale?: string;
  /** Text direction (the rail mirrors in RTL). Default: read from the element after mount. */
  dir?: "ltr" | "rtl";

  labels?: CarouselComposerLabelsInput;
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
  /**
   * 0.5.0. Fires for a one-step move (the `reorderButtons` pair or
   * `handle.moveItem`): `delta` is the change in position (−1 earlier, +1 later),
   * after the move. `onReorder` fires too.
   */
  onMove?: (id: string, delta: number) => void;
  onSelect?: (id: string | null) => void;
  /**
   * 0.5.0. Fires `true` when an edit panel opens and `false` when it closes.
   * Use it to keep a host dialog open while editing (the carousel already
   * swallows Escape while a panel reports busy).
   */
  onEditingChange?: (editing: boolean) => void;
  onEditOpen?: (id: string) => void;
  onEditApply?: (item: MediaCarouselItem) => void;
  onEditCancel?: (id: string) => void;
  onValidationError?: (error: MediaCarouselError) => void;
  onMaxItemsExceeded?: (attempted: number, max: number) => void;
}

export interface CarouselComposerHandle {
  getItems: () => MediaCarouselItem[];
  /**
   * Resolves a copy of the COMMITTED ordered items (edits already flattened). An
   * open, unapplied edit is not included — gate publish while editing. 0.4.0:
   * each image of known size carries `crop` for the shared aspect.
   */
  export: () => Promise<MediaCarouselItem[]>;
  /**
   * 0.4.0. The shared aspect as resolved now (`"auto"` and `"original"` turned
   * into a value) and its width / height (`null` for `"free"`).
   */
  getAspect: () => { aspect: CarouselAspectRatio; ratio: number | null };
  /** Same path as the dropzone, with the current props. Resolves once the files are read and added. */
  addFiles: (files: File[] | FileList) => Promise<void>;
  removeItem: (id: string) => void;
  /**
   * 0.5.0. Move an item by `delta` positions (negative = earlier), clamped to
   * the list. Same path as the `reorderButtons` pair: fires `onReorder` and
   * `onMove`; ignored while an edit is open.
   */
  moveItem: (id: string, delta: number) => void;
  /** Patch an item (upload `status` / `progress` / `error`, the uploaded `url`, `alt`…). */
  updateItem: (id: string, patch: MediaCarouselItemPatch) => void;
  select: (id: string | null) => void;
  /** Open the editor for an item. Needs `editing`; videos and items `canEditItem` refuses are ignored (dev warning). */
  openEditor: (id: string) => void;
  /** Revoke all owned object URLs and clear the items. (Unmount revokes owned URLs too, unless `revokeOnUnmount={false}`.) */
  reset: () => void;
}
