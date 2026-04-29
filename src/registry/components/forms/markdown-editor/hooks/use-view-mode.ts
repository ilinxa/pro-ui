import { useCallback, useState } from "react";
import type { ViewMode } from "../types";

interface UseViewModeOpts {
  view: ViewMode | undefined;
  onViewChange: ((view: ViewMode) => void) | undefined;
  initialView: ViewMode;
  showPreviewToggle: boolean;
}

interface UseViewModeResult {
  viewValue: ViewMode;
  handleViewChange: (next: ViewMode) => void;
  toggleHidden: boolean;
}

// Controlled-or-uncontrolled view-mode dispatch (plan §4.3).
// When showPreviewToggle is false, view is locked to initialView (toggle is hidden too).
export function useViewMode(opts: UseViewModeOpts): UseViewModeResult {
  const { view, onViewChange, initialView, showPreviewToggle } = opts;
  const isControlled = view !== undefined;
  const [internalView, setInternalView] = useState<ViewMode>(initialView);

  const lockedView = !showPreviewToggle ? initialView : null;
  const viewValue = lockedView ?? (isControlled ? view : internalView);

  const handleViewChange = useCallback(
    (next: ViewMode) => {
      if (lockedView) return;
      if (!isControlled) setInternalView(next);
      onViewChange?.(next);
    },
    [isControlled, lockedView, onViewChange],
  );

  return { viewValue, handleViewChange, toggleHidden: !showPreviewToggle };
}
