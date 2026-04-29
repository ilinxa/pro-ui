"use client";

import type { ReactNode } from "react";
import { CommandItem } from "@/components/ui/command";
import type { EntityLike, KindMeta } from "../types";
import { KindBadge } from "./kind-badge";

interface ResultRowProps<T extends EntityLike> {
  item: T;
  selected: boolean;
  kindMeta: KindMeta | undefined;
  showKindBadges: boolean;
  onSelect: () => void;
  customRender?: ReactNode;
}

export function ResultRow<T extends EntityLike>({
  item,
  selected,
  kindMeta,
  showKindBadges,
  onSelect,
  customRender,
}: ResultRowProps<T>) {
  return (
    <CommandItem
      value={item.id}
      onSelect={onSelect}
      data-checked={selected ? "true" : undefined}
      aria-selected={selected || undefined}
      className="flex items-center gap-2"
    >
      {customRender ?? (
        <>
          {showKindBadges && item.kind ? (
            <KindBadge kindKey={item.kind} meta={kindMeta} />
          ) : null}
          <span className="truncate">{item.label}</span>
        </>
      )}
    </CommandItem>
  );
}
