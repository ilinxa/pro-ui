import type { ComposerConfig } from "./types";

/**
 * Skeleton config used by the C1/C2 demo so the docs site renders something.
 * The real fixtures (the full `news-composer` config, a sample `ComposerDraft`,
 * and a sample `ContentCardItem` for the re-edit demo) land at C14.
 */
export const SKELETON_CONFIG: ComposerConfig = {
  id: "news",
  version: "0.0.0",
  title: "News Article",
  adapterId: "news-content-item",
  publishModes: ["draft", "publish", "schedule"],
  presentation: "inline",
  steps: [],
};
