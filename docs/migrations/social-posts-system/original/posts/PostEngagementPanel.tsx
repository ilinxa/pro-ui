"use client";
import { useState, useCallback } from "react";
import { Heart, MessageCircle, Send, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import useEmblaCarousel from "embla-carousel-react";

export interface LikeUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  createdAt: Date;
  likes: number;
  isLiked?: boolean;
}

type ActiveTab = "none" | "likes" | "comments";

interface PostEngagementPanelProps {
  postId: string;
  // Like props
  initialLiked?: boolean;
  likeCount: number;
  likedBy?: LikeUser[];
  onLike?: (liked: boolean) => void;
  onLoadMoreLikes?: () => Promise<LikeUser[]>;
  // Comment props
  commentCount: number;
  initialComments?: Comment[];
  currentUser?: {
    avatar: string;
    name: string;
  };
  onLoadComments?: (page: number) => Promise<Comment[]>;
  onAddComment?: (content: string) => Promise<Comment>;
  onLikeComment?: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  // Extra buttons to show in the action row
  shareButton?: React.ReactNode;
  bookmarkButton?: React.ReactNode;
  className?: string;
}

const PAGE_SIZE = 10;

export function PostEngagementPanel({
  postId,
  initialLiked = false,
  likeCount: initialLikeCount,
  likedBy = [],
  onLike,
  onLoadMoreLikes,
  commentCount,
  initialComments = [],
  currentUser = { avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100", name: "Kullanıcı" },
  onLoadComments,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  shareButton,
  bookmarkButton,
  className,
}: PostEngagementPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("none");
  
  // Like state
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likeUsers, setLikeUsers] = useState<LikeUser[]>(likedBy);
  const [isLoadingMoreLikes, setIsLoadingMoreLikes] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  // Comment state
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(commentCount > PAGE_SIZE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Embla carousel for likes
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps"
  });

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    onLike?.(newLiked);
  };

  const triggerDoubleTapLike = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount(prev => prev + 1);
      onLike?.(true);
    }
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 800);
  };

  const handleTabClick = async (tab: "likes" | "comments") => {
    if (activeTab === tab) {
      setActiveTab("none");
      return;
    }
    
    setActiveTab(tab);
    
    if (tab === "comments" && comments.length === 0 && onLoadComments) {
      await loadComments(1);
    }
  };

  const loadMoreLikes = async () => {
    if (!onLoadMoreLikes || isLoadingMoreLikes) return;
    setIsLoadingMoreLikes(true);
    try {
      const moreUsers = await onLoadMoreLikes();
      setLikeUsers(prev => [...prev, ...moreUsers]);
    } finally {
      setIsLoadingMoreLikes(false);
    }
  };

  const loadComments = useCallback(async (page: number) => {
    if (!onLoadComments || isLoadingComments) return;
    setIsLoadingComments(true);
    try {
      const loadedComments = await onLoadComments(page);
      if (page === 1) {
        setComments(loadedComments);
      } else {
        setComments(prev => [...prev, ...loadedComments]);
      }
      setHasMoreComments(loadedComments.length === PAGE_SIZE);
      setCurrentPage(page);
    } finally {
      setIsLoadingComments(false);
    }
  }, [onLoadComments, isLoadingComments]);

  const handleLoadMoreComments = () => {
    loadComments(currentPage + 1);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !onAddComment || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const comment = await onAddComment(newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleLikeComment = (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
        : c
    ));
    onLikeComment?.(commentId);
  };

  const scrollLikesPrev = () => emblaApi?.scrollPrev();
  const scrollLikesNext = () => emblaApi?.scrollNext();

  return (
    <div className={cn("relative", className)}>
      {/* Double tap heart animation overlay */}
      {showHeartAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <Heart 
            className="h-24 w-24 text-destructive fill-current animate-ping" 
            style={{ animationDuration: "0.6s" }}
          />
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 px-2 transition-colors",
              liked && "text-destructive",
              activeTab === "likes" && "bg-muted"
            )}
            onClick={handleLike}
          >
            <Heart className={cn("h-5 w-5 transition-transform", liked && "fill-current scale-110")} />
            <span className="text-sm font-medium">{likeCount}</span>
          </Button>

          {likeCount > 0 && likeUsers.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 text-muted-foreground text-xs",
                activeTab === "likes" && "bg-muted text-foreground"
              )}
              onClick={() => handleTabClick("likes")}
            >
              {activeTab === "likes" ? "Gizle" : "Beğenenler"}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 px-2",
              activeTab === "comments" && "bg-muted"
            )}
            onClick={() => handleTabClick("comments")}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">{commentCount}</span>
          </Button>
          
          {shareButton}
        </div>
        
        {bookmarkButton && (
          <div className="flex items-center gap-1">
            {bookmarkButton}
          </div>
        )}
      </div>

      {/* Expandable Panel - Only one visible at a time */}
      {activeTab !== "none" && (
        <div className="mt-3 border-t pt-3 animate-fade-in">
          {/* Likes Panel - Horizontal Swipeable Slider */}
          {activeTab === "likes" && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">Beğenenler</p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={scrollLikesPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={scrollLikesNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-3">
                  {likeUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex-[0_0_auto] flex flex-col items-center gap-1 p-2 min-w-[80px]"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium truncate max-w-[70px] text-center">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[70px]">@{user.username}</p>
                    </div>
                  ))}
                  
                  {likeUsers.length < likeCount && (
                    <div className="flex-[0_0_auto] flex items-center justify-center min-w-[80px]">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 w-12 rounded-full text-xs"
                        onClick={loadMoreLikes}
                        disabled={isLoadingMoreLikes}
                      >
                        {isLoadingMoreLikes ? "..." : `+${likeCount - likeUsers.length}`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comments Panel - Scrollable with Pagination */}
          {activeTab === "comments" && (
            <div className="flex flex-col h-80">
              {/* Comments List - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4">
                <div className="space-y-4 pb-2">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onLike={() => handleLikeComment(comment.id)}
                      onDelete={() => onDeleteComment?.(comment.id)}
                    />
                  ))}

                  {isLoadingComments && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  )}

                  {hasMoreComments && !isLoadingComments && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={handleLoadMoreComments}
                    >
                      Daha fazla yorum göster
                    </Button>
                  )}

                  {!isLoadingComments && comments.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Henüz yorum yok. İlk yorumu sen yap!
                    </p>
                  )}
                </div>
              </div>

              {/* Comment Input - Sticky at bottom */}
              <div className="flex items-center gap-2 pt-3 px-4 border-t bg-background">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="relative flex-1">
                  <Input
                    placeholder="Yorum yaz..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pr-10 bg-muted/50 border-0"
                    disabled={isSubmitting}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    <Send className={cn("h-4 w-4", newComment.trim() && "text-primary")} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Separate CommentItem component for reusability
interface CommentItemProps {
  comment: Comment;
  onLike: () => void;
  onDelete: () => void;
}

function CommentItem({ comment, onLike, onDelete }: CommentItemProps) {
  return (
    <div className="flex items-start gap-2 group">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.author.avatar} />
        <AvatarFallback>{comment.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-xl px-3 py-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
          </div>
          <p className="text-sm mt-0.5">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: tr })}
          </span>
          <button
            onClick={onLike}
            className={cn(
              "text-xs font-medium hover:text-destructive transition-colors",
              comment.isLiked ? "text-destructive" : "text-muted-foreground"
            )}
          >
            Beğen {comment.likes > 0 && `(${comment.likes})`}
          </button>
          <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Yanıtla
          </button>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Şikayet Et</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { CommentItem };
export type { LikeUser as EngagementLikeUser, Comment as EngagementComment };
