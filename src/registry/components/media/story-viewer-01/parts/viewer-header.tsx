import { type ElementType } from "react";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";
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
}: ViewerHeaderProps) {
  const initials = story.username.slice(0, 2).toUpperCase();
  const isInteractive = !!onAuthorClick || !!authorComponent;
  const AuthorRoot: ElementType =
    authorComponent ?? (onAuthorClick ? "button" : "div");
  const authorRootProps: Record<string, unknown> = {
    className: cn(
      "flex items-center gap-3 rounded-full text-left",
      isInteractive &&
        "cursor-pointer transition-opacity hover:opacity-80 focus-visible:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
    ),
  };
  if (onAuthorClick) {
    authorRootProps.onClick = () => onAuthorClick(story);
  }
  if (AuthorRoot === "button") {
    authorRootProps.type = "button";
  }
  return (
    <div className="absolute left-0 right-0 top-4 z-20 flex items-center justify-between px-4 pt-2">
      <AuthorRoot {...authorRootProps}>
        <Avatar className="h-10 w-10 border-2 border-white">
          {story.avatar ? <AvatarImage src={story.avatar} alt="" /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-white">{story.username}</p>
          <p className="text-xs text-white/60">
            {formatTime(new Date(story.createdAt))}
          </p>
        </div>
      </AuthorRoot>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 md:h-9 md:w-9 text-white hover:bg-white/20 hover:text-white"
          onClick={onTogglePause}
          aria-label={isPaused ? labels.play : labels.pause}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        {item.type === "video" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 md:h-9 md:w-9 text-white hover:bg-white/20 hover:text-white"
            onClick={onToggleMute}
            aria-label={isMuted ? labels.unmute : labels.mute}
            aria-pressed={isMuted}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 md:h-9 md:w-9 text-white hover:bg-white/20 hover:text-white"
          onClick={onClose}
          aria-label={labels.close}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
