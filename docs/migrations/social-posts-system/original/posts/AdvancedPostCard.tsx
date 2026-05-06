"use client";
import { useState } from "react";
import { Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PostMediaCarousel, type PostMedia } from "./PostMediaCarousel";
import { PostContent } from "./PostContent";
import { PostEngagementPanel, type LikeUser, type Comment } from "./PostEngagementPanel";


export interface PostAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
}

export interface AdvancedPostData {
  id: string;
  author: PostAuthor;
  content: string;
  media: PostMedia[];
  likes: number;
  likedBy?: LikeUser[];
  comments: number;
  shares: number;
  timestamp: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface AdvancedPostCardProps {
  post: AdvancedPostData;
  currentUser?: {
    avatar: string;
    name: string;
  };
  onLike?: (postId: string, liked: boolean) => void;
  onBookmark?: (postId: string, bookmarked: boolean) => void;
  onShare?: (postId: string) => void;
  onLoadComments?: (postId: string, page: number) => Promise<Comment[]>;
  onAddComment?: (postId: string, content: string) => Promise<Comment>;
  onLoadMoreLikes?: (postId: string) => Promise<LikeUser[]>;
  className?: string;
}

export function AdvancedPostCard({
  post,
  currentUser,
  onLike,
  onBookmark,
  onShare,
  onLoadComments,
  onAddComment,
  onLoadMoreLikes,
  className,
}: AdvancedPostCardProps) {
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false);

  const handleBookmark = () => {
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);
    onBookmark?.(post.id, newBookmarked);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback>{post.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">{post.author.name}</span>
              {post.author.isVerified && (
                <svg className="w-4 h-4 text-primary fill-current" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              @{post.author.username} · {post.timestamp}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleBookmark}>
              {bookmarked ? "Kaydedilenlerden Çıkar" : "Kaydet"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare?.(post.id)}>Paylaş</DropdownMenuItem>
            <DropdownMenuItem>Bağlantıyı kopyala</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Şikayet Et</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {/* Collapsible Content */}
      <PostContent content={post.content} maxLines={3} />

      {/* Media Carousel */}
      <PostMediaCarousel media={post.media} />

      {/* Engagement Panel (Likes + Comments as Tabs) */}
      <CardContent className="p-4 pb-2">
        <PostEngagementPanel
          postId={post.id}
          initialLiked={post.isLiked}
          likeCount={post.likes}
          likedBy={post.likedBy}
          commentCount={post.comments}
          currentUser={currentUser}
          onLike={(liked) => onLike?.(post.id, liked)}
          onLoadMoreLikes={() => onLoadMoreLikes?.(post.id) ?? Promise.resolve([])}
          onLoadComments={(page) => onLoadComments?.(post.id, page) ?? Promise.resolve([])}
          onAddComment={(content) => onAddComment?.(post.id, content) ?? Promise.resolve({
            id: Date.now().toString(),
            author: { id: "1", name: currentUser?.name ?? "User", username: "user", avatar: currentUser?.avatar ?? "" },
            content,
            createdAt: new Date(),
            likes: 0,
          })}
          shareButton={
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 px-2"
              onClick={() => onShare?.(post.id)}
            >
              <Share2 className="h-5 w-5" />
              {/* <span className="text-sm">{post.shares}</span> */}
            </Button>
          }
          bookmarkButton={
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", bookmarked && "text-primary")}
              onClick={handleBookmark}
            >
              <Bookmark className={cn("h-5 w-5", bookmarked && "fill-current")} />
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
