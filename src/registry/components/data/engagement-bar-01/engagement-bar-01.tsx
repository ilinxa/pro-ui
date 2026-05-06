"use client";

import { memo, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ENGAGEMENT_BAR_LABELS,
  type EngagementAction,
  type EngagementActionAlign,
  type EngagementBar01Handle,
  type EngagementBar01Props,
  type EngagementBarLabels,
  type EngagementState,
} from "./types";
import { ActionButton } from "./parts/action-button";
import {
  deriveStateFromActions,
  useEngagementState,
} from "./hooks/use-engagement-state";
import { formatEngagementCount } from "./utils/format-count";

interface EngagementBar01InnerProps extends EngagementBar01Props {
  ref?: React.Ref<EngagementBar01Handle>;
}

function defaultAlignFor(kind: EngagementAction["kind"]): EngagementActionAlign {
  return kind === "bookmark" || kind === "view-count" ? "right" : "left";
}

function actionKey(action: EngagementAction, index: number): string {
  if (action.kind === "custom") return `custom-${action.id}`;
  return `${action.kind}-${index}`;
}

function EngagementBar01Inner({
  actions,
  variant = "default",
  subscribe,
  onSubscribeDelta,
  likersPreview,
  labels: labelsProp,
  className,
  actionClassName,
  ref,
}: EngagementBar01InnerProps) {
  const { state, dispatch, controlled } = useEngagementState({
    actions,
    subscribe,
    onSubscribeDelta,
  });

  const labels = useMemo<Required<Omit<EngagementBarLabels, "formatCount">>>(
    () => ({ ...DEFAULT_ENGAGEMENT_BAR_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const format = useMemo<(n: number) => string>(
    () => labelsProp?.formatCount ?? formatEngagementCount,
    [labelsProp?.formatCount],
  );

  // Stable handle identity — refs mirror state + actions via passive effect
  // (refs must not be written during render).
  const stateRef = useRef<EngagementState>(state);
  const actionsRef = useRef<EngagementAction[]>(actions);
  useEffect(() => {
    stateRef.current = state;
    actionsRef.current = actions;
  });

  useImperativeHandle(
    ref,
    () => ({
      triggerLike: () => {
        const likeAction = actionsRef.current.find((a) => a.kind === "like");
        if (!likeAction || likeAction.kind !== "like") return;
        const next = !stateRef.current.liked;
        if (likeAction.liked === undefined) {
          dispatch({ kind: "like-toggle" });
        }
        likeAction.onToggle?.(next);
      },
      triggerBookmark: () => {
        const bookmarkAction = actionsRef.current.find(
          (a) => a.kind === "bookmark",
        );
        if (!bookmarkAction || bookmarkAction.kind !== "bookmark") return;
        const next = !stateRef.current.bookmarked;
        if (bookmarkAction.bookmarked === undefined) {
          dispatch({ kind: "bookmark-toggle" });
        }
        bookmarkAction.onToggle?.(next);
      },
      getCurrentState: () => stateRef.current,
      reset: () => {
        dispatch({
          kind: "reset",
          next: deriveStateFromActions(actionsRef.current),
        });
      },
    }),
    // dispatch is stable; refs handle the rest. Empty dep array → handle identity is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (actions.length === 0) return null;

  // Stacked variant: vertical list, no left/right split, align ignored.
  if (variant === "stacked") {
    return (
      <div
        className={cn("flex flex-col items-center gap-3", className)}
      >
        {actions.map((action, index) => (
          <ActionButton
            key={actionKey(action, index)}
            action={action}
            variant={variant}
            state={state}
            controlled={controlled}
            dispatch={dispatch}
            format={format}
            labels={labels}
            actionClassName={actionClassName}
          />
        ))}
        {likersPreview ? <div className="mt-1">{likersPreview}</div> : null}
      </div>
    );
  }

  // Default + compact: horizontal row split by align.
  const leftActions: EngagementAction[] = [];
  const rightActions: EngagementAction[] = [];
  for (const action of actions) {
    const align = action.align ?? defaultAlignFor(action.kind);
    if (align === "right") rightActions.push(action);
    else leftActions.push(action);
  }

  const outerGapClass = variant === "compact" ? "gap-1" : "gap-2";

  return (
    <div className={cn("flex flex-col", outerGapClass, className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {leftActions.map((action, index) => (
            <ActionButton
              key={actionKey(action, index)}
              action={action}
              variant={variant}
              state={state}
              controlled={controlled}
              dispatch={dispatch}
              format={format}
              labels={labels}
              actionClassName={actionClassName}
            />
          ))}
        </div>
        {rightActions.length > 0 ? (
          <div className="flex items-center gap-1">
            {rightActions.map((action, index) => (
              <ActionButton
                key={actionKey(action, index)}
                action={action}
                variant={variant}
                state={state}
                controlled={controlled}
                dispatch={dispatch}
                format={format}
                labels={labels}
                actionClassName={actionClassName}
              />
            ))}
          </div>
        ) : null}
      </div>
      {likersPreview ? <div className="mt-1">{likersPreview}</div> : null}
    </div>
  );
}

const EngagementBar01 = memo(EngagementBar01Inner);
EngagementBar01.displayName = "EngagementBar01";

export { EngagementBar01 };
