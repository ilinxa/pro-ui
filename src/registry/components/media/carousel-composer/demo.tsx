"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { Button } from "@/components/ui/button";
import { CarouselComposer } from "./carousel-composer";
import type {
  CarouselComposerHandle,
  CarouselComposerLabelsInput,
  MediaCarouselItem,
} from "./types";
import { PLATFORM_SAFE_MIME } from "./types";
import { carouselEditing } from "./features/editing";
import {
  arabicLabels,
  dummyCarouselItems,
  dummyStatusItems,
  turkishLabels,
} from "./dummy-data";

function Status({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 font-mono text-xs text-muted-foreground">{children}</p>
  );
}

function EmptyTab() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="mx-auto max-w-md">
      <CarouselComposer
        onChange={(items) => setCount(items.length)}
        editing={carouselEditing}
        enableAltText
        acceptMime={PLATFORM_SAFE_MIME}
        maxVideoSeconds={30}
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
      <CarouselComposer
        defaultValue={dummyCarouselItems}
        editing={carouselEditing}
        editorProps={{ enabledTools: ["crop", "filters", "adjust"] }}
      />
      <Status>
        Seeded from remote URLs (CMS re-edit). Select a thumb, drag to reorder,
        press Edit on any item. Videos can be previewed, reordered and removed, but not edited.
      </Status>
    </div>
  );
}

function ControlledTab() {
  const [items, setItems] = React.useState<MediaCarouselItem[]>([]);
  const ref = React.useRef<CarouselComposerHandle>(null);
  const [exported, setExported] = React.useState<number | null>(null);

  return (
    <div className="mx-auto max-w-md">
      <CarouselComposer
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
      <CarouselComposer
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

function StatusTab() {
  const [items, setItems] = React.useState<MediaCarouselItem[]>(dummyStatusItems);
  const [retries, setRetries] = React.useState(0);
  return (
    <div className="mx-auto max-w-md">
      <CarouselComposer
        value={items}
        onChange={setItems}
        onRetry={(item) => {
          setRetries((n) => n + 1);
          setItems((cur) =>
            cur.map((it) =>
              it.id === item.id
                ? { ...it, status: "uploading", progress: 0.1, error: undefined }
                : it,
            ),
          );
        }}
      />
      <Status>
        Host-owned upload state: item 1 is uploading at 40 %, item 2 failed.
        Select item 2 and press Retry ({retries} retries).
      </Status>
    </div>
  );
}

function LocaleTab({
  dir,
  locale,
  labels,
  note,
}: {
  dir: "ltr" | "rtl";
  locale: string;
  labels: CarouselComposerLabelsInput;
  note: string;
}) {
  return (
    <div className="mx-auto max-w-md" dir={dir} lang={locale}>
      <CarouselComposer
        defaultValue={dummyCarouselItems.map((it) =>
          it.kind === "video" ? { ...it, duration: 75 } : it,
        )}
        locale={locale}
        labels={labels}
        enableAltText
      />
      <Status>{note}</Status>
    </div>
  );
}

function AspectTab() {
  const ref = React.useRef<CarouselComposerHandle>(null);
  const [log, setLog] = React.useState<string[]>([]);
  const [crops, setCrops] = React.useState<string[]>([]);
  return (
    <div className="mx-auto max-w-md">
      <CarouselComposer
        ref={ref}
        defaultValue={dummyCarouselItems}
        editing={carouselEditing}
        defaultAspect="original"
        aspectOptions={["original", "1:1", "4:5", "1.91:1"]}
        onAspectChange={(a) => setLog((l) => [...l.slice(-2), a])}
        editorProps={{ enabledTools: ["crop", "filters", "adjust"] }}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={async () => {
            const out = (await ref.current?.export()) ?? [];
            setCrops(
              out.map((it, i) =>
                it.crop
                  ? `#${i + 1} ${it.crop.width}x${it.crop.height} @${it.crop.x},${it.crop.y}`
                  : `#${i + 1} no crop`,
              ),
            );
          }}
        >
          Export
        </Button>
      </div>
      <Status>
        Select item 1 to switch the shared aspect; every thumb, the preview and the editor follow.
        onAspectChange: {log.length ? log.join(" → ") : "—"}
        {crops.length ? ` · ${crops.join(" · ")}` : ""}
      </Status>
    </div>
  );
}

export default function CarouselComposerDemo() {
  const [tab, setTab] = React.useState("seeded");
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="seeded">Seeded (re-edit)</TabsTrigger>
        <TabsTrigger value="controlled">Controlled + export</TabsTrigger>
        <TabsTrigger value="max">Max 3</TabsTrigger>
        <TabsTrigger value="aspect">Aspect switch</TabsTrigger>
        <TabsTrigger value="status">Upload status</TabsTrigger>
        <TabsTrigger value="tr">Türkçe</TabsTrigger>
        <TabsTrigger value="ar">العربية (RTL)</TabsTrigger>
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
      <TabsContent value="aspect" className="pt-4">
        <AspectTab />
      </TabsContent>
      <TabsContent value="status" className="pt-4">
        <StatusTab />
      </TabsContent>
      <TabsContent value="tr" className="pt-4">
        <LocaleTab dir="ltr" locale="tr" labels={turkishLabels} note="Turkish labels and tr-locale formatting. Turkish writes digits the same way as English, so the video length still reads 1:15." />
      </TabsContent>
      <TabsContent value="ar" className="pt-4">
        <LocaleTab dir="rtl" locale="ar-EG" labels={arabicLabels} note="Arabic labels, right-to-left rail, Arabic-Indic digits." />
      </TabsContent>
    </Tabs>
  );
}
