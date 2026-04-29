import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ViewMode } from "../types";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as ViewMode)}
      className={cn("w-fit shrink-0", className)}
    >
      <TabsList variant="line" className="h-7 gap-0.5">
        <TabsTrigger value="edit" className="px-2 text-xs">
          Edit
        </TabsTrigger>
        <TabsTrigger value="split" className="px-2 text-xs">
          Split
        </TabsTrigger>
        <TabsTrigger value="preview" className="px-2 text-xs">
          Preview
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
