"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  DEFAULT_MEDIA_LIBRARY_LABELS,
  type MediaFilterCategory,
  type MediaLibrary01Labels,
  type MediaLibrary01Storage,
  type MediaLibraryPreviewMode,
  type MediaLibraryRootProps,
  type MediaNode,
  type MediaUploadItem,
} from "../types";
import {
  computeFilterCounts,
  nodeMatchesFilter,
  type MediaFilterCounts,
} from "../lib/filter-category";
import { buildParentMap, canDropInto, findNode } from "../lib/drag";
import { useControllableState } from "./use-controllable-state";
import { useLazyChildren } from "./use-lazy-children";
import { useSelection, type SelectionApi } from "./use-selection";
import { useUpload } from "./use-upload";

export interface MediaClipboard {
  kind: "cut" | null;
  ids: string[];
}

export interface MediaLibraryContextValue {
  labels: Required<MediaLibrary01Labels>;

  // current-folder view
  nodes: MediaNode[];
  currentFolderId: string | null;
  currentFolder: MediaNode | null;
  path: MediaNode[];
  folders: MediaNode[];
  files: MediaNode[];
  filterCounts: MediaFilterCounts;
  uploads: MediaUploadItem[];
  loadingChildren: boolean;
  loadError: string | null;

  // ui state
  filter: MediaFilterCategory;
  setFilter: (f: MediaFilterCategory) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  storage?: MediaLibrary01Storage;

  // selection
  selectedIds: Set<string>;
  selection: SelectionApi;
  visibleIds: string[];

  // clipboard (cut → move on paste; copy deferred to v0.2)
  clipboard: MediaClipboard;
  cut: (ids: string[]) => void;
  paste: () => void;

  // navigation
  navigateTo: (folderId: string | null) => void;
  navigateUp: () => void;
  refresh: (folderId?: string | null) => void;

  // preview
  previewId: string | null;
  previewNode: MediaNode | null;
  openPreview: (id: string) => void;
  closePreview: () => void;
  previewNext: () => void;
  previewPrev: () => void;
  previewHasNext: boolean;
  previewHasPrev: boolean;
  previewMode: MediaLibraryPreviewMode;
  canPreview: boolean;
  resolveTextContent?: (node: MediaNode) => Promise<string>;
  pdfWorkerSrc?: string;

  // mutations
  triggerUpload: () => void;
  uploadFiles: (files: File[], targetFolderId?: string | null) => void;
  retryUpload: (tempId: string) => void;
  dismissUpload: (tempId: string) => void;
  moveTo: (ids: string[], targetFolderId: string | null) => void;
  download: (ids: string[]) => void;
  requestDelete: (ids: string[]) => void;
  canDrop: (draggedIds: string[], targetFolderId: string | null) => boolean;

  // inline rename
  renamingId: string | null;
  renameError: string | null;
  startRename: (id: string) => void;
  submitRename: (id: string, name: string) => void;
  cancelRename: () => void;

  // inline create-folder
  creatingFolder: boolean;
  startCreateFolder: () => void;
  submitCreateFolder: (name: string) => void;
  cancelCreateFolder: () => void;

  // capability flags
  can: {
    upload: boolean;
    move: boolean;
    rename: boolean;
    delete: boolean;
    createFolder: boolean;
    download: boolean;
  };

  // behaviour
  enableInternalDrag: boolean;
  enableUploadDrop: boolean;
  enableContextMenu: boolean;
  virtualizeThreshold: number;

  // dnd transient
  activeDragIds: string[] | null;
  setActiveDragIds: (ids: string[] | null) => void;
  /** True while OS files are dragged over the surface (drives the upload overlay). */
  isDraggingFiles: boolean;
  setDraggingFiles: (v: boolean) => void;

  fileInputRef: RefObject<HTMLInputElement | null>;
}

const MediaLibraryContext = createContext<MediaLibraryContextValue | null>(null);

export function useMediaLibrary(): MediaLibraryContextValue {
  const ctx = useContext(MediaLibraryContext);
  if (!ctx) {
    throw new Error(
      "useMediaLibrary must be used within <MediaLibraryRoot> (or <MediaLibrary01>).",
    );
  }
  return ctx;
}

