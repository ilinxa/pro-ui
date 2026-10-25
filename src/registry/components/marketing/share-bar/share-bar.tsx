"use client";

import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ShareButton, type CopyState } from "./parts/share-button";
import { SHARE_TEMPLATES } from "./parts/templates";
import {
  defaultShareBarLabels,
  type ResolvedShareBarLabels,
  type ShareBarLabels,
  type ShareBarProps,
  type ShareTarget,
} from "./types";

function fallbackCopy(text: string): void {
  if (typeof document === "undefined") {
    throw new Error("Clipboard not available (no document)");
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  // readonly: keeps the on-screen keyboard from flashing up on iOS.
  textarea.setAttribute("readonly", "");
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

async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Rejected (iframe permissions policy, unfocused document): try the legacy path.
    }
  }
  fallbackCopy(text);
}

/** Merge `labels` over the defaults per key; an explicit `undefined` never erases a default. */
function resolveLabels(labels: ShareBarLabels | undefined): ResolvedShareBarLabels {
  const merged: ResolvedShareBarLabels = {
    ...defaultShareBarLabels,
    targets: { ...defaultShareBarLabels.targets },
  };
  if (!labels) return merged;
  for (const key of ["heading", "copyAria", "copySuccess", "copyError"] as const) {
    const value = labels[key];
    if (value !== undefined) merged[key] = value;
  }
  if (labels.targets) {
    for (const [kind, value] of Object.entries(labels.targets)) {
      if (value !== undefined) merged.targets[kind as keyof typeof merged.targets] = value;
    }
  }
  return merged;
}

function targetLabel(target: ShareTarget, labels: ResolvedShareBarLabels): string {
  if (target.ariaLabel) return target.ariaLabel;
  if (target.kind === "custom") return target.ariaLabel;
  // `labels.targets.copy` has no default, so `copyAria` (default or given) names copy unless it is set.
  if (target.kind === "copy") return labels.targets.copy ?? labels.copyAria;
  return labels.targets[target.kind];
}

function canNativeShare(data: ShareData): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return true;
  try {
    return navigator.canShare(data);
  } catch {
    return false;
  }
}

function ShareBarInner(props: ShareBarProps) {
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
    onShareError,
    successResetMs = 2000,
    divider = false,
    headingAs,
    labels,
    className,
    headerClassName,
    buttonClassName,
  } = props;

  const HeadingTag = headingAs;
  const resolvedLabels = resolveLabels(labels);
  const headingId = useId();

  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [nativeSupported, setNativeSupported] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  // A second `navigator.share` while the sheet is open rejects with InvalidStateError: ignore the click.
  const sharing = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (resetTimer.current !== null) {
        clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
    };
  }, []);

  const scheduleReset = useCallback((ms: number) => {
    if (!mounted.current) return;
    if (resetTimer.current !== null) {
      clearTimeout(resetTimer.current);
    }
    resetTimer.current = setTimeout(() => setCopyState("idle"), ms);
  }, []);

  const resolveUrl = useCallback(() => {
    if (url) return url;
    return typeof window !== "undefined" ? window.location.href : "";
  }, [url]);

  const buildNativePayload = useCallback(() => {
    const data: ShareData = { url: resolveUrl() };
    if (title) data.title = title;
    if (text) data.text = text;
    return data;
  }, [resolveUrl, title, text]);

  // Native share is decided after mount: server HTML never contains the button.
  useEffect(() => {
    const supported = canNativeShare(buildNativePayload());
    // Capability detection needs the client; setting it after mount is what keeps server HTML free of the button.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNativeSupported(supported);
  }, [buildNativePayload]);

  const handleClick = useCallback(
    (target: ShareTarget) => async () => {
      if (target.kind === "native") {
        if (sharing.current) return;
        sharing.current = true;
        // Nothing is awaited before `share`: it needs the click's transient user activation.
        try {
          await navigator.share(buildNativePayload());
        } catch (err) {
          if ((err as { name?: string } | null)?.name === "AbortError") return;
          onShareError?.(err, "native");
          return;
        } finally {
          sharing.current = false;
        }
        onShare?.("native");
        return;
      }

      if (target.kind === "copy") {
        try {
          await copyToClipboard(resolveUrl());
          if (mounted.current) setCopyState("success");
          onCopySuccess?.();
          onShare?.("copy");
          scheduleReset(successResetMs);
        } catch (err) {
          if (mounted.current) setCopyState("error");
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
      buildNativePayload,
      resolveUrl,
      title,
      text,
      via,
      hashtags,
      onShare,
      onShareError,
      onCopySuccess,
      onCopyError,
      successResetMs,
      scheduleReset,
    ]
  );

  return (
    <div
      className={cn(divider && "pt-8 border-t border-border", className)}
      role="group"
      aria-labelledby={HeadingTag ? headingId : undefined}
      aria-label={HeadingTag ? undefined : resolvedLabels.heading}
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
        {targets.map((target, index) => {
          if (target.hidden) return null;
          if (target.kind === "native" && !nativeSupported) return null;
          return (
            <ShareButton
              key={index}
              target={target}
              state={target.kind === "copy" ? copyState : "idle"}
              label={targetLabel(target, resolvedLabels)}
              onClick={handleClick(target)}
              buttonClassName={buttonClassName}
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

export const ShareBar = memo(ShareBarInner);
ShareBar.displayName = "ShareBar";
