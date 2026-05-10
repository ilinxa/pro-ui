"use client";

import { useCallback, useState } from "react";
import { Code2, FileSpreadsheet, ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileTree } from "./file-tree";
import {
  dummyFsNodes,
  dummyShallowNodes,
  dummyLazyChildren,
  largeDummyFsNodes,
} from "./dummy-data";
import { mergeLoadedChildren } from "./lib/tree-utils";
import type { FsNode } from "./types";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-105 w-full overflow-hidden rounded-lg border border-border bg-card">
      {children}
    </div>
  );
}

function ReadOnlyDemo() {
  return (
    <Frame>
      <FileTree
        nodes={dummyFsNodes}
        title="my-app"
        showNewFile={false}
        showNewFolder={false}
        showRefresh={false}
      />
    </Frame>
  );
}

function FullCrudDemo() {
  const [nodes, setNodes] = useState<FsNode[]>(dummyFsNodes);
  const [counter, setCounter] = useState(1);

  const handleCreate = useCallback(
    (args: { parentId: string | null; type: "file" | "folder" }) => {
      const id = `new-${args.type}-${counter}`;
      setCounter((n) => n + 1);
      const newNode: FsNode = {
        id,
        name: args.type === "file" ? `untitled-${counter}.txt` : `New Folder ${counter}`,
        type: args.type,
        parentId: args.parentId,
        children: args.type === "folder" ? [] : undefined,
      };
      const insert = (list: FsNode[]): FsNode[] => {
        if (args.parentId === null) return [...list, newNode];
        return list.map((n) => {
          if (n.id === args.parentId) {
            return { ...n, children: [...(n.children ?? []), newNode] };
          }
          if (n.children) {
            return { ...n, children: insert(n.children) };
          }
          return n;
        });
      };
      setNodes(insert);
    },
    [counter],
  );

  const handleRename = useCallback(
    (args: { id: string; nextName: string }) => {
      const rename = (list: FsNode[]): FsNode[] =>
        list.map((n) => {
          if (n.id === args.id) return { ...n, name: args.nextName };
          if (n.children) return { ...n, children: rename(n.children) };
          return n;
        });
      setNodes(rename);
    },
    [],
  );

  const handleDelete = useCallback((args: { ids: string[] }) => {
    const ids = new Set(args.ids);
    const remove = (list: FsNode[]): FsNode[] =>
      list
        .filter((n) => !ids.has(n.id))
        .map((n) =>
          n.children ? { ...n, children: remove(n.children) } : n,
        );
    setNodes(remove);
  }, []);

  const handleMove = useCallback(
    (args: { ids: string[]; targetId: string | null; position: "before" | "inside" | "after" }) => {
      const moving = new Set(args.ids);
      // remove from current locations
      const collect: FsNode[] = [];
      const removeAndCollect = (list: FsNode[]): FsNode[] =>
        list
          .filter((n) => {
            if (moving.has(n.id)) {
              collect.push(n);
              return false;
            }
            return true;
          })
          .map((n) =>
            n.children
              ? { ...n, children: removeAndCollect(n.children) }
              : n,
          );
      const removed = removeAndCollect(nodes);
      // insert at target
      if (args.position === "inside" && args.targetId) {
        const insertInside = (list: FsNode[]): FsNode[] =>
          list.map((n) => {
            if (n.id === args.targetId) {
              return {
                ...n,
                children: [...(n.children ?? []), ...collect],
              };
            }
            if (n.children) {
              return { ...n, children: insertInside(n.children) };
            }
            return n;
          });
        setNodes(insertInside(removed));
      } else if (args.targetId) {
        // before/after: insert relative to target's siblings
        const insertSiblings = (list: FsNode[]): FsNode[] => {
          const idx = list.findIndex((n) => n.id === args.targetId);
          if (idx >= 0) {
            const at = args.position === "after" ? idx + 1 : idx;
            return [...list.slice(0, at), ...collect, ...list.slice(at)];
          }
          return list.map((n) =>
            n.children ? { ...n, children: insertSiblings(n.children) } : n,
          );
        };
        setNodes(insertSiblings(removed));
      } else {
        // root append
        setNodes([...removed, ...collect]);
      }
    },
    [nodes],
  );

  return (
    <Frame>
      <FileTree
        nodes={nodes}
        title="Full CRUD"
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
        onMove={handleMove}
        onOpen={({ node }) => alert(`Open: ${node.name}`)}
      />
    </Frame>
  );
}

