"use client";

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FlatFieldValue, MetaRenderer } from "../types";
import { MetaEditList } from "./meta-edit";
import type { EditDispatchers, EditValidators } from "./card";

function format(v: FlatFieldValue) {
  if (v === null) return "—";
  return String(v);
}

export function MetaPopover({
  meta,
  cardId,
  editable,
  metaRenderers,
  dispatchers,
  validators,
  className,
}: {
  meta: Record<string, FlatFieldValue>;
  cardId: string;
  editable: boolean;
  metaRenderers?: Record<string, MetaRenderer>;
  dispatchers?: EditDispatchers;
  validators?: EditValidators;
  className?: string;
}) {
  const entries = Object.entries(meta);
  if (entries.length === 0 && !editable) return null;

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
        className="w-72 p-3"
      >
        {editable && dispatchers && validators ? (
          <MetaEditList
            meta={meta}
            cardId={cardId}
            metaRenderers={metaRenderers}
            onEdit={(k, v) => dispatchers.metaEdit(cardId, k, v)}
            onAdd={(k, v) => dispatchers.metaAdd(cardId, k, v)}
            onRemove={(k) => dispatchers.metaRemove(cardId, k)}
            validateAdd={(k, v) => validators.metaAdd(cardId, k, v)}
            validateEdit={(k, v) => validators.metaEdit(cardId, k, v)}
          />
        ) : (
          <>
            <p className="mb-2 text-xs font-mono uppercase tracking-wide text-muted-foreground">
              Meta
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              {entries.map(([k, v]) => {
                const renderer = metaRenderers?.[k];
                return (
                  <div key={k} className="contents">
                    <dt className="truncate font-mono text-xs text-muted-foreground">
                      {k}
                    </dt>
                    <dd className="min-w-0 wrap-break-word">
                      {renderer ? renderer(v, { cardId, metaKey: k }) : format(v)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
