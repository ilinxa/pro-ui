"use client";

/**
 * Per plan §8.4: empty SVG overlay scaffolding. v0.1 mounts the layer
 * so v0.4 (hulls + group-involving edges) and v0.6 (multi-edge badges)
 * have a stable mount point that doesn't require a parent restructure.
 *
 * The overlay sits on top of the Sigma canvas in DOM order; pointer
 * events pass through (`pointer-events: none`) so Sigma owns
 * interaction. v0.4 will selectively re-enable pointer events on hull
 * shapes when click-to-select-group lands.
 */
export function SvgOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {/* Hulls land in v0.4, group-involving edges in v0.4,
          multi-edge badges in v0.6. */}
    </svg>
  );
}
