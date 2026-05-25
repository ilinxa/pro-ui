"use client";

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AreaContextContext } from "../hooks/use-area-context";
import { ComponentPicker } from "./component-picker";
import type { AreaTreeLeaf, WorkspaceComponent } from "../types";

const DEFAULT_STACK_CARD_HEIGHT = 320;

export function CardStack({
  leaves,
  components,
  onSelectComponent,
  itemHeight = DEFAULT_STACK_CARD_HEIGHT,
}: {
  leaves: AreaTreeLeaf[];
  components: WorkspaceComponent[];
  onSelectComponent: (areaId: string, componentId: string) => void;
  itemHeight?: number;
}) {
  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col gap-3 p-3">
        {leaves.map((leaf) => (
          <StackedCard
            key={leaf.id}
            leaf={leaf}
            components={components}
            itemHeight={itemHeight}
            onSelectComponent={(componentId) =>
              onSelectComponent(leaf.id, componentId)
            }
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function StackedCard({
  leaf,
  components,
  itemHeight,
  onSelectComponent,
}: {
  leaf: AreaTreeLeaf;
  components: WorkspaceComponent[];
  itemHeight: number;
  onSelectComponent: (componentId: string) => void;
}) {
  const component = components.find((c) => c.id === leaf.componentId);
  const ctx = useMemo(
    () => ({
      areaId: leaf.id,
      width: 0,
      height: itemHeight,
      isFocused: false,
    }),
    [leaf.id, itemHeight],
  );
  return (
    <div
      data-area-id={leaf.id}
      role="region"
      aria-label={component?.name ?? "Area"}
      className="overflow-hidden rounded-md border border-border bg-card"
    >
      <div className="flex h-7 items-center justify-between border-b border-border bg-card px-2">
        <ComponentPicker
          components={components}
          currentId={leaf.componentId}
          onSelect={onSelectComponent}
        />
      </div>
      <div
        className="relative overflow-hidden"
        style={{ height: itemHeight }}
      >
        <AreaContextContext.Provider value={ctx}>
          <ScrollArea className="h-full w-full">
            <div className="h-full w-full">
              {component ? (
                component.render()
              ) : (
                <div className="flex h-full w-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
                  Component &quot;{leaf.componentId}&quot; not registered
                </div>
              )}
            </div>
          </ScrollArea>
        </AreaContextContext.Provider>
      </div>
    </div>
  );
}
