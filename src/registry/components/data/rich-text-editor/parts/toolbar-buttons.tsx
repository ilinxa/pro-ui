"use client";

import {
  type ComponentType,
  type MouseEvent,
  useCallback,
} from "react";
import {
  useEditorRef,
  useEditorSelector,
  useMarkToolbarButton,
  useMarkToolbarButtonState,
} from "platejs/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarkButtonProps {
  nodeType: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  size?: "sm" | "md";
}

export function MarkButton({
  nodeType,
  icon: Icon,
  label,
  size = "md",
}: MarkButtonProps) {
  const state = useMarkToolbarButtonState({ nodeType });
  const { props } = useMarkToolbarButton(state);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        state.pressed && "bg-muted text-foreground"
      )}
      title={label}
      aria-label={label}
      aria-pressed={state.pressed}
      onMouseDown={props.onMouseDown}
      onClick={props.onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

interface BlockButtonProps {
  isActive: boolean;
  onActivate: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
  size?: "sm" | "md";
}

export function BlockButton({
  isActive,
  onActivate,
  icon: Icon,
  label,
  size = "md",
}: BlockButtonProps) {
  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
    },
    []
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        isActive && "bg-muted text-foreground"
      )}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      onMouseDown={handleMouseDown}
      onClick={onActivate}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

export function useBlockToggle(blockType: string) {
  const editor = useEditorRef();
  const isActive = useEditorSelector(
    (e) => {
      const entry = e.api.block();
      return entry?.[0]?.type === blockType;
    },
    [blockType]
  );
  const toggle = useCallback(() => {
    editor.tf.toggleBlock(blockType);
    editor.tf.focus();
  }, [editor, blockType]);
  return { isActive, toggle };
}
