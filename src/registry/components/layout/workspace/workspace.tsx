"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { Area } from "./parts/area";
import { CardStack } from "./parts/card-stack";
import { DragOverlay } from "./parts/drag-overlay";
import { PresetsTabs } from "./parts/presets-tabs";
import { SplitDivider } from "./parts/split-divider";
import { useBreakpoint } from "./hooks/use-breakpoint";
import { useAreaFocus } from "./hooks/use-area-focus";
import { useCornerGesture } from "./hooks/use-corner-gesture";
import { useEdgeGesture } from "./hooks/use-edge-gesture";
import {
  useKeyboardActions,
  useResizeKeyboard,
} from "./hooks/use-keyboard-actions";
import { reducer, type Action } from "./lib/reducer";
import {
  computeLayout,
  computeLayoutBoundsForPath,
  flattenLeavesInOrder,
  flattenSubtreesPastDepth,
  getNodeAtPath,
  treeDepth,
  validateTree,
} from "./lib/tree";
import { makeAreaId } from "./lib/ids";
import type {
  AreaTree,
  Breakpoint,
  ResponsiveValue,
  WorkspaceProps,
} from "./types";

const DEFAULT_BREAKPOINTS = { mobile: 640, tablet: 1024 };
const DEFAULT_MIN_AREA_SIZE = { width: 120, height: 80 };
const DEFAULT_MAX_DEPTH: { mobile: number; tablet: number; desktop: number } = {
  mobile: 0,
  tablet: 3,
  desktop: 7,
};

function resolveResponsive<T>(
  value: ResponsiveValue<T> | undefined,
  breakpoint: Breakpoint,
  fallback: { mobile: T; tablet: T; desktop: T },
): T {
  if (value === undefined) return fallback[breakpoint];
  if (typeof value === "number" || typeof value === "string") {
    return value as T;
  }
  if (typeof value === "object" && value !== null) {
    const v = value as { mobile?: T; tablet?: T; desktop?: T };
    return v[breakpoint] ?? fallback[breakpoint];
  }
  return value as T;
}

function createInitialTree(defaultComponentId: string): AreaTree {
  return { kind: "leaf", id: makeAreaId(), componentId: defaultComponentId };
}

