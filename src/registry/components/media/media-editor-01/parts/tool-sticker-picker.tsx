"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { StickerOption, StickerSet } from "../types";

export interface ToolStickerPickerProps {
  sets: StickerSet[];
  onPick: (sticker: StickerOption) => void;
  className?: string;
}

/**
 * Bottom-sheet sticker picker. Top row of category tabs + scrollable grid
 * of stickers from the active set. Tap a sticker → consumer adds it to
 * the stage (center) and selects it for transformer manipulation.
 */
export function ToolStickerPicker({
  sets,
  onPick,
  className,
}: ToolStickerPickerProps) {
  const [activeSetId, setActiveSetId] = useState(sets[0]?.id ?? "");
  const activeSet = sets.find((s) => s.id === activeSetId) ?? sets[0];

  if (!activeSet) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl bg-black/70 backdrop-blur-md p-3 text-white",
        className,
      )}
    >
      {/* Category tabs */}
      {sets.length > 1 ? (
        <div className="flex items-center gap-1 overflow-x-auto">
          {sets.map((set) => {
            const isActive = set.id === activeSet.id;
            return (
              <button
                key={set.id}
                type="button"
                onClick={() => setActiveSetId(set.id)}
                aria-pressed={isActive}
                className={cn(
                  "flex-none rounded-full px-3 py-1 text-[10px] font-medium tracking-wider uppercase transition-colors",
                  isActive
                    ? "bg-white text-black"
                    : "text-white/70 hover:text-white hover:bg-white/10",
                )}
              >
                {set.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Sticker grid — capped at ~3 rows so the panel doesn't take the whole screen */}
      <div
        className={cn(
          "grid grid-cols-6 gap-2 overflow-y-auto",
          "max-h-[40dvh] sm:max-h-44",
        )}
      >
        {activeSet.stickers.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            onClick={() => onPick(sticker)}
            aria-label={sticker.alt}
            className="aspect-square rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 transition-transform p-1 grid place-items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sticker.src}
              alt={sticker.alt}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
