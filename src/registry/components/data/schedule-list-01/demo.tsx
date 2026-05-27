"use client";

import { Mic } from "lucide-react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { ScheduleList01 } from "./schedule-list-01";
import { dummySchedule, dummyScheduleTr } from "./dummy-data";
import type { ScheduleListItem } from "./types";

const speakers: Record<string, { name: string; image: string }> = {
  "2": {
    name: "Prof. Ahmet Yılmaz",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
  },
  "3": {
    name: "Dr. Elif Kaya",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=faces",
  },
};

function SpeakerAugmentedRow({ item }: { item: ScheduleListItem }) {
  const speaker = speakers[item.id];
  return (
    <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
      <div className="w-auto min-w-20 shrink-0">
        <span className="text-lg font-bold text-primary">{item.time}</span>
      </div>
      {speaker && (
        <img
          src={speaker.image}
          alt={speaker.name}
          loading="lazy"
          className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-primary/20"
        />
      )}
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-foreground">{item.title}</h4>
        {speaker && (
          <p className="text-xs text-primary mt-0.5 inline-flex items-center gap-1">
            <Mic aria-hidden="true" className="w-3 h-3" />
            {speaker.name}
          </p>
        )}
        {item.description && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ScheduleList01Demo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="default">Default (TR)</TabsTrigger>
        <TabsTrigger value="english">English</TabsTrigger>
        <TabsTrigger value="bare">Bare rows</TabsTrigger>
        <TabsTrigger value="links">Icons + links</TabsTrigger>
        <TabsTrigger value="custom">Custom renderItem</TabsTrigger>
      </SwipeTabsList>

      {/* 1. Default — Turkish, mirrors the kasder source verbatim */}
      <TabsContent value="default" className="mt-6">
        <div className="max-w-3xl mx-auto">
          <ScheduleList01 heading="Program" items={dummyScheduleTr} />
        </div>
      </TabsContent>

      {/* 2. English — same shape, English content */}
      <TabsContent value="english" className="mt-6">
        <div className="max-w-3xl mx-auto">
          <ScheduleList01 heading="Program" items={dummySchedule} />
        </div>
      </TabsContent>

      {/* 3. Bare rows — framed=false for sidebar/widget contexts */}
      <TabsContent value="bare" className="mt-6">
        <div className="max-w-md mx-auto rounded-2xl border border-border/50 bg-card p-4">
          <ScheduleList01
            heading="Today"
            headingAs="h3"
            framed={false}
            items={dummySchedule.slice(0, 4)}
          />
        </div>
      </TabsContent>

      {/* 4. Icons + links — items with icon + clickable href */}
      <TabsContent value="links" className="mt-6">
        <div className="max-w-3xl mx-auto">
          <p className="mb-3 text-sm text-muted-foreground">
            Items with icons (Coffee / Users / Utensils) and links — the entire
            row is wrapped in a polymorphic link when <code>href</code> is
            provided.
          </p>
          <ScheduleList01
            heading="Conference Day 1"
            items={dummySchedule.map((item) => ({
              ...item,
              href: `#talk-${item.id}`,
            }))}
          />
        </div>
      </TabsContent>

      {/* 5. Custom renderItem — speaker-augmented row */}
      <TabsContent value="custom" className="mt-6">
        <div className="max-w-3xl mx-auto">
          <p className="mb-3 text-sm text-muted-foreground">
            Custom <code>renderItem</code> slot — drops a speaker avatar
            adjacent to the time column on items 2 + 3.
          </p>
          <ScheduleList01
            heading="Program with Speakers"
            items={dummySchedule}
            renderItem={(item) => <SpeakerAugmentedRow item={item} />}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
