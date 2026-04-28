import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PREDEFINED_KEYS,
  type PredefinedKey,
} from "../types";
import type { RichCardPredefinedEntry } from "../lib/parse";

/**
 * Default-shape value for a freshly-added predefined-key entry.
 * The user is auto-entered into the predefined editor immediately after add
 * so they can fill in real content.
 */
function defaultEntry(key: PredefinedKey): RichCardPredefinedEntry {
  switch (key) {
    case "codearea":
      return { key: "codearea", value: { format: "text", content: "" } };
    case "image":
      return { key: "image", value: { src: "", alt: "" } };
    case "table":
      return {
        key: "table",
        value: { headers: ["col"], rows: [[""]] },
      };
    case "quote":
      return { key: "quote", value: "" };
    case "list":
      return { key: "list", value: [""] };
  }
}

/**
 * Hover-revealed "+ block" button → menu listing predefined keys not yet
 * present on this card and not in `disabledPredefinedKeys`.
 */
export function PredefinedAddMenu({
  presentKeys,
  disabledKeys,
  onAdd,
}: {
  presentKeys: readonly PredefinedKey[];
  disabledKeys: readonly PredefinedKey[];
  onAdd: (entry: RichCardPredefinedEntry) => void;
}) {
  const available = PREDEFINED_KEYS.filter(
    (k) => !presentKeys.includes(k) && !disabledKeys.includes(k),
  );
  if (available.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/70 bg-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Plus className="size-3" aria-hidden="true" />
        block
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="w-44 p-1">
        <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Add block
        </p>
        {available.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onAdd(defaultEntry(k))}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left font-mono text-[12px] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted"
          >
            {k}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
