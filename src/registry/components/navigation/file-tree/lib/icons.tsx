import type { ReactNode } from "react";
import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileCode2,
  FileImage,
  FileJson,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
} from "lucide-react";

import type { FsNode } from "../types";

/**
 * Mapping of common file-extension categories to their default Lucide icon.
 * Order of definition matters only for documentation; lookup is by the
 * extension string itself.
 */
const EXT_TO_ICON: Record<string, typeof File> = {
  // Code (general)
  ts: FileCode,
  tsx: FileCode,
  js: FileCode,
  jsx: FileCode,
  mjs: FileCode,
  cjs: FileCode,
  py: FileCode,
  rb: FileCode,
  go: FileCode,
  rs: FileCode,
  java: FileCode,
  kt: FileCode,
  swift: FileCode,
  cpp: FileCode,
  c: FileCode,
  h: FileCode,
  cs: FileCode,
  php: FileCode,
  lua: FileCode,
  // CSS family
  css: FileCode,
  scss: FileCode,
  sass: FileCode,
  less: FileCode,
  // Markup
  html: FileCode2,
  htm: FileCode2,
  xml: FileCode2,
  // JSON
  json: FileJson,
  jsonc: FileJson,
  // Text / docs
  md: FileText,
  mdx: FileText,
  markdown: FileText,
  txt: FileText,
  rtf: FileText,
  // Images
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  bmp: FileImage,
  ico: FileImage,
  svg: FileImage,
  // Archives
  zip: FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  "7z": FileArchive,
  rar: FileArchive,
  // Video / audio
  mp4: FileVideo,
  mov: FileVideo,
  webm: FileVideo,
  mkv: FileVideo,
  avi: FileVideo,
  mp3: FileAudio,
  wav: FileAudio,
  ogg: FileAudio,
  flac: FileAudio,
  // Config / dotfiles
  lock: File,
  env: File,
  gitignore: File,
  gitattributes: File,
  editorconfig: File,
};

/**
 * Derive an extension string from an FsNode. Prefers the explicit `ext` field,
 * else falls back to the substring after the last dot. Files with no dot
 * (e.g. `Dockerfile`) return an empty string.
 */
export function getNodeExtension(node: FsNode): string {
  if (node.ext) return node.ext.replace(/^\./, "").toLowerCase();
  const idx = node.name.lastIndexOf(".");
  if (idx <= 0 || idx === node.name.length - 1) return "";
  return node.name.slice(idx + 1).toLowerCase();
}

/**
 * Public consumer helper. Returns a JSX element for the given extension
 * string, falling back to a generic `<File>`. Does NOT take an FsNode —
 * consumers building custom registries can chain on this for their unknown
 * types.
 */
export function iconForExtension(
  ext: string,
  className = "size-4",
): ReactNode {
  const normalized = ext.replace(/^\./, "").toLowerCase();
  const Icon = EXT_TO_ICON[normalized] ?? File;
  return <Icon className={className} />;
}

/** Default icon for a file node — internal use. */
export function defaultFileIcon(node: FsNode, className = "size-4"): ReactNode {
  return iconForExtension(getNodeExtension(node), className);
}

/** Default icon for a folder node — internal use. */
export function defaultFolderIcon(
  expanded: boolean,
  className = "size-4",
): ReactNode {
  const Icon = expanded ? FolderOpen : Folder;
  return <Icon className={className} />;
}