export { MediaLibraryContext };

function sortByName(a: MediaNode, b: MediaNode): number {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

/** Builds the full context value from the root props. */
export function useMediaLibraryStore(
  props: MediaLibraryRootProps,
): MediaLibraryContextValue {
  const {
    nodes: rootNodes,
    onLoadChildren,
    storage,
    onUpload,
    onMove,
    onRename,
    onDelete,
    onCreateFolder,
    onDownload,
    validateRename,
    resolveTextContent,
    pdfWorkerSrc,
    onPreviewOpen,
    onPreviewClose,
    enableUploadDrop = true,
    enableInternalDrag = true,
    enableContextMenu = true,
    preview: previewMode = "both",
    virtualizeThreshold = 120,
    labels: labelOverrides,
  } = props;
  const canPreview = previewMode !== false;

  const labels = useMemo(
    () => ({ ...DEFAULT_MEDIA_LIBRARY_LABELS, ...labelOverrides }),
    [labelOverrides],
  );

  // lazy-merged tree
  const { nodes, ensureLoaded, invalidate, loadingIds, errorIds } = useLazyChildren(
    rootNodes,
    onLoadChildren,
  );

  // current folder (controllable)
  const [currentFolderId, setCurrentFolderId] = useControllableState<string | null>({
    value: props.currentFolderId,
    defaultValue: props.defaultCurrentFolderId ?? null,
    onChange: props.onCurrentFolderChange,
    componentName: "MediaLibrary01",
    valuePropName: "currentFolderId",
  });

  // selection (controllable)
  const [selectedIds, setSelectedIds] = useControllableState<Set<string>>({
    value: props.selectedIds,
    defaultValue: props.defaultSelectedIds ?? new Set<string>(),
    onChange: props.onSelectedChange,
    componentName: "MediaLibrary01",
    valuePropName: "selectedIds",
  });
  const selection = useSelection(selectedIds, setSelectedIds);

  // ui state
  const [filter, setFilter] = useState<MediaFilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<MediaClipboard>({ kind: null, ids: [] });
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [activeDragIds, setActiveDragIds] = useState<string[] | null>(null);
  const [isDraggingFiles, setDraggingFiles] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const parentMap = useMemo(() => buildParentMap(nodes), [nodes]);

  // derive current folder + path
  const currentFolder = useMemo(
    () => (currentFolderId == null ? null : findNode(nodes, currentFolderId) ?? null),
    [nodes, currentFolderId],
  );

  const path = useMemo(() => {
    if (currentFolderId == null) return [] as MediaNode[];
    const chain: MediaNode[] = [];
    let cur: string | null | undefined = currentFolderId;
    const seen = new Set<string>();
    while (cur != null && !seen.has(cur)) {
      seen.add(cur);
      const node = findNode(nodes, cur);
      if (!node) break;
      chain.unshift(node);
      cur = node.parentId ?? parentMap.get(cur) ?? null;
    }
    return chain;
  }, [nodes, currentFolderId, parentMap]);

  // children of the current folder
  const currentChildren = useMemo<MediaNode[]>(() => {
    if (currentFolderId == null) return nodes;
    return currentFolder?.children ?? [];
  }, [nodes, currentFolderId, currentFolder]);

  const allFolders = useMemo(
    () => currentChildren.filter((n) => n.type === "folder").sort(sortByName),
    [currentChildren],
  );
  const allFiles = useMemo(
    () => currentChildren.filter((n) => n.type === "file"),
    [currentChildren],
  );

  const filterCounts = useMemo(() => computeFilterCounts(allFiles), [allFiles]);

  const files = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allFiles
      .filter((n) => nodeMatchesFilter(n, filter))
      .filter((n) => (q ? n.name.toLowerCase().includes(q) : true))
      .sort(sortByName);
  }, [allFiles, filter, searchQuery]);

  const folders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? allFolders.filter((n) => n.name.toLowerCase().includes(q)) : allFolders;
  }, [allFolders, searchQuery]);

  const visibleIds = useMemo(
    () => [...folders.map((n) => n.id), ...files.map((n) => n.id)],
    [folders, files],
  );

  const loadingChildren =
    currentFolderId != null && loadingIds.has(currentFolderId);
  const loadError =
    currentFolderId != null ? (errorIds[currentFolderId] ?? null) : null;

  // ensure current folder children are loaded
  useEffect(() => {
    if (currentFolderId != null) ensureLoaded(currentFolderId);
  }, [currentFolderId, ensureLoaded]);

  // upload
  const onUploadResolved = useCallback(
    (_nodes: MediaNode[], targetFolderId: string | null) => {
      if (targetFolderId != null) invalidate(targetFolderId);
    },
    [invalidate],
  );
  const upload = useUpload(onUpload, onUploadResolved);

  const uploads = useMemo(
    () => upload.uploads.filter((u) => u.targetFolderId === currentFolderId),
    [upload.uploads, currentFolderId],
  );

  // navigation
  const navigateTo = useCallback(
    (folderId: string | null) => {
      setCurrentFolderId(folderId);
      setSearchQuery("");
      setFilter("all");
      selection.clear();
      if (folderId != null) ensureLoaded(folderId);
    },
    [setCurrentFolderId, ensureLoaded, selection],
  );

  const navigateUp = useCallback(() => {
    if (currentFolderId == null) return;
    const parent = currentFolder?.parentId ?? parentMap.get(currentFolderId) ?? null;
    navigateTo(parent);
  }, [currentFolderId, currentFolder, parentMap, navigateTo]);

  const refresh = useCallback(
    (folderId?: string | null) => {
      const target = folderId === undefined ? currentFolderId : folderId;
      invalidate(target);
      if (target != null) ensureLoaded(target);
    },
    [currentFolderId, invalidate, ensureLoaded],
  );

  // preview
  const previewNode = useMemo(
    () => (previewId == null ? null : findNode(nodes, previewId) ?? null),
    [nodes, previewId],
  );
  const previewIndex = previewId == null ? -1 : files.findIndex((f) => f.id === previewId);
  const previewHasNext = previewIndex !== -1 && previewIndex < files.length - 1;
  const previewHasPrev = previewIndex > 0;

  const openPreview = useCallback(
    (id: string) => {
      setPreviewId(id);
      onPreviewOpen?.(id);
    },
    [onPreviewOpen],
  );
  const closePreview = useCallback(() => {
    setPreviewId(null);
    onPreviewClose?.();
  }, [onPreviewClose]);
  const previewNext = useCallback(() => {
    if (previewHasNext) openPreview(files[previewIndex + 1].id);
  }, [previewHasNext, files, previewIndex, openPreview]);
  const previewPrev = useCallback(() => {
    if (previewHasPrev) openPreview(files[previewIndex - 1].id);
  }, [previewHasPrev, files, previewIndex, openPreview]);

  // mutations
  const triggerUpload = useCallback(() => fileInputRef.current?.click(), []);
  const uploadFiles = useCallback(
    (files_: File[], targetFolderId?: string | null) =>
      upload.start(files_, targetFolderId === undefined ? currentFolderId : targetFolderId),
    [upload, currentFolderId],
  );

  const moveTo = useCallback(
    (ids: string[], targetFolderId: string | null) => {
      if (!onMove || ids.length === 0) return;
      if (!canDropInto(ids, targetFolderId, nodes, parentMap)) return;
      onMove(ids, targetFolderId);
      selection.clear();
      if (targetFolderId != null) invalidate(targetFolderId);
      if (currentFolderId != null) invalidate(currentFolderId);
    },
    [onMove, nodes, parentMap, selection, invalidate, currentFolderId],
  );

  const download = useCallback(
    (ids: string[]) => onDownload?.(ids),
    [onDownload],
  );

  const requestDelete = useCallback(
    (ids: string[]) => {
      if (!onDelete || ids.length === 0) return;
      onDelete(ids);
      selection.clear();
      if (currentFolderId != null) invalidate(currentFolderId);
    },
    [onDelete, selection, currentFolderId, invalidate],
  );

  const canDrop = useCallback(
    (draggedIds: string[], targetFolderId: string | null) =>
      canDropInto(draggedIds, targetFolderId, nodes, parentMap),
    [nodes, parentMap],
  );

  // clipboard
  const cut = useCallback((ids: string[]) => {
    if (ids.length > 0) setClipboard({ kind: "cut", ids });
  }, []);
  const paste = useCallback(() => {
    if (clipboard.kind === "cut" && clipboard.ids.length > 0) {
      moveTo(clipboard.ids, currentFolderId);
      setClipboard({ kind: null, ids: [] });
    }
  }, [clipboard, moveTo, currentFolderId]);

  // inline rename
  const startRename = useCallback((id: string) => {
    setRenameError(null);
    setRenamingId(id);
  }, []);
  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameError(null);
  }, []);
  const submitRename = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        cancelRename();
        return;
      }
      const err = validateRename?.(id, trimmed) ?? null;
      if (err) {
        setRenameError(err);
        return;
      }
      onRename?.(id, trimmed);
      setRenamingId(null);
      setRenameError(null);
      if (currentFolderId != null) invalidate(currentFolderId);
    },
    [validateRename, onRename, cancelRename, currentFolderId, invalidate],
  );

  // inline create-folder
  const startCreateFolder = useCallback(() => setCreatingFolder(true), []);
  const cancelCreateFolder = useCallback(() => setCreatingFolder(false), []);
  const submitCreateFolder = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed) onCreateFolder?.(currentFolderId, trimmed);
      setCreatingFolder(false);
      if (currentFolderId != null) invalidate(currentFolderId);
    },
    [onCreateFolder, currentFolderId, invalidate],
  );

  const can = useMemo(
    () => ({
      upload: Boolean(onUpload),
      move: Boolean(onMove),
      rename: Boolean(onRename),
      delete: Boolean(onDelete),
      createFolder: Boolean(onCreateFolder),
      download: Boolean(onDownload),
    }),
    [onUpload, onMove, onRename, onDelete, onCreateFolder, onDownload],
  );

  return useMemo<MediaLibraryContextValue>(
    () => ({
      labels,
      nodes,
      currentFolderId,
      currentFolder,
      path,
      folders,
      files,
      filterCounts,
      uploads,
      loadingChildren,
      loadError,
      filter,
      setFilter,
      searchQuery,
      setSearchQuery,
      storage,
      selectedIds,
      selection,
      visibleIds,
      clipboard,
      cut,
      paste,
      navigateTo,
      navigateUp,
      refresh,
      previewId,
      previewNode,
      openPreview,
      closePreview,
      previewNext,
      previewPrev,
      previewHasNext,
      previewHasPrev,
      previewMode,
      canPreview,
      resolveTextContent,
      pdfWorkerSrc,
      triggerUpload,
      uploadFiles,
      retryUpload: upload.retry,
      dismissUpload: upload.dismiss,
      moveTo,
      download,
      requestDelete,
      canDrop,
      renamingId,
      renameError,
      startRename,
      submitRename,
      cancelRename,
      creatingFolder,
      startCreateFolder,
      submitCreateFolder,
      cancelCreateFolder,
      can,
      enableInternalDrag,
      enableUploadDrop,
      enableContextMenu,
      virtualizeThreshold,
      activeDragIds,
      setActiveDragIds,
      isDraggingFiles,
      setDraggingFiles,
      fileInputRef,
    }),
    [
      labels, nodes, currentFolderId, currentFolder, path, folders, files,
      filterCounts, uploads, loadingChildren, loadError, filter, searchQuery,
      storage, selectedIds, selection, visibleIds, clipboard, cut, paste,
      navigateTo, navigateUp, refresh, previewId, previewNode, openPreview, closePreview,
      previewNext, previewPrev, previewHasNext, previewHasPrev, previewMode, canPreview, resolveTextContent, pdfWorkerSrc,
      triggerUpload, uploadFiles, upload.retry, upload.dismiss, moveTo, download,
      requestDelete, canDrop, renamingId, renameError, startRename, submitRename,
      cancelRename, creatingFolder, startCreateFolder, submitCreateFolder,
      cancelCreateFolder, can, enableInternalDrag, enableUploadDrop,
      enableContextMenu, virtualizeThreshold, activeDragIds, isDraggingFiles,
    ],
  );
}
