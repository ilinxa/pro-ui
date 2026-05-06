"use client";

import { AtSign, Briefcase, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeopleGrid01 } from "./people-grid-01";
import { dummyBoard, dummySpeakers, dummyTeam } from "./dummy-data";

const speakerSocial: Record<
  string,
  { handle?: string; work?: string; site?: string }
> = {
  s1: { handle: "#", work: "#" },
  s2: { work: "#", site: "#" },
  s3: { handle: "#", site: "#" },
};

export default function PeopleGrid01Demo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="default">Default (TR)</TabsTrigger>
        <TabsTrigger value="initials">Initials fallback</TabsTrigger>
        <TabsTrigger value="columns">Columns 2-5</TabsTrigger>
        <TabsTrigger value="linked">Linked + actions</TabsTrigger>
        <TabsTrigger value="custom">Custom renderItem</TabsTrigger>
      </TabsList>

      {/* 1. Default — kasder Konuşmacılar verbatim */}
      <TabsContent value="default" className="mt-6">
        <div className="max-w-4xl mx-auto">
          <PeopleGrid01
            heading="Konuşmacılar"
            items={dummySpeakers}
            columns={3}
          />
        </div>
      </TabsContent>

      {/* 2. Initials fallback — names only, no images */}
      <TabsContent value="initials" className="mt-6">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-sm text-muted-foreground">
            No <code>image</code> fields — falls back to{" "}
            <code>getInitials(name)</code>. Note titles
            (Dr./Prof./Mr./Ms./etc.) are skipped when computing initials.
          </p>
          <PeopleGrid01
            heading="Board of Directors"
            items={dummyBoard}
            columns={5}
            avatarSize="md"
          />
        </div>
      </TabsContent>

      {/* 3. Columns variants — 2 / 3 / 4 / 5 stacked */}
      <TabsContent value="columns" className="mt-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <p className="text-sm text-muted-foreground">
            Same 6-person team rendered with <code>columns</code> 2 / 3 / 4 /
            5. All grids start at <code>grid-cols-1</code> on mobile and
            scale up at sm/md/lg breakpoints. For wider columns
            (<code>4</code> / <code>5</code>), pair with{" "}
            <code>avatarSize=&quot;sm&quot;</code> or{" "}
            <code>&quot;md&quot;</code> for narrow containers.
          </p>
          <PeopleGrid01
            heading="2 columns (lg avatar)"
            headingAs="h3"
            items={dummyTeam}
            columns={2}
            avatarSize="lg"
          />
          <PeopleGrid01
            heading="3 columns (lg avatar — kasder default)"
            headingAs="h3"
            items={dummyTeam}
            columns={3}
            avatarSize="lg"
          />
          <PeopleGrid01
            heading="4 columns (md avatar)"
            headingAs="h3"
            items={dummyTeam}
            columns={4}
            avatarSize="md"
          />
          <PeopleGrid01
            heading="5 columns (sm avatar, start-aligned)"
            headingAs="h3"
            items={dummyTeam}
            columns={5}
            avatarSize="sm"
            alignment="start"
          />
        </div>
      </TabsContent>

      {/* 4. Linked — entire card is a link */}
      <TabsContent value="linked" className="mt-6">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-sm text-muted-foreground">
            Each card has <code>href</code> — entire card surface is
            clickable. Tab to a card and you&apos;ll see the focus-visible
            ring covering the whole rectangle. Polymorphic{" "}
            <code>linkComponent</code> works with NextLink / RemixLink /
            etc.
          </p>
          <PeopleGrid01
            heading="Speakers"
            items={dummySpeakers.map((s) => ({
              ...s,
              href: `/speakers/${s.id}`,
            }))}
            columns={3}
          />
        </div>
      </TabsContent>

      {/* 5. Custom renderItem — speakers with social links */}
      <TabsContent value="custom" className="mt-6">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-sm text-muted-foreground">
            <code>renderItem</code> — full per-card takeover. Here: append a
            social-link row beneath the title.
          </p>
          <PeopleGrid01
            heading="Konuşmacılar"
            items={dummySpeakers}
            columns={3}
            renderItem={(item) => {
              const social = speakerSocial[item.id];
              return (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 mx-auto mb-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground">
                    {item.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.title}
                  </p>
                  {social && (
                    <div className="flex justify-center gap-2 text-muted-foreground">
                      {social.handle && (
                        <a
                          href={social.handle}
                          aria-label={`${item.name} social handle`}
                          className="hover:text-primary"
                        >
                          <AtSign aria-hidden="true" className="w-4 h-4" />
                        </a>
                      )}
                      {social.work && (
                        <a
                          href={social.work}
                          aria-label={`${item.name} professional profile`}
                          className="hover:text-primary"
                        >
                          <Briefcase aria-hidden="true" className="w-4 h-4" />
                        </a>
                      )}
                      {social.site && (
                        <a
                          href={social.site}
                          aria-label={`${item.name} personal website`}
                          className="hover:text-primary"
                        >
                          <Globe aria-hidden="true" className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
