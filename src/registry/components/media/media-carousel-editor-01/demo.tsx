"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { Button } from "@/components/ui/button";
import { MediaCarouselEditor01 } from "./media-carousel-editor-01";
import type {
  MediaCarouselEditor01Handle,
  MediaCarouselItem,
} from "./types";
import { dummyCarouselItems } from "./dummy-data";

function Status({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 font-mono text-xs text-muted-foreground">{children}</p>
  );
}

function EmptyTab() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="mx-auto max-w-md">
      <MediaCarouselEditor01
        onChange={(items) => setCount(items.length)}
        editorProps={{ enabledTools: ["crop", "filters", "adjust", "text"] }}
      />
      <Status>
        Drop or browse photos + videos. {count} item{count === 1 ? "" : "s"}.
      </Status>
    </div>
  );
}

function SeededTab() {
  return (
    <div className="mx-auto max-w-md">
      <MediaCarouselEditor01
        defaultValue={dummyCarouselItems}
        editorProps={{ enabledTools: ["crop", "filters", "adjust"] }}
      />
      <Status>
        Seeded from remote URLs (CMS re-edit). Select a thumb, drag to reorder,
        press Edit on a photo. Video Edit is deferred to v0.2.
      </Status>
    </div>
  );
}

function ControlledTab() {
  const [items, setItems] = React.useState<MediaCarouselItem[]>([]);
  const ref = React.useRef<MediaCarouselEditor01Handle>(null);
  const [exported, setExported] = React.useState<number | null>(null);

  return (
    <div className="mx-auto max-w-md">
      <MediaCarouselEditor01
        ref={ref}
        value={items}
        onChange={setItems}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={async () => {
            const out = await ref.current?.export();
            setExported(out?.length ?? 0);
          }}
        >
          Export (publish)
        </Button>
        <Button size="sm" variant="ghost" onClick={() => ref.current?.reset()}>
          Reset
        </Button>
      </div>
      <Status>
        Controlled: {items.length} item{items.length === 1 ? "" : "s"} ·{" "}
        {items.filter((i) => i.kind === "image").length} photo /{" "}
        {items.filter((i) => i.kind === "video").length} video
        {exported !== null ? ` · last export → ${exported} items` : ""}
      </Status>
    </div>
  );
}

function MaxTab() {
  const [warn, setWarn] = React.useState<string | null>(null);
  return (
    <div className="mx-auto max-w-md">
      <MediaCarouselEditor01
        maxItems={3}
        defaultValue={dummyCarouselItems.slice(0, 2)}
        onMaxItemsExceeded={(attempted, max) =>
          setWarn(`Tried ${attempted}, cap is ${max}.`)
        }
      />
      <Status>
        Cap is 3. {warn ?? "Add more until the tile disappears."}
      </Status>
    </div>
  );
}

export default function MediaCarouselEditor01Demo() {
  const [tab, setTab] = React.useState("seeded");
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="seeded">Seeded (re-edit)</TabsTrigger>
        <TabsTrigger value="controlled">Controlled + export</TabsTrigger>
        <TabsTrigger value="max">Max 3</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="empty" className="pt-4">
        <EmptyTab />
      </TabsContent>
      <TabsContent value="seeded" className="pt-4">
        <SeededTab />
      </TabsContent>
      <TabsContent value="controlled" className="pt-4">
        <ControlledTab />
      </TabsContent>
      <TabsContent value="max" className="pt-4">
        <MaxTab />
      </TabsContent>
    </Tabs>
  );
}
