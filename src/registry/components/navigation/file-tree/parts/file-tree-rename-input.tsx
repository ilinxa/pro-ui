"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { FsNode, FileTreeValidateRenameArgs } from "../types";

interface FileTreeRenameInputProps {
  node: FsNode;
  onCommit: (nextName: string) => void;
  onCancel: () => void;
  validateRename?: (args: FileTreeValidateRenameArgs) => string | null;
}

export function FileTreeRenameInput(props: FileTreeRenameInputProps) {
  const { node, onCommit, onCancel, validateRename } = props;
  const [value, setValue] = useState(node.name);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    // Select the basename (everything before the final dot for files; whole
    // name for folders).
    if (node.type === "folder") {
      input.select();
    } else {
      const dot = node.name.lastIndexOf(".");
      if (dot > 0) {
        input.setSelectionRange(0, dot);
      } else {
        input.select();
      }
    }
  }, [node.type, node.name]);

  const tryCommit = () => {
    const trimmed = value.trim();
    if (trimmed === "") {
      setError("Name cannot be empty");
      return;
    }
    if (trimmed === node.name) {
      onCancel();
      return;
    }
    if (validateRename) {
      const message = validateRename({ node, nextName: trimmed });
      if (message) {
        setError(message);
        return;
      }
    }
    onCommit(trimmed);
  };

  return (
    <div className="relative flex flex-1 min-w-0 items-center">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            tryCommit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          } else {
            // Stop arrow keys from bubbling to the tree's keyboard handler
            e.stopPropagation();
          }
        }}
        onBlur={() => tryCommit()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        aria-label={`Rename ${node.name}`}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-6 min-w-0 flex-1 rounded-sm border bg-background px-1 text-sm outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          error
            ? "border-destructive ring-1 ring-destructive"
            : "border-border",
        )}
      />
      {error ? (
        <span
          role="alert"
          className="pointer-events-none absolute left-0 top-full z-10 mt-0.5 rounded-sm bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground shadow-sm"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
