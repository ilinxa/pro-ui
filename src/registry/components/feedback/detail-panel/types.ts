import type { ReactNode, Ref, RefObject } from "react";

export type DetailPanelMode = "read" | "edit";

export interface DetailPanelSelection {
  type: string;
  id: string;
}

export interface DetailPanelError {
  message: string;
  retry?: () => void;
}

export interface DetailPanelActionsContext {
  mode: DetailPanelMode;
  setMode: (next: DetailPanelMode) => void;
  canEdit: boolean;
}

export type DetailPanelActionsRenderFn = (
  ctx: DetailPanelActionsContext,
) => ReactNode;

export interface DetailPanelLabels {
  /**
   * Accessible name for the `role="region"` landmark when no per-render
   * `ariaLabel` is supplied. Default: 'Detail panel'.
   */
  region?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_DETAIL_PANEL_LABELS: Required<DetailPanelLabels> = {
  region: "Detail panel",
};

export interface DetailPanelProps {
  selection: DetailPanelSelection | null;

  mode?: DetailPanelMode;
  onModeChange?: (mode: DetailPanelMode) => void;

  canEdit?: boolean;

  loading?: boolean;
  error?: DetailPanelError | null;

  emptyState?: ReactNode;

  children: ReactNode;

  /**
   * Per-render accessible name override (e.g., the currently-selected
   * entity's label). Wins over `labels.region`. When BOTH are absent, the
   * region falls back to `DEFAULT_DETAIL_PANEL_LABELS.region` ("Detail panel")
   * so the `role="region"` landmark always has an accessible name.
   */
  ariaLabel?: string;
  /**
   * Localized labels. Currently a single key — `region` (the static landmark
   * name). `ariaLabel` overrides on a per-render basis.
   */
  labels?: DetailPanelLabels;
  className?: string;

  ref?: Ref<DetailPanelHandle>;
}

export interface DetailPanelHeaderProps {
  children: ReactNode;
  sticky?: boolean;
  className?: string;
}

export interface DetailPanelBodyProps {
  children: ReactNode;
  className?: string;
}

export interface DetailPanelActionsProps {
  children: ReactNode | DetailPanelActionsRenderFn;
  position?: "footer" | "header";
  className?: string;
}

export interface DetailPanelHandle {
  focusBody(): void;
  resetMode(): void;
}

export interface DetailPanelContextValue {
  selection: DetailPanelSelection | null;
  mode: DetailPanelMode;
  setMode: (next: DetailPanelMode) => void;
  canEdit: boolean;
  loading: boolean;
  hasError: boolean;
  selectionKey: string;
  bodyRef: RefObject<HTMLDivElement | null>;
}
