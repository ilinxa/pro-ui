"use client";

import {
  memo,
  useEffect,
  useImperativeHandle,
  useState,
  type ReactNode,
} from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAutosizeTextarea } from "../hooks/use-autosize-textarea";
import type { CommentThreadCurrentUser, CommentThreadLabels } from "../types";

export interface CommentComposerProps {
  currentUser?: CommentThreadCurrentUser;
  /** Defaults to labels.composerPlaceholder. */
  placeholder?: string;
  /** Initial uncontrolled value. */
  initialValue?: string;
  /** Controlled value — pair with onChange. */
  value?: string;
  onChange?: (next: string) => void;
  /** Required when used standalone. Fire-and-forget. */
  onSubmit: (content: string) => Promise<void> | void;
  /** Optional Cancel button — only renders when provided. */
  onCancel?: () => void;
  /** Force-disable the composer (sign-out / network down). */
  disabled?: boolean;
  /** External busy signal — overrides internal isSubmitting. */
  isSubmitting?: boolean;
  /** Default true. */
  submitOnEnter?: boolean;
  /** Defaults: 1 / 6. */
  minRows?: number;
  maxRows?: number;
  /** Aria-label override on the textarea. */
  ariaLabel?: string;
  /** Override the avatar visual entirely (e.g. persona switcher). */
  avatarSlot?: ReactNode;
  /** Auto-focus on mount (use for inline reply composers). */
  autoFocus?: boolean;
  className?: string;
  labels?: Pick<
    CommentThreadLabels,
    "composerPlaceholder" | "composerSend" | "composerCancel"
  >;
  ref?: React.Ref<CommentComposerHandle>;
}

export interface CommentComposerHandle {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";
}

function CommentComposerInner({
  currentUser,
  placeholder,
  initialValue = "",
  value: controlledValue,
  onChange,
  onSubmit,
  onCancel,
  disabled = false,
  isSubmitting: controlledSubmitting,
  submitOnEnter = true,
  minRows = 1,
  maxRows = 6,
  ariaLabel,
  avatarSlot,
  autoFocus = false,
  className,
  labels,
  ref,
}: CommentComposerProps) {
  const isValueControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(initialValue);
  const value = isValueControlled ? controlledValue : internalValue;

  const isSubmittingControlled = controlledSubmitting !== undefined;
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const isSubmitting = isSubmittingControlled
    ? controlledSubmitting
    : internalSubmitting;

  const textareaRef = useAutosizeTextarea(value, { minRows, maxRows });

  // Auto-focus on mount for inline reply composers (effect runs once).
  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => textareaRef.current?.focus(),
      blur: () => textareaRef.current?.blur(),
      clear: () => {
        if (!isValueControlled) setInternalValue("");
        onChange?.("");
      },
    }),
    // textareaRef identity is stable; setters are stable; onChange may change but
    // that's OK — the imperative handle reads it via closure on call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isValueControlled, onChange],
  );

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting || disabled) return;
    if (!isSubmittingControlled) setInternalSubmitting(true);
    try {
      await onSubmit(trimmed);
      if (!isValueControlled) setInternalValue("");
      onChange?.("");
    } finally {
      if (!isSubmittingControlled) setInternalSubmitting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (submitOnEnter && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
      return;
    }
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  const placeholderText =
    placeholder ?? labels?.composerPlaceholder ?? "Write a comment…";
  const sendLabel = labels?.composerSend ?? "Send";
  const cancelLabel = labels?.composerCancel ?? "Cancel";

  return (
    <div className={cn("flex items-start gap-2", className)}>
      {avatarSlot ??
        (currentUser ? (
          <Avatar className="h-8 w-8 shrink-0">
            {currentUser.avatar ? (
              <AvatarImage src={currentUser.avatar} alt="" />
            ) : null}
            <AvatarFallback>{initials(currentUser.name)}</AvatarFallback>
          </Avatar>
        ) : null)}
      <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            if (!isValueControlled) setInternalValue(e.target.value);
            onChange?.(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholderText}
          rows={minRows}
          disabled={disabled || isSubmitting}
          aria-label={ariaLabel ?? placeholderText}
          aria-busy={isSubmitting}
          className="resize-none border-0 bg-muted/50 pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            void submit();
          }}
          disabled={!value.trim() || isSubmitting || disabled}
          aria-label={sendLabel}
          className="absolute right-1 top-1.5 h-7 w-7"
        >
          <Send
            className={cn(
              "h-4 w-4",
              value.trim() && "text-primary",
            )}
          />
        </Button>
      </div>
      {onCancel ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (!isValueControlled) setInternalValue("");
            onChange?.("");
            onCancel();
          }}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      ) : null}
    </div>
  );
}

export const CommentComposer = memo(CommentComposerInner);
CommentComposer.displayName = "CommentComposer";
