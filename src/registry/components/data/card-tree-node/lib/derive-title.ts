// F-S1 lock — RELATIVE import for cross-procomp types. Same-category alias
// imports get the slug name substituted by shadcn's rewriter; relative paths
// bypass that and translate verbatim.
import type { CardTreeJsonNode } from "../../card-tree/types";

// Skip these keys when scanning for the title fallback.
const RESERVED_PREFIX = "__rc"; // __rcid / __rcorder / __rcmeta
const SKIP_KEYS = new Set(["__type", "ports"]);

/**
 * Derive a viewer title from a card-tree tree.
 *
 * Order of precedence (per plan §5.5):
 *  1. `data.title` if it's a non-empty string.
 *  2. The first non-reserved string flat field by `Object.entries` order.
 *  3. `undefined` (caller renders a neutral placeholder, e.g. "Untitled card-tree").
 */
export function deriveTitle(data: CardTreeJsonNode): string | undefined {
  const t = data.title;
  if (typeof t === "string" && t.length > 0) return t;

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith(RESERVED_PREFIX)) continue;
    if (SKIP_KEYS.has(key)) continue;
    if (typeof value === "string" && value.length > 0) return value;
  }

  return undefined;
}
