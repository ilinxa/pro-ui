"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StoryComposer01 } from "./story-composer-01";
import { SAMPLE_UPLOAD_URL } from "./dummy-data";
import type { PublishedStory } from "./types";

export default function StoryComposer01Demo() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastPublished, setLastPublished] = useState<PublishedStory | null>(
    null,
  );

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <Button onClick={() => setIsOpen(true)}>Open composer</Button>
      <p className="text-xs text-muted-foreground">
        C2 scaffold — capture surface lands in C3.
      </p>
      <StoryComposer01
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        uploadUrl={SAMPLE_UPLOAD_URL}
        onPublished={(story) => {
          setLastPublished(story);
          setIsOpen(false);
        }}
      />
      {lastPublished ? (
        <pre className="max-w-xs overflow-x-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
          {JSON.stringify(lastPublished, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
