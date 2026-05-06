"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpandableText01 } from "./expandable-text-01";
import { LONG_EN, LONG_TR, SHORT_EN, SHORT_TR } from "./dummy-data";

const TR_LABELS = {
  showMore: "Daha fazla göster",
  showLess: "Daha az göster",
};

function CustomToggleDemo() {
  const [expanded, setExpanded] = useState(false);
  return (
    <ExpandableText01
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

export default function ExpandableText01Demo() {
  return (
    <Tabs defaultValue="default">
      <TabsList>
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="custom-lines">Custom maxLines</TabsTrigger>
        <TabsTrigger value="localized">Localized (TR)</TabsTrigger>
        <TabsTrigger value="custom-toggle">Custom toggle</TabsTrigger>
      </TabsList>

      <TabsContent value="default" className="mt-6 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Long content (toggle appears)
          </p>
          <ExpandableText01 content={LONG_EN} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Short content (no toggle — content fits)
          </p>
          <ExpandableText01 content={SHORT_EN} />
        </div>
      </TabsContent>

      <TabsContent value="custom-lines" className="mt-6 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            maxLines=2
          </p>
          <ExpandableText01 content={LONG_EN} maxLines={2} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            maxLines=6
          </p>
          <ExpandableText01 content={LONG_EN} maxLines={6} />
        </div>
      </TabsContent>

      <TabsContent value="localized" className="mt-6 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Long content + Turkish labels
          </p>
          <ExpandableText01 content={LONG_TR} labels={TR_LABELS} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Short content + Turkish labels (no toggle rendered)
          </p>
          <ExpandableText01 content={SHORT_TR} labels={TR_LABELS} />
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
