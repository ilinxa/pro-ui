"use client";

import { memo, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  defaultEngagementBarLabels,
  type EngagementAction,
  type EngagementBarHandle,
  type EngagementBarProps,
  type ResolvedEngagementBarLabels,
} from "./types";
import { ActionButton } from "./parts/action-button";
import { useEngagementState } from "./hooks/use-engagement-state";
import { useDirection } from "./hooks/use-direction";
import { resolveLocale } from "./lib/format-count";

interface EngagementBarInnerProps extends EngagementBarProps {
  ref?: React.Ref<EngagementBarHandle>;
}

type ResolvedAlign = "start" | "end";

function resolveAlign(action: EngagementAction): ResolvedAlign {
  const align = action.align;
  if (align === "end" || align === "right") return "end";
  if (align === "start" || align === "left") return "start";
  // undefined / "auto" → the per-kind default.
  return action.kind === "bookmark" || action.kind === "view-count" ? "end" : "start";
}

/**
 * Stable keys: a custom action by its id, others by kind + occurrence across the FULL list — so
 * hiding or re-aligning one action never remounts another (an open picker would close).
 */
function actionKeys(actions: EngagementAction[]): string[] {
  const seen = new Map<string, number>();
  return actions.map((action) => {
    if (action.kind === "custom") return `custom-${action.id}`;
    const n = seen.get(action.kind) ?? 0;
    seen.set(action.kind, n + 1);
    return `${action.kind}-${n}`;
  });
}

function EngagementBarInner({
  actions,
  variant = "default",
  subscribe,
  onSubscribeDelta,
  likersPreview,
  reactionsPreview,
  trailing,
  labels: labelsProp,
  locale: localeProp = "en",
  formatCount,
  hideZeroCounts = false,
  optimistic = true,
  dir: dirProp,
  onReactionPickerOpenChange,
  className,
  actionClassName,
  ref,
}: EngagementBarInnerProps) {
  const {
    state,
    toggleLike,
    toggleBookmark,
    selectReaction,
    reset,
  } = useEngagementState({ actions, subscribe, onSubscribeDelta, optimistic });

  // The root element lives in state so direction resolves when the bar first mounts its root —
  // also when the first render was `null` (every action hidden).
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);
  const rootRef = useMemo(() => ({ current: rootEl }), [rootEl]);
  const dir = useDirection(rootRef, dirProp);

  // Merge over the defaults; an `undefined` value never erases a default (C2).
  const labels = useMemo<ResolvedEngagementBarLabels>(() => {
    const merged: ResolvedEngagementBarLabels = { ...defaultEngagementBarLabels };
    if (labelsProp) {
      for (const key of Object.keys(merged) as Array<keyof ResolvedEngagementBarLabels>) {
        const value = labelsProp[key];
        if (value !== undefined) merged[key] = value;
      }
    }
    return merged;
  }, [labelsProp]);

  const locale = useMemo(() => resolveLocale(localeProp), [localeProp]);
  const legacyFormat = labelsProp?.formatCount;
  const format = useMemo<(n: number) => string>(() => {
    if (formatCount) return formatCount;
    if (legacyFormat) return legacyFormat;
    const formatter = new Intl.NumberFormat(locale, { notation: "compact" });
    return (n: number) => formatter.format(Math.max(0, n));
  }, [formatCount, legacyFormat, locale]);

  // Stable handle identity — every method goes through the hook's request paths (stable).
  // (refs must not be written during render)
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });
  useImperativeHandle(
    ref,
    () => ({
      triggerLike: toggleLike,
      triggerBookmark: toggleBookmark,
      // Defense 1 per Q-PP-3 — microtask-deferred, same as a pick in the picker.
      triggerReaction: (kind: string | null) => {
        queueMicrotask(() => selectReaction(kind));
      },
      getCurrentState: () => stateRef.current,
      getCurrentReaction: () => stateRef.current.viewerReaction,
      reset,
    }),
    [toggleLike, toggleBookmark, selectReaction, reset],
  );

  const keys = actionKeys(actions);
  const visible = actions
    .map((action, i) => ({ action, key: keys[i] ?? String(i) }))
    .filter((entry) => !entry.action.hidden);
  if (visible.length === 0 && !trailing) return null;

  const renderAction = ({ action, key }: { action: EngagementAction; key: string }) => (
    <ActionButton
      key={key}
      action={action}
      variant={variant}
      state={state}
      onToggleLike={toggleLike}
      onToggleBookmark={toggleBookmark}
      onSelectReaction={selectReaction}
      format={format}
      labels={labels}
      dir={dir}
      onReactionPickerOpenChange={onReactionPickerOpenChange}
      actionClassName={actionClassName}
      hideZeroCounts={hideZeroCounts}
    />
  );

  // Stacked variant: vertical list, no start/end split, align ignored. One child per visible
  // action (story-viewer's stagger selectors rely on this shape), then `trailing`, then previews.
  if (variant === "stacked") {
    return (
      <div
        ref={setRootEl}
        dir={dirProp}
        className={cn("flex flex-col items-center gap-3", className)}
      >
        {visible.map(renderAction)}
        {trailing}
        {likersPreview ? <div className="mt-1">{likersPreview}</div> : null}
        {reactionsPreview ? (
          <div className="mt-1">{reactionsPreview}</div>
        ) : null}
      </div>
    );
  }

  // Default + compact: horizontal row split by align (start group, end group + trailing).
  const startActions: typeof visible = [];
  const endActions: typeof visible = [];
  for (const entry of visible) {
    if (resolveAlign(entry.action) === "end") endActions.push(entry);
    else startActions.push(entry);
  }

  const outerGapClass = variant === "compact" ? "gap-1" : "gap-2";

  return (
    <div
      ref={setRootEl}
      dir={dirProp}
      className={cn("flex flex-col", outerGapClass, className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">{startActions.map(renderAction)}</div>
        {endActions.length > 0 || trailing ? (
          <div className="flex items-center gap-1">
            {endActions.map(renderAction)}
            {trailing}
          </div>
        ) : null}
      </div>
      {likersPreview ? <div className="mt-1">{likersPreview}</div> : null}
      {reactionsPreview ? (
        <div className="mt-1">{reactionsPreview}</div>
      ) : null}
    </div>
  );
}

const EngagementBar = memo(EngagementBarInner);
EngagementBar.displayName = "EngagementBar";

export { EngagementBar };
