"use client";

import {
  Crop,
  Palette,
  Sliders,
  Smile,
  Type,
  Wand,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditTool, StoryComposer01Labels } from "../types";

export interface ComposerToolbarProps {
  activeTool: EditTool | null;
  enabledTools: EditTool[];
  /** Tools that aren't shipped yet — render disabled. */
  pendingTools?: EditTool[];
  labels: Required<StoryComposer01Labels>;
  onSelect: (tool: EditTool | null) => void;
  className?: string;
}

interface ToolConfig {
  key: EditTool;
  icon: React.ComponentType<{ className?: string }>;
  label: (labels: Required<StoryComposer01Labels>) => string;
}

const TOOL_ORDER: ToolConfig[] = [
  { key: "text", icon: Type, label: (l) => l.toolText },
  { key: "draw", icon: Wand, label: (l) => l.toolDraw },
  { key: "stickers", icon: Smile, label: (l) => l.toolStickers },
  { key: "filters", icon: Palette, label: (l) => l.toolFilters },
  { key: "adjust", icon: Sliders, label: (l) => l.toolAdjust },
  { key: "crop", icon: Crop, label: (l) => l.toolCrop },
];

export function ComposerToolbar({
  activeTool,
  enabledTools,
  pendingTools = [],
  labels,
  onSelect,
  className,
}: ComposerToolbarProps) {
  const visible = TOOL_ORDER.filter((t) => enabledTools.includes(t.key));

  return (
    <div
      role="toolbar"
      aria-label="Edit tools"
      className={cn(
        "flex items-center justify-around gap-1 rounded-2xl",
        "bg-black/70 backdrop-blur-md px-1 py-1.5 text-white",
        className,
      )}
    >
      {visible.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.key;
        const isPending = pendingTools.includes(tool.key);
        return (
          <Button
            key={tool.key}
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            aria-pressed={isActive}
            aria-label={tool.label(labels)}
            onClick={() => onSelect(isActive ? null : tool.key)}
            className={cn(
              "flex flex-col items-center gap-0.5 h-auto px-2 py-1.5 text-[10px] text-white/80 hover:bg-white/10 hover:text-white",
              isActive && "text-white bg-white/15",
              isPending && "opacity-40",
            )}
          >
            <Icon className="size-5" />
            <span>{tool.label(labels)}</span>
          </Button>
        );
      })}
    </div>
  );
}
