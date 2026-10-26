"use client";

import type { EntityLike, KindMeta } from "../types";
import { Chip } from "./chip";

interface ChipClusterProps<T extends EntityLike> {
  value: T[];
  kinds: Record<string, KindMeta> | undefined;
  showKindBadges: boolean;
  onRemove: (id: string) => void;
  removeChipLabel: (label: string) => string;
  disabled?: boolean;
}

export function ChipCluster<T extends EntityLike>({
  value,
  kinds,
  showKindBadges,
  onRemove,
  removeChipLabel,
  disabled,
}: ChipClusterProps<T>) {
  if (value.length === 0) return null;
  // F-cross-13 shape: paints above the field's trigger-button overlay
  // (`relative`) but stays click-transparent (`pointer-events-none`) so field
  // clicks fall through; only each chip's remove <button> re-enables pointers.
  return (
    <div className="pointer-events-none relative flex flex-1 flex-wrap items-center gap-1">
      {value.map((entity) => (
        <Chip
          key={entity.id}
          entity={entity}
          kindMeta={entity.kind ? kinds?.[entity.kind] : undefined}
          showKind={showKindBadges}
          onRemove={() => onRemove(entity.id)}
          removeLabel={removeChipLabel(entity.label)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
