"use client";

import {
  forwardRef,
  useCallback,
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
import type {
  CarouselAspectRatio,
  CarouselComposerHandle,
  CarouselComposerProps,
  CarouselCropOffset,
  MediaCarouselItem,
  MediaCarouselItemStatus,
} from "./types";
import { useCarouselState } from "./hooks/use-carousel-state";
import { filesToItems } from "./lib/file-intake";
import { clampSources } from "./lib/clamp-sources";
import {
  aspectToCss,
  offsetCropRect,
  isValidAspect,
  resolveAspect,
} from "./lib/aspect";
import { mergeLabels } from "./lib/labels";
import { defaultCarouselComposerLabels } from "./types";
import { formatDuration as defaultFormatDuration } from "./lib/format-duration";
import { useWarnOnce } from "./hooks/use-warn-once";
import { ItemStatus } from "./parts/item-status";
import { AltField } from "./parts/alt-field";
import { MediaDropzone } from "./parts/media-dropzone";
import { PreviewRail } from "./parts/preview-rail";
import { MainPreview } from "./parts/main-preview";
import { useEditingExtension } from "./hooks/use-editing-extension";
import { useDirection } from "./hooks/use-direction";
import { EditFrame } from "./parts/edit-frame";
import { AspectSwitch } from "./parts/aspect-switch";
import { formatNumber as formatLocaleNumber } from "./lib/format-number";
import { useControllableState } from "./hooks/use-controllable-state";

/** How long the Escape guard outlives an edit (see the effect that installs it). */
const ESCAPE_GRACE_MS = 1000;

/**
 * carousel-composer — a multi-item media composer (Instagram-feed-post
 * semantics): drag-drop / browse one-or-more mixed photo+video files into an
 * ordered, reorderable rail with a main preview, alt text and host-driven upload
 * status. Image editing is injected through `editing` (the
 * `carousel-composer-editing` feature item); the base imports nothing from it.
 */
function CarouselComposerImpl(
  props: CarouselComposerProps,
  ref: React.Ref<CarouselComposerHandle>,
) {
  const {
    value,
    defaultValue,
    onChange,
    maxItems = 10,
    maxFileSizeMb = 50,
    accept,
    acceptMime,
    maxVideoSeconds,
    enableAltText = false,
    maxAltLength: maxAltLengthProp,
    onRetry,
    posterAt,
    formatDuration: formatDurationProp,
    locale = "en",
    dir: dirProp,
    sources,
    aspect: aspectProp,
    defaultAspect = "auto",
    onAspectChange,
    aspectOptions,
    editing: editingProp,
    canEditItem,
    editorProps,
    labels: labelOverrides,
    className,
    revokeOnUnmount,
    onItemAdd,
    onItemRemove,
    onReorder,
    onMove,
    onSelect,
    enablePan = false,
    onCropOffsetChange,
    reorderButtons = false,
    onEditingChange,
    onEditOpen,
    onEditApply,
    onEditCancel,
    onValidationError,
    onMaxItemsExceeded,
  } = props;

  const merged = useMemo(() => mergeLabels(labelOverrides), [labelOverrides]);
  const { labels } = merged;
  const legacyKeyList = merged.legacyKeys.join(",");
  const warnOnce = useWarnOnce();
  useEffect(() => {
    if (!legacyKeyList) return;
    legacyKeyList.split(",").forEach((key) =>
      warnOnce(
        `legacy-label:${key}`,
        `[CarouselComposer] labels.${key} is a function now (0.2 passed a string template); the string is ignored and the English default is used.`,
      ),
    );
  }, [legacyKeyList, warnOnce]);
  // Which items may be described: resolved once, here.
  const altEnabledFor = (it: MediaCarouselItem): boolean =>
    typeof enableAltText === "function"
      ? enableAltText(it)
      : enableAltText === "all"
        ? true
        : enableAltText === true || enableAltText === "images"
          ? it.kind === "image"
          : false;
  const maxAltLength = Math.max(1, maxAltLengthProp ?? 200);
  const formatDuration = useMemo(
    () => formatDurationProp ?? ((s: number) => defaultFormatDuration(s, locale)),
    [formatDurationProp, locale],
  );
  const acceptKinds = useMemo(
    () => accept ?? ["image" as const, "video" as const],
    [accept],
  );
  // "library" is clamped out — intake is upload-only (drop / browse).
  const uploadEnabled = useMemo(
    () => clampSources(sources).includes("upload"),
    [sources],
  );

  const [ingesting, setIngesting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [announce, setAnnounce] = useState("");
  // The live region only speaks when its text changes, so a repeat of the same
  // text alternates a trailing zero-width space.
  const say = useCallback(
    (text: string) => setAnnounce((prev) => (prev === text ? `${text}\u200B` : text)),
    [],
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const dir = useDirection(rootRef, dirProp);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  // Where focus goes once the element the user acted on is gone.
  const focusTargetRef = useRef<
    { type: "retry"; id: string } | { type: "remove"; id: string; next: string | null } | null
  >(null);

  const { editing, warnOpenWithoutEditing } = useEditingExtension({
    editing: editingProp,
    editorProps,
  });

  const state = useCarouselState({
    canEdit: (it) => canEditItem?.(it) !== false,
    value,
    defaultValue,
    onChange,
    maxItems,
    revokeOnUnmount,
    onItemAdd,
    onItemRemove: (id) => {
      onItemRemove?.(id);
      say(labels.itemRemoved);
    },
    onReorder: (items) => {
      onReorder?.(items);
    },
    onSelect,
    onEditOpen,
    onEditApply,
    onEditCancel,
    onMaxItemsExceeded: (attempted, max) => {
      onMaxItemsExceeded?.(attempted, max);
      const msg = labels.maxReached(max);
      // The error list below is a role="alert" region and announces this once.
      setErrors((prev) => (prev.includes(msg) ? prev : [...prev, msg]));
    },
  });

  // Announce each item's status or error CHANGE (never the statuses present at
  // mount or on first sight of an item, never progress ticks).
  const prevStatuses = useRef<Map<
    string,
    { status: MediaCarouselItemStatus | undefined; error: string | undefined }
  > | null>(null);
  useEffect(() => {
    const prev = prevStatuses.current;
    const next = new Map<
      string,
      { status: MediaCarouselItemStatus | undefined; error: string | undefined }
    >();
    const spoken: string[] = [];
    state.items.forEach((it, i) => {
      next.set(it.id, { status: it.status, error: it.error });
      const before = prev?.get(it.id);
      if (
        before &&
        it.status &&
        (before.status !== it.status || before.error !== it.error)
      ) {
        spoken.push(
          labels.uploadStatus({
            status: it.status,
            position: i + 1,
            total: state.items.length,
            error: it.error,
          }),
        );
      }
    });
    prevStatuses.current = next;
    if (spoken.length > 0) say(spoken.join(". "));
  }, [state.items, labels, say]);

  // Open edit that can no longer happen: the item left `items`, `editing` was
  // removed, or `canEditItem` now refuses it. Close it (fires onEditCancel once).
  const { editingId, cancelEdit } = state;
  useEffect(() => {
    if (editingId === null) return;
    const item = state.items.find((it) => it.id === editingId);
    const stillValid =
      editing !== undefined &&
      item !== undefined &&
      item.kind === "image" &&
      canEditItem?.(item) !== false;
    if (!stillValid) cancelEdit();
  }, [editingId, state.items, editing, canEditItem, cancelEdit]);

  // Hand focus on after Retry / Remove unmount the focused control. Only acts when
  // focus was lost to <body>, so it never pulls focus from where the user went.
  useEffect(() => {
    const target = focusTargetRef.current;
    const root = rootRef.current;
    if (!target || !root) return;
    const item = state.items.find((it) => it.id === target.id);
    const find = (attr: string, id: string) =>
      Array.from(root.querySelectorAll<HTMLElement>(`[${attr}]`)).find(
        (el) => el.getAttribute(attr) === id,
      );
    const lost = () =>
      document.activeElement === null || document.activeElement === document.body;
    if (target.type === "retry") {
      if (!item) {
        focusTargetRef.current = null;
        return;
      }
      if (item.status === "error") return;
      focusTargetRef.current = null;
      if (!lost()) return;
      (find("data-progress-for", item.id) ?? find("data-thumb-select", item.id))?.focus();
      return;
    }
    if (item) return;
    focusTargetRef.current = null;
    if (!lost()) return;
    const el = target.next
      ? find("data-thumb-select", target.next)
      : root.querySelector<HTMLElement>("[data-dropzone-browse]");
    el?.focus();
  }, [state.items]);

  // Closing the edit (Done, Cancel or an automatic close) removes the panel and the focus
  // with it. Hand focus back to the Edit button, else the selected thumb, but only if it
  // was lost: never pull it from where the user went.
  const isEditingNow =
    editing !== undefined && state.editingId !== null && state.editingItem !== null;
  const wasEditingRef = useRef(false);
  const selectedIdNow = state.selectedId;
  useEffect(() => {
    const was = wasEditingRef.current;
    wasEditingRef.current = isEditingNow;
    if (!was || isEditingNow) return;
    const root = rootRef.current;
    if (!root) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const thumb = Array.from(root.querySelectorAll<HTMLElement>("[data-thumb-select]")).find(
      (el) => el.getAttribute("data-thumb-select") === selectedIdNow,
    );
    (root.querySelector<HTMLElement>("[data-edit-button]") ?? thumb)?.focus();
  }, [isEditingNow, selectedIdNow]);

  // `onChange` is always defined: a fixed `aspect` with no switch is plain configuration,
  // not a frozen control, so the helper's "controlled without handler" warning would mislead.
  const [aspectSetting, setAspectSetting] = useControllableState<CarouselAspectRatio | "auto">({
    value: aspectProp,
    defaultValue: defaultAspect,
    onChange: (next) => {
      if (next !== "auto") onAspectChange?.(next);
    },
    componentName: "CarouselComposer",
    valuePropName: "aspect",
  });
  const switchOptions = useMemo(() => {
    const given = aspectOptions ?? [];
    const valid = given.filter((o, i) => isValidAspect(o) && given.indexOf(o) === i);
    return { valid, invalid: given.filter((o) => !isValidAspect(o)) };
  }, [aspectOptions]);
  const resolution = useMemo(
    () => resolveAspect(state.items, aspectSetting, switchOptions.valid),
    [state.items, aspectSetting, switchOptions.valid],
  );
  const resolvedAspect = resolution.aspect;
  const invalidAspectOptions = switchOptions.invalid.join(",");
  useEffect(() => {
    if (resolution.invalid) {
      warnOnce(
        `invalid-aspect:${String(aspectSetting)}`,
        `[CarouselComposer] aspect "${String(aspectSetting)}" is not a ratio ("W:H" with positive numbers); using "1:1".`,
      );
    }
  }, [resolution.invalid, aspectSetting, warnOnce]);
  useEffect(() => {
    if (invalidAspectOptions) {
      warnOnce(
        `invalid-aspect-options:${invalidAspectOptions}`,
        `[CarouselComposer] aspectOptions entries dropped (not a ratio): ${invalidAspectOptions}`,
      );
    }
  }, [invalidAspectOptions, warnOnce]);
  const aspectSwitchFrozen =
    aspectProp !== undefined && !onAspectChange && switchOptions.valid.length >= 2;
  useEffect(() => {
    if (aspectSwitchFrozen) {
      warnOnce(
        "aspect-switch-frozen",
        "[CarouselComposer] `aspect` is controlled and `aspectOptions` is set, but there is no `onAspectChange`: picking an option does nothing. Pass `onAspectChange` and update `aspect`.",
      );
    }
  }, [aspectSwitchFrozen, warnOnce]);
  const resolvedRatio = resolution.ratio;

  const addFiles = async (files: File[] | FileList) => {
    setErrors([]);
    setIngesting(true);
    try {
      const res = await filesToItems(files, {
        accept: acceptKinds,
        acceptMime,
        maxFileSizeMb,
        maxVideoSeconds,
        posterAt,
        errors: labels.errors,
      });
      if (!mountedRef.current) {
        // Unmounted while reading the files: release what intake created.
        res.items.forEach((it) => {
          URL.revokeObjectURL(it.url);
          if (it.posterUrl) URL.revokeObjectURL(it.posterUrl);
        });
        return;
      }
      res.errors.forEach((err) => onValidationError?.(err));
      if (res.errors.length > 0) {
        setErrors((prev) => [...prev, ...res.errors.map((e) => e.message)]);
      }
      // addItems caps to maxItems synchronously + fires onMaxItemsExceeded.
      if (res.items.length > 0) {
        const before = state.getItems().length;
        state.addItems(res.items);
        // Count what was kept, not what was offered (the cap may drop some).
        const added = state.getItems().length - before;
        if (added > 0) say(labels.itemsAdded(added));
      }
    } finally {
      if (mountedRef.current) setIngesting(false);
    }
  };
  // The handle calls the latest closure, so label / limit changes apply.
  const addFilesRef = useRef(addFiles);
  useEffect(() => {
    addFilesRef.current = addFiles;
  });

  const handleRetry = onRetry
    ? (item: MediaCarouselItem) => {
        focusTargetRef.current = { type: "retry", id: item.id };
        onRetry(item);
      }
    : undefined;

  const handleRemove = (id: string) => {
    const list = state.getItems();
    const idx = list.findIndex((it) => it.id === id);
    const neighbour = idx < 0 ? undefined : (list[idx + 1] ?? list[idx - 1]);
    focusTargetRef.current = { type: "remove", id, next: neighbour?.id ?? null };
    state.removeItem(id);
  };

  // The dismiss button is about to unmount; keep focus in the component.
  const dismissErrors = () => {
    const root = rootRef.current;
    const candidates = [
      "[data-dropzone-browse]",
      "[data-dropzone-add-more]",
      `[data-thumb-select="${state.selectedId ?? ""}"]`,
    ];
    for (const selector of candidates) {
      const el = root?.querySelector<HTMLElement>(selector);
      if (!el || (el as HTMLButtonElement).disabled) continue;
      el.focus();
      if (document.activeElement === el) break;
    }
    setErrors([]);
  };

  // Non-drag reorder: the same path as a drop (`state.reorder`), one step at a time.
  const moveFocusRef = useRef<{ id: string; which: string; to: number } | null>(null);
  const { editingId: editingIdForMove } = state;
  const moveBy = useCallback(
    (id: string, delta: number, which?: string) => {
      if (editingIdForMove !== null || delta === 0 || !Number.isFinite(delta)) return;
      const list = state.getItems();
      const from = list.findIndex((it) => it.id === id);
      if (from < 0) return;
      const to = Math.min(list.length - 1, Math.max(0, from + Math.trunc(delta)));
      if (to === from) return;
      if (which) {
        const pending = { id, which, to };
        moveFocusRef.current = pending;
        // A host that never echoes the move must not leave this armed for a later change.
        const drop = () => {
          if (moveFocusRef.current === pending) moveFocusRef.current = null;
        };
        if (typeof requestAnimationFrame === "function") requestAnimationFrame(drop);
        else setTimeout(drop, 0);
      }
      state.reorder(arrayMove(list, from, to));
      onMove?.(id, to - from);
      if (which) {
        say((labels.moved ?? defaultCarouselComposerLabels.moved!)(to + 1, list.length));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingIdForMove, state.getItems, state.reorder, onMove, say, labels],
  );
  // A moved thumb is re-inserted by the browser, which can drop focus: put it back on the
  // same button (an end-of-list button stays focusable because it is aria-disabled).
  useEffect(() => {
    const target = moveFocusRef.current;
    if (!target) return;
    // Consume the request on this run either way; only a list that really shows the moved
    // item at its new index may take focus (a controlled host may reject or echo late).
    moveFocusRef.current = null;
    if (state.items[target.to]?.id !== target.id) return;
    const el = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>("[data-thumb-move]") ?? [],
    ).find(
      (b) =>
        b.getAttribute("data-thumb-id") === target.id &&
        b.getAttribute("data-thumb-move") === target.which,
    );
    if (el && document.activeElement !== el) el.focus();
  }, [state.items]);

  const { updateItem: updateItemState } = state;
  const handlePanCommit = useCallback(
    (id: string, offset: CarouselCropOffset) => {
      updateItemState(id, { cropOffset: offset });
      onCropOffsetChange?.(id, offset);
    },
    [updateItemState, onCropOffsetChange],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Rebuilt when `labels.drag` changes, so a locale switch reaches the announcements.
  const dragLabels = labels.drag;
  const { getItems } = state;
  // Final index of the item just dropped, set in onDragEnd. The announcement can run
  // after the reorder, when the over item's position has already shifted.
  const droppedRef = useRef<{ id: string | number; position: number } | null>(null);
  const dndAnnouncements: Announcements = useMemo(() => {
    const pos = (id: string | number) =>
      getItems().findIndex((it) => it.id === id) + 1;
    const total = () => getItems().length;
    return {
      onDragStart: ({ active }) => dragLabels.pickedUp(pos(active.id), total()),
      onDragOver: ({ active, over }) =>
        over ? dragLabels.over(pos(active.id), pos(over.id), total()) : "",
      onDragEnd: ({ active, over }) => {
        const dropped = droppedRef.current;
        droppedRef.current = null;
        if (!over) return dragLabels.droppedInPlace(pos(active.id));
        const final = dropped && dropped.id === active.id ? dropped.position : pos(over.id);
        return dragLabels.dropped(final, total());
      },
      onDragCancel: ({ active }) => dragLabels.cancelled(pos(active.id)),
    };
  }, [dragLabels, getItems]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = getItems();
    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    droppedRef.current = { id: active.id, position: newIndex + 1 };
    state.reorder(arrayMove(items, oldIndex, newIndex));
  };

  const {
    removeItem,
    updateItem,
    select: selectItem,
    openEditor: openEditorState,
    reset: resetItems,
  } = state;
  useImperativeHandle(
    ref,
    (): CarouselComposerHandle => ({
      getItems: () => getItems().map((it) => ({ ...it })),
      export: async () =>
        getItems().map((it) => {
          const copy = { ...it };
          if (it.kind === "image" && resolvedRatio !== null && it.width && it.height) {
            copy.crop = offsetCropRect(it.width, it.height, resolvedRatio, it.cropOffset);
          } else {
            delete copy.crop;
          }
          return copy;
        }),
      addFiles: (files) => addFilesRef.current(files),
      removeItem,
      moveItem: (id, delta) => moveBy(id, delta),
      updateItem,
      select: selectItem,
      openEditor: (id: string) => {
        if (!editing) {
          warnOpenWithoutEditing(id);
          return;
        }
        openEditorState(id);
      },
      reset: resetItems,
      getAspect: () => ({ aspect: resolvedAspect, ratio: resolvedRatio }),
    }),
    [resolvedAspect, resolvedRatio, removeItem, updateItem, selectItem, openEditorState, resetItems, getItems, editing, warnOpenWithoutEditing, moveBy],
  );

  const isEmpty = state.items.length === 0;
  const isEditing =
    editing !== undefined && state.editingId !== null && state.editingItem !== null;
  const EditingPanel = editing?.Panel;

  // onEditingChange: true on open, false on close; never a false without a true.
  const editingReported = useRef(false);
  const onEditingChangeRef = useRef(onEditingChange);
  useEffect(() => {
    onEditingChangeRef.current = onEditingChange;
  });
  useEffect(() => {
    if (isEditing === editingReported.current) return;
    editingReported.current = isEditing;
    onEditingChangeRef.current?.(isEditing);
  }, [isEditing]);
  useEffect(
    () => () => {
      if (!editingReported.current) return;
      editingReported.current = false;
      onEditingChangeRef.current?.(false);
    },
    [],
  );

  // Escape guard: while the panel reports busy, Escape is swallowed at window capture
  // (before Radix / Base UI see it at the document), so no host dialog closes mid-prepare.
  // Busy lives in a ref (set synchronously by the panel's onBusyChange), not state: a same-task
  // Escape must already see it. `busyEndRef` is when the last busy period ended (performance.now()
  // clock = event.timeStamp's): a main-thread-blocking export queues the Escape, which is then
  // delivered AFTER busy went false / the panel unmounted — its timeStamp still says "while busy".
  const busyRef = useRef(false);
  const busyEndRef = useRef(-1);
  const setPanelBusy = useCallback((busy: boolean) => {
    if (busyRef.current && !busy) busyEndRef.current = performance.now();
    busyRef.current = busy;
  }, []);
  useEffect(() => {
    if (!isEditing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.isComposing) return;
      if (!busyRef.current && e.timeStamp > busyEndRef.current) return;
      e.stopPropagation();
      e.preventDefault();
    };
    // keydown-ok: must run at window capture, before the dialog's document-level Escape handling; only Escape, and it acts only while a panel is busy (or was when the key was pressed)
    window.addEventListener("keydown", onKey, true);
    return () => {
      // Busy never outlives its edit.
      setPanelBusy(false);
      // Keep the listener a moment past the close: a keydown queued behind the blocking export
      // is delivered in the next task(s). 1 s is far longer than that and shorter than any
      // deliberate second Escape.
      window.setTimeout(() => window.removeEventListener("keydown", onKey, true), ESCAPE_GRACE_MS);
    };
  }, [isEditing, setPanelBusy]);
  const sel = state.selectedItem;
  const canEdit =
    editing !== undefined &&
    sel !== null &&
    sel.kind === "image" &&
    canEditItem?.(sel) !== false;
  const showSwitch =
    switchOptions.valid.length >= 2 && state.items[0] !== undefined && sel?.id === state.items[0].id;
  const activeOption =
    aspectSetting === "auto"
      ? (switchOptions.valid.find((o) => o === resolvedAspect) ?? null)
      : aspectSetting;
  const formatNumber = (n: number) => formatLocaleNumber(n, locale);
  const canAddMore = uploadEnabled && state.items.length < maxItems;

  return (
    <div ref={rootRef} dir={dirProp} className={cn("flex flex-col gap-3", className)}>
      {isEmpty ? (
        uploadEnabled ? (
          <MediaDropzone
            variant="empty"
            accept={acceptKinds}
            acceptMime={acceptMime}
            maxItems={maxItems}
            busy={ingesting}
            labels={labels}
            onFiles={addFiles}
          />
        ) : null
      ) : isEditing && EditingPanel ? (
        <EditFrame key={state.editingItem!.id} label={labels.edit}>
        <EditingPanel
          item={state.editingItem!}
          aspect={resolvedAspect}
          aspectRatio={resolvedRatio}
          editorProps={editorProps}
          labels={{
            editDone: labels.editDone,
            editCancel: labels.editCancel,
            editSaving: labels.editSaving,
            editError: labels.editError,
          }}
          onBusyChange={setPanelBusy}
          onApply={state.applyEdit}
          onCancel={state.cancelEdit}
        />
        </EditFrame>
      ) : (
        <MainPreview
          item={state.selectedItem}
          aspectCss={aspectToCss(resolvedAspect)}
          canEdit={canEdit}
          editingEnabled={editing !== undefined}
          labels={labels}
          ratio={resolvedRatio}
          pan={
            enablePan
              ? {
                  label: labels.panHint ?? defaultCarouselComposerLabels.panHint!,
                  onCommit: handlePanCommit,
                }
              : undefined
          }
          aspectSwitch={
            showSwitch ? (
              <AspectSwitch
                options={switchOptions.valid}
                active={activeOption}
                groupLabel={labels.aspectSwitch ?? defaultCarouselComposerLabels.aspectSwitch!}
                optionLabel={(a) =>
                  (labels.aspectOption ?? defaultCarouselComposerLabels.aspectOption!)(a, formatNumber)
                }
                onPick={(next) => {
                  // Re-picking the pressed option is not a change.
                  if (aspectSetting !== "auto" && next === aspectSetting) return;
                  setAspectSetting(next);
                }}
              />
            ) : null
          }
          onEdit={() =>
            state.selectedItem && state.openEditor(state.selectedItem.id)
          }
        />
      )}

      {!isEmpty && !isEditing ? (
        <>
          <ItemStatus
            item={state.selectedItem}
            labels={labels}
            position={state.items.findIndex((it) => it.id === state.selectedId) + 1}
            total={state.items.length}
            onRetry={handleRetry}
          />
          {state.selectedItem && altEnabledFor(state.selectedItem) ? (
            <AltField
              item={state.selectedItem}
              maxLength={maxAltLength}
              labels={labels}
              onChange={(id, alt) =>
                state.updateItem(id, { alt: alt === "" ? undefined : alt })
              }
            />
          ) : null}
        </>
      ) : null}

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
            aria-label={labels.dismissErrors}
            onClick={dismissErrors}
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
          accessibility={{
            announcements: dndAnnouncements,
            screenReaderInstructions: { draggable: labels.drag.instructions },
          }}
          onDragEnd={onDragEnd}
        >
          <PreviewRail
            items={state.items}
            selectedId={state.selectedId}
            disabled={isEditing}
            canAddMore={canAddMore}
            busy={ingesting}
            accept={acceptKinds}
            acceptMime={acceptMime}
            maxItems={maxItems}
            labels={labels}
            formatDuration={formatDuration}
            ratio={resolvedRatio}
            onRetry={handleRetry}
            onSelect={state.select}
            onRemove={handleRemove}
            onFiles={addFiles}
            reorderButtons={reorderButtons}
            onMove={(id, delta) => {
              const which = delta < 0 ? "earlier" : "later";
              moveBy(id, delta, which);
            }}
            dir={dir}
          />
        </DndContext>
      ) : null}

      <output aria-live="polite" className="sr-only">
        {announce}
      </output>
    </div>
  );
}

export const CarouselComposer = forwardRef(CarouselComposerImpl);
CarouselComposer.displayName = "CarouselComposer";

// ─── Tail type re-exports (cross-procomp consumers) ──────────────────────────
// Procomps that compose carousel-composer must import these types from
// THIS component-file path, not `./types`: the shadcn path rewriter resolves a
// barrel/directory import to this `.tsx` file but mangles `/types` subpaths
// (F-01). Mirrors media-editor's tail band.
export type {
  MediaCarouselItem,
  MediaKind,
  MediaCarouselSource,
  MediaCarouselError,
  CarouselComposerProps,
  CarouselComposerHandle,
  CarouselComposerLabels,
  CarouselAspectRatio,
  CarouselCropRect,
  CarouselExportMeta,
  CarouselEditingExtension,
  CarouselEditorPanelProps,
  ApplyEditPatch,
  MediaCarouselItemPatch,
  MediaCarouselItemStatus,
  MediaCarouselErrorKind,
  CarouselComposerLabelsInput,
  CarouselComposerErrorLabels,
  CarouselComposerDragLabels,
} from "./types";
export {
  defaultCarouselComposerLabels,
  PLATFORM_SAFE_MIME,
  DEFAULT_CAROUSEL_LABELS,
} from "./types";
