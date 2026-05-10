"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { ChevronRight, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileManager } from "../hooks/use-file-manager-context";
import type { FileManagerPathTypedArgs } from "../types";

export interface FileManagerPathBarProps {
  /** Optional callback when user types a path; if omitted, the bar stays in display mode. */
  onPathTyped?: (args: FileManagerPathTypedArgs) => void;
  className?: string;
}

export function FileManagerPathBar(props: FileManagerPathBarProps) {
  const { onPathTyped, className } = props;
  const { state, actions, labels } = useFileManager();
  const { path } = state;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const display = path.map((n) => n.name).join("/");

  const startEdit = (e: ReactMouseEvent) => {
    if (!onPathTyped) return;
    // Only enter edit mode when clicking the empty area (not a segment)
    const target = e.target as HTMLElement | null;
    if (target?.closest("[data-path-segment]")) return;
    setDraft(display);
    setEditing(true);
  };

  const commit = () => {
    if (draft.trim() === display.trim()) {
      setEditing(false);
      return;
    }
    onPathTyped?.({ path: draft });
    setEditing(false);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className={cn("flex flex-1 items-center", className)}>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onInputKeyDown}
          className="h-7 w-full rounded-sm border border-border bg-background px-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Path"
        />
      </div>
    );
  }

  return (
    <nav
      aria-label="Path"
      onClick={startEdit}
      className={cn(
        "flex min-w-0 flex-1 cursor-text items-center gap-0.5 truncate rounded-sm px-1 py-0.5 text-xs",
        onPathTyped && "hover:bg-muted/40",
        className,
      )}
    >
      <button
        type="button"
        data-path-segment="root"
        onClick={(e) => {
          e.stopPropagation();
          actions.navigateTo(null);
        }}
        className="rounded-sm px-1 py-0.5 font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      >
        {labels.pathRoot}
      </button>
      {path.map((segment) => (
        <span key={segment.id} className="flex shrink-0 items-center gap-0.5">
          <ChevronRight
            className="size-3 text-muted-foreground/60"
            aria-hidden="true"
          />
          <button
            type="button"
            data-path-segment={segment.id}
            onClick={(e) => {
              e.stopPropagation();
              actions.navigateTo(segment.id);
            }}
            className="max-w-[180px] truncate rounded-sm px-1 py-0.5 text-foreground hover:bg-muted/60"
          >
            {segment.name}
          </button>
        </span>
      ))}
      {onPathTyped ? (
        <Pencil
          aria-hidden="true"
          className="ml-auto size-3 shrink-0 text-muted-foreground/40"
        />
      ) : null}
    </nav>
  );
}
