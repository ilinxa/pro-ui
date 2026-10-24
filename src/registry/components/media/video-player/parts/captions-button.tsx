"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import { Captions } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVideoPlayer } from "./video-player-context";

const ROUND = "h-8 w-8 rounded-full bg-background/70 hover:bg-background/90";

export function VideoPlayerCaptionsButton({ className }: { className?: string }) {
  const { state, labels, setMenuOpen } = useVideoPlayer();
  const { tracks, activeTrack, setActiveTrack } = state;

  const menuId = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Click outside closes — listener only exists while open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const wrap = wrapRef.current;
      if (wrap && e.target instanceof Node && !wrap.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // The overlay must not auto-hide under an open menu.
  useEffect(() => {
    setMenuOpen(open);
    return () => setMenuOpen(false);
  }, [open, setMenuOpen]);

  // Opening moves focus to the checked item.
  useEffect(() => {
    if (!open) return;
    const checked = activeTrack === null ? 0 : activeTrack + 1;
    itemRefs.current[checked]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus only on open, not on every selection change
  }, [open]);

  if (tracks.length === 0) return null;

  if (tracks.length === 1) {
    const on = activeTrack === 0;
    return (
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className={cn(ROUND, className)}
        aria-pressed={on}
        aria-label={labels.captions}
        onClick={() => setActiveTrack(on ? null : 0)}
      >
        <Captions className="h-4 w-4" aria-hidden="true" />
      </Button>
    );
  }

  const itemCount = tracks.length + 1;

  const focusItem = (index: number) => {
    const n = ((index % itemCount) + itemCount) % itemCount;
    itemRefs.current[n]?.focus();
  };

  const choose = (index: number | null) => {
    setActiveTrack(index);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusItem(current + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusItem(current - 1);
        break;
      case "Home":
        e.preventDefault();
        focusItem(0);
        break;
      case "End":
        e.preventDefault();
        focusItem(itemCount - 1);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  };

  const onWrapBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!open) return;
    const next = e.relatedTarget;
    if (next instanceof Node && wrapRef.current?.contains(next)) return;
    if (next === null) return; // focus left the document or went to a non-focusable spot; pointerdown handles outside clicks
    setOpen(false);
  };

  const itemClass =
    "flex w-full items-center rounded-sm px-2 py-1.5 text-start text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground aria-checked:font-medium";

  return (
    <div ref={wrapRef} className="relative" onBlur={onWrapBlur}>
      <Button
        ref={triggerRef}
        type="button"
        variant="secondary"
        size="icon"
        className={cn(ROUND, className)}
        aria-label={labels.captionsMenu}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <Captions className="h-4 w-4" aria-hidden="true" />
      </Button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={labels.captionsMenu}
          onKeyDown={onMenuKeyDown}
          className="absolute bottom-full end-0 mb-2 min-w-36 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <button
            ref={(el) => {
              itemRefs.current[0] = el;
            }}
            type="button"
            role="menuitemradio"
            aria-checked={activeTrack === null}
            tabIndex={-1}
            className={itemClass}
            onClick={() => choose(null)}
          >
            {labels.captionsOff}
          </button>
          {tracks.map((track, i) => (
            <button
              key={`${track.srcLang}-${track.src}`}
              ref={(el) => {
                itemRefs.current[i + 1] = el;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={activeTrack === i}
              tabIndex={-1}
              className={itemClass}
              onClick={() => choose(i)}
            >
              {track.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
