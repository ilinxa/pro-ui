"use client";

import { memo, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// F-S1 lock — RELATIVE cross-procomp imports
import type {
  Port,
  PortDir,
  PortSide,
  PortType,
} from "../../flow-canvas-01/types";
import { isDuplicateId } from "../lib/port-mutators";
import type { PortEditorPermissions, PortField } from "../types";

const SIDES: PortSide[] = ["left", "right", "top", "bottom"];
const DIRS: PortDir[] = ["in", "out"];

export type PortEditorRowProps = {
  cardId: string;
  port: Port;
  portTypes: PortType[];
  existingPorts: Port[];
  liveEdgeCount: { asSource: number; asTarget: number };
  editable: boolean;
  permissions: PortEditorPermissions;
  onUpdate: (mut: Partial<Port>) => void;
  onRemove: () => void;
};

function PortEditorRowImpl({
  cardId,
  port,
  portTypes,
  existingPorts,
  liveEdgeCount,
  editable,
  permissions,
  onUpdate,
  onRemove,
}: PortEditorRowProps) {
  // Local buffers for commit-on-blur text fields (id, label). Live-save for
  // selects + checkbox per Q6/Q7 — id renames have edge implications so they
  // commit on blur; label is no-op for runtime but still uses blur for consistency.
  //
  // Note: the parent strip uses key={port.id} so id-rename commits remount the
  // row (drafts reset cleanly from the new port props). External label-only
  // mutations mid-edit don't re-sync the draft (edge case; v0.3 fix if a
  // consumer hits it). Avoids the React Compiler "setState during effect"
  // cascading-renders warning.
  const [idDraft, setIdDraft] = useState(port.id);
  const [labelDraft, setLabelDraft] = useState(port.label ?? "");

  const isDocType = port.type === "doc";
  const totalLiveEdges = liveEdgeCount.asSource + liveEdgeCount.asTarget;
  const hasLiveEdges = totalLiveEdges > 0;
  const idIsDirty = idDraft !== port.id;

  const canEdit =
    editable && (permissions.canEditPort?.(cardId, port.id) ?? true);
  const canEditField = (field: PortField): boolean =>
    canEdit && (permissions.canEditPortField?.(cardId, port.id, field) ?? true);
  const canRemove =
    editable && (permissions.canRemovePort?.(cardId, port.id) ?? true);

  const idError =
    idDraft.trim() === ""
      ? "Port id required"
      : isDuplicateId(existingPorts, idDraft, port.id)
        ? "Port id must be unique within this node"
        : null;

  function commitId() {
    const trimmed = idDraft.trim();
    if (trimmed === "" || trimmed === port.id) {
      setIdDraft(port.id);
      return;
    }
    if (isDuplicateId(existingPorts, trimmed, port.id)) {
      setIdDraft(port.id);
      return;
    }
    onUpdate({ id: trimmed });
  }

  function commitLabel() {
    const trimmed = labelDraft.trim();
    if (trimmed === (port.label ?? "")) return;
    onUpdate({ label: trimmed === "" ? undefined : trimmed });
  }

  function handleTypeChange(v: string) {
    // Q4 auto-correct: switching to "doc" forces side to "bottom".
    if (v === "doc" && port.side !== "bottom") {
      onUpdate({ type: v, side: "bottom" });
    } else {
      onUpdate({ type: v });
    }
  }

  if (!editable) {
    // F-08 read-only summary row. Mirrors the editable row's fixed-pixel
    // column widths so rows align cleanly. No remove / no multi columns.
    return (
      <div className="grid grid-cols-[220px_120px_100px_80px_200px] items-center gap-1 rounded-sm border border-border/40 bg-card/30 px-2 py-1.5 text-xs">
        <div className="truncate font-mono">{port.id}</div>
        <PortTypeBadge type={port.type} portTypes={portTypes} />
        <span className="text-muted-foreground">{port.side}</span>
        <span className="text-muted-foreground">{port.dir}</span>
        {port.label ? (
          <span className="truncate text-muted-foreground">{port.label}</span>
        ) : (
          <span />
        )}
      </div>
    );
  }

  const idField = (
    <div className="relative">
      <Input
        value={idDraft}
        onChange={(e) => setIdDraft(e.target.value)}
        onBlur={commitId}
        disabled={!canEditField("id")}
        className={`h-7 pr-6 font-mono text-xs ${idError ? "border-destructive" : ""}`}
        aria-invalid={idError !== null}
      />
      {hasLiveEdges && idIsDirty && !idError && (
        <AlertCircle
          className="pointer-events-none absolute right-1.5 top-1.5 size-3 text-warning"
          aria-label="Rename will affect existing edges"
        />
      )}
    </div>
  );

  return (
    // Fixed-pixel column widths sized for actual control content (no fr
    // stretching — at wide parents the fr-grown columns made selects look
    // unnecessarily wide). Row sits at natural width (~860px) anchored left;
    // the strip's overflow-x-auto wrapper kicks in if the parent is narrower.
    // Widths: id 220 / type 120 / side 100 / dir 80 / multi 80 / label 200 /
    // remove 36 = 836 + 6×4 gaps = 860.
    <div className="grid grid-cols-[220px_120px_100px_80px_80px_200px_36px] items-center gap-1 rounded-sm border border-border/40 bg-card/30 px-2 py-1.5">
      {/* ID — commit on blur; tooltip when error OR live-edges warning */}
      {idError ? (
        <Tooltip>
          <TooltipTrigger asChild>{idField}</TooltipTrigger>
          <TooltipContent>{idError}</TooltipContent>
        </Tooltip>
      ) : hasLiveEdges && idIsDirty ? (
        <Tooltip>
          <TooltipTrigger asChild>{idField}</TooltipTrigger>
          <TooltipContent>
            Renaming this port will not auto-update {totalLiveEdges} existing edge
            {totalLiveEdges === 1 ? "" : "s"} — consumer must update edge references.
          </TooltipContent>
        </Tooltip>
      ) : (
        idField
      )}

      {/* Type — live-save; auto-corrects side when switching to "doc" */}
      <Select
        value={port.type}
        onValueChange={handleTypeChange}
        disabled={!canEditField("type")}
      >
        <SelectTrigger className="h-7 w-full text-xs">
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

      {/* Side — disabled for doc-type per Q4 */}
      <Select
        value={port.side}
        onValueChange={(v) => onUpdate({ side: v as PortSide })}
        disabled={!canEditField("side") || isDocType}
      >
        <SelectTrigger className="h-7 w-full text-xs">
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

      {/* Dir */}
      <Select
        value={port.dir}
        onValueChange={(v) => onUpdate({ dir: v as PortDir })}
        disabled={!canEditField("dir")}
      >
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DIRS.map((d) => (
            <SelectItem key={d} value={d} className="text-xs">
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Multi */}
      <label className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Checkbox
          checked={port.multi === true}
          onCheckedChange={(c) => onUpdate({ multi: c === true })}
          disabled={!canEditField("multi")}
        />
        multi
      </label>

      {/* Label — commit on blur */}
      <Input
        value={labelDraft}
        onChange={(e) => setLabelDraft(e.target.value)}
        onBlur={commitLabel}
        disabled={!canEditField("label")}
        placeholder="label"
        className="h-7 text-xs"
      />

      {/* Remove */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={!canRemove}
        className="size-7 p-0"
        aria-label={`Remove port ${port.id}`}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

function PortTypeBadge({
  type,
  portTypes,
}: {
  type: string;
  portTypes: PortType[];
}) {
  const pt = portTypes.find((t) => t.id === type);
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="inline-block size-2.5 rounded-full"
        style={{ background: pt?.color ?? "var(--muted-foreground)" }}
        aria-hidden="true"
      />
      {pt?.label ?? type}
    </span>
  );
}

export const PortEditorRow = memo(PortEditorRowImpl);
