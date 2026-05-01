"use client";

import { Bookmark } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbList01 } from "./thumb-list-01";
import {
  THUMB_LIST_01_DUMMY,
  THUMB_LIST_01_DUMMY_DATED,
  THUMB_LIST_01_DUMMY_TR,
} from "./dummy-data";

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function formatRelativeDays(dateStr: string): string {
  const days = Math.round(
    (Date.parse(dateStr) - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return RELATIVE_FORMATTER.format(days, "day");
}

export default function ThumbList01Demo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="no-frame">No frame</TabsTrigger>
        <TabsTrigger value="custom-meta">Custom meta</TabsTrigger>
        <TabsTrigger value="empty">Empty state</TabsTrigger>
        <TabsTrigger value="i18n">Custom icon + Turkish</TabsTrigger>
      </TabsList>

      <TabsContent value="default" className="mt-6 max-w-md">
        <ThumbList01 items={THUMB_LIST_01_DUMMY} />
      </TabsContent>

      <TabsContent value="no-frame" className="mt-6 max-w-md">
        <ThumbList01 items={THUMB_LIST_01_DUMMY} framed={false} />
      </TabsContent>

      <TabsContent value="custom-meta" className="mt-6 max-w-md">
        <ThumbList01
          items={THUMB_LIST_01_DUMMY_DATED}
          labels={{ heading: "More from this author" }}
          renderMeta={(item) => {
            const dated = item as (typeof THUMB_LIST_01_DUMMY_DATED)[number];
            return (
              <time
                className="text-xs text-muted-foreground mt-1 block"
                dateTime={dated.publishedAt}
              >
                {formatRelativeDays(dated.publishedAt)}
              </time>
            );
          }}
        />
      </TabsContent>

      <TabsContent value="empty" className="mt-6 max-w-md">
        <ThumbList01
          items={[]}
          labels={{
            heading: "Recently viewed",
            emptyText:
              "Nothing here yet — articles you read will show up here.",
          }}
        />
      </TabsContent>

      <TabsContent value="i18n" className="mt-6 max-w-md">
        <ThumbList01
          items={THUMB_LIST_01_DUMMY_TR}
          headerIcon={Bookmark}
          labels={{ heading: "Kaydedilen Haberler" }}
        />
      </TabsContent>
    </Tabs>
  );
}
