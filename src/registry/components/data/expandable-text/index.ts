export { default as ExpandableText } from "./expandable-text";

export type {
  ExpandableTextProps,
  ExpandableTextLabels,
  ExpandableTextToggleRenderProps,
} from "./types";

export { DEFAULT_EXPANDABLE_TEXT_LABELS, defaultExpandableTextLabels } from "./types";

export {
  useLineClampDetect,
  type UseLineClampDetectOptions,
  type UseLineClampDetectResult,
} from "./hooks/use-line-clamp-detect";
