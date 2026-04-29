import { ToolbarButton } from "./toolbar-button";
import { cn } from "@/lib/utils";
import type { ToolbarCtx, ToolbarItem } from "../types";

interface ToolbarProps {
  items: ReadonlyArray<ToolbarItem>;
  ctx: ToolbarCtx;
  disabled?: boolean;
  className?: string;
}

function isSeparator(item: ToolbarItem): boolean {
  return item.id.startsWith("sep");
}

export function Toolbar({ items, ctx, disabled, className }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Markdown editor toolbar"
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-border bg-card px-2 py-1.5",
        className,
      )}
    >
      {items.map((item) =>
        isSeparator(item) ? (
          <span
            key={item.id}
            aria-hidden
            className="mx-1 inline-block h-5 w-px bg-border"
          />
        ) : (
          <ToolbarButton key={item.id} item={item} ctx={ctx} disabled={disabled} />
        ),
      )}
    </div>
  );
}
