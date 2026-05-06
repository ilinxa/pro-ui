"use client";
import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PostVideoPlayer } from "./PostVideoPlayer";
import useEmblaCarousel from "embla-carousel-react";

export interface PostMedia {
  id: string;
  type: "image" | "video";
  url: string;
  alt?: string;
  poster?: string;
}

interface PostMediaCarouselProps {
  media: PostMedia[];
  onDoubleTap?: () => void;
  className?: string;
}

export function PostMediaCarousel({ media, onDoubleTap, className }: PostMediaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: false,
    loop: media.length > 1,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  emblaApi?.on("select", () => {
    setCurrentIndex(emblaApi.selectedScrollSnap());
  });

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      onDoubleTap?.();
    }
    setLastTap(now);
  };

  if (media.length === 0) return null;

  // Single media item
  if (media.length === 1) {
    const item = media[0];
    return (
      <div 
        className={cn("relative aspect-square bg-muted overflow-hidden", className)}
        onClick={handleTap}
      >
        {item.type === "video" ? (
          <PostVideoPlayer src={item.url} poster={item.poster} />
        ) : (
          <img
            src={item.url}
            alt={item.alt || "Post image"}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    );
  }

  // Multiple media items - carousel
  return (
    <div className={cn("relative", className)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex" onClick={handleTap}>
          {media.map((item, index) => (
            <div
              key={item.id}
              className="relative flex-[0_0_85%] min-w-0 mx-1 first:ml-[7.5%] last:mr-[7.5%]"
            >
              <div 
                className={cn(
                  "aspect-square rounded-lg overflow-hidden transition-all duration-300",
                  index === currentIndex 
                    ? "scale-100 opacity-100" 
                    : "scale-95 opacity-60"
                )}
              >
                {item.type === "video" ? (
                  <PostVideoPlayer 
                    src={item.url} 
                    poster={item.poster}
                    isActive={index === currentIndex}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.alt || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 z-10"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 z-10"
        onClick={scrollNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {media.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === currentIndex
                ? "bg-primary w-4"
                : "bg-primary/40 w-1.5 hover:bg-primary/60"
            )}
          />
        ))}
      </div>
    </div>
  );
}
