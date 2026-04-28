"use client";

import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { AreaBody } from "./area-body";
import { AreaHeader } from "./area-header";
import { CornerHandle } from "./corner-handle";
import type { AreaContext, WorkspaceComponent } from "../types";

export function Area({
  areaId,
  componentId,
  components,
  width,
  height,
  isFocused,
  cornerInert,
  canSplit,
  mergeOptions,
  onCornerPointerDown,
  onSelectComponent,
  onSplitVertical,
  onSplitHorizontal,
  onMergeDirection,
  onAreaPointerDown,
}: {
  areaId: string;
  componentId: string;
  components: WorkspaceComponent[];
  width: number;
  height: number;
  isFocused: boolean;
  cornerInert: boolean;
  canSplit: boolean;
  mergeOptions: { left: boolean; right: boolean; up: boolean; down: boolean };
  onCornerPointerDown: (
    areaId: string,
    e: React.PointerEvent<HTMLDivElement>,
  ) => void;
  onSelectComponent: (componentId: string) => void;
  onSplitVertical: () => void;
  onSplitHorizontal: () => void;
  onMergeDirection: (direction: "left" | "right" | "up" | "down") => void;
  onAreaPointerDown: () => void;
}) {
  const component = components.find((c) => c.id === componentId);
  const headerHeight = 28;

  const ctx = useMemo<AreaContext>(
    () => ({
      areaId,
      width,
      height: Math.max(0, height - headerHeight),
      isFocused,
    }),
    [areaId, width, height, isFocused, headerHeight],
  );

  const handleCornerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      onCornerPointerDown(areaId, e);
    },
    [areaId, onCornerPointerDown],
  );

  return (
    <div
      data-area-id={areaId}
      tabIndex={0}
      role="region"
      aria-label={component?.name ?? "Area"}
      onPointerDownCapture={onAreaPointerDown}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-md border border-border bg-card",
        isFocused && "ring-1 ring-primary/40",
      )}
      style={{ width: "100%", height: "100%" }}
    >
      <AreaHeader
        components={components}
        currentId={componentId}
        onSelectComponent={onSelectComponent}
        onSplitVertical={onSplitVertical}
        onSplitHorizontal={onSplitHorizontal}
        onMergeDirection={onMergeDirection}
        canSplit={canSplit}
        mergeOptions={mergeOptions}
      />
      <div className="relative flex-1 overflow-hidden">
        <AreaBody ctx={ctx}>
          {component ? (
            component.render()
          ) : (
            <div className="flex h-full w-full items-center justify-center p-6 text-center">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Component &quot;{componentId}&quot; not registered
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use the dropdown to pick one from the registry.
                </p>
              </div>
            </div>
          )}
        </AreaBody>
      </div>
      <CornerHandle position="tl" disabled={cornerInert} onPointerDown={handleCornerDown} />
      <CornerHandle position="tr" disabled={cornerInert} onPointerDown={handleCornerDown} />
      <CornerHandle position="bl" disabled={cornerInert} onPointerDown={handleCornerDown} />
      <CornerHandle position="br" disabled={cornerInert} onPointerDown={handleCornerDown} />
    </div>
  );
}
