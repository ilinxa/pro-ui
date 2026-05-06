"use client";

import { Bookmark, CalendarPlus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegistrationCard01 } from "./registration-card-01";
import {
  dummyRegistrationClosed,
  dummyRegistrationFull,
  dummyRegistrationLastSpots,
  dummyRegistrationOpen,
  dummyRegistrationUrgent,
  fundraisingLabels,
  trLabels,
} from "./dummy-data";

const noop = () => {};

export default function RegistrationCard01Demo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="default">Default (TR)</TabsTrigger>
        <TabsTrigger value="states">All states</TabsTrigger>
        <TabsTrigger value="no-quota">No-quota</TabsTrigger>
        <TabsTrigger value="actions">Custom actions</TabsTrigger>
        <TabsTrigger value="bare">Bare + relabeled</TabsTrigger>
      </TabsList>

      {/* 1. Default (TR) — kasder Kayıt Durumu verbatim */}
      <TabsContent value="default" className="mt-6">
        <div className="max-w-sm mx-auto">
          <RegistrationCard01
            heading="Kayıt Durumu"
            capacity={dummyRegistrationLastSpots.capacity}
            registered={dummyRegistrationLastSpots.registered}
            onRegister={noop}
            onShare={noop}
            labels={trLabels}
          />
        </div>
      </TabsContent>

      {/* 2. All states — open / lastSpots / urgent / full / closed stacked */}
      <TabsContent value="states" className="mt-6">
        <div className="max-w-sm mx-auto space-y-6">
          <RegistrationCard01
            heading="Open (142/500)"
            capacity={dummyRegistrationOpen.capacity}
            registered={dummyRegistrationOpen.registered}
            onRegister={noop}
            onShare={noop}
          />
          <RegistrationCard01
            heading="Last spots (423/500 — ≥80% full)"
            capacity={dummyRegistrationLastSpots.capacity}
            registered={dummyRegistrationLastSpots.registered}
            onRegister={noop}
            onShare={noop}
          />
          <RegistrationCard01
            heading="Urgent (95/100 — ≤10 spots → destructive color)"
            capacity={dummyRegistrationUrgent.capacity}
            registered={dummyRegistrationUrgent.registered}
            onRegister={noop}
            onShare={noop}
          />
          <RegistrationCard01
            heading="Full (50/50 — sold out)"
            capacity={dummyRegistrationFull.capacity}
            registered={dummyRegistrationFull.registered}
            onRegister={noop}
            onShare={noop}
          />
          <RegistrationCard01
            heading="Closed (host-driven — e.g. event expired)"
            capacity={dummyRegistrationClosed.capacity}
            registered={dummyRegistrationClosed.registered}
            closed={dummyRegistrationClosed.closed}
            onRegister={noop}
            onShare={noop}
          />
        </div>
      </TabsContent>

      {/* 3. No-quota — capacity-less, just CTA + share */}
      <TabsContent value="no-quota" className="mt-6">
        <div className="max-w-sm mx-auto space-y-2">
          <p className="text-sm text-muted-foreground">
            No <code>capacity</code> / <code>registered</code> — bar +
            counter rows hide; CTA + share remain. Useful for unlimited /
            drop-in events.
          </p>
          <RegistrationCard01
            heading="Sign up"
            onRegister={noop}
            onShare={noop}
          />
        </div>
      </TabsContent>

      {/* 4. Custom actions — replaces default share with cluster */}
      <TabsContent value="actions" className="mt-6">
        <div className="max-w-sm mx-auto space-y-2">
          <p className="text-sm text-muted-foreground">
            <code>actions</code> slot — fully replaces the default share
            button. Drop in calendar + save + share cluster, or compose with{" "}
            <code>share-bar-01</code>.
          </p>
          <RegistrationCard01
            heading="Registration"
            capacity={200}
            registered={172}
            onRegister={noop}
            actions={
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={noop}
                >
                  <CalendarPlus aria-hidden="true" className="size-4" />
                  Cal
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={noop}
                >
                  <Bookmark aria-hidden="true" className="size-4" />
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={noop}
                >
                  <Share2 aria-hidden="true" className="size-4" />
                  Share
                </Button>
              </div>
            }
          />
        </div>
      </TabsContent>

      {/* 5. Bare + relabeled — fundraising goal */}
      <TabsContent value="bare" className="mt-6">
        <div className="max-w-sm mx-auto rounded-2xl border border-border/50 bg-card p-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            <code>framed=&#123;false&#125;</code> embedded inside an outer
            card + relabeled for a fundraising-goal context.
          </p>
          <RegistrationCard01
            heading="Fundraising Goal"
            capacity={50000}
            registered={32000}
            framed={false}
            onRegister={noop}
            onShare={noop}
            labels={fundraisingLabels}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
