"use client";

import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ShareButton, type CopyState } from "./parts/share-button";
import { SHARE_TEMPLATES } from "./parts/templates";
import {
  SHARE_BAR_DEFAULT_LABELS,
  type ShareBar01Props,
  type ShareTarget,
} from "./types";

async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  if (typeof document === "undefined") {
    throw new Error("Clipboard not available (no document)");
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand("copy")) {
      throw new Error("execCommand copy returned false");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

function ShareBar01Inner(props: ShareBar01Props) {
  const {
    targets,
    url,
    title,
    text,
    via,
    hashtags,
    onShare,
    onCopySuccess,
    onCopyError,
    successResetMs = 2000,
    divider = false,
    headingAs,
    labels,
    className,
    headerClassName,
    buttonClassName,
  } = props;

  const HeadingTag = headingAs;
  const resolvedLabels = { ...SHARE_BAR_DEFAULT_LABELS, ...labels };
  const headingId = useId();

  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) {
        clearTimeout(resetTimer.current);
      }
    },
    []
  );

  const scheduleReset = useCallback((ms: number) => {
    if (resetTimer.current !== null) {
      clearTimeout(resetTimer.current);
    }
    resetTimer.current = setTimeout(() => setCopyState("idle"), ms);
  }, []);

  const resolveUrl = useCallback(() => {
    if (url) return url;
    return typeof window !== "undefined" ? window.location.href : "";
  }, [url]);

  const handleClick = useCallback(
    (target: ShareTarget) => async () => {
      if (target.kind === "copy") {
        try {
          await copyToClipboard(resolveUrl());
          setCopyState("success");
          onCopySuccess?.();
          onShare?.("copy");
          scheduleReset(successResetMs);
        } catch (err) {
          setCopyState("error");
          onCopyError?.(err);
          scheduleReset(successResetMs);
        }
        return;
      }

      if (target.kind === "custom") {
        target.onClick();
        onShare?.(target.id);
        return;
      }

      const shareUrl = SHARE_TEMPLATES[target.kind]({
        url: resolveUrl(),
        title,
        text,
        via,
        hashtags,
      });
      if (typeof window !== "undefined") {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }
      onShare?.(target.kind);
    },
    [
      resolveUrl,
      title,
      text,
      via,
      hashtags,
      onShare,
      onCopySuccess,
      onCopyError,
      successResetMs,
      scheduleReset,
    ]
  );

  return (
    <div
      className={cn(divider && "pt-8 border-t border-border", className)}
      aria-labelledby={HeadingTag ? headingId : undefined}
    >
      {HeadingTag ? (
        <HeadingTag
          id={headingId}
          className={cn(
            "text-sm font-semibold text-muted-foreground mb-3",
            headerClassName
          )}
        >
          {resolvedLabels.heading}
        </HeadingTag>
      ) : null}

      <ul role="list" className="flex flex-wrap items-center gap-2 list-none">
        {targets.map((target) => {
          const key = target.kind === "custom" ? target.id : target.kind;
          return (
            <ShareButton
              key={key}
              target={target}
              state={target.kind === "copy" ? copyState : "idle"}
              onClick={handleClick(target)}
              buttonClassName={buttonClassName}
              copyAriaLabel={resolvedLabels.copyAria}
            />
          );
        })}
      </ul>

      <span className="sr-only" role="status" aria-live="polite">
        {copyState === "success" ? resolvedLabels.copySuccess : ""}
      </span>
      <span className="sr-only" role="alert">
        {copyState === "error" ? resolvedLabels.copyError : ""}
      </span>
    </div>
  );
}

export const ShareBar01 = memo(ShareBar01Inner);
ShareBar01.displayName = "ShareBar01";
