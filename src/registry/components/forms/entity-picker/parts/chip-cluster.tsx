"use client";

import type { EntityLike, KindMeta } from "../types";
import { Chip } from "./chip";

interface ChipClusterProps<T extends EntityLike> {
  value: T[];
  kinds: Record<string, KindMeta> | undefined;
  showKindBadges: boolean;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function ChipCluster<T extends EntityLike>({
  value,
  kinds,
  showKindBadges,
  onRemove,
  disabled,
}: ChipClusterProps<T>) {
  if (value.length === 0) return null;
  return (
    <div className="flex flex-1 flex-wrap items-center gap-1">
      {value.map((entity) => (
        <Chip
          key={entity.id}
          entity={entity}
          kindMeta={entity.kind ? kinds?.[entity.kind] : undefined}
          showKind={showKindBadges}
          onRemove={() => onRemove(entity.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
