"use client";

import { cn } from "@/lib/utils";
import type { TodoItem } from "../types";
import { ImageStrip } from "./image-strip";
import { LinkChip } from "./link-chip";
import { PersonChip } from "./person-chip";
import { TimeInfo } from "./time-info";

export function CardBody({ item }: { item: TodoItem }) {
  const hasPeople = item.targetPerson || item.creatorPerson;
  const hasLinks = item.links && item.links.length > 0;
  const hasImages = item.images && item.images.length > 0;

  return (
    <div className="mt-3 space-y-2 text-sm">
      {item.description ? (
        <p className="text-muted-foreground whitespace-pre-wrap">{item.description}</p>
      ) : null}
      <TimeInfo item={item} />
      {hasPeople ? (
        <div className="flex flex-wrap items-center gap-2">
          {item.targetPerson ? (
            <PersonChip person={item.targetPerson} variant="target" />
          ) : null}
          {item.creatorPerson ? (
            <PersonChip person={item.creatorPerson} variant="creator" />
          ) : null}
        </div>
      ) : null}
      {hasLinks ? (
        <div className={cn("flex flex-wrap gap-1.5")}>
          {item.links!.map((link, i) => (
            <LinkChip key={i} link={link} />
          ))}
        </div>
      ) : null}
      {hasImages ? <ImageStrip images={item.images!} /> : null}
    </div>
  );
}
