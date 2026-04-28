import { cn } from "@/lib/utils";
import type { FlatFieldValue, MetaRenderer } from "../types";

function format(v: FlatFieldValue) {
  if (v === null) return "—";
  return String(v);
}

export function MetaInline({
  meta,
  metaRenderers,
  className,
}: {
  meta: Record<string, FlatFieldValue>;
  metaRenderers?: Record<string, MetaRenderer>;
  className?: string;
}) {
  const entries = Object.entries(meta);
  if (entries.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 truncate font-mono text-[10px] text-muted-foreground",
        className,
      )}
    >
      {entries.map(([k, v], i) => {
        const renderer = metaRenderers?.[k];
        return (
          <span key={k} className="inline-flex items-center gap-1">
            {i > 0 ? (
              <span aria-hidden="true" className="opacity-60">
                ·
              </span>
            ) : null}
            <span className="text-foreground/50">{k}</span>
            {renderer ? renderer(v, { cardId: "", metaKey: k }) : <span>{format(v)}</span>}
          </span>
        );
      })}
    </div>
  );
}
