"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WorkspacePreset } from "../types";

export function PresetsTabs({
  presets,
  activePresetId,
  onChange,
}: {
  presets: WorkspacePreset[];
  activePresetId: string | null;
  onChange: (id: string) => void;
}) {
  if (presets.length === 0) return null;
  return (
    <div className="flex items-center border-b border-border bg-background px-2 py-1.5">
      <Tabs
        value={activePresetId ?? presets[0]?.id}
        onValueChange={onChange}
      >
        <TabsList className="h-7">
          {presets.map((preset) => (
            <TabsTrigger
              key={preset.id}
              value={preset.id}
              className="h-6 px-2.5 text-xs"
            >
              {preset.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
