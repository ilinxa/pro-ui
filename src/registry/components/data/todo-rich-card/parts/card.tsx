"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react"; // useEffect for focus + state hooks
import { Palette, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCardContext } from "../hooks/use-card-context";
import { computeElapsed, resolveBorderColor } from "../lib/color-engine";
import { fromDataTransfer, serialize } from "../lib/json-io";
import { TODO_CLIPBOARD_MIME, type TodoNode } from "../types";
import { CardBody } from "./card-body";
import { CardHeader } from "./card-header";
import { EditInline } from "./edit-inline";
import { EditPopup } from "./edit-popup";

const PALETTE_SWATCHES = [
  "oklch(0.78 0.18 142)", // green
  "oklch(0.78 0.18 90)",  // yellow-green
  "oklch(0.78 0.18 50)",  // amber
  "oklch(0.70 0.20 25)",  // red
  "oklch(0.78 0.18 250)", // blue
  "oklch(0.78 0.18 290)", // violet
  "oklch(0.78 0.18 310)", // pink
  "oklch(0.45 0.02 250)", // graphite
];

export function Card({ node }: { node: TodoNode }) {
  const ctx = useCardContext();
  const perms = ctx.resolvePermissions(node);
  const isInlineActive =
    ctx.editState.kind === "inline" && ctx.editState.itemId === node.item.id;

  // Subscribe to context tick (referenced for memo dep — drives re-render on interval).
  void ctx.tick;
  // Recompute per render — cheap. Border color is rendered immediately; if
  // SSR + non-frozen `now` produces a hydration warning, the consumer can
  // either pass a frozen `now` (recommended) or accept the warning. The
  // article element below sets `suppressHydrationWarning` to mute it
  // gracefully (plan §5.5 / §11 trade-off — avoids the cascading-render lint
  // hit from a mount-state pattern).
  const elapsed = computeElapsed(node.item, ctx.now());
  const computedBorder = resolveBorderColor(node.item, elapsed, ctx.ramp);

  const style: CSSProperties = computedBorder
    ? { borderColor: computedBorder, transition: "border-color 0.4s ease" }
    : {};

  /* ───────── focus management ───────── */

  const articleRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (ctx.focusedId === node.item.id) {
      articleRef.current?.focus();
    }
  }, [ctx.focusedId, node.item.id]);

  /* ───────── DnD ───────── */

  const [isDragging, setIsDragging] = useState(false);

  function handleDragStart(e: React.DragEvent) {
    if (!perms.drag) {
      e.preventDefault();
      ctx.reportPermissionDenied("drag", node.item.id, perms.reason);
      return;
    }
    const payload = serialize(node.item);
    e.dataTransfer.setData(TODO_CLIPBOARD_MIME, payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "copy";
    setIsDragging(true);
    ctx.fireEvent("copy", { itemId: node.item.id, payload: node.item });
  }

  function handleDragEnd() {
    setIsDragging(false);
  }

  /* ───────── color override dialog ───────── */

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorInput, setColorInput] = useState(node.item.borderColor ?? "");

  function applyColor(next: string | null) {
    if (!perms.overrideColor) {
      ctx.reportPermissionDenied("overrideColor", node.item.id, perms.reason);
      return;
    }
    const oldColor = node.item.borderColor;
    ctx.dispatch({ type: "set-border-color", itemId: node.item.id, color: next });
    ctx.fireEvent("colorOverridden", {
      itemId: node.item.id,
      oldColor,
      newColor: next ?? undefined,
    });
    setColorPickerOpen(false);
  }

  /* ───────── children DnD drop ───────── */

  const [isDropTarget, setIsDropTarget] = useState(false);
  function handleDragOver(e: React.DragEvent) {
    if (!perms.addChildren) return;
    if (
      e.dataTransfer.types.includes(TODO_CLIPBOARD_MIME) ||
      e.dataTransfer.types.includes("text/plain")
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDropTarget(true);
    }
  }
  function handleDragLeave() {
    setIsDropTarget(false);
  }
  function handleDrop(e: React.DragEvent) {
    setIsDropTarget(false);
    if (!perms.addChildren) {
      ctx.reportPermissionDenied("addChildren", node.item.id, perms.reason);
      return;
    }
    e.preventDefault();
    const payload = fromDataTransfer(e.dataTransfer);
    if (!payload) return;
    ctx.dispatch({ type: "add-child", parentId: node.item.id, item: payload });
    ctx.fireEvent("paste", { parentId: node.item.id, payload });
    ctx.fireEvent("itemAdded", { parentId: node.item.id, item: payload });
  }

  return (
    <article
      ref={articleRef}
      role="article"
      tabIndex={0}
      aria-label={node.item.name}
      data-locked={node.item.locked ? "true" : undefined}
      data-inactive={!node.item.active ? "true" : undefined}
      draggable={perms.drag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onFocus={() => ctx.dispatch({ type: "set-focus", itemId: node.item.id })}
      style={style}
      className={cn(
        "rounded-2xl border-2 border-border bg-card p-4 text-card-foreground shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        node.item.locked && "opacity-70",
        !node.item.active && "opacity-50 saturate-50",
        isDragging && "opacity-40",
      )}
      data-todo-card-id={node.item.id}
      suppressHydrationWarning
    >
      <CardHeader node={node} onOverrideColor={() => setColorPickerOpen(true)} />
      {!ctx.isCollapsed(node.item.id) ? (
        <>
          <CardBody item={node.item} />
          {isInlineActive ? (
            <div className="mt-3">
              <EditInline node={node} />
            </div>
          ) : null}
        </>
      ) : null}

      <EditPopup node={node} />

      {/* Color override dialog — opened programmatically from action menu / header.
          Using Dialog instead of Popover avoids the outside-click race with the
          DropdownMenu's lingering click event after the menu dismisses. */}
      <Dialog open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="size-4" />
              Border color
            </DialogTitle>
            <DialogDescription>
              Override the time-engine color for this card. Pick a swatch, paste a
              CSS color, or reset to let the engine decide.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-8 gap-1.5">
              {PALETTE_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => applyColor(swatch)}
                  className="aspect-square rounded border border-border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ backgroundColor: swatch }}
                  aria-label={`Use color ${swatch}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="oklch(...) or #hex"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="font-mono text-xs"
              />
              <Button size="sm" onClick={() => applyColor(colorInput || null)}>
                Apply
              </Button>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyColor(null)}
              className="gap-1.5"
              title="Hand control back to the time-driven auto-color engine"
            >
              <Sparkles className="size-3.5" />
              Auto
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setColorPickerOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {node.childNodes.length > 0 && !ctx.isCollapsed(node.item.id) ? (
        <div
          role="group"
          aria-label={`Children of ${node.item.name}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "mt-3 space-y-2 border-s border-border/40 ps-4",
            isDropTarget && "bg-muted/30 rounded-r-md",
          )}
        >
          {node.childNodes.map((child) => (
            <Card key={child.item.id} node={child} />
          ))}
        </div>
      ) : !ctx.isCollapsed(node.item.id) ? (
        <div
          role="group"
          aria-label={`Drop zone for ${node.item.name}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "mt-2 h-0",
            isDropTarget && "mt-2 h-12 rounded-md border-2 border-dashed border-border bg-muted/30 transition-all",
          )}
        />
      ) : null}
    </article>
  );
}
