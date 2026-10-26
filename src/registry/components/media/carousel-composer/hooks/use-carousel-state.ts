"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ApplyEditPatch,
  MediaCarouselItem,
  MediaCarouselItemPatch,
} from "../types";
import { useControllableState } from "./use-controllable-state";
import { useWarnOnce } from "./use-warn-once";

export interface CarouselStateCallbacks {
  onItemAdd?: (item: MediaCarouselItem) => void;
  onItemRemove?: (id: string) => void;
  onReorder?: (items: MediaCarouselItem[]) => void;
  onSelect?: (id: string | null) => void;
  onEditOpen?: (id: string) => void;
  onEditApply?: (item: MediaCarouselItem) => void;
  onEditCancel?: (id: string) => void;
  onMaxItemsExceeded?: (attempted: number, max: number) => void;
}

export interface UseCarouselStateOptions extends CarouselStateCallbacks {
  value?: MediaCarouselItem[];
  defaultValue?: MediaCarouselItem[];
  onChange?: (items: MediaCarouselItem[]) => void;
  maxItems: number;
  /**
   * Revoke owned object URLs when the component unmounts. Default true. A host
   * that persists the live items across remounts (e.g. content-composer's
   * carousel cache) sets this false and owns the final cleanup itself.
   */
  revokeOnUnmount?: boolean;
  /**
   * Whether an item may be edited. Images only by default; `openEditor` ignores
   * (with a dev warning) any item this refuses.
   */
  canEdit?: (item: MediaCarouselItem) => boolean;
}

export type { ApplyEditPatch };

export interface UseCarouselStateResult {
  items: MediaCarouselItem[];
  selectedId: string | null;
  editingId: string | null;
  selectedItem: MediaCarouselItem | null;
  editingItem: MediaCarouselItem | null;
  addItems: (next: MediaCarouselItem[]) => void;
  removeItem: (id: string) => void;
  reorder: (next: MediaCarouselItem[]) => void;
  select: (id: string | null) => void;
  openEditor: (id: string) => void;
  cancelEdit: () => void;
  applyEdit: (id: string, patch: ApplyEditPatch) => void;
  /** Merge a patch into one item (upload status, alt…). No-op for an unknown id. */
  updateItem: (id: string, patch: MediaCarouselItemPatch) => void;
  reset: () => void;
  /** The latest items, including changes made earlier in the same tick. Stable identity. */
  getItems: () => MediaCarouselItem[];
}

/** Only object URLs we created are ours to revoke; remote/consumer URLs aren't. */
function isOwnable(url: string): boolean {
  return url.startsWith("blob:");
}

/**
 * Owns the carousel model: a controllable `items` array (value/defaultValue/
 * onChange) plus internal `selectedId` / `editingId`, and the object-URL
 * lifecycle. `itemsRef` is updated SYNCHRONOUSLY inside every mutator (not via an
 * effect) so async/batched intakes can't read a stale base. An orphan-revoke
 * effect catches URLs dropped by any path — including a wholesale controlled
 * `value` swap (e.g. the host's `loadValue`) that bypasses removeItem.
 */
