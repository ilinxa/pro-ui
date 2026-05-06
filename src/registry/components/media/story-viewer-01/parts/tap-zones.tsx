export interface TapZonesProps {
  onPrev: () => void;
  onTogglePause: () => void;
  onNext: () => void;
}

/**
 * Three full-height columns (1/3 each) over the item content:
 * - left = previous item
 * - middle = pause toggle
 * - right = next item
 *
 * Lives at z-10 so the header (z-20) and nav arrows (z-20) remain clickable.
 * `tabIndex={-1}` because tap zones are touch affordances; keyboard users
 * use the arrow-key handlers instead.
 */
export function TapZones({ onPrev, onTogglePause, onNext }: TapZonesProps) {
  return (
    <div className="absolute inset-0 z-10 flex" aria-hidden="true">
      <button
        type="button"
        className="h-full w-1/3 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        tabIndex={-1}
      />
      <button
        type="button"
        className="h-full w-1/3 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePause();
        }}
        tabIndex={-1}
      />
      <button
        type="button"
        className="h-full w-1/3 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        tabIndex={-1}
      />
    </div>
  );
}
