import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Story } from "./types";

interface StoryThumbnailProps {
  story?: Story;
  isAddStory?: boolean;
  userAvatar?: string;
  onClick?: () => void;
}

export function StoryThumbnail({ story, isAddStory, userAvatar, onClick }: StoryThumbnailProps) {
  if (isAddStory) {
    return (
      <button onClick={onClick} className="flex flex-col items-center gap-2 shrink-0 group">
        <div className="relative">
          <div className="w-20 h-28 rounded-2xl border-2 border-dashed border-muted-foreground/30 overflow-hidden bg-muted/50 group-hover:border-primary/50 transition-colors">
            <img 
              src={userAvatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"} 
              alt="Add story"
              className="w-full h-full object-cover opacity-50"
            />
          </div>
          <span className="absolute bottom-1 right-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground border-2 border-card shadow-md">
            <Plus className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-xs font-medium text-center w-20 truncate text-muted-foreground">Hikaye Ekle</span>
      </button>
    );
  }

  if (!story) return null;

  const previewImage = story.items[0]?.src;

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 shrink-0 group">
      <div
        className={cn(
          "p-0.5 rounded-2xl transition-all",
          story.hasUnread
            ? "bg-linear-to-br from-accent via-warning to-destructive"
            : "bg-muted"
        )}
      >
        <div className="w-20 h-28 rounded-[14px] overflow-hidden border-2 border-card bg-card">
          <img 
            src={previewImage} 
            alt={story.username}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Avatar className="h-5 w-5 border border-card">
          <AvatarImage src={story.avatar} />
          <AvatarFallback className="text-[8px]">{story.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-center max-w-14 truncate">{story.username}</span>
      </div>
    </button>
  );
}
