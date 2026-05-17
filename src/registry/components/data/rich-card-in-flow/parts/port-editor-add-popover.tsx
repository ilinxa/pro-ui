"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// F-S1 lock — RELATIVE cross-procomp imports
import type { Port, PortSide, PortType } from "../../flow-canvas-01/types";
import { makeInOutPair, makePortId } from "../lib/port-mutators";

const SIDES: PortSide[] = ["left", "right", "top", "bottom"];

/**
 * v0.2.0 — popover triggered by the "+ add port" button. Lets the user pick
 * one or both directions via [✓in][✓out] checkboxes + type / side / multi /
 * label. On commit, calls `onAdd` with 1 or 2 atomic ports (per Q3 lock:
 * "both" creates a pair at create time; rows are independent post-save).
 *
 * Doc-typed ports have their `side` forced to `"bottom"` editor-side per Q4.
 */
export function PortEditorAddPopover({
  cardRcid,
  portTypes,
  onAdd,
  disabled,
}: {
  cardRcid: string | undefined;
  portTypes: PortType[];
  onAdd: (newPorts: Port[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [inChecked, setInChecked] = useState(false);
  const [outChecked, setOutChecked] = useState(true);
  const [type, setType] = useState<string>(portTypes[0]?.id ?? "data");
  const [side, setSide] = useState<PortSide>("right");
  const [multi, setMulti] = useState(false);
  const [label, setLabel] = useState("");

  const isDocType = type === "doc";
  const effectiveSide: PortSide = isDocType ? "bottom" : side;
  const canCommit = inChecked || outChecked;

  function reset() {
    setInChecked(false);
    setOutChecked(true);
    setType(portTypes[0]?.id ?? "data");
    setSide("right");
    setMulti(false);
    setLabel("");
  }

  function commit() {
    if (!canCommit) return;
    const trimmedLabel = label.trim() === "" ? undefined : label.trim();
    let newPorts: Port[];
    if (inChecked && outChecked) {
      newPorts = makeInOutPair(
        cardRcid,
        type,
        effectiveSide,
        multi,
        trimmedLabel,
      );
    } else {
      const dir = inChecked ? "in" : "out";
      newPorts = [
        {
          id: makePortId(cardRcid),
          side: effectiveSide,
          dir,
          type,
          multi,
          label: trimmedLabel,
        },
      ];
    }
    onAdd(newPorts);
    reset();
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <PopoverTrigger asChild>
        {/* Matches rich-card's "+ FIELD" / "+ BLOCK" pattern per description Q11.
            See: rich-card/parts/predefined-add-menu.tsx:56-59 */}
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/70 bg-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-3" aria-hidden="true" />
          add port
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-72 space-y-3 p-3"
      >
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Add port
        </p>

        {/* Direction multi-select per Q3 — both checked creates an in/out pair */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Direction</Label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={inChecked}
                onCheckedChange={(c) => setInChecked(c === true)}
              />
              in
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={outChecked}
                onCheckedChange={(c) => setOutChecked(c === true)}
              />
              out
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Type</Label>
          <Select value={type} onValueChange={(v: string | null) => v && setType(v)}>
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {portTypes.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ background: t.color }}
                      aria-hidden="true"
                    />
                    {t.label ?? t.id}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Side</Label>
          <Select
            value={effectiveSide}
            onValueChange={(v: string | null) => v && setSide(v as PortSide)}
            disabled={isDocType}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIDES.map((s) => (
                <SelectItem
                  key={s}
                  value={s}
                  className="text-xs"
                  disabled={isDocType && s !== "bottom"}
                >
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isDocType && (
            <p className="text-[10px] text-muted-foreground">
              Doc-type ports are forced to the bottom side.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2">
          <Checkbox
            checked={multi}
            onCheckedChange={(c) => setMulti(c === true)}
          />
          <span className="text-xs">Allow multiple connections</span>
        </label>

        <div className="space-y-1.5">
          <Label htmlFor="rcif-port-add-label" className="text-xs font-medium">
            Label (optional)
          </Label>
          <Input
            id="rcif-port-add-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. response, doc-ref"
            className="h-8 text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={commit} disabled={!canCommit}>
            Add
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