function LazyLoadDemo() {
  const [nodes, setNodes] = useState<FsNode[]>(dummyShallowNodes);

  const handleLoad = useCallback(
    async ({ nodeId }: { nodeId: string; node: FsNode }): Promise<FsNode[]> => {
      await new Promise((r) => setTimeout(r, 350));
      const kids = dummyLazyChildren[nodeId] ?? [];
      setNodes((prev) => mergeLoadedChildren(prev, nodeId, kids));
      return kids;
    },
    [],
  );

  return (
    <Frame>
      <FileTree
        nodes={nodes}
        title="Lazy load"
        showNewFile={false}
        showNewFolder={false}
        onLoadChildren={handleLoad}
        onOpen={({ node }) => alert(`Open: ${node.name}`)}
      />
    </Frame>
  );
}

function MultiSelectDemo() {
  const [nodes, setNodes] = useState<FsNode[]>(dummyFsNodes);
  const handleDelete = useCallback((args: { ids: string[] }) => {
    const ids = new Set(args.ids);
    const remove = (list: FsNode[]): FsNode[] =>
      list
        .filter((n) => !ids.has(n.id))
        .map((n) =>
          n.children ? { ...n, children: remove(n.children) } : n,
        );
    setNodes(remove);
  }, []);
  return (
    <Frame>
      <FileTree
        nodes={nodes}
        title="Multi-select"
        selectionMode="multi"
        showNewFile={false}
        showNewFolder={false}
        showRefresh={false}
        onDelete={handleDelete}
      />
    </Frame>
  );
}

function resolveCustomIcon({ node }: { node: FsNode }) {
  if (node.type === "folder") return null;
  const ext =
    node.ext ?? node.name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "svg"].includes(ext)) {
    return <ImageIcon className="size-4 text-violet-500" />;
  }
  if (["json", "yaml", "yml", "toml"].includes(ext)) {
    return <FileSpreadsheet className="size-4 text-emerald-500" />;
  }
  if (["ts", "tsx", "js", "jsx"].includes(ext)) {
    return <Code2 className="size-4 text-sky-500" />;
  }
  return null;
}

function CustomIconsDemo() {
  return (
    <Frame>
      <FileTree
        nodes={dummyFsNodes}
        title="Custom icons"
        iconForNode={resolveCustomIcon}
        showNewFile={false}
        showNewFolder={false}
        showRefresh={false}
      />
    </Frame>
  );
}

function VirtualizedDemo() {
  return (
    <Frame>
      <FileTree
        nodes={largeDummyFsNodes}
        title="250 nodes (virtualized)"
        showNewFile={false}
        showNewFolder={false}
        showRefresh={false}
      />
    </Frame>
  );
}

export default function FileTreeDemo() {
  return (
    <Tabs defaultValue="readonly" className="w-full">
      <TabsList>
        <TabsTrigger value="readonly">Read-only</TabsTrigger>
        <TabsTrigger value="crud">Full CRUD</TabsTrigger>
        <TabsTrigger value="lazy">Lazy load</TabsTrigger>
        <TabsTrigger value="multi">Multi-select</TabsTrigger>
        <TabsTrigger value="icons">Custom icons</TabsTrigger>
        <TabsTrigger value="virtual">Virtualized</TabsTrigger>
      </TabsList>
      <TabsContent value="readonly">
        <ReadOnlyDemo />
      </TabsContent>
      <TabsContent value="crud">
        <FullCrudDemo />
      </TabsContent>
      <TabsContent value="lazy">
        <LazyLoadDemo />
      </TabsContent>
      <TabsContent value="multi">
        <MultiSelectDemo />
      </TabsContent>
      <TabsContent value="icons">
        <CustomIconsDemo />
      </TabsContent>
      <TabsContent value="virtual">
        <VirtualizedDemo />
      </TabsContent>
    </Tabs>
  );
}
