"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  ResolvedStoryViewer01Labels,
  Story,
  StoryItem,
  ViewerListItem,
} from "../types";

export interface OwnerOverlayProps {
  story: Story;
  item: StoryItem;
  /**
   * Lazy-fetch viewers when owner taps the view-count chip. Returns
   * ViewerListItem[]. Called once per panel-open; result cached locally.
   */
  onLoadViewers?: (storyId: string) => Promise<ViewerListItem[]>;
  labels: ResolvedStoryViewer01Labels;
  className?: string;
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") || "?"
  );
}

/**
 * Owner overlay — bottom-anchored view-count chip + tap-to-expand viewers
 * list panel. Mounts only when `viewerMode === "owner"` + `!disableOwnerOverlay`.
 *
 * Per Q-V5 hybrid lock: count is eager (cheap byte from `story.viewerCount`),
 * users list is lazy (fetched on first tap via `onLoadViewers`). Optional
 * eager seed via `story.viewers` short-circuits the fetch.
 *
 * The expanded panel renders avatars + names inline (a simple list — not the
 * cross-cat LikersStrip — to keep the F-S1 surface minimal; LikersStrip can
 * be wired via `renderOwnerOverlay` slot if the host wants the swipable
 * variant).
 */
function OwnerOverlayInner(props: OwnerOverlayProps) {
  const eagerCount = props.story.viewerCount ?? props.story.viewers?.length ?? 0;
  const [open, setOpen] = useState(false);
  const [viewers, setViewers] = useState<ViewerListItem[]>(props.story.viewers ?? []);
  const [loading, setLoading] = useState(false);
  const [didFetch, setDidFetch] = useState(false);

  // Reset panel state when story changes (cursor navigation).
  useEffect(() => {
    setOpen(false);
    setViewers(props.story.viewers ?? []);
    setDidFetch(false);
  }, [props.story.id]);

  const handleToggle = useCallback(async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (viewers.length === 0 && props.onLoadViewers && !loading && !didFetch) {
      setLoading(true);
      try {
        const list = await props.onLoadViewers(props.story.id);
        setViewers(list);
        setDidFetch(true);
      } catch {
        // Swallow; host can re-attempt via re-tap. No retry-with-backoff for v0.2.0.
      } finally {
        setLoading(false);
      }
    }
  }, [open, viewers.length, loading, didFetch, props.onLoadViewers, props.story.id]);

  const timeStr = props.labels.formatTime(new Date(props.story.createdAt));
  const ariaLabel = props.labels.viewerCountLabel(eagerCount, timeStr);

  return (
    <>
      {/* View-count chip — bottom-left of viewer (replaces reply composer in owner mode). */}
      <div
        className={cn(
          "absolute left-0 right-0 bottom-0 z-30 flex items-center px-4 pb-4 pt-8",
          "bg-linear-to-t from-black/60 via-black/40 to-transparent",
          props.className,
        )}
      >
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-11 text-white hover:bg-white/20 hover:text-white",
          )}
          aria-label={ariaLabel}
          aria-expanded={open}
        >
          <Eye className="mr-2 h-4 w-4" />
          <span className="font-semibold">{eagerCount}</span>
          <span className="ml-2 text-white/70">· {timeStr}</span>
        </button>
      </div>

      {/* Viewers panel — bottom-anchored sheet that slides up. */}
      {open ? (
        <div className="absolute inset-x-0 bottom-0 z-40 max-h-[60%] overflow-hidden rounded-t-2xl bg-card text-foreground shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">{props.labels.viewersHeading}</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9",
              )}
              aria-label={props.labels.close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[50vh] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading viewers…
              </p>
            ) : viewers.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No viewers yet.
              </p>
            ) : (
              <ul className="flex flex-col">
                {viewers.map((viewer) => (
                  <li
                    key={viewer.id}
                    className="flex items-center gap-3 border-b border-border/30 px-4 py-2 last:border-b-0"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      {viewer.avatar ? <AvatarImage src={viewer.avatar} alt="" /> : null}
                      <AvatarFallback className="text-xs">{initials(viewer.name)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{viewer.name}</span>
                    {viewer.viewedAt ? (
                      <span className="text-xs text-muted-foreground">
                        {props.labels.formatTime(new Date(viewer.viewedAt))}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export const OwnerOverlay = memo(OwnerOverlayInner);
OwnerOverlay.displayName = "OwnerOverlay";
