import type { MediaFilterCategory, MediaNode, MediaPreviewKind } from "../types";
import { resolvePreviewKind } from "./preview-kind";

/**
 * Map a preview kind to its type-filter chip (Q4 taxonomy):
 * images / video / pdfs / docs (= code, json, text, markdown + unknown/office).
 */
export function filterCategoryForKind(kind: MediaPreviewKind): Exclude<MediaFilterCategory, "all"> {
  switch (kind) {
    case "image":
      return "images";
    case "video":
      return "video";
    case "pdf":
      return "pdfs";
    default:
      // code | json | text | markdown | unknown (office docs, archives, …)
      return "docs";
  }
}

export function filterCategoryForNode(node: MediaNode): Exclude<MediaFilterCategory, "all"> {
  return filterCategoryForKind(resolvePreviewKind(node));
}

/** Does a file node match the active chip? Folders are never filtered. */
export function nodeMatchesFilter(node: MediaNode, filter: MediaFilterCategory): boolean {
  if (node.type === "folder") return true;
  if (filter === "all") return true;
  return filterCategoryForNode(node) === filter;
}

export type MediaFilterCounts = Record<MediaFilterCategory, number>;

/** Count files per chip for the given (current-folder) file list. */
export function computeFilterCounts(files: MediaNode[]): MediaFilterCounts {
  const counts: MediaFilterCounts = {
    all: 0,
    images: 0,
    video: 0,
    pdfs: 0,
    docs: 0,
  };
  for (const node of files) {
    if (node.type === "folder") continue;
    counts.all += 1;
    counts[filterCategoryForNode(node)] += 1;
  }
  return counts;
}

export const FILTER_ORDER: MediaFilterCategory[] = [
  "all",
  "images",
  "video",
  "pdfs",
  "docs",
];
