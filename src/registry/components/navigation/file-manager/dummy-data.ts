import type { FsNode } from "./types";

/**
 * Small Next.js project shape (mirrors file-tree's fixture so the dual-pane
 * demo shows consistent data on both sides). Includes some `size` /
 * `modifiedAt` metadata so the list view + status bar have something to
 * display.
 */
export const dummyFsNodes: FsNode[] = [
  {
    id: "src",
    name: "src",
    type: "folder",
    parentId: null,
    modifiedAt: "2026-04-12T10:14:00Z",
    children: [
      {
        id: "src/app",
        name: "app",
        type: "folder",
        parentId: "src",
        modifiedAt: "2026-05-08T15:22:00Z",
        children: [
          {
            id: "src/app/layout.tsx",
            name: "layout.tsx",
            type: "file",
            parentId: "src/app",
            size: 412,
            modifiedAt: "2026-05-01T09:30:00Z",
          },
          {
            id: "src/app/page.tsx",
            name: "page.tsx",
            type: "file",
            parentId: "src/app",
            size: 1820,
            modifiedAt: "2026-05-08T15:22:00Z",
          },
          {
            id: "src/app/globals.css",
            name: "globals.css",
            type: "file",
            parentId: "src/app",
            size: 3104,
            modifiedAt: "2026-04-22T11:08:00Z",
          },
        ],
      },
      {
        id: "src/components",
        name: "components",
        type: "folder",
        parentId: "src",
        modifiedAt: "2026-05-09T14:00:00Z",
        children: [
          {
            id: "src/components/ui",
            name: "ui",
            type: "folder",
            parentId: "src/components",
            modifiedAt: "2026-05-09T14:00:00Z",
            children: [
              {
                id: "src/components/ui/button.tsx",
                name: "button.tsx",
                type: "file",
                parentId: "src/components/ui",
                size: 2240,
                modifiedAt: "2026-05-09T14:00:00Z",
              },
              {
                id: "src/components/ui/input.tsx",
                name: "input.tsx",
                type: "file",
                parentId: "src/components/ui",
                size: 1560,
                modifiedAt: "2026-05-04T10:18:00Z",
              },
            ],
          },
          {
            id: "src/components/header.tsx",
            name: "header.tsx",
            type: "file",
            parentId: "src/components",
            size: 1108,
            modifiedAt: "2026-05-07T17:00:00Z",
          },
        ],
      },
      {
        id: "src/lib",
        name: "lib",
        type: "folder",
        parentId: "src",
        modifiedAt: "2026-04-30T08:42:00Z",
        children: [
          {
            id: "src/lib/utils.ts",
            name: "utils.ts",
            type: "file",
            parentId: "src/lib",
            size: 612,
            modifiedAt: "2026-04-30T08:42:00Z",
          },
        ],
      },
    ],
  },
  {
    id: "public",
    name: "public",
    type: "folder",
    parentId: null,
    modifiedAt: "2026-04-15T12:00:00Z",
    children: [
      {
        id: "public/favicon.ico",
        name: "favicon.ico",
        type: "file",
        parentId: "public",
        size: 4286,
        modifiedAt: "2026-03-10T09:00:00Z",
      },
      {
        id: "public/images",
        name: "images",
        type: "folder",
        parentId: "public",
        modifiedAt: "2026-04-15T12:00:00Z",
        children: [
          {
            id: "public/images/hero.png",
            name: "hero.png",
            type: "file",
            parentId: "public/images",
            size: 184320,
            modifiedAt: "2026-04-15T12:00:00Z",
          },
        ],
      },
    ],
  },
  {
    id: "package.json",
    name: "package.json",
    type: "file",
    parentId: null,
    size: 2048,
    modifiedAt: "2026-05-08T08:00:00Z",
  },
  {
    id: "tsconfig.json",
    name: "tsconfig.json",
    type: "file",
    parentId: null,
    size: 856,
    modifiedAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "next.config.ts",
    name: "next.config.ts",
    type: "file",
    parentId: null,
    size: 412,
    modifiedAt: "2026-04-20T10:14:00Z",
  },
  {
    id: "README.md",
    name: "README.md",
    type: "file",
    parentId: null,
    size: 3140,
    modifiedAt: "2026-05-09T11:00:00Z",
  },
];

/** Flat fixture for the grid-view demo: ~30 mixed-extension items. */
export const dummyFlatGrid: FsNode[] = Array.from({ length: 30 }, (_, i) => ({
  id: `asset-${i.toString().padStart(2, "0")}`,
  name: `asset-${i.toString().padStart(2, "0")}.${
    ["png", "jpg", "svg", "json", "md"][i % 5]
  }`,
  type: "file" as const,
  parentId: null,
  size: 1024 * (1 + (i % 16)),
  modifiedAt: new Date(2026, 0, 1 + i).toISOString(),
}));

/** Virtualization-stress fixture (≥200 nodes for list-view virtualization demo). */
export function makeLargeFolder(count = 250): FsNode[] {
  const exts = ["ts", "tsx", "js", "json", "md", "css", "png", "py"];
  return Array.from({ length: count }, (_, i) => ({
    id: `large-${i.toString().padStart(3, "0")}`,
    name: `file-${i.toString().padStart(3, "0")}.${exts[i % exts.length]}`,
    type: "file" as const,
    parentId: null,
    size: 1024 * (1 + (i % 32)),
    modifiedAt: new Date(2026, i % 12, 1 + (i % 28)).toISOString(),
  }));
}

export const dummyLargeFolder: FsNode[] = makeLargeFolder(250);
