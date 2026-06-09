"use client";

import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  type DragEvent as ReactDragEvent,
} from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Files } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MediaLibraryContext,
  useMediaLibraryStore,
} from "../hooks/use-media-library";
import type { MediaDragData } from "../lib/drag";
import type { MediaLibrary01Handle, MediaLibraryRootProps } from "../types";
import { MediaLibraryUploadOverlay } from "./upload-overlay";

export const DROP_PREFIX = "drop:";

/**
 * Headless provider (Tier B). Owns the store/context, the single `DndContext`
 * for internal move, OS file-drop wiring, the hidden upload input, and the
 * imperative handle. Renders `children` so consumers compose freely.
 */
export const MediaLibraryRoot = forwardRef<
  MediaLibrary01Handle,
  MediaLibraryRootProps
>(function MediaLibraryRoot(props, ref) {
  const store = useMediaLibraryStore(props);
  const { children, className } = props;
  const dragDepth = useRef(0);
  // Stable, SSR-safe id for DndContext — without it, @dnd-kit derives its
  // `aria-describedby` ("DndDescribedBy-N") from a module-level counter that
  // increments in a different order on the server vs the client → hydration
  // mismatch. useId is identical across SSR/CSR and unique per Root instance.
  const dndId = useId();

  useImperativeHandle(
    ref,
    () => ({
      navigateTo: store.navigateTo,
      refresh: store.refresh,
      openPreview: store.openPreview,
      closePreview: store.closePreview,
      triggerUpload: store.triggerUpload,
      getSelectedIds: () => Array.from(store.selectedIds),
      clearSelection: store.selection.clear,
    }),
    [store],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!store.enableInternalDrag) return;
      const id = String(event.active.id);
      const data = event.active.data.current as MediaDragData | undefined;
      const ids = data?.ids?.length ? data.ids : [id];
      store.setActiveDragIds(ids);
    },
    [store],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      store.setActiveDragIds(null);
      const overId = event.over ? String(event.over.id) : null;
      if (!overId || !overId.startsWith(DROP_PREFIX)) return;
      // Read the dragged ids straight off the event (set at drag-start) rather
      // than from React state, which can lag behind the drop.
      const data = event.active.data.current as MediaDragData | undefined;
      const ids = data?.ids?.length ? data.ids : [String(event.active.id)];
      const rawTarget = overId.slice(DROP_PREFIX.length);
      const target = rawTarget === "root" ? null : rawTarget;
      store.moveTo(ids, target);
    },
    [store],
  );

  // ---- OS file drop (native HTML5 drag of files from the desktop) ----
  const isFileDrag = (e: ReactDragEvent) =>
    Array.from(e.dataTransfer?.types ?? []).includes("Files");

  const onDragEnter = useCallback(
    (e: ReactDragEvent) => {
      if (!store.enableUploadDrop || !store.can.upload || !isFileDrag(e)) return;
      e.preventDefault();
      dragDepth.current += 1;
      store.setDraggingFiles(true);
    },
    [store],
  );
  const onDragOver = useCallback(
    (e: ReactDragEvent) => {
      if (!store.enableUploadDrop || !store.can.upload || !isFileDrag(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [store],
  );
  const onDragLeave = useCallback(
    (e: ReactDragEvent) => {
      if (!store.enableUploadDrop || !store.can.upload || !isFileDrag(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) store.setDraggingFiles(false);
    },
    [store],
  );
  const onDrop = useCallback(
    (e: ReactDragEvent) => {
      if (!store.enableUploadDrop || !store.can.upload || !isFileDrag(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      store.setDraggingFiles(false);
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length) store.uploadFiles(files);
    },
    [store],
  );

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Snapshot BEFORE resetting value (the browse-FileList lesson, v0.1.2).
      const files = Array.from(e.target.files ?? []);
      e.target.value = "";
      if (files.length) store.uploadFiles(files);
    },
    [store],
  );

  return (
    <MediaLibraryContext.Provider value={store}>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => store.setActiveDragIds(null)}
      >
        <div
          className={cn(
            "relative flex flex-col gap-4 text-foreground",
            "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300",
            className,
          )}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            ref={store.fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf,text/*,.md,.markdown,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={onFileInputChange}
          />
          {children}
          {store.enableUploadDrop && store.can.upload ? (
            <MediaLibraryUploadOverlay />
          ) : null}
          <DragOverlay dropAnimation={null}>
            {store.activeDragIds ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-popover px-3 py-2 text-sm font-medium shadow-lg">
                <Files className="size-4 text-primary" aria-hidden="true" />
                {store.activeDragIds.length}
              </div>
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>
    </MediaLibraryContext.Provider>
  );
});
