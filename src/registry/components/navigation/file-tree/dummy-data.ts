import type { FsNode } from "./types";

/**
 * Small Next.js project shape — universally recognizable for the docs demo.
 * Exercises every default icon-mapping category (code, json, markdown,
 * image, archive, audio, video, dotfile).
 */
export const dummyFsNodes: FsNode[] = [
  {
    id: "src",
    name: "src",
    type: "folder",
    parentId: null,
    children: [
      {
        id: "src/app",
        name: "app",
        type: "folder",
        parentId: "src",
        children: [
          {
            id: "src/app/layout.tsx",
            name: "layout.tsx",
            type: "file",
            parentId: "src/app",
          },
          {
            id: "src/app/page.tsx",
            name: "page.tsx",
            type: "file",
            parentId: "src/app",
          },
          {
            id: "src/app/globals.css",
            name: "globals.css",
            type: "file",
            parentId: "src/app",
          },
        ],
      },
      {
        id: "src/components",
        name: "components",
        type: "folder",
        parentId: "src",
        children: [
          {
            id: "src/components/ui",
            name: "ui",
            type: "folder",
            parentId: "src/components",
            children: [
              {
                id: "src/components/ui/button.tsx",
                name: "button.tsx",
                type: "file",
                parentId: "src/components/ui",
              },
              {
                id: "src/components/ui/input.tsx",
                name: "input.tsx",
                type: "file",
                parentId: "src/components/ui",
              },
            ],
          },
          {
            id: "src/components/header.tsx",
            name: "header.tsx",
            type: "file",
            parentId: "src/components",
          },
        ],
      },
      {
        id: "src/lib",
        name: "lib",
        type: "folder",
        parentId: "src",
        children: [
          {
            id: "src/lib/utils.ts",
            name: "utils.ts",
            type: "file",
            parentId: "src/lib",
          },
        ],
      },
      {
        id: "src/types",
        name: "types",
        type: "folder",
        parentId: "src",
        children: [
          {
            id: "src/types/index.d.ts",
            name: "index.d.ts",
            type: "file",
            parentId: "src/types",
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
    children: [
      {
        id: "public/favicon.ico",
        name: "favicon.ico",
        type: "file",
        parentId: "public",
      },
      {
        id: "public/images",
        name: "images",
        type: "folder",
        parentId: "public",
        children: [
          {
            id: "public/images/hero.png",
            name: "hero.png",
            type: "file",
            parentId: "public/images",
          },
        ],
      },
    ],
  },
  {
    id: "assets",
    name: "assets",
    type: "folder",
    parentId: null,
    children: [
      {
        id: "assets/intro.mp4",
        name: "intro.mp4",
        type: "file",
        parentId: "assets",
      },
      {
        id: "assets/jingle.mp3",
        name: "jingle.mp3",
        type: "file",
        parentId: "assets",
      },
      {
        id: "assets/style.scss",
        name: "style.scss",
        type: "file",
        parentId: "assets",
      },
      {
        id: "assets/data.json",
        name: "data.json",
        type: "file",
        parentId: "assets",
      },
      {
        id: "assets/script.py",
        name: "script.py",
        type: "file",
        parentId: "assets",
      },
      {
        id: "assets/archive.zip",
        name: "archive.zip",
        type: "file",
        parentId: "assets",
      },
    ],
  },
  {
    id: "package.json",
    name: "package.json",
    type: "file",
    parentId: null,
  },
  {
    id: "tsconfig.json",
    name: "tsconfig.json",
    type: "file",
    parentId: null,
  },
  {
    id: "next.config.ts",
    name: "next.config.ts",
    type: "file",
    parentId: null,
  },
  {
    id: "README.md",
    name: "README.md",
    type: "file",
    parentId: null,
  },
  {
    id: ".gitignore",
    name: ".gitignore",
    type: "file",
    parentId: null,
  },
];

/**
 * Lazy-load demo: shallow root + folders with `children: undefined`. Used to
 * showcase `onLoadChildren` async resolution.
 */
export const dummyShallowNodes: FsNode[] = [
  { id: "src", name: "src", type: "folder", parentId: null },
  { id: "public", name: "public", type: "folder", parentId: null },
  { id: "assets", name: "assets", type: "folder", parentId: null },
  { id: "package.json", name: "package.json", type: "file", parentId: null },
  { id: "README.md", name: "README.md", type: "file", parentId: null },
];

/** Mock children for the lazy-load demo, keyed by parent id. */
export const dummyLazyChildren: Record<string, FsNode[]> = {
  src: [
    { id: "src/app", name: "app", type: "folder", parentId: "src" },
    {
      id: "src/components",
      name: "components",
      type: "folder",
      parentId: "src",
    },
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
      id: "src/app/layout.tsx",
      name: "layout.tsx",
      type: "file",
      parentId: "src/app",
    },
    {
      id: "src/app/page.tsx",
      name: "page.tsx",
      type: "file",
      parentId: "src/app",
    },
  ],
  "src/components": [
    {
      id: "src/components/header.tsx",
      name: "header.tsx",
      type: "file",
      parentId: "src/components",
    },
    {
      id: "src/components/footer.tsx",
      name: "footer.tsx",
      type: "file",
      parentId: "src/components",
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
      id: "public/favicon.ico",
      name: "favicon.ico",
      type: "file",
      parentId: "public",
    },
    {
      id: "public/og.png",
      name: "og.png",
      type: "file",
      parentId: "public",
    },
  ],
  assets: [
    { id: "assets/data.json", name: "data.json", type: "file", parentId: "assets" },
    { id: "assets/script.py", name: "script.py", type: "file", parentId: "assets" },
  ],
};

/** Programmatically generate a deep, virtualization-friendly tree. */
export function makeLargeTree(count = 250): FsNode[] {
  const exts = ["ts", "tsx", "js", "json", "md", "css", "png", "py"];
  const out: FsNode[] = [];
  const folderCount = Math.min(8, Math.floor(count / 10));
  let remaining = count;
  for (let f = 0; f < folderCount && remaining > 0; f++) {
    const folderId = `pkg-${f.toString().padStart(2, "0")}`;
    const childCount = Math.min(remaining, Math.floor(count / folderCount));
    const children: FsNode[] = [];
    for (let i = 0; i < childCount; i++) {
      const ext = exts[i % exts.length];
      children.push({
        id: `${folderId}/file-${i.toString().padStart(3, "0")}.${ext}`,
        name: `file-${i.toString().padStart(3, "0")}.${ext}`,
        type: "file",
        parentId: folderId,
      });
    }
    out.push({
      id: folderId,
      name: `package-${f}`,
      type: "folder",
      parentId: null,
      children,
    });
    remaining -= childCount;
  }
  // top-level loose files to fill out the count
  for (let i = 0; i < remaining; i++) {
    out.push({
      id: `loose-${i.toString().padStart(3, "0")}.txt`,
      name: `loose-${i.toString().padStart(3, "0")}.txt`,
      type: "file",
      parentId: null,
    });
  }
  return out;
}

export const largeDummyFsNodes: FsNode[] = makeLargeTree(250);
