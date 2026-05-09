import type { ReactNode } from "react";
import type { GridLayoutItemSlot } from "../types";

/**
 * The main column's "tower" of cards: 1 large card on top, 2-up medium row,
 * then a 3-up grid of remaining medium cards. The descending-density
 * pattern is the magazine intuition baked in.
 *
 * If there are 1 or 2 items, the layout adapts: one item = just the large;
 * two items = large + a single medium row.
 */
export function MagazineTower<T>({
  items,
  renderItem,
}: {
  items: T[];
  /** Same object-shape signature as the parent component's `renderItem` prop. */
  renderItem: (args: { item: T; slot: GridLayoutItemSlot; index: number }) => ReactNode;
}) {
  if (items.length === 0) return null;

  const lead = items[0];
  const twoUp = items.slice(1, 3);
  const rest = items.slice(3);

  return (
    <div className="space-y-8">
      {renderItem({ item: lead, slot: "large", index: 0 })}

      {twoUp.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {twoUp.map((item, i) => (
            <div key={i}>{renderItem({ item, slot: "medium", index: i + 1 })}</div>
          ))}
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((item, i) => (
            <div key={i}>{renderItem({ item, slot: "medium", index: i + 3 })}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