export function useCarouselState(
  opts: UseCarouselStateOptions,
): UseCarouselStateResult {
  const { maxItems, revokeOnUnmount = true } = opts;

  const [items, setItemsRaw] = useControllableState<MediaCarouselItem[]>({
    value: opts.value,
    defaultValue: opts.defaultValue ?? [],
    onChange: opts.onChange,
    componentName: "CarouselComposer",
    valuePropName: "value",
  });
  const [rawSelectedId, setSelectedId] = useState<string | null>(
    opts.value?.[0]?.id ?? opts.defaultValue?.[0]?.id ?? null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedId =
    rawSelectedId != null && items.some((it) => it.id === rawSelectedId)
      ? rawSelectedId
      : (items[0]?.id ?? null);

  const cbRef = useRef<CarouselStateCallbacks & Pick<UseCarouselStateOptions, "canEdit">>(opts);
  useEffect(() => {
    cbRef.current = opts;
  });

  // itemsRef tracks committed render state; mutators below ALSO write it
  // synchronously so a second mutation in the same tick reads the latest base.
  const itemsRef = useRef(items);
  const selectedIdRef = useRef(selectedId);
  const editingIdRef = useRef(editingId);
  useEffect(() => {
    itemsRef.current = items;
    selectedIdRef.current = selectedId;
    editingIdRef.current = editingId;
  });
  const warnOnce = useWarnOnce();
  const getItems = useCallback(() => itemsRef.current, []);

  /** Synchronous-ref write + state set, so chained mutators compose correctly. */
  const setItems = useCallback(
    (next: MediaCarouselItem[]) => {
      itemsRef.current = next;
      setItemsRaw(next);
    },
    [setItemsRaw],
  );

  // Object-URL ownership. A URL is revoked by the orphan effect once it has been
  // committed in `items` at least once and then dropped. A URL the host has not
  // rendered yet (a controlled host that echoes `onChange` late) is never revoked
  // by an unrelated commit.
  const ownedUrls = useRef<Set<string>>(new Set());
  const seenUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    const present = new Set<string>();
    items.forEach((it) => {
      present.add(it.url);
      if (it.posterUrl) present.add(it.posterUrl);
    });
    present.forEach((u) => seenUrls.current.add(u));
    ownedUrls.current.forEach((u) => {
      if (!present.has(u) && seenUrls.current.has(u)) {
        URL.revokeObjectURL(u);
        ownedUrls.current.delete(u);
        seenUrls.current.delete(u);
      }
    });
  }, [items]);

  // Read at unmount time, so flipping the flag at runtime revokes nothing.
  const revokeOnUnmountRef = useRef(revokeOnUnmount);
  useEffect(() => {
    revokeOnUnmountRef.current = revokeOnUnmount;
  });
  useEffect(() => {
    const owned = ownedUrls.current;
    return () => {
      if (!revokeOnUnmountRef.current) return;
      owned.forEach((u) => URL.revokeObjectURL(u));
      owned.clear();
    };
  }, []);

  const addItems = useCallback(
    (incoming: MediaCarouselItem[]) => {
      if (incoming.length === 0) return;
      // Cap synchronously against the latest items (race-safe).
      const room = Math.max(0, maxItems - itemsRef.current.length);
      const toAdd = incoming.slice(0, room);
      const dropped = incoming.slice(room);
      // Revoke object URLs of items we won't keep (intake created them).
      dropped.forEach((it) => {
        if (isOwnable(it.url)) URL.revokeObjectURL(it.url);
        if (it.posterUrl && isOwnable(it.posterUrl)) {
          URL.revokeObjectURL(it.posterUrl);
        }
      });
      if (toAdd.length > 0) {
        toAdd.forEach((it) => {
          if (isOwnable(it.url)) ownedUrls.current.add(it.url);
          if (it.posterUrl && isOwnable(it.posterUrl)) {
            ownedUrls.current.add(it.posterUrl);
          }
        });
        setItems([...itemsRef.current, ...toAdd]);
        toAdd.forEach((it) => cbRef.current.onItemAdd?.(it));
      }
      if (dropped.length > 0) {
        cbRef.current.onMaxItemsExceeded?.(
          itemsRef.current.length + dropped.length,
          maxItems,
        );
      }
    },
    [maxItems, setItems],
  );

  const removeItem = useCallback(
    (id: string) => {
      const cur = itemsRef.current;
      const idx = cur.findIndex((it) => it.id === id);
      if (idx < 0) return;
      const next = cur.filter((it) => it.id !== id);
      setItems(next);
      cbRef.current.onItemRemove?.(id);
      if (selectedIdRef.current === id) {
        const neighbor = next[Math.min(idx, next.length - 1)] ?? null;
        const nid = neighbor?.id ?? null;
        setSelectedId(nid);
        cbRef.current.onSelect?.(nid);
      }
      if (editingIdRef.current === id) {
        editingIdRef.current = null;
        setEditingId(null);
        cbRef.current.onEditCancel?.(id);
      }
    },
    [setItems],
  );

  const reorder = useCallback(
    (next: MediaCarouselItem[]) => {
      setItems(next);
      cbRef.current.onReorder?.(next);
    },
    [setItems],
  );

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    cbRef.current.onSelect?.(id);
  }, []);

  const openEditor = useCallback((id: string) => {
    // Only images are editable — a video must never reach the editor, whose
    // export() would re-encode it.
    const target = itemsRef.current.find((it) => it.id === id);
    if (!target) return;
    if (target.kind !== "image") {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[CarouselComposer] openEditor("${id}") ignored: item is a ${target.kind}; only image items can be edited.`,
        );
      }
      return;
    }
    if (cbRef.current.canEdit?.(target) === false) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[CarouselComposer] openEditor("${id}") ignored: canEditItem refused this item.`,
        );
      }
      return;
    }
    // Written now, not in a later effect: a Panel may call onCancel in its mount effect.
    editingIdRef.current = id;
    setSelectedId(id);
    setEditingId(id);
    cbRef.current.onEditOpen?.(id);
  }, []);

  const cancelEdit = useCallback(() => {
    const id = editingIdRef.current;
    if (id == null) return;
    editingIdRef.current = null;
    setEditingId(null);
    cbRef.current.onEditCancel?.(id);
  }, []);

  const applyEdit = useCallback(
    (id: string, patch: ApplyEditPatch) => {
      const cur = itemsRef.current;
      const idx = cur.findIndex((it) => it.id === id);
      if (editingIdRef.current !== id || idx < 0) {
        // Not the open edit (foreign id, unknown id, or a repeat after it closed).
        // A blob URL the panel minted for it would leak, so release it.
        const inUse = cur.some(
          (it) => it.url === patch.url || it.posterUrl === patch.url,
        );
        if (
          isOwnable(patch.url) &&
          !ownedUrls.current.has(patch.url) &&
          !inUse
        ) {
          URL.revokeObjectURL(patch.url);
        }
        warnOnce(
          "applyEdit-not-editing",
          `[CarouselComposer] onApply("${id}") ignored: that item is not the one being edited.`,
        );
        return;
      }
      const prev = cur[idx];
      if (isOwnable(patch.url)) ownedUrls.current.add(patch.url);
      // The edited media is not the uploaded one: drop the upload state. The host
      // re-uploads from onEditApply. The old URL is released by the orphan effect.
      const updated: MediaCarouselItem = {
        ...prev,
        url: patch.url,
        blob: patch.blob ?? prev.blob,
        editorState: patch.editorState ?? prev.editorState,
        sourceBlob: patch.sourceBlob ?? prev.sourceBlob,
        exportMeta: patch.exportMeta ?? prev.exportMeta,
        width: patch.width ?? prev.width,
        height: patch.height ?? prev.height,
      };
      delete updated.status;
      delete updated.progress;
      delete updated.error;
      setItems(cur.map((it, i) => (i === idx ? updated : it)));
      editingIdRef.current = null;
      setEditingId(null);
      cbRef.current.onEditApply?.(updated);
    },
    [setItems, warnOnce],
  );

  const updateItem = useCallback(
    (id: string, patch: MediaCarouselItemPatch) => {
      const cur = itemsRef.current;
      const idx = cur.findIndex((it) => it.id === id);
      if (idx < 0) return;
      const updated: MediaCarouselItem = { ...cur[idx], ...patch };
      // A new blob: URL from the host is the host's to revoke; the old owned one
      // is released by the orphan effect once it leaves `items`.
      setItems(cur.map((it, i) => (i === idx ? updated : it)));
    },
    [setItems],
  );

  const reset = useCallback(() => {
    ownedUrls.current.forEach((u) => URL.revokeObjectURL(u));
    ownedUrls.current.clear();
    setItems([]);
    setSelectedId(null);
    editingIdRef.current = null;
    setEditingId(null);
  }, [setItems]);

  const selectedItem = items.find((it) => it.id === selectedId) ?? null;
  const editingItem = items.find((it) => it.id === editingId) ?? null;

  return {
    items,
    selectedId,
    editingId,
    selectedItem,
    editingItem,
    addItems,
    removeItem,
    reorder,
    select,
    openEditor,
    cancelEdit,
    applyEdit,
    updateItem,
    reset,
    getItems,
  };
}
