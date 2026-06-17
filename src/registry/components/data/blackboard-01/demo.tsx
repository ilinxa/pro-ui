"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { Blackboard01 } from "./blackboard-01";
import { BlackboardRoot } from "./parts/blackboard-root";
import { BlackboardSurface } from "./parts/blackboard-surface";
import { BlackboardPinnedRow } from "./parts/blackboard-pinned-row";
import { BlackboardNoteStream } from "./parts/blackboard-note-stream";
import type { BlackboardNote, NoteDraft } from "./types";
import {
  BLACKBOARD_01_CURRENT_USER,
  BLACKBOARD_01_MEMBERS,
  BLACKBOARD_01_NOTES,
  makeOlderNotes,
} from "./dummy-data";

const OLDER_PAGES = 3;

export default function Blackboard01Demo() {
  const [notes, setNotes] = React.useState<BlackboardNote[]>(BLACKBOARD_01_NOTES);
  const [pinnedIds, setPinnedIds] = React.useState<string[]>(["n-101"]);
  const [lastSeenNoteId, setLastSeenNoteId] = React.useState<string | null>("n-104");
  const pageRef = React.useRef(0);
  const [hasMoreOlder, setHasMoreOlder] = React.useState(true);

  const onPostNote = React.useCallback(
    (draft: NoteDraft) =>
      new Promise<BlackboardNote>((resolve) => {
        // Simulate a backend round-trip so the optimistic → reconcile path is exercised.
        setTimeout(() => {
          const real: BlackboardNote = {
            id: crypto.randomUUID(),
            text: draft.text,
            author: BLACKBOARD_01_CURRENT_USER,
            createdAt: new Date().toISOString(),
            style: draft.style,
            mentions: draft.mentions,
          };
          setNotes((prev) => [...prev, real]);
          resolve(real);
        }, 350);
      }),
    [],
  );

  const onLoadOlder = React.useCallback(async (_beforeId: string | null, limit: number) => {
    await new Promise((r) => setTimeout(r, 500));
    const page = pageRef.current;
    pageRef.current += 1;
    if (pageRef.current >= OLDER_PAGES) setHasMoreOlder(false);
    const older = makeOlderNotes(page, limit);
    setNotes((prev) => [...older, ...prev]);
    return older;
  }, []);

  const onDeleteNote = React.useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setPinnedIds((prev) => prev.filter((p) => p !== id));
  }, []);

  return (
    <Tabs defaultValue="full" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="full">Full board</TabsTrigger>
        <TabsTrigger value="lighter">Lighter (read-only)</TabsTrigger>
        <TabsTrigger value="custom">Custom background</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="full">
        <p className="mb-2 text-sm text-muted-foreground">
          <strong>Double-click the board</strong> to reveal the composer (Esc or ✕ to dismiss).
          Pick an ink color, chalk width, and font; type <code>@</code> to mention a teammate; scroll
          up to lazy-load older notes; the red number marks unread.
        </p>
        <div className="h-135">
          <Blackboard01
            className="h-full"
            notes={notes}
            currentUser={BLACKBOARD_01_CURRENT_USER}
            members={BLACKBOARD_01_MEMBERS}
            canWrite
            onPostNote={onPostNote}
            onLoadOlder={onLoadOlder}
            hasMoreOlder={hasMoreOlder}
            pinnedNoteIds={pinnedIds}
            onPinNote={(id) => setPinnedIds((p) => [...p, id])}
            onUnpinNote={(id) => setPinnedIds((p) => p.filter((x) => x !== id))}
            onDeleteNote={onDeleteNote}
            onMention={() => {}}
            lastSeenNoteId={lastSeenNoteId}
            onSeen={setLastSeenNoteId}
            editableBackground
          />
        </div>
      </TabsContent>

      <TabsContent value="lighter">
        <p className="mb-2 text-sm text-muted-foreground">
          Composed à la carte — just <code>BlackboardRoot</code> + <code>BlackboardSurface</code> +{" "}
          <code>BlackboardNoteStream</code>. No composer, so none of the writing / mention bundle
          ships. A kiosk or status wall pushes notes via the imperative handle.
        </p>
        <div className="h-110">
          <BlackboardRoot
            className="h-full"
            notes={notes}
            currentUser={BLACKBOARD_01_CURRENT_USER}
            pinnedNoteIds={pinnedIds}
          >
            <BlackboardSurface>
              <BlackboardPinnedRow />
              <BlackboardNoteStream />
            </BlackboardSurface>
          </BlackboardRoot>
        </div>
      </TabsContent>

      <TabsContent value="custom">
        <p className="mb-2 text-sm text-muted-foreground">
          The board surface is themeable — a solid color or a custom image (with a legibility
          overlay). Click the palette (top-left) to switch, or paste an image URL. This board also
          uses <code>composerMode=&quot;always&quot;</code> to keep the composer docked.
        </p>
        <div className="h-135">
          <Blackboard01
            className="h-full"
            notes={notes}
            currentUser={BLACKBOARD_01_CURRENT_USER}
            members={BLACKBOARD_01_MEMBERS}
            canWrite
            onPostNote={onPostNote}
            onDeleteNote={onDeleteNote}
            composerMode="always"
            defaultBackground={{ kind: "color", value: "oklch(0.20 0.02 160)" }}
            editableBackground
            showNotificationBadge={false}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
