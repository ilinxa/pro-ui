import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Default empty-tree placeholder shown when the root has been removed
 * (allowRootRemoval={true} + onRootRemoved returned null).
 *
 * Hosts can override this entirely via the emptyTreeRenderer prop.
 */
export function EmptyTreePlaceholder({
  onAddRoot,
  className,
}: {
  onAddRoot?: () => void;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">Tree is empty.</p>
      {onAddRoot ? (
        <button
          type="button"
          onClick={onAddRoot}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-card px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-3" aria-hidden="true" />
          add root card
        </button>
      ) : null}
    </div>
  );
}
