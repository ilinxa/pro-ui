"use client";

import { useState } from "react";
import { Image as ImageIcon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBlackboard } from "../hooks/use-blackboard";

export interface BlackboardBackgroundEditorProps {
  className?: string;
}

const BOARD_COLORS = [
  "oklch(0.18 0.04 250)", // navy (default)
  "oklch(0.20 0.02 160)", // green slate
  "oklch(0.17 0.01 20)", // charcoal
  "oklch(0.19 0.03 300)", // plum
];

/**
 * Opt-in board theming control (top-left). Renders nothing unless `editableBackground`.
 * Inline panel (no Popover primitive — avoids the Base-UI divergence surface for an
 * opt-in affordance). Sets a solid color or a custom image URL via context.
 */
export function BlackboardBackgroundEditor({ className }: BlackboardBackgroundEditorProps) {
  const ctx = useBlackboard();
  const [open, setOpen] = useState(false);
  if (!ctx.editableBackground) return null;

  const bg = ctx.background;
  return (
    <div className={cn("absolute left-2 top-2 z-20", className)}>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={ctx.labels.backgroundLabel}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="text-white/70 hover:bg-white/10 hover:text-white"
      >
        <Palette aria-hidden />
      </Button>
      {open ? (
        <div
          role="dialog"
          aria-label={ctx.labels.backgroundLabel}
          className="absolute left-0 top-9 w-60 rounded-lg border border-white/10 bg-[oklch(0.22_0.02_250)] p-3 text-white shadow-xl"
        >
          <div className="mb-2 text-xs font-medium text-white/60">{ctx.labels.backgroundColor}</div>
          <div className="flex gap-1.5">
            {BOARD_COLORS.map((c) => {
              const selected = bg.kind === "color" && bg.value === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => ctx.setBackground({ kind: "color", value: c })}
                  className={cn(
                    "size-6 rounded-full ring-1 ring-white/15 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                    selected && "ring-2 ring-white/70",
                  )}
                  style={{ backgroundColor: c }}
                />
              );
            })}
          </div>
          <div className="mt-3 mb-1 flex items-center gap-1 text-xs font-medium text-white/60">
            <ImageIcon className="size-3" aria-hidden />
            {ctx.labels.backgroundImage}
          </div>
          <input
            type="url"
            placeholder={ctx.labels.backgroundImageUrl}
            defaultValue={bg.kind === "image" ? bg.url : ""}
            onChange={(e) => {
              const url = e.target.value.trim();
              if (url) ctx.setBackground({ kind: "image", url, overlay: 0.45 });
            }}
            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
      ) : null}
    </div>
  );
}
