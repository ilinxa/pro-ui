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

const EXT_TO_ICON: Record<string, typeof File> = {
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
  css: FileCode,
  scss: FileCode,
  sass: FileCode,
  less: FileCode,
  html: FileCode2,
  htm: FileCode2,
  xml: FileCode2,
  json: FileJson,
  jsonc: FileJson,
  md: FileText,
  mdx: FileText,
  markdown: FileText,
  txt: FileText,
  rtf: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  bmp: FileImage,
  ico: FileImage,
  svg: FileImage,
  zip: FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  "7z": FileArchive,
  rar: FileArchive,
  mp4: FileVideo,
  mov: FileVideo,
  webm: FileVideo,
  mkv: FileVideo,
  avi: FileVideo,
  mp3: FileAudio,
  wav: FileAudio,
  ogg: FileAudio,
  flac: FileAudio,
  lock: File,
  env: File,
  gitignore: File,
  gitattributes: File,
  editorconfig: File,
};

export function getNodeExtension(node: FsNode): string {
  if (node.ext) return node.ext.replace(/^\./, "").toLowerCase();
  const idx = node.name.lastIndexOf(".");
  if (idx <= 0 || idx === node.name.length - 1) return "";
  return node.name.slice(idx + 1).toLowerCase();
}

export function iconForExtension(
  ext: string,
  className = "size-4",
): ReactNode {
  const normalized = ext.replace(/^\./, "").toLowerCase();
  const Icon = EXT_TO_ICON[normalized] ?? File;
  return <Icon className={className} />;
}

export function defaultFileIcon(node: FsNode, className = "size-4"): ReactNode {
  return iconForExtension(getNodeExtension(node), className);
}

export function defaultFolderIcon(
  expanded: boolean,
  className = "size-4",
): ReactNode {
  const Icon = expanded ? FolderOpen : Folder;
  return <Icon className={className} />;
}
