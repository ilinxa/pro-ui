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

export interface DetailPanelProps {
  selection: DetailPanelSelection | null;

  mode?: DetailPanelMode;
  onModeChange?: (mode: DetailPanelMode) => void;

  canEdit?: boolean;

  loading?: boolean;
  error?: DetailPanelError | null;

  emptyState?: ReactNode;

  children: ReactNode;

  ariaLabel?: string;
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
