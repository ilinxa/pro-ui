"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type {
  DetailPanelContextValue,
  DetailPanelHandle,
  DetailPanelProps,
} from "./types";
import { DetailPanelContext } from "./parts/detail-panel-context";
import { DetailPanelHeader } from "./parts/detail-panel-header";
import { DetailPanelBody } from "./parts/detail-panel-body";
import { DetailPanelActions } from "./parts/detail-panel-actions";
import { DetailPanelEmptyState } from "./parts/detail-panel-empty-state";
import { DetailPanelSkeleton } from "./parts/detail-panel-skeleton";
import { DetailPanelError } from "./parts/detail-panel-error";
import { SelectionAnnouncer } from "./parts/selection-announcer";
import { useDetailPanelMode } from "./hooks/use-detail-panel-mode";
import { useFocusRestore } from "./hooks/use-focus-restore";
import { keyForSelection } from "./lib/selection-key";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'input, textarea, select, button, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function DetailPanelImpl({
  selection,
  mode: controlledMode,
  onModeChange,
  canEdit = true,
  loading = false,
  error = null,
  emptyState,
  children,
  ariaLabel,
  className,
  ref,
}: DetailPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const selectionKey = useMemo(() => keyForSelection(selection), [selection]);

  const { mode, setMode } = useDetailPanelMode({
    controlledMode,
    onModeChange,
    selectionKey,
  });

  const { captureTrigger } = useFocusRestore({ mode, rootRef, bodyRef });

  const wrappedSetMode = useCallback(
    (next: typeof mode) => {
      captureTrigger();
      setMode(next);
    },
    [captureTrigger, setMode],
  );

  const hasError = !!error;
  const hasSelection = selection !== null;

  const lastSelectionKeyRef = useRef(selectionKey);
  useEffect(() => {
    if (lastSelectionKeyRef.current === selectionKey) return;
    lastSelectionKeyRef.current = selectionKey;
    rootRef.current?.focus({ preventScroll: true });
  }, [selectionKey]);

  const focusBody = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;
    const focusable = body.querySelector<HTMLElement>(FOCUSABLE);
    (focusable ?? body).focus();
  }, []);

  const resetMode = useCallback(() => {
    setMode("read");
  }, [setMode]);

  useImperativeHandle(
    ref,
    (): DetailPanelHandle => ({
      focusBody,
      resetMode,
    }),
    [focusBody, resetMode],
  );

  const ctx: DetailPanelContextValue = useMemo(
    () => ({
      selection,
      mode,
      setMode: wrappedSetMode,
      canEdit,
      loading,
      hasError,
      selectionKey,
      bodyRef,
    }),
    [
      selection,
      mode,
      wrappedSetMode,
      canEdit,
      loading,
      hasError,
      selectionKey,
    ],
  );

  let body: React.ReactNode;
  if (hasError && error) {
    body = <DetailPanelError error={error} />;
  } else if (loading) {
    body = <DetailPanelSkeleton />;
  } else if (!hasSelection) {
    body = emptyState ?? <DetailPanelEmptyState />;
  } else {
    body = (
      <div key={selectionKey} className="contents">
        {children}
      </div>
    );
  }

  return (
    <DetailPanelContext.Provider value={ctx}>
      <div
        ref={rootRef}
        role="region"
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        tabIndex={-1}
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <SelectionAnnouncer selectionKey={selectionKey} />
        {body}
      </div>
    </DetailPanelContext.Provider>
  );
}

type DetailPanelComponent = ((props: DetailPanelProps) => React.JSX.Element) & {
  Header: typeof DetailPanelHeader;
  Body: typeof DetailPanelBody;
  Actions: typeof DetailPanelActions;
};

export const DetailPanel = DetailPanelImpl as unknown as DetailPanelComponent;
DetailPanel.Header = DetailPanelHeader;
DetailPanel.Body = DetailPanelBody;
DetailPanel.Actions = DetailPanelActions;

export { DetailPanelEmptyState };
