"use client";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PostContentProps {
  content: string;
  maxLines?: number;
  className?: string;
}

export function PostContent({ content, maxLines = 3, className }: PostContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = contentRef.current;
    if (element) {
      // Check if content is truncated
      const lineHeight = parseInt(getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * maxLines;
      setIsTruncated(element.scrollHeight > maxHeight);
    }
  }, [content, maxLines]);

  if (!content) return null;

  return (
    <div className={cn("px-4 pb-3", className)}>
      <p
        ref={contentRef}
        className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap break-words",
          !isExpanded && isTruncated && "line-clamp-3"
        )}
        style={{ 
          display: "-webkit-box",
          WebkitLineClamp: isExpanded ? "unset" : maxLines,
          WebkitBoxOrient: "vertical",
          overflow: isExpanded ? "visible" : "hidden"
        }}
      >
        {content}
      </p>
      {isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-medium text-muted-foreground hover:text-foreground mt-1 transition-colors"
        >
          {isExpanded ? "Daha az göster" : "Daha fazla göster"}
        </button>
      )}
    </div>
  );
}
