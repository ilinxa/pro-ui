import { type ElementType, type ReactNode } from "react";
import { MoreVertical, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ResolvedStoryViewer01Labels, Story, StoryItem } from "../types";

export interface ViewerHeaderProps {
  story: Story;
  item: StoryItem;
  isPaused: boolean;
  isMuted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onClose: () => void;
  formatTime: (date: Date) => string;
  labels: ResolvedStoryViewer01Labels;
  /**
   * v0.2.2 — when set, the avatar + name strip becomes interactive (rendered
   * as `authorComponent` if provided, else `<button type="button">`).
   */
  onAuthorClick?: (story: Story) => void;
  /**
   * v0.2.2 — polymorphic root override for the author tap-target. Defaults
   * to `"button"` when onAuthorClick is set, `"div"` otherwise.
   */
  authorComponent?: ElementType;
  /**
   * v0.3.5 — when set, the kebab button renders in the header right cluster
   * (between mute and close). Tapping it fires this callback (the caller
   * owns the bottom-sheet panel state).
   */
  onKebabClick?: () => void;
  /** 0.7.0 - the actions menu is open (the kebab button's `aria-expanded`). */
  kebabOpen?: boolean;
  /**
   * 0.7.0 - leave the Play / Pause control out: the notice on screen stays until the viewer closes,
   * so there is nothing to play.
   */
  hidePause?: boolean;
  /**
   * 0.6.0 - badge rendered after the author name, before the time
   * ({@link StoryViewerProps.renderHeaderBadge}). Absent = nothing.
   */
  renderBadge?: (story: Story, item: StoryItem) => ReactNode;
}

export function ViewerHeader({
  story,
  item,
  isPaused,
  isMuted,
  onTogglePause,
  onToggleMute,
  onClose,
  formatTime,
  labels,
  onAuthorClick,
  authorComponent,
  onKebabClick,
  kebabOpen = false,
  hidePause = false,
  renderBadge,
}: ViewerHeaderProps) {
  const initials = story.username.slice(0, 2).toUpperCase();
  const isInteractive = !!onAuthorClick || !!authorComponent;
  const AuthorRoot: ElementType =
    authorComponent ?? (onAuthorClick ? "button" : "div");
  const authorRootProps: Record<string, unknown> = {
    className: cn(
      "flex items-center gap-3 rounded-full text-start",
      isInteractive &&
        "cursor-pointer transition-opacity hover:opacity-80 focus-visible:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-media-overlay-foreground/60",
    ),
  };
  if (onAuthorClick) {
    authorRootProps.onClick = () => onAuthorClick(story);
  }
  if (AuthorRoot === "button") {
    authorRootProps.type = "button";
  }
  return (
    <div className="absolute inset-x-0 top-4 z-20 flex items-center justify-between px-4 pt-2">
      {/* F2: top scrim so white header text stays legible on bright media. Behind the controls
          (-z-10 inside this stacking context), above the media, never takes pointer events. */}
      <div
        aria-hidden="true"
        data-story-header-scrim=""
        className="pointer-events-none absolute inset-x-0 -top-4 -z-10 h-28 bg-linear-to-b from-media-overlay to-transparent"
      />
      <AuthorRoot {...authorRootProps}>
        <Avatar className="h-10 w-10 border-2 border-media-overlay-foreground">
          {story.avatar ? <AvatarImage src={story.avatar} alt="" /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-media-overlay-foreground">
              {story.username}
            </p>
            {renderBadge ? renderBadge(story, item) : null}
          </div>
          <p className="text-xs text-media-overlay-foreground/60">
            {formatTime(new Date(item.createdAt ?? story.createdAt))}
          </p>
        </div>
      </AuthorRoot>
      <div className="flex items-center gap-2">
        {hidePause ? null : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 md:h-9 md:w-9 text-media-overlay-foreground hover:bg-media-overlay-foreground/20 hover:text-media-overlay-foreground"
            onClick={onTogglePause}
            aria-label={isPaused ? labels.play : labels.pause}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        )}
        {item.type === "video" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 md:h-9 md:w-9 text-media-overlay-foreground hover:bg-media-overlay-foreground/20 hover:text-media-overlay-foreground"
            onClick={onToggleMute}
            aria-label={isMuted ? labels.unmute : labels.mute}
            aria-pressed={isMuted}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        ) : null}
        {onKebabClick ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onKebabClick}
            // The button's own `aria-expanded:` look is a light chip; keep the media overlay one.
            className="h-11 w-11 md:h-9 md:w-9 text-media-overlay-foreground hover:bg-media-overlay-foreground/20 hover:text-media-overlay-foreground aria-expanded:bg-media-overlay-foreground/20 aria-expanded:text-media-overlay-foreground"
            aria-label={labels.kebabAriaLabel}
            aria-haspopup="menu"
            aria-expanded={kebabOpen}
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 md:h-9 md:w-9 text-media-overlay-foreground hover:bg-media-overlay-foreground/20 hover:text-media-overlay-foreground"
          onClick={onClose}
          aria-label={labels.close}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
