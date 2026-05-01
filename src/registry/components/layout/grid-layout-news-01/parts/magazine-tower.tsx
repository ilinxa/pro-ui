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
  renderItem: (item: T, slot: GridLayoutItemSlot) => ReactNode;
}) {
  if (items.length === 0) return null;

  const lead = items[0];
  const twoUp = items.slice(1, 3);
  const rest = items.slice(3);

  return (
    <div className="space-y-8">
      {renderItem(lead, "large")}

      {twoUp.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {twoUp.map((item, i) => (
            <div key={i}>{renderItem(item, "medium")}</div>
          ))}
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((item, i) => (
            <div key={i}>{renderItem(item, "medium")}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
