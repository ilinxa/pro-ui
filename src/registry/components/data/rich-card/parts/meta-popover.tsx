import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FlatFieldValue } from "../types";

function format(v: FlatFieldValue) {
  if (v === null) return "—";
  return String(v);
}

export function MetaPopover({
  meta,
  className,
}: {
  meta: Record<string, FlatFieldValue>;
  className?: string;
}) {
  const entries = Object.entries(meta);
  if (entries.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        aria-label="Show meta information"
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-72 p-3 text-sm"
      >
        <p className="mb-2 text-xs font-mono uppercase tracking-wide text-muted-foreground">
          Meta
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          {entries.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="truncate font-mono text-xs text-muted-foreground">
                {k}
              </dt>
              <dd className="min-w-0 wrap-break-word">{format(v)}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}
