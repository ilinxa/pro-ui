import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailPanelEmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function DetailPanelEmptyState({
  title = "Nothing selected",
  description = "Select an item to view details.",
  className,
}: DetailPanelEmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex h-full flex-col items-center justify-center gap-2 p-6 text-center",
        className,
      )}
    >
      <Info aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
