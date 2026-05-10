"use client";

import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import {
  ClipboardCopy,
  ClipboardPaste,
  FilePlus,
  FolderPlus,
  Pencil,
  RefreshCw,
  Scissors,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type {
  FileManagerActions,
  FileManagerContextMenuContext,
  FileManagerContextMenuItem,
  FileManagerLabels,
  FileManagerState,
  FsNode,
} from "../types";

interface FileManagerContextMenuProps {
  state: FileManagerState;
  actions: FileManagerActions;
  enabled: boolean;
  labels: FileManagerLabels;
  gates: {
    open: boolean;
    newFile: boolean;
    newFolder: boolean;
    cut: boolean;
    copy: boolean;
    paste: boolean;
    rename: boolean;
    delete: boolean;
    refresh: boolean;
  };
  wired: {
    onOpen: boolean;
    onCreate: boolean;
    onRename: boolean;
    onDelete: boolean;
    onMove: boolean;
    onPaste: boolean;
    onRefresh: boolean;
  };
  nodeIndex: ReadonlyMap<string, FsNode>;
  renderContextMenu?: (ctx: FileManagerContextMenuContext) => ReactNode;
  children: ReactNode;
}

export function FileManagerContextMenu(props: FileManagerContextMenuProps) {
  const {
    state,
    actions,
    enabled,
    labels,
    gates,
    wired,
    nodeIndex,
    renderContextMenu,
    children,
  } = props;
  const [target, setTarget] = useState<{
    node: FsNode | null;
    position: { x: number; y: number };
  } | null>(null);

  const captureTarget = (e: MouseEvent) => {
    const el = e.target as HTMLElement | null;
    const itemEl = el?.closest("[data-item-id]") as HTMLElement | null;
    const id = itemEl?.getAttribute("data-item-id") ?? null;
    const node = id ? (nodeIndex.get(id) ?? null) : null;
    setTarget({ node, position: { x: e.clientX, y: e.clientY } });
  };

  const defaultActions = useMemo<FileManagerContextMenuItem[]>(() => {
    if (!target) return [];
    const node = target.node;
    const list: FileManagerContextMenuItem[] = [];
    const hasClipboard = state.clipboard.kind !== null;
    const ids =
      node && state.selectedIds.has(node.id)
        ? Array.from(state.selectedIds)
        : node
          ? [node.id]
          : [];

    if (gates.open && wired.onOpen && node && node.type === "file") {
      list.push({
        id: "open",
        label: labels.contextOpen,
        icon: <FilePlus className="size-3.5" />,
        onSelect: () => actions.triggerOpen(node.id),
      });
    }
    if (gates.newFile && wired.onCreate) {
      list.push({
        id: "new-file",
        label: labels.contextNewFile,
        icon: <FilePlus className="size-3.5" />,
        onSelect: () => actions.triggerCreate("file"),
      });
    }
    if (gates.newFolder && wired.onCreate) {
      list.push({
        id: "new-folder",
        label: labels.contextNewFolder,
        icon: <FolderPlus className="size-3.5" />,
        onSelect: () => actions.triggerCreate("folder"),
      });
    }
    if (gates.cut && node && ids.length > 0) {
      list.push({
        id: "cut",
        label: labels.contextCut,
        icon: <Scissors className="size-3.5" />,
        onSelect: () => actions.cut(ids),
      });
    }
    if (gates.copy && node && ids.length > 0) {
      list.push({
        id: "copy",
        label: labels.contextCopy,
        icon: <ClipboardCopy className="size-3.5" />,
        onSelect: () => actions.copy(ids),
      });
    }
    if (gates.paste && wired.onPaste) {
      list.push({
        id: "paste",
        label: labels.contextPaste,
        icon: <ClipboardPaste className="size-3.5" />,
        disabled: !hasClipboard,
        onSelect: () => actions.paste(),
      });
    }
    if (gates.rename && wired.onRename && node) {
      list.push({
        id: "rename",
        label: labels.contextRename,
        icon: <Pencil className="size-3.5" />,
        onSelect: () => actions.startRename(node.id),
      });
    }
    if (gates.refresh && wired.onRefresh) {
      list.push({
        id: "refresh",
        label: labels.contextRefresh,
        icon: <RefreshCw className="size-3.5" />,
        onSelect: () => actions.refresh(state.currentFolderId),
      });
    }
    if (gates.delete && wired.onDelete && node && ids.length > 0) {
      list.push({
        id: "delete",
        label: labels.contextDelete,
        icon: <Trash2 className="size-3.5" />,
        destructive: true,
        onSelect: () => actions.triggerDelete(ids),
      });
    }
    return list;
  }, [target, state, gates, wired, labels, actions]);

  if (!enabled) {
    return <>{children}</>;
  }

  const ctx: FileManagerContextMenuContext = {
    state,
    actions,
    node: target?.node ?? null,
    defaultActions,
    position: target?.position ?? { x: 0, y: 0 },
    labels,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild onContextMenu={captureTarget}>
        <div className="contents" onContextMenu={captureTarget}>
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-[180px]">
        {renderContextMenu ? (
          renderContextMenu(ctx)
        ) : defaultActions.length === 0 ? (
          <ContextMenuItem disabled>{labels.emptyTitle}</ContextMenuItem>
        ) : (
          <DefaultItems items={defaultActions} />
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function DefaultItems({ items }: { items: FileManagerContextMenuItem[] }) {
  const out: ReactNode[] = [];
  let lastSep = false;
  items.forEach((item, i) => {
    if (item.destructive && i > 0 && !lastSep) {
      out.push(<ContextMenuSeparator key={`sep-${i}`} />);
      lastSep = true;
    } else {
      lastSep = false;
    }
    out.push(
      <ContextMenuItem
        key={item.id}
        disabled={item.disabled}
        variant={item.destructive ? "destructive" : "default"}
        onSelect={() => item.onSelect()}
      >
        {item.icon}
        {item.label}
      </ContextMenuItem>,
    );
  });
  return <>{out}</>;
}
