import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PREDEFINED_KEYS,
  type CustomPredefinedKey,
  type PredefinedKey,
} from "../types";
import type { CardTreeCustomEntry, CardTreePredefinedEntry } from "../lib/parse";
import { HostRenderBoundary } from "./predefined-custom";

/**
 * Default-shape value for a freshly-added predefined-key entry.
 * The user is auto-entered into the predefined editor immediately after add
 * so they can fill in real content.
 */
function defaultEntry(key: PredefinedKey): CardTreePredefinedEntry {
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
 * Default-shape value for a freshly-added CUSTOM predefined-key entry (v0.6).
 * `defaultValue()` is host code and may throw — degrade to `null` rather
 * than blocking the add.
 */
function defaultCustomEntry(registration: CustomPredefinedKey): CardTreeCustomEntry {
  let value: unknown;
  try {
    value = registration.defaultValue();
  } catch {
    value = null;
  }
  return { key: registration.key, custom: true, value };
}

/**
 * Hover-revealed "+ block" button → menu listing predefined keys (built-in +
 * registered custom, v0.6) not yet present on this card and not in
 * `disabledPredefinedKeys` (built-ins only — custom keys have no disable
 * switch).
 */
export function PredefinedAddMenu({
  presentKeys,
  disabledKeys,
  customKeys,
  onAdd,
}: {
  presentKeys: readonly (PredefinedKey | string)[];
  disabledKeys: readonly PredefinedKey[];
  customKeys: readonly CustomPredefinedKey[];
  onAdd: (entry: CardTreePredefinedEntry) => void;
}) {
  const available = PREDEFINED_KEYS.filter(
    (k) => !presentKeys.includes(k) && !disabledKeys.includes(k),
  );
  const availableCustom = customKeys.filter(
    (reg) => !presentKeys.includes(reg.key),
  );
  if (available.length === 0 && availableCustom.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/70 bg-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Plus className="size-3" aria-hidden="true" />
        block
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="w-44 p-1">
        {available.length > 0 ? (
          <>
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
          </>
        ) : null}
        {availableCustom.length > 0 ? (
          <>
            <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Custom
            </p>
            {availableCustom.map((reg) => (
              <button
                key={reg.key}
                type="button"
                onClick={() => onAdd(defaultCustomEntry(reg))}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left font-mono text-[12px] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted"
              >
                {reg.icon ? (
                  <span className="shrink-0 text-muted-foreground" aria-hidden="true">
                    {/* Host-supplied node — a throwing icon must not take the
                        add-menu (or the tree) down with it. */}
                    <HostRenderBoundary fallback={null}>
                      {reg.icon}
                    </HostRenderBoundary>
                  </span>
                ) : null}
                <span className="flex-1 truncate">{reg.description ?? reg.key}</span>
                {reg.category ? (
                  <span className="shrink-0 rounded-sm bg-muted px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {reg.category}
                  </span>
                ) : null}
              </button>
            ))}
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
