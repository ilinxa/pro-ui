"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, CalendarPlus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventCard01 } from "./event-card-01";
import {
  dummyCustomTypeStyles,
  dummyEvents,
  dummyNow,
  dummyTrEvents,
  dummyTrLabels,
  dummyTrTypeStyles,
  dummyTypeStyles,
  formatDateTr,
} from "./dummy-data";
import type { EventCardItem } from "./types";

const HREF_BASE = "/events";

function makeHref(event: EventCardItem) {
  return `${HREF_BASE}/${event.id}`;
}

function ActionsCluster({
  eventId,
  saved,
  onToggle,
}: {
  eventId: string;
  saved: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle(eventId);
        }}
        aria-label={saved ? "Remove from saved events" : "Save event"}
      >
        {saved ? (
          <BookmarkCheck aria-hidden="true" className="size-4" />
        ) : (
          <Bookmark aria-hidden="true" className="size-4" />
        )}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Add to calendar"
      >
        <CalendarPlus aria-hidden="true" className="size-4" />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Share event"
      >
        <Share2 aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

const feedSlice = dummyEvents.filter((e) =>
  ["evt-open", "evt-ongoing", "evt-upcoming", "evt-lastspots"].includes(e.id),
);

const featuredEvent = dummyEvents.find((e) => e.id === "evt-featured")!;
const openEvent = dummyEvents.find((e) => e.id === "evt-open")!;

export default function EventCard01Demo() {
  const [saved, setSaved] = useState<Set<string>>(() => new Set());

  const toggleSaved = (id: string) =>
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  return (
    <Tabs defaultValue="grid" className="w-full">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="grid">Grid</TabsTrigger>
        <TabsTrigger value="feed">Feed</TabsTrigger>
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="compact">Compact</TabsTrigger>
        <TabsTrigger value="featured">Featured</TabsTrigger>
        <TabsTrigger value="localized">Localized (TR)</TabsTrigger>
        <TabsTrigger value="custom-types">Custom types</TabsTrigger>
        <TabsTrigger value="actions">Actions slot</TabsTrigger>
      </TabsList>

      {/* 1. Grid */}
      <TabsContent value="grid" className="mt-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyEvents.map((event) => (
            <EventCard01
              key={event.id}
              event={event}
              variant="grid"
              href={makeHref(event)}
              now={dummyNow}
              typeStyles={dummyTypeStyles}
            />
          ))}
        </div>
      </TabsContent>

      {/* 2. Feed */}
      <TabsContent value="feed" className="mt-6">
        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
          {feedSlice.map((event) => (
            <EventCard01
              key={event.id}
              event={event}
              variant="feed"
              href={makeHref(event)}
              now={dummyNow}
              typeStyles={dummyTypeStyles}
            />
          ))}
        </div>
      </TabsContent>

      {/* 3. List — dense info-rich rows */}
      <TabsContent value="list" className="mt-6">
        <p className="mb-3 text-sm text-muted-foreground">
          List variant — dense info-rich row with status + 4-icon meta line
          (date / time / location / spots-left) + status-aware right indicator
          (days-until count for upcoming, &quot;Live now&quot; pulsing pill for ongoing,
          chevron for ended). Featured events get a left accent border.
        </p>
        <div className="rounded-2xl border border-border/50 bg-card max-w-3xl mx-auto">
          {dummyEvents.map((event) => (
            <EventCard01
              key={event.id}
              event={event}
              variant="list"
              href={makeHref(event)}
              now={dummyNow}
              typeStyles={dummyTypeStyles}
            />
          ))}
        </div>
      </TabsContent>

      {/* 4. Compact — text-only minimal rows for sidebars / widgets */}
      <TabsContent value="compact" className="mt-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Compact variant — text-only minimal row for sidebars / widgets.
              No thumbnail, no status badge, no capacity bar — title + type
              pill + 3 stacked meta lines (date / time / location). Localized
              labels applied here to mirror the source pattern.
            </p>
            <div className="rounded-2xl border border-border/50 bg-card p-2 max-w-md">
              {dummyTrEvents.slice(0, 4).map((event) => (
                <EventCard01
                  key={event.id}
                  event={event}
                  variant="compact"
                  href={makeHref(event)}
                  now={dummyNow}
                  typeStyles={dummyTrTypeStyles}
                  labels={dummyTrLabels}
                  formatDate={(d) =>
                    new Date(d).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                    })
                  }
                />
              ))}
              <div className="text-center pt-3 pb-2">
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                >
                  Tüm Etkinlikler →
                </a>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Same compact variant in English with the default labels &amp;
              full date format.
            </p>
            <div className="rounded-2xl border border-border/50 bg-card p-2 max-w-md">
              {dummyEvents.slice(0, 4).map((event) => (
                <EventCard01
                  key={event.id}
                  event={event}
                  variant="compact"
                  href={makeHref(event)}
                  now={dummyNow}
                  typeStyles={dummyTypeStyles}
                />
              ))}
              <div className="text-center pt-3 pb-2">
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                >
                  All events →
                </a>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* 5. Featured — grid + feed side by side */}
      <TabsContent value="featured" className="mt-6">
        <div className="space-y-8">
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Grid variant — top accent border + star prefix on title.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <EventCard01
                event={featuredEvent}
                variant="grid"
                href={makeHref(featuredEvent)}
                now={dummyNow}
                typeStyles={dummyTypeStyles}
              />
              <EventCard01
                event={openEvent}
                variant="grid"
                href={makeHref(openEvent)}
                now={dummyNow}
                typeStyles={dummyTypeStyles}
              />
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Feed variant — inset ring + star prefix.
            </p>
            <div className="max-w-3xl mx-auto">
              <EventCard01
                event={featuredEvent}
                variant="feed"
                href={makeHref(featuredEvent)}
                now={dummyNow}
                typeStyles={dummyTypeStyles}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* 4. Localized (TR) */}
      <TabsContent value="localized" className="mt-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyTrEvents.map((event) => (
            <EventCard01
              key={event.id}
              event={event}
              variant="grid"
              href={makeHref(event)}
              now={dummyNow}
              typeStyles={dummyTrTypeStyles}
              labels={dummyTrLabels}
              formatDate={formatDateTr}
            />
          ))}
        </div>
      </TabsContent>

      {/* 5. Custom types */}
      <TabsContent value="custom-types" className="mt-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyEvents.map((event) => (
            <EventCard01
              key={event.id}
              event={event}
              variant="grid"
              href={makeHref(event)}
              now={dummyNow}
              typeStyles={dummyCustomTypeStyles}
            />
          ))}
        </div>
      </TabsContent>

      {/* 6. Actions slot + custom href */}
      <TabsContent value="actions" className="mt-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Action buttons stop propagation — clicks on Save / Calendar / Share
            don&apos;t navigate. The rest of the card surface still does.
            Clicked saved-state:{" "}
            <span className="font-mono text-xs">
              {saved.size > 0 ? Array.from(saved).join(", ") : "(none)"}
            </span>
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dummyEvents.slice(0, 3).map((event) => (
              <EventCard01
                key={event.id}
                event={event}
                variant="grid"
                getHref={(e) => `/etkinlik/${e.id}`}
                now={dummyNow}
                typeStyles={dummyTypeStyles}
                actions={
                  <ActionsCluster
                    eventId={event.id}
                    saved={saved.has(event.id)}
                    onToggle={toggleSaved}
                  />
                }
              />
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
