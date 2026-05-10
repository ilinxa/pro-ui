"use client";

import { LayoutGrid, List } from "lucide-react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerViewToggle() {
  const { actions, state, labels } = useFileManager();
  return (
    <ToggleGroup
      type="single"
      value={state.viewMode}
      onValueChange={(v) => {
        if (v === "grid" || v === "list") actions.setViewMode(v);
      }}
      className="shrink-0"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="grid"
            aria-label={labels.viewGrid}
            className="size-7"
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>{labels.viewGrid}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="list"
            aria-label={labels.viewList}
            className="size-7"
          >
            <List className="size-4" aria-hidden="true" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>{labels.viewList}</TooltipContent>
      </Tooltip>
    </ToggleGroup>
  );
}
