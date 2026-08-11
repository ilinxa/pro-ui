"use client";

import * as React from "react";
import { Check, Pencil, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useTeamQuestLog } from "../hooks/use-team-quest-log";
import type { QuestNameFieldProps, QuestTitleProps } from "../types";

/**
 * Tier C — dumb resolved-title display. `isDefault` (falling back to the literal
 * team name) is a subtle affordance hook, never a nag.
 */
export function QuestTitle({ title, isDefault = false, className }: QuestTitleProps) {
  return (
    <h2
      className={cn(
        "truncate text-lg font-semibold",
        isDefault ? "text-foreground" : "text-foreground",
        className,
      )}
      title={title}
    >
      {title}
    </h2>
  );
}

/**
 * Tier C — dumb controlled name input + save/cancel. `Enter` saves, `Escape`
 * cancels; a blank save is allowed (the revert/skip path). Auto-focuses on mount
 * (edit mode entered). Plain controlled `<input>` — no backend-specific props,
 * so it stays portable across the Radix↔Base-UI `input` (a simple wrapper).
 */
export function QuestNameField({
  value,
  onChange,
  onSave,
  onCancel,
  inputRef,
  className,
}: QuestNameFieldProps) {
  const localRef = React.useRef<HTMLInputElement | null>(null);
  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      localRef.current = node;
      inputRef?.(node);
    },
    [inputRef],
  );

  React.useEffect(() => {
    localRef.current?.focus();
    localRef.current?.select();
  }, []);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Input
        ref={setRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSave();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        aria-label="Quest name"
        placeholder="Name your quest…"
        className="max-w-xs"
      />
      <Button type="button" size="icon" className="size-8" aria-label="Save quest name" onClick={onSave}>
        <Check aria-hidden />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-8"
        aria-label="Cancel"
        onClick={onCancel}
      >
        <X aria-hidden />
      </Button>
    </div>
  );
}

/**
 * Tier B — the quest-name surface. Display the resolved title + a quiet edit
 * affordance (a "Name your quest" invitation when on the default, an edit pencil
 * when custom). Never a blocking prompt. The edit affordance is gated on
 * `canEditName` (editable + a save handler wired). In edit mode → `QuestNameField`.
 */
export function TeamQuestNameEditor({ className }: { className?: string }) {
  const {
    title,
    isDefaultTitle,
    canEditName,
    editing,
    draft,
    startEditing,
    setDraft,
    saveDraft,
    cancelEditing,
    registerNameInput,
  } = useTeamQuestLog();

  if (editing) {
    return (
      <QuestNameField
        value={draft}
        onChange={setDraft}
        onSave={saveDraft}
        onCancel={cancelEditing}
        inputRef={registerNameInput}
        className={className}
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <QuestTitle title={title} isDefault={isDefaultTitle} />
      {canEditName ? (
        isDefaultTitle ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1 text-muted-foreground"
            onClick={startEditing}
          >
            <Sparkles aria-hidden className="size-3.5" /> Name your quest
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7 text-muted-foreground"
            aria-label="Edit quest name"
            onClick={startEditing}
          >
            <Pencil aria-hidden className="size-3.5" />
          </Button>
        )
      ) : null}
    </div>
  );
}
