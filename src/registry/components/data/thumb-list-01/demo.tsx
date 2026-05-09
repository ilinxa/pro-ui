"use client";

import type { ComponentProps, ElementType } from "react";
import { Bookmark } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbList01 } from "./thumb-list-01";
import {
  THUMB_LIST_01_DUMMY,
  THUMB_LIST_01_DUMMY_DATED,
  THUMB_LIST_01_DUMMY_TR,
} from "./dummy-data";

// Demo-only mock router-Link substitute. Real consumers pass NextLink /
// RemixLink / TanStack Link / etc. — anything that accepts an href and
// renders an anchor.
function MockRouterLink({
  href,
  children,
  ...rest
}: ComponentProps<"a">) {
  return (
    <a
      data-router-link="mock"
      href={href}
      onClick={(e) => {
        e.preventDefault();
        // Real Link would pushState here. Demo just no-ops.
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
const MockRouterLinkAs: ElementType = MockRouterLink;

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
        <TabsTrigger value="no-icon">No icon + router link</TabsTrigger>
        <TabsTrigger value="empty">Empty state</TabsTrigger>
        <TabsTrigger value="i18n">Custom icon + Turkish</TabsTrigger>
      </TabsList>

      <TabsContent value="default" className="mt-6 max-w-md">
        <ThumbList01 items={THUMB_LIST_01_DUMMY} />
        <p className="mt-3 text-xs text-muted-foreground">
          Default chrome — framed card, default header icon, native anchors.
          Drop into any sidebar slot.
        </p>
      </TabsContent>

      <TabsContent value="no-frame" className="mt-6 max-w-md">
        <ThumbList01 items={THUMB_LIST_01_DUMMY} framed={false} />
        <p className="mt-3 text-xs text-muted-foreground">
          <code>framed={"{false}"}</code> drops the card chrome — useful when
          the parent already provides padding / background / borders, or when
          stacking multiple lists without nested cards.
        </p>
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
        <p className="mt-3 text-xs text-muted-foreground">
          <code>renderMeta</code> takes over the secondary line — here a
          relative-time stamp. The slot replaces (rather than augments) the
          default meta, so you own its semantics + a11y.
        </p>
      </TabsContent>

      <TabsContent value="no-icon" className="mt-6 max-w-md">
        <ThumbList01
          items={THUMB_LIST_01_DUMMY}
          headerIcon={null}
          linkComponent={MockRouterLinkAs}
          labels={{ heading: "Trending now" }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          <code>headerIcon={"{null}"}</code> hides the icon entirely (use this
          when the heading is self-explanatory).{" "}
          <code>linkComponent={"{NextLink}"}</code> swaps the native{" "}
          <code>&lt;a&gt;</code> for your router&apos;s Link — preserves
          client-side nav, prefetching, etc. Inspect the rendered DOM to see
          the <code>data-router-link=&quot;mock&quot;</code> attribute on each row.
        </p>
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
        <p className="mt-3 text-xs text-muted-foreground">
          When <code>items</code> is empty the component still renders the
          heading + a graceful empty-state line. Consumers don&apos;t need to
          guard against <code>items.length === 0</code> at the call site.
        </p>
      </TabsContent>

      <TabsContent value="i18n" className="mt-6 max-w-md">
        <ThumbList01
          items={THUMB_LIST_01_DUMMY_TR}
          headerIcon={Bookmark}
          labels={{ heading: "Kaydedilen Haberler" }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Custom <code>headerIcon</code> (here Lucide&apos;s{" "}
          <code>Bookmark</code>) plus a localized heading — both the icon and
          the label are independently overridable.
        </p>
      </TabsContent>
    </Tabs>
  );
}
