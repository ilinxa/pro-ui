"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExportMetadata, MediaCarouselItem, MediaEditorState } from "../types";
import { useControllableState } from "./use-controllable-state";

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
}

export interface ApplyEditPatch {
  url: string;
  blob?: Blob;
  editorState?: MediaEditorState;
  exportMeta?: ExportMetadata;
  width?: number;
  height?: number;
}

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
  reset: () => void;
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
    componentName: "MediaCarouselEditor01",
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

  const cbRef = useRef<CarouselStateCallbacks>(opts);
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

  /** Synchronous-ref write + state set, so chained mutators compose correctly. */
  const setItems = useCallback(
    (next: MediaCarouselItem[]) => {
      itemsRef.current = next;
      setItemsRaw(next);
    },
    [setItemsRaw],
  );

  // Object-URL ownership.
  const ownedUrls = useRef<Set<string>>(new Set());
  const revoke = useCallback((url: string) => {
    if (ownedUrls.current.has(url)) {
      URL.revokeObjectURL(url);
      ownedUrls.current.delete(url);
    }
  }, []);

  // Catch-all: revoke any owned URL no longer present in items — including
  // drops via a controlled `value` swap that never went through removeItem.
  useEffect(() => {
    const present = new Set(items.map((it) => it.url));
    ownedUrls.current.forEach((u) => {
      if (!present.has(u)) {
        URL.revokeObjectURL(u);
        ownedUrls.current.delete(u);
      }
    });
  }, [items]);

  useEffect(() => {
    const owned = ownedUrls.current;
    return () => {
      if (!revokeOnUnmount) return;
      owned.forEach((u) => URL.revokeObjectURL(u));
      owned.clear();
    };
  }, [revokeOnUnmount]);

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
      });
      if (toAdd.length > 0) {
        toAdd.forEach((it) => {
          if (isOwnable(it.url)) ownedUrls.current.add(it.url);
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
      revoke(cur[idx].url);
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
        setEditingId(null);
        cbRef.current.onEditCancel?.(id);
      }
    },
    [revoke, setItems],
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
    setSelectedId(id);
    setEditingId(id);
    cbRef.current.onEditOpen?.(id);
  }, []);

  const cancelEdit = useCallback(() => {
    const id = editingIdRef.current;
    if (id == null) return;
    setEditingId(null);
    cbRef.current.onEditCancel?.(id);
  }, []);

  const applyEdit = useCallback(
    (id: string, patch: ApplyEditPatch) => {
      const cur = itemsRef.current;
      const idx = cur.findIndex((it) => it.id === id);
      if (idx < 0) return;
      const prev = cur[idx];
      if (prev.url !== patch.url) revoke(prev.url);
      if (isOwnable(patch.url)) ownedUrls.current.add(patch.url);
      const updated: MediaCarouselItem = {
        ...prev,
        url: patch.url,
        blob: patch.blob ?? prev.blob,
        editorState: patch.editorState ?? prev.editorState,
        exportMeta: patch.exportMeta ?? prev.exportMeta,
        width: patch.width ?? prev.width,
        height: patch.height ?? prev.height,
      };
      setItems(cur.map((it, i) => (i === idx ? updated : it)));
      setEditingId(null);
      cbRef.current.onEditApply?.(updated);
    },
    [revoke, setItems],
  );

  const reset = useCallback(() => {
    ownedUrls.current.forEach((u) => URL.revokeObjectURL(u));
    ownedUrls.current.clear();
    setItems([]);
    setSelectedId(null);
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
    reset,
  };
}
