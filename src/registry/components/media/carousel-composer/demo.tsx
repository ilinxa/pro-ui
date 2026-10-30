"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  dummyPanItems,
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

function AltVideoTab() {
  return (
    <div className="mx-auto max-w-md">
      <CarouselComposer defaultValue={dummyCarouselItems} enableAltText="all" />
      <Status>
        enableAltText=&quot;all&quot;: select the video (item 3) and describe it; the preview video is named by that text.
      </Status>
    </div>
  );
}

function PanTab() {
  const ref = React.useRef<CarouselComposerHandle>(null);
  const [log, setLog] = React.useState("—");
  const [crops, setCrops] = React.useState<string[]>([]);
  return (
    <div className="mx-auto max-w-md">
      <CarouselComposer
        ref={ref}
        defaultValue={dummyPanItems}
        defaultAspect="1:1"
        aspectOptions={["1:1", "4:5", "1.91:1"]}
        enablePan
        editing={carouselEditing}
        editorProps={{ enabledTools: ["crop", "filters", "adjust"] }}
        onCropOffsetChange={(id, o) => setLog(`${id} → ${o.x.toFixed(2)}, ${o.y.toFixed(2)}`)}
      />
      <div className="mt-3">
        <Button
          size="sm"
          onClick={async () => {
            const out = (await ref.current?.export()) ?? [];
            setCrops(
              out.map((it, i) =>
                it.crop ? `#${i + 1} ${it.crop.width}x${it.crop.height} @${it.crop.x},${it.crop.y}` : `#${i + 1} no crop`,
              ),
            );
          }}
        >
          Export
        </Button>
      </div>
      <Status>
        Drag the wide or tall photo inside the frame, or focus it and use the arrow keys (Shift = 20 %). The rail
        thumb follows. Pan, then Edit and Done: the framing survives the edit and the offset clears. onCropOffsetChange: {log}
        {crops.length ? ` · ${crops.join(" · ")}` : ""}
      </Status>
    </div>
  );
}

function ReorderTab() {
  const ref = React.useRef<CarouselComposerHandle>(null);
  const [log, setLog] = React.useState("—");
  // The narrowest thumb (9:16) and a native RTL mount; the rail reads direction at mount, so
  // either switch remounts the composer.
  const [narrow, setNarrow] = React.useState(false);
  const [rtl, setRtl] = React.useState(false);
  return (
    <div className="mx-auto max-w-md" dir={rtl ? "rtl" : undefined}>
      <CarouselComposer
        key={`${narrow}-${rtl}`}
        ref={ref}
        defaultValue={dummyCarouselItems}
        defaultAspect={narrow ? "9:16" : undefined}
        aspectOptions={narrow ? ["9:16"] : undefined}
        reorderButtons
        onMove={(id, d) => setLog(`${id} ${d > 0 ? "+" : ""}${d}`)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => ref.current?.moveItem("seed-1", 1)}>
          handle.moveItem(seed-1, +1)
        </Button>
        <Button size="sm" variant="outline" aria-pressed={narrow} onClick={() => setNarrow((v) => !v)}>
          Shared aspect 9:16
        </Button>
        <Button size="sm" variant="outline" aria-pressed={rtl} onClick={() => setRtl((v) => !v)}>
          Mount under dir=rtl
        </Button>
      </div>
      <Status>
        Tab to a thumb: a move earlier / later pair appears on focus (logical direction, works in RTL). onMove: {log}
      </Status>
    </div>
  );
}

function EscapeTab() {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  return (
    <div className="mx-auto max-w-md">
      <Dialog open={open} onOpenChange={setOpen}>
        {/* A real trigger: closing returns focus to it instead of <body>. */}
        <DialogTrigger className={buttonVariants({ size: "sm" })}>
          Open carousel in a dialog
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogTitle>Post media</DialogTitle>
          <DialogDescription>Add, reorder and edit the media for this post.</DialogDescription>
          <CarouselComposer
            defaultValue={dummyCarouselItems.slice(0, 2)}
            editing={carouselEditing}
            onEditingChange={setEditing}
            editorProps={{ enabledTools: ["crop", "filters", "adjust"] }}
          />
        </DialogContent>
      </Dialog>
      <Status>
        Press Edit, then Escape while the editor loads or Done is exporting: the dialog stays open. When idle,
        Escape closes it as before. Editing now: {String(editing)}.
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
        <TabsTrigger value="alt-video">Alt for videos</TabsTrigger>
        <TabsTrigger value="pan">Pan</TabsTrigger>
        <TabsTrigger value="reorder">Reorder buttons</TabsTrigger>
        <TabsTrigger value="escape">Escape guard</TabsTrigger>
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
      <TabsContent value="alt-video" className="pt-4">
        <AltVideoTab />
      </TabsContent>
      <TabsContent value="pan" className="pt-4">
        <PanTab />
      </TabsContent>
      <TabsContent value="reorder" className="pt-4">
        <ReorderTab />
      </TabsContent>
      <TabsContent value="escape" className="pt-4">
        <EscapeTab />
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
