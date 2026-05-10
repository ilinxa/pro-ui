"use client";

import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  FilePlus,
  FolderPlus,
  Pencil,
  RefreshCw,
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
  FileTreeActions,
  FileTreeContextMenuContext,
  FileTreeContextMenuItem,
  FileTreeLabels,
  FileTreeState,
  FsNode,
} from "../types";

interface FileTreeContextMenuProps {
  state: FileTreeState;
  actions: FileTreeActions;
  enabled: boolean;
  labels: FileTreeLabels;
  /** Per-action gates from `contextMenuActions` prop. */
  gates: {
    open: boolean;
    newFile: boolean;
    newFolder: boolean;
    rename: boolean;
    delete: boolean;
    refresh: boolean;
  };
  /** Whether the consumer has wired the corresponding callback (we hide actions whose op nobody listens to). */
  wired: {
    onOpen: boolean;
    onCreate: boolean;
    onRename: boolean;
    onDelete: boolean;
    onRefresh: boolean;
  };
  /** Index of nodes (id → node) for resolving target on right-click. */
  nodeIndex: ReadonlyMap<string, FsNode>;
  /** Slot override. Receives the same context the default would render. */
  renderContextMenu?: (ctx: FileTreeContextMenuContext) => ReactNode;
  /** Children — the area wrapped by the context-menu trigger. */
  children: ReactNode;
}

export function FileTreeContextMenu(props: FileTreeContextMenuProps) {
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
  const triggerRef = useRef<HTMLDivElement>(null);

  const captureTarget = (e: MouseEvent) => {
    const el = e.target as HTMLElement | null;
    const rowEl = el?.closest("[data-row-id]") as HTMLElement | null;
    const id = rowEl?.getAttribute("data-row-id") ?? null;
    const node = id ? (nodeIndex.get(id) ?? null) : null;
    setTarget({ node, position: { x: e.clientX, y: e.clientY } });
  };

  const defaultActions = useMemo<FileTreeContextMenuItem[]>(() => {
    if (!target) return [];
    const node = target.node;
    const isFolder = node?.type === "folder";
    const list: FileTreeContextMenuItem[] = [];

    if (gates.open && wired.onOpen && node && node.type === "file") {
      list.push({
        id: "open",
        label: labels.contextOpen,
        icon: <FilePlus className="size-3.5" />,
        onSelect: () => actions.focusNode(node.id), // open is a consumer hook; no-op default safety
      });
    }

    if (gates.newFile && wired.onCreate) {
      list.push({
        id: "new-file",
        label: labels.contextNewFile,
        icon: <FilePlus className="size-3.5" />,
        onSelect: () => {
          const parentId =
            isFolder && node ? node.id : (node?.parentId ?? null);
          actions.triggerCreate(parentId, "file");
        },
      });
    }
    if (gates.newFolder && wired.onCreate) {
      list.push({
        id: "new-folder",
        label: labels.contextNewFolder,
        icon: <FolderPlus className="size-3.5" />,
        onSelect: () => {
          const parentId =
            isFolder && node ? node.id : (node?.parentId ?? null);
          actions.triggerCreate(parentId, "folder");
        },
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
    if (gates.refresh && wired.onRefresh && isFolder && node) {
      list.push({
        id: "refresh",
        label: labels.contextRefresh,
        icon: <RefreshCw className="size-3.5" />,
        onSelect: () => actions.refresh(node.id),
      });
    }
    if (gates.delete && wired.onDelete && node) {
      list.push({
        id: "delete",
        label: labels.contextDelete,
        icon: <Trash2 className="size-3.5" />,
        destructive: true,
        onSelect: () => {
          const ids = state.selectedIds.has(node.id)
            ? Array.from(state.selectedIds)
            : [node.id];
          actions.triggerDelete(ids);
        },
      });
    }
    return list;
  }, [target, gates, wired, labels, actions, state.selectedIds]);

  if (!enabled) {
    return <>{children}</>;
  }

  // Rebuild the slot context on each open
  const ctx: FileTreeContextMenuContext = {
    state,
    actions,
    node: target?.node ?? null,
    defaultActions,
    position: target?.position ?? { x: 0, y: 0 },
    labels,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger
        asChild
        ref={triggerRef}
        onContextMenu={captureTarget}
      >
        <div
          className="contents"
          onContextMenu={captureTarget}
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-[180px]">
        {renderContextMenu ? (
          renderContextMenu(ctx)
        ) : defaultActions.length === 0 ? (
          <ContextMenuItem disabled>{labels.emptyTitle}</ContextMenuItem>
        ) : (
          <DefaultContextMenuItems items={defaultActions} />
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function DefaultContextMenuItems({
  items,
}: {
  items: FileTreeContextMenuItem[];
}) {
  // Insert a separator before the destructive (delete) action
  const out: ReactNode[] = [];
  items.forEach((item, i) => {
    if (item.destructive && i > 0) {
      out.push(<ContextMenuSeparator key={`sep-${i}`} />);
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
