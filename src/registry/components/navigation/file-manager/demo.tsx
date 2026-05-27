"use client";

import { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { FileManager } from "./file-manager";
import {
  dummyFsNodes,
  dummyFlatGrid,
  dummyLargeFolder,
} from "./dummy-data";
import { mergeLoadedChildren } from "./lib/tree-utils";
import { FileClipboardProvider } from "../_shared/file-clipboard";
import type { FsNode } from "./types";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-130 w-full overflow-hidden rounded-lg border border-border bg-card">
      {children}
    </div>
  );
}

function StandaloneGridDemo() {
  return (
    <Frame>
      <FileManager
        nodes={dummyFsNodes}
        defaultCurrentFolderId={null}
        title="Project"
      />
    </Frame>
  );
}

function FlatGridDemo() {
  return (
    <Frame>
      <FileManager
        nodes={dummyFlatGrid}
        defaultCurrentFolderId={null}
        title="Asset library"
        showBackForward={false}
        showUpButton={false}
        showPathBar={false}
      />
    </Frame>
  );
}

function FullCrudDemo() {
  const [nodes, setNodes] = useState<FsNode[]>(dummyFsNodes);
  const [counter, setCounter] = useState(1);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const handleCreate = useCallback(
    ({
      parentId,
      type,
    }: {
      parentId: string | null;
      type: "file" | "folder";
    }) => {
      const id = `new-${counter}`;
      setCounter((n) => n + 1);
      const newNode: FsNode = {
        id,
        name:
          type === "file" ? `untitled-${counter}.txt` : `New Folder ${counter}`,
        type,
        parentId,
        children: type === "folder" ? [] : undefined,
      };
      const insert = (list: FsNode[]): FsNode[] => {
        if (parentId === null) return [...list, newNode];
        return list.map((n) => {
          if (n.id === parentId) {
            return { ...n, children: [...(n.children ?? []), newNode] };
          }
          if (n.children) return { ...n, children: insert(n.children) };
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

  const moveAll = useCallback(
    (
      args: { ids: string[]; targetId: string | null },
      collected: FsNode[] = [],
    ): FsNode[] => {
      const moving = new Set(args.ids);
      const collect: FsNode[] = collected;
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
      if (args.targetId === null) return [...removed, ...collect];
      const insertInside = (list: FsNode[]): FsNode[] =>
        list.map((n) => {
          if (n.id === args.targetId) {
            return { ...n, children: [...(n.children ?? []), ...collect] };
          }
          if (n.children) return { ...n, children: insertInside(n.children) };
          return n;
        });
      return insertInside(removed);
    },
    [nodes],
  );

  const handleMove = useCallback(
    (args: { ids: string[]; targetId: string | null }) => {
      setNodes(moveAll(args));
    },
    [moveAll],
  );

  const handlePaste = useCallback(
    (args: {
      ids: string[];
      kind: "cut" | "copy";
      targetFolderId: string | null;
    }) => {
      if (args.kind === "cut") {
        setNodes(moveAll({ ids: args.ids, targetId: args.targetFolderId }));
      } else {
        // copy: clone with fresh ids
        const cloned: FsNode[] = [];
        const cloneNode = (n: FsNode): FsNode => ({
          ...n,
          id: `${n.id}-copy-${counter}`,
          parentId: args.targetFolderId,
          children: n.children?.map(cloneNode),
        });
        const collect = (list: FsNode[]) => {
          for (const n of list) {
            if (args.ids.includes(n.id)) cloned.push(cloneNode(n));
            if (n.children) collect(n.children);
          }
        };
        collect(nodes);
        setCounter((n) => n + 1);
        if (args.targetFolderId === null) {
          setNodes((prev) => [...prev, ...cloned]);
        } else {
          setNodes((prev) =>
            prev.map(function attach(n: FsNode): FsNode {
              if (n.id === args.targetFolderId) {
                return {
                  ...n,
                  children: [...(n.children ?? []), ...cloned],
                };
              }
              if (n.children) {
                return { ...n, children: n.children.map(attach) };
              }
              return n;
            }),
          );
        }
      }
    },
    [moveAll, nodes, counter],
  );

  return (
    <Frame>
      <FileClipboardProvider>
        <FileManager
          nodes={nodes}
          currentFolderId={currentFolderId}
          onCurrentFolderChange={({ folderId }) => setCurrentFolderId(folderId)}
          title="Full CRUD"
          onOpen={({ node }) => alert(`Open: ${node.name}`)}
          onCreate={handleCreate}
          onRename={handleRename}
          onDelete={handleDelete}
          onMove={handleMove}
          onPaste={handlePaste}
          onRefresh={() => alert("Refresh!")}
        />
      </FileClipboardProvider>
    </Frame>
  );
}

function LazyLoadDemo() {
  const [nodes, setNodes] = useState<FsNode[]>([
    { id: "src", name: "src", type: "folder", parentId: null },
    { id: "public", name: "public", type: "folder", parentId: null },
    { id: "README.md", name: "README.md", type: "file", parentId: null },
  ]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const lazyChildren: Record<string, FsNode[]> = {
    src: [
      { id: "src/app", name: "app", type: "folder", parentId: "src" },
      { id: "src/lib", name: "lib", type: "folder", parentId: "src" },
      {
        id: "src/index.ts",
        name: "index.ts",
        type: "file",
        parentId: "src",
      },
    ],
    "src/app": [
      {
        id: "src/app/page.tsx",
        name: "page.tsx",
        type: "file",
        parentId: "src/app",
      },
    ],
    "src/lib": [
      {
        id: "src/lib/utils.ts",
        name: "utils.ts",
        type: "file",
        parentId: "src/lib",
      },
    ],
    public: [
      {
        id: "public/og.png",
        name: "og.png",
        type: "file",
        parentId: "public",
      },
    ],
  };

  return (
    <Frame>
      <FileManager
        nodes={nodes}
        currentFolderId={currentFolderId}
        onCurrentFolderChange={({ folderId }) => setCurrentFolderId(folderId)}
        title="Lazy load"
        onLoadChildren={async ({ nodeId }) => {
          await new Promise((r) => setTimeout(r, 350));
          const kids = lazyChildren[nodeId] ?? [];
          setNodes((prev) => mergeLoadedChildren(prev, nodeId, kids));
          return kids;
        }}
      />
    </Frame>
  );
}

function VirtualizedDemo() {
  return (
    <Frame>
      <FileManager
        nodes={dummyLargeFolder}
        defaultCurrentFolderId={null}
        defaultViewMode="list"
        title="250 items (virtualized)"
        showBackForward={false}
        showUpButton={false}
        showPathBar={false}
      />
    </Frame>
  );
}

export default function FileManagerDemo() {
  return (
    <Tabs defaultValue="standalone" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="standalone">Standalone</TabsTrigger>
        <TabsTrigger value="flat">Flat grid</TabsTrigger>
        <TabsTrigger value="crud">Full CRUD + clipboard</TabsTrigger>
        <TabsTrigger value="lazy">Lazy load</TabsTrigger>
        <TabsTrigger value="virtual">Virtualized list</TabsTrigger>
      </SwipeTabsList>
      <TabsContent value="standalone">
        <StandaloneGridDemo />
      </TabsContent>
      <TabsContent value="flat">
        <FlatGridDemo />
      </TabsContent>
      <TabsContent value="crud">
        <FullCrudDemo />
      </TabsContent>
      <TabsContent value="lazy">
        <LazyLoadDemo />
      </TabsContent>
      <TabsContent value="virtual">
        <VirtualizedDemo />
      </TabsContent>
    </Tabs>
  );
}
