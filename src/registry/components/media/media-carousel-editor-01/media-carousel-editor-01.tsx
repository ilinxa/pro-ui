"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
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

  const state = useCarouselState({
    value,
    defaultValue,
    onChange,
    onItemAdd,
    onItemRemove,
    onReorder,
    onSelect,
    onEditOpen,
    onEditApply,
    onEditCancel,
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

  // Not memoized on purpose — closes over the latest items count so the
  // `maxItems` room is accurate even across rapid adds.
  const addFiles = async (files: File[] | FileList) => {
    const existingCount = itemsRef.current.length;
    const res = await filesToItems(files, {
      accept: acceptKinds,
      maxFileSizeMb,
      maxItems,
      existingCount,
    });
    res.errors.forEach((err) => onValidationError?.(err));
    if (res.exceeded) {
      onMaxItemsExceeded?.(existingCount + res.attempted, maxItems);
    }
    if (res.items.length > 0) state.addItems(res.items);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

        {!isEmpty ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <PreviewRail
              items={state.items}
              selectedId={state.selectedId}
              disabled={isEditing}
              canAddMore={canAddMore}
              accept={acceptKinds}
              maxItems={maxItems}
              labels={labels}
              onSelect={state.select}
              onRemove={state.removeItem}
              onFiles={addFiles}
            />
          </DndContext>
        ) : null}
    </div>
  );
}

export const MediaCarouselEditor01 = forwardRef(MediaCarouselEditor01Impl);
MediaCarouselEditor01.displayName = "MediaCarouselEditor01";
