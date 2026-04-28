import type { ReactNode } from "react";

export type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T };

export type Breakpoint = "mobile" | "tablet" | "desktop";

export type WorkspaceComponent = {
  id: string;
  name: string;
  icon?: ReactNode;
  category?: string;
  render: () => ReactNode;
};

export type AreaContext = {
  areaId: string;
  width: number;
  height: number;
  isFocused: boolean;
};

export type SplitOrientation = "vertical" | "horizontal";

export type AreaTreeLeaf = {
  kind: "leaf";
  id: string;
  componentId: string;
};

export type AreaTreeSplit = {
  kind: "split";
  orientation: SplitOrientation;
  ratio: number;
  a: AreaTree;
  b: AreaTree;
};

export type AreaTree = AreaTreeLeaf | AreaTreeSplit;

export type WorkspacePreset = {
  id: string;
  name: string;
  layout: AreaTree;
};

export type WorkspaceProps = {
  components: WorkspaceComponent[];
  defaultComponentId: string;

  layout?: AreaTree;
  defaultLayout?: AreaTree;
  onLayoutChange?: (next: AreaTree) => void;

  presets?: WorkspacePreset[];
  activePresetId?: string;
  onActivePresetChange?: (id: string) => void;

  minAreaSize?: { width: number; height: number };
  maxSplitDepth?: ResponsiveValue<number>;
  breakpoints?: { mobile: number; tablet: number };

  "aria-label"?: string;
  className?: string;
};
