"use client";

import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { ProgressTimeline01 } from "./progress-timeline-01";
import {
  dummyNow,
  dummyTimelineActive,
  dummyTimelineAfter,
  dummyTimelineBefore,
} from "./dummy-data";
import type { TimelineState } from "./types";

const trLabels = {
  startLabel: "Kayıt Başlangıcı",
  endLabel: "Etkinlik Günü",
  beforeText: (state: TimelineState) =>
    `${state.daysToStart} gün sonra başlıyor`,
  activeText: (state: TimelineState) => `${state.daysToEnd} gün kaldı`,
  afterText: "Etkinlik Sona Erdi",
};

export default function ProgressTimeline01Demo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="default">Default (TR)</TabsTrigger>
        <TabsTrigger value="states">3 states</TabsTrigger>
        <TabsTrigger value="bare">Bare</TabsTrigger>
        <TabsTrigger value="custom">Custom render</TabsTrigger>
        <TabsTrigger value="value">Value escape hatch</TabsTrigger>
      </SwipeTabsList>

      {/* 1. Default — Turkish, mirrors the kasder source verbatim */}
      <TabsContent value="default" className="mt-6">
        <div className="max-w-3xl mx-auto">
          <ProgressTimeline01
            heading="Zaman Çizelgesi"
            start={dummyTimelineActive.start}
            end={dummyTimelineActive.end}
            now={dummyNow}
            labels={trLabels}
          />
        </div>
      </TabsContent>

      {/* 2. 3 states — before / active / after stacked */}
      <TabsContent value="states" className="mt-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <ProgressTimeline01
            heading="Before — registration not open yet"
            start={dummyTimelineBefore.start}
            end={dummyTimelineBefore.end}
            now={dummyNow}
          />
          <ProgressTimeline01
            heading="Active — currently in progress"
            start={dummyTimelineActive.start}
            end={dummyTimelineActive.end}
            now={dummyNow}
          />
          <ProgressTimeline01
            heading="After — has ended"
            start={dummyTimelineAfter.start}
            end={dummyTimelineAfter.end}
            now={dummyNow}
          />
        </div>
      </TabsContent>

      {/* 3. Bare — no card chrome, no marker, no heading */}
      <TabsContent value="bare" className="mt-6">
        <div className="max-w-3xl mx-auto space-y-2">
          <p className="text-sm text-muted-foreground">
            Embedded use — <code>framed=&#123;false&#125;</code> +{" "}
            <code>marker=&quot;none&quot;</code>. Drop into a banner / dashboard
            tile.
          </p>
          <ProgressTimeline01
            start={dummyTimelineActive.start}
            end={dummyTimelineActive.end}
            now={dummyNow}
            framed={false}
            marker="none"
          />
        </div>
      </TabsContent>

      {/* 4. Custom render — full takeover of center label */}
      <TabsContent value="custom" className="mt-6">
        <div className="max-w-3xl mx-auto space-y-2">
          <p className="text-sm text-muted-foreground">
            <code>renderCenterLabel(state)</code> — full control. Here:
            percent + days-left composed.
          </p>
          <ProgressTimeline01
            heading="Project Sprint"
            start={dummyTimelineActive.start}
            end={dummyTimelineActive.end}
            now={dummyNow}
            renderCenterLabel={(state) => (
              <span className="inline-flex items-baseline gap-2">
                <span className="text-base font-bold text-primary">
                  {Math.round(state.percent)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {state.daysToEnd} days left
                </span>
              </span>
            )}
          />
        </div>
      </TabsContent>

      {/* 5. Value escape hatch — non-time-based progress */}
      <TabsContent value="value" className="mt-6">
        <div className="max-w-3xl mx-auto space-y-2">
          <p className="text-sm text-muted-foreground">
            <code>value</code> overrides start/end-derived percent — useful for
            non-time-based progress (course completion, fundraising, etc.).
            State (and therefore center label) still derives from dates so the
            countdown stays meaningful.
          </p>
          <ProgressTimeline01
            heading="Course Progress"
            start={dummyTimelineActive.start}
            end={dummyTimelineActive.end}
            now={dummyNow}
            value={42}
            labels={{
              startLabel: "Module 1",
              endLabel: "Module 12",
              activeText: () => "42% complete (5 of 12 modules)",
            }}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
