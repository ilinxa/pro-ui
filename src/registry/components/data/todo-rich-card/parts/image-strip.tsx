"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TodoImage } from "../types";

export function ImageStrip({
  images,
  className,
}: {
  images: TodoImage[];
  className?: string;
}) {
  if (images.length === 0) return null;

  return (
    <ScrollArea className={cn("w-full whitespace-nowrap", className)}>
      <div className="flex gap-2 pb-2">
        {images.map((img, i) => (
          <a
            key={i}
            href={img.src}
            target="_blank"
            rel="noopener noreferrer"
            className="block shrink-0"
            title={img.caption}
          >
            <figure className="flex w-32 flex-col gap-1">
              <img
                src={img.src}
                alt={img.alt ?? ""}
                className="h-20 w-32 rounded-md border border-border object-cover"
              />
              {img.caption ? (
                <figcaption className="truncate text-xs text-muted-foreground">
                  {img.caption}
                </figcaption>
              ) : null}
            </figure>
          </a>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
