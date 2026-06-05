"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CAROUSEL_LABELS,
  type MediaCarouselEditor01Handle,
  type MediaCarouselEditor01Props,
} from "./types";
import { useCarouselState } from "./hooks/use-carousel-state";
import { filesToItems } from "./lib/file-intake";
import { clampSources } from "./lib/clamp-sources";
import { aspectToCss, resolveAspect } from "./lib/aspect";
import { MediaDropzone } from "./parts/media-dropzone";
import { PreviewRail } from "./parts/preview-rail";
import { MainPreview } from "./parts/main-preview";
import { EditPanel } from "./parts/edit-panel";

/**
 * media-carousel-editor-01 — a multi-item media composer (Instagram-feed-post
 * semantics): drag-drop / browse one-or-more mixed photo+video files into an
 * ordered, reorderable rail with a main preview, and edit any item through a
 * single shared `media-editor-01` instance (loaded serially, never N at once).
 * Composes media-editor-01 without modifying it.
 */
function MediaCarouselEditor01Impl(
  props: MediaCarouselEditor01Props,
  ref: React.Ref<MediaCarouselEditor01Handle>,
) {
  const {
    value,
    defaultValue,
    onChange,
    maxItems = 10,
    maxFileSizeMb = 50,
    accept,
    sources,
    aspect = "auto",
    editorProps,
    labels: labelOverrides,
    className,
    revokeOnUnmount,
    onItemAdd,
    onItemRemove,
    onReorder,
    onSelect,
    onEditOpen,
    onEditApply,
    onEditCancel,
    onValidationError,
    onMaxItemsExceeded,
  } = props;

  const labels = useMemo(
    () => ({ ...DEFAULT_CAROUSEL_LABELS, ...labelOverrides }),
    [labelOverrides],
  );
  const acceptKinds = useMemo(
    () => accept ?? ["image" as const, "video" as const],
    [accept],
  );
  // v0.1: "library" is clamped out — intake is upload-only (drop / browse).
  const uploadEnabled = useMemo(
    () => clampSources(sources).includes("upload"),
    [sources],
  );

  const [ingesting, setIngesting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [announce, setAnnounce] = useState("");

  const fillTemplate = (tpl: string) => tpl.replace("{max}", String(maxItems));

  const state = useCarouselState({
    value,
    defaultValue,
    onChange,
    maxItems,
    revokeOnUnmount,
    onItemAdd,
    onItemRemove: (id) => {
      onItemRemove?.(id);
      setAnnounce(labels.remove);
    },
    onReorder: (items) => {
      onReorder?.(items);
      setAnnounce(labels.reorderHint);
    },
    onSelect,
    onEditOpen,
    onEditApply,
    onEditCancel,
    onMaxItemsExceeded: (attempted, max) => {
      onMaxItemsExceeded?.(attempted, max);
      const msg = fillTemplate(labels.maxReached);
      setErrors((prev) => (prev.includes(msg) ? prev : [...prev, msg]));
      setAnnounce(msg);
    },
  });

  // Latest items for stable async reads (file intake + imperative handle).
  const itemsRef = useRef(state.items);
  useEffect(() => {
    itemsRef.current = state.items;
  });

  const resolvedAspect = useMemo(
    () => resolveAspect(state.items, aspect),
    [state.items, aspect],
  );

  const addFiles = async (files: File[] | FileList) => {
    setErrors([]);
    setIngesting(true);
    try {
      const res = await filesToItems(files, {
        accept: acceptKinds,
        maxFileSizeMb,
      });
      res.errors.forEach((err) => onValidationError?.(err));
      if (res.errors.length > 0) {
        setErrors((prev) => [...prev, ...res.errors.map((e) => e.message)]);
      }
      // addItems caps to maxItems synchronously + fires onMaxItemsExceeded.
      if (res.items.length > 0) {
        state.addItems(res.items);
        setAnnounce(
          `${res.items.length} item${res.items.length === 1 ? "" : "s"} added`,
        );
      }
    } finally {
      setIngesting(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const dndAnnouncements: Announcements = useMemo(() => {
    const pos = (id: string | number) =>
      itemsRef.current.findIndex((it) => it.id === id) + 1;
    const total = () => itemsRef.current.length;
    return {
      onDragStart: ({ active }) => `Picked up item ${pos(active.id)}.`,
      onDragOver: ({ active, over }) =>
        over ? `Item ${pos(active.id)} over position ${pos(over.id)}.` : "",
      onDragEnd: ({ active, over }) =>
        over
          ? `Item dropped at position ${pos(over.id)} of ${total()}.`
          : `Item ${pos(active.id)} dropped.`,
      onDragCancel: ({ active }) =>
        `Reorder cancelled; item ${pos(active.id)} returned.`,
    };
  }, []);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = itemsRef.current;
    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    state.reorder(arrayMove(items, oldIndex, newIndex));
  };

  useImperativeHandle(
    ref,
    (): MediaCarouselEditor01Handle => ({
      getItems: () => itemsRef.current.map((it) => ({ ...it })),
      export: async () => itemsRef.current.map((it) => ({ ...it })),
      addFiles,
      removeItem: state.removeItem,
      select: state.select,
      openEditor: state.openEditor,
      reset: state.reset,
    }),
    // addFiles is recreated each render (intentional); the rest are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.removeItem, state.select, state.openEditor, state.reset],
  );

  const isEmpty = state.items.length === 0;
  const isEditing = state.editingId !== null && state.editingItem !== null;
  const canAddMore = uploadEnabled && state.items.length < maxItems;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {isEmpty ? (
        uploadEnabled ? (
          <MediaDropzone
            variant="empty"
            accept={acceptKinds}
            maxItems={maxItems}
            busy={ingesting}
            labels={labels}
            onFiles={addFiles}
          />
        ) : null
      ) : isEditing ? (
        <EditPanel
          key={state.editingItem!.id}
          item={state.editingItem!}
          aspect={resolvedAspect}
          editorProps={editorProps}
          labels={labels}
          onApply={state.applyEdit}
          onCancel={state.cancelEdit}
        />
      ) : (
        <MainPreview
          item={state.selectedItem}
          aspectCss={aspectToCss(resolvedAspect)}
          canEdit={state.selectedItem?.kind === "image"}
          labels={labels}
          onEdit={() =>
            state.selectedItem && state.openEditor(state.selectedItem.id)
          }
        />
      )}

      {errors.length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden
          />
          <ul className="flex-1 space-y-0.5">
            {errors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setErrors([])}
            className="shrink-0 rounded p-0.5 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      {!isEmpty ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          accessibility={{ announcements: dndAnnouncements }}
          onDragEnd={onDragEnd}
        >
          <PreviewRail
            items={state.items}
            selectedId={state.selectedId}
            disabled={isEditing}
            canAddMore={canAddMore}
            busy={ingesting}
            accept={acceptKinds}
            maxItems={maxItems}
            labels={labels}
            onSelect={state.select}
            onRemove={state.removeItem}
            onFiles={addFiles}
          />
        </DndContext>
      ) : null}

      <output aria-live="polite" className="sr-only">
        {announce}
      </output>
    </div>
  );
}

export const MediaCarouselEditor01 = forwardRef(MediaCarouselEditor01Impl);
MediaCarouselEditor01.displayName = "MediaCarouselEditor01";

// ─── Tail type re-exports (cross-procomp consumers) ──────────────────────────
// Procomps that compose media-carousel-editor-01 must import these types from
// THIS component-file path, not `./types`: the shadcn path rewriter resolves a
// barrel/directory import to this `.tsx` file but mangles `/types` subpaths
// (F-01). Mirrors media-editor-01's tail band.
export type {
  MediaCarouselItem,
  MediaKind,
  MediaCarouselSource,
  MediaCarouselError,
  MediaCarouselEditor01Props,
  MediaCarouselEditor01Handle,
  MediaCarouselEditor01Labels,
} from "./types";
