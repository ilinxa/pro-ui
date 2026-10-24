"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { ExpandableText } from "./expandable-text";
import { LONG_AR, LONG_EN, LONG_TR, SHORT_AR, SHORT_EN, SHORT_TR } from "./dummy-data";

const TR_LABELS = {
  showMore: "Daha fazla göster",
  showLess: "Daha az göster",
};

const AR_LABELS = {
  showMore: "عرض المزيد",
  showLess: "عرض أقل",
};

function CustomToggleDemo() {
  const [expanded, setExpanded] = useState(false);
  return (
    <ExpandableText
      content={LONG_EN}
      maxLines={3}
      expanded={expanded}
      onExpandedChange={setExpanded}
      renderToggle={({ isExpanded, setExpanded }) => (
        <button
          type="button"
          onClick={() => setExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse" : "Expand"}
          aria-expanded={isExpanded}
          className="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" aria-hidden="true" /> Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" aria-hidden="true" /> More
            </>
          )}
        </button>
      )}
    />
  );
}

/** A host's own safe mention / hashtag / link renderer — what `children` is for. */
function RichBody() {
  return (
    <ExpandableText maxLines={3}>
      <span>
        Market day with{" "}
        <a href="#ayse" className="font-medium text-foreground underline decoration-primary underline-offset-2">
          @ayse
        </a>{" "}
        and{" "}
        <a href="#deniz" className="font-medium text-foreground underline decoration-primary underline-offset-2">
          @deniz
        </a>
        . {LONG_EN}{" "}
        <a href="#harbor" className="text-muted-foreground underline underline-offset-2">
          #harbor
        </a>
      </span>
    </ExpandableText>
  );
}

/** Text that grows while clamped (a live edit) — re-measured from the DOM change (MutationObserver). */
function GrowingBody() {
  const [lines, setLines] = useState(1);
  const text = Array.from({ length: lines }, (_, i) => `Update ${i + 1}: the thread keeps going.`).join(" ");
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setLines((n) => n + 3)}
        className="rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Add text
      </button>
      <ExpandableText maxLines={2}>
        <span>{text}</span>
      </ExpandableText>
    </div>
  );
}

/**
 * A style change (letter spacing) alters no DOM inside the text. While the box stays at its clamped
 * height no observer fires — `measureKey` re-measures it.
 */
function MeasureKeyBody() {
  const [wide, setWide] = useState(false);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setWide((w) => !w)}
        className="rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {wide ? "Normal letter spacing" : "Wide letter spacing"}
      </button>
      <ExpandableText maxLines={2} measureKey={wide} contentClassName={wide ? "tracking-[0.4em]" : undefined}>
        <span>{SHORT_EN} Two lines at normal spacing.</span>
      </ExpandableText>
    </div>
  );
}

export default function ExpandableTextDemo() {
  return (
    <Tabs defaultValue="default">
      <SwipeTabsList>
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="custom-lines">Custom maxLines</TabsTrigger>
        <TabsTrigger value="localized">Localized (TR)</TabsTrigger>
        <TabsTrigger value="rich">Rich children</TabsTrigger>
        <TabsTrigger value="rtl">RTL</TabsTrigger>
        <TabsTrigger value="custom-toggle">Custom toggle</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="default" className="mt-6 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Long content (toggle appears)
          </p>
          <ExpandableText content={LONG_EN} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Short content (no toggle — content fits)
          </p>
          <ExpandableText content={SHORT_EN} />
        </div>
      </TabsContent>

      <TabsContent value="custom-lines" className="mt-6 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            maxLines=2
          </p>
          <ExpandableText content={LONG_EN} maxLines={2} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            maxLines=6
          </p>
          <ExpandableText content={LONG_EN} maxLines={6} />
        </div>
      </TabsContent>

      <TabsContent value="localized" className="mt-6 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Long content + Turkish labels
          </p>
          <ExpandableText content={LONG_TR} labels={TR_LABELS} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Short content + Turkish labels (no toggle rendered)
          </p>
          <ExpandableText content={SHORT_TR} labels={TR_LABELS} />
        </div>
      </TabsContent>

      <TabsContent value="rich" className="mt-6 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            children — your own mention / link renderer inside the clamp
          </p>
          <RichBody />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Block children — one paragraph each, still held to maxLines
          </p>
          <ExpandableText maxLines={3}>
            <p>{SHORT_EN}</p>
            <p>{LONG_EN}</p>
          </ExpandableText>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Content that grows while clamped (re-measured)
          </p>
          <GrowingBody />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            measureKey — re-measure on a style change (letter spacing)
          </p>
          <MeasureKeyBody />
        </div>
      </TabsContent>

      <TabsContent value="rtl" className="mt-6 space-y-6">
        <div dir="rtl" lang="ar" className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            An RTL page
          </p>
          <ExpandableText content={LONG_AR} labels={AR_LABELS} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Arabic post in an LTR feed — dir=&quot;auto&quot; starts it at the right
          </p>
          <ExpandableText content={SHORT_AR} />
          <ExpandableText content={SHORT_EN} />
        </div>
      </TabsContent>

      <TabsContent value="custom-toggle" className="mt-6 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Chevron-icon toggle via renderToggle slot (controlled mode)
        </p>
        <CustomToggleDemo />
      </TabsContent>
    </Tabs>
  );
}