export function Workspace({
  components,
  defaultComponentId,
  layout,
  defaultLayout,
  onLayoutChange,
  presets,
  activePresetId: activePresetIdProp,
  onActivePresetChange,
  minAreaSize = DEFAULT_MIN_AREA_SIZE,
  maxSplitDepth,
  breakpoints = DEFAULT_BREAKPOINTS,
  cardStackItemHeight,
  onError,
  className,
  "aria-label": ariaLabel = "Workspace",
}: WorkspaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [{ tree, focusedAreaId }, dispatchInternal] = useReducer(reducer, null, () => ({
    tree: layout ?? defaultLayout ?? createInitialTree(defaultComponentId),
    focusedAreaId: null,
  }));

  // Sync controlled `layout` prop into reducer state by reference comparison.
  useEffect(() => {
    if (layout !== undefined && layout !== tree) {
      dispatchInternal({ type: "replace-tree", tree: layout });
    }
  }, [layout, tree]);

  // Fire onLayoutChange when tree changes (excluding initial mount).
  const onLayoutChangeRef = useRef(onLayoutChange);
  useEffect(() => {
    onLayoutChangeRef.current = onLayoutChange;
  }, [onLayoutChange]);
  const prevTreeRef = useRef(tree);
  useEffect(() => {
    if (prevTreeRef.current !== tree) {
      prevTreeRef.current = tree;
      onLayoutChangeRef.current?.(tree);
    }
  }, [tree]);

  const dispatch = useCallback<React.Dispatch<Action>>((action) => {
    dispatchInternal(action);
  }, []);

  // Active preset state — controlled if prop provided, otherwise internal.
  const [internalActivePresetId, setInternalActivePresetId] = useState<
    string | null
  >(presets && presets.length > 0 ? (presets[0]?.id ?? null) : null);
  const activePresetId =
    activePresetIdProp !== undefined
      ? activePresetIdProp
      : internalActivePresetId;

  const handlePresetChange = useCallback(
    (id: string) => {
      const preset = presets?.find((p) => p.id === id);
      if (!preset) return;
      dispatch({ type: "replace-tree", tree: preset.layout });
      if (activePresetIdProp === undefined) {
        setInternalActivePresetId(id);
      }
      onActivePresetChange?.(id);
    },
    [presets, dispatch, activePresetIdProp, onActivePresetChange],
  );

  // Validate tree once per change for unregistered component-ids etc.
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    const componentIds = components.map((c) => c.id);
    const result = validateTree(tree, componentIds);
    if (!result.valid) {
      console.error("[workspace] invalid tree:", result.errors);
      onErrorRef.current?.(result.errors);
    }
  }, [tree, components]);

  // Track breakpoint via ResizeObserver on canvas.
  const breakpoint = useBreakpoint(canvasRef, breakpoints);

  const cap = resolveResponsive(maxSplitDepth, breakpoint, DEFAULT_MAX_DEPTH);

  const renderedTree = useMemo(
    () =>
      cap >= treeDepth(tree)
        ? tree
        : flattenSubtreesPastDepth(tree, Math.max(0, cap)),
    [tree, cap],
  );

  const isStacked = breakpoint === "mobile";

  // Measure canvas to compute layout rects.
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setCanvasSize({ width: el.clientWidth, height: el.clientHeight });
    });
    observer.observe(el);
    setCanvasSize({ width: el.clientWidth, height: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  const { leaves, dividers } = useMemo(() => {
    if (isStacked || canvasSize.width === 0 || canvasSize.height === 0) {
      return { leaves: [], dividers: [] };
    }
    return computeLayout(
      renderedTree,
      { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height },
      { minSize: minAreaSize },
    );
  }, [renderedTree, canvasSize, isStacked, minAreaSize]);

  const stackedLeaves = useMemo(
    () => (isStacked ? flattenLeavesInOrder(tree) : []),
    [tree, isStacked],
  );

  const handleFocusChange = useCallback(
    (areaId: string | null) => {
      dispatch({ type: "focus", areaId });
    },
    [dispatch],
  );
  useAreaFocus(rootRef, handleFocusChange);

  const { dragState, beginCornerDrag } = useCornerGesture({
    rootRef: canvasRef,
    leaves,
    cap,
    breakpoint,
    dispatch,
    makeAreaId,
  });

  const { beginEdgeDrag, isResizing } = useEdgeGesture({
    rootRef: canvasRef,
    minAreaSize,
    dispatch,
  });

  const keyboard = useKeyboardActions({
    leaves,
    focusedAreaId,
    cap,
    dispatch,
    makeAreaId,
  });

  const handleCornerPointerDown = useCallback(
    (areaId: string, e: React.PointerEvent<HTMLDivElement>) => {
      beginCornerDrag(areaId, e.clientX, e.clientY, e.pointerId);
    },
    [beginCornerDrag],
  );

  const handleDividerPointerDown = useCallback(
    (
      splitPath: number[],
      e: React.PointerEvent<HTMLDivElement>,
    ) => {
      const node = getNodeAtPath(renderedTree, splitPath);
      if (node.kind !== "split") return;
      if (!canvasRef.current) return;
      const parentRect = computeLayoutBoundsForPath(
        renderedTree,
        splitPath,
        canvasSize,
        minAreaSize,
      );
      if (!parentRect) return;
      beginEdgeDrag(
        splitPath,
        node.orientation,
        parentRect,
        node.ratio,
        e.clientX,
        e.clientY,
        e.pointerId,
      );
    },
    [renderedTree, canvasSize, minAreaSize, beginEdgeDrag],
  );

  const handleAreaSelectComponent = useCallback(
    (areaId: string, componentId: string) => {
      dispatch({ type: "swap", areaId, componentId });
    },
    [dispatch],
  );

  const handleStackedSelectComponent = useCallback(
    (areaId: string, componentId: string) => {
      dispatch({ type: "swap", areaId, componentId });
    },
    [dispatch],
  );

  useResizeKeyboard({
    enabled: !isStacked,
    leaves,
    dividers,
    renderedTree,
    focusedAreaId,
    dispatch,
  });

  return (
    <div
      ref={rootRef}
      role="application"
      aria-label={ariaLabel}
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-md border border-border bg-background text-foreground",
        className,
      )}
    >
      {presets && presets.length > 0 ? (
        <PresetsTabs
          presets={presets}
          activePresetId={activePresetId}
          onChange={handlePresetChange}
        />
      ) : null}
      <div
        ref={canvasRef}
        className={cn(
          "relative flex-1 overflow-hidden",
          (isResizing || dragState !== null) && "select-none",
        )}
      >
        {isStacked ? (
          <CardStack
            leaves={stackedLeaves}
            components={components}
            itemHeight={cardStackItemHeight}
            onSelectComponent={handleStackedSelectComponent}
          />
        ) : (
          <>
            {leaves.map((leaf) => (
              <div
                key={leaf.areaId}
                className="absolute"
                style={{
                  left: leaf.x,
                  top: leaf.y,
                  width: leaf.width,
                  height: leaf.height,
                }}
              >
                <Area
                  areaId={leaf.areaId}
                  componentId={leaf.componentId}
                  components={components}
                  width={leaf.width}
                  height={leaf.height}
                  isFocused={focusedAreaId === leaf.areaId}
                  cornerInert={leaf.depth >= cap}
                  canSplit={leaf.depth < cap}
                  mergeOptions={{
                    left: keyboard.findNeighbor(leaf.areaId, "left") !== null,
                    right: keyboard.findNeighbor(leaf.areaId, "right") !== null,
                    up: keyboard.findNeighbor(leaf.areaId, "up") !== null,
                    down: keyboard.findNeighbor(leaf.areaId, "down") !== null,
                  }}
                  onCornerPointerDown={handleCornerPointerDown}
                  onSelectComponent={(componentId) =>
                    handleAreaSelectComponent(leaf.areaId, componentId)
                  }
                  onSplitVertical={() => {
                    if (focusedAreaId !== leaf.areaId) {
                      dispatch({ type: "focus", areaId: leaf.areaId });
                    }
                    if (leaf.depth < cap) {
                      dispatch({
                        type: "split",
                        areaId: leaf.areaId,
                        orientation: "vertical",
                        newAreaId: makeAreaId(),
                      });
                    }
                  }}
                  onSplitHorizontal={() => {
                    if (focusedAreaId !== leaf.areaId) {
                      dispatch({ type: "focus", areaId: leaf.areaId });
                    }
                    if (leaf.depth < cap) {
                      dispatch({
                        type: "split",
                        areaId: leaf.areaId,
                        orientation: "horizontal",
                        newAreaId: makeAreaId(),
                      });
                    }
                  }}
                  onMergeDirection={(dir) => {
                    if (focusedAreaId !== leaf.areaId) {
                      dispatch({ type: "focus", areaId: leaf.areaId });
                    }
                    const neighbor = keyboard.findNeighbor(leaf.areaId, dir);
                    if (neighbor) {
                      dispatch({
                        type: "merge",
                        survivorId: leaf.areaId,
                        absorbedId: neighbor.areaId,
                      });
                    }
                  }}
                  onAreaPointerDown={() =>
                    dispatch({ type: "focus", areaId: leaf.areaId })
                  }
                />
              </div>
            ))}
            {dividers.map((d) => {
              const node = getNodeAtPath(renderedTree, d.splitPath);
              const ratio = node.kind === "split" ? node.ratio : 0.5;
              return (
                <SplitDivider
                  key={d.splitPath.join("-")}
                  orientation={d.orientation}
                  x={d.x}
                  y={d.y}
                  length={d.length}
                  ratioPercent={ratio * 100}
                  onPointerDown={(e) => handleDividerPointerDown(d.splitPath, e)}
                  onKeyResize={(delta) => {
                    const currentNode = getNodeAtPath(renderedTree, d.splitPath);
                    if (currentNode.kind !== "split") return;
                    const next = Math.max(
                      0.05,
                      Math.min(
                        0.95,
                        currentNode.ratio +
                          keyboard.KEYBOARD_RESIZE_STEP * delta,
                      ),
                    );
                    dispatch({
                      type: "resize",
                      splitPath: d.splitPath,
                      ratio: next,
                    });
                  }}
                />
              );
            })}
            <DragOverlay dragState={dragState} leaves={leaves} />
          </>
        )}
      </div>
    </div>
  );
}

