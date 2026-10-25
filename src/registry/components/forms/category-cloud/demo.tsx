"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { CategoryCloud } from "./category-cloud";
import { DUMMY_CATEGORIES_AR, DUMMY_CATEGORIES_EN, DUMMY_CATEGORIES_TR } from "./dummy-data";

const DUMMY_CATEGORIES_TR_BIG = DUMMY_CATEGORIES_TR.map((c, i) => ({ ...c, count: 1200 * (i + 1) + 345 }));

export default function CategoryCloudDemo() {
  const [controlledValue, setControlledValue] = useState<string | null>(null);
  // Stands in for "the category in the current URL" (a real app derives it from the router).
  const [linkValue, setLinkValue] = useState<string | null>("sustainability");

  return (
    <Tabs defaultValue="basic" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="counts">With counts</TabsTrigger>
        <TabsTrigger value="controlled">Controlled</TabsTrigger>
        <TabsTrigger value="i18n">Localized</TabsTrigger>
        <TabsTrigger value="links">Link mode</TabsTrigger>
        <TabsTrigger value="rtl">RTL</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="basic" className="mt-6 max-w-md rounded-2xl border border-border/50 bg-card p-6">
        <CategoryCloud
          items={["All", "Tech", "Design", "Engineering", "Marketing", "Operations"]}
          title="Filter by department"
        />
      </TabsContent>

      <TabsContent value="counts" className="mt-6 max-w-md rounded-2xl border border-border/50 bg-card p-6">
        <CategoryCloud items={DUMMY_CATEGORIES_EN} title="Categories" />
      </TabsContent>

      <TabsContent value="controlled" className="mt-6 max-w-md space-y-4 rounded-2xl border border-border/50 bg-card p-6">
        <CategoryCloud
          items={DUMMY_CATEGORIES_EN}
          title="Categories"
          value={controlledValue}
          onChange={setControlledValue}
        />
        <p className="text-sm text-muted-foreground">
          Active value: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{controlledValue ?? "null"}</code>
        </p>
      </TabsContent>

      <TabsContent value="i18n" className="mt-6 max-w-md rounded-2xl border border-border/50 bg-card p-6">
        <CategoryCloud
          items={DUMMY_CATEGORIES_TR_BIG}
          title="Kategoriler"
          locale="tr"
          labels={{ group: "Kategori filtresi", count: (_n, formatted) => ` (${formatted} yazı)` }}
        />
      </TabsContent>

      <TabsContent value="links" className="mt-6 max-w-md space-y-3 rounded-2xl border border-border/50 bg-card p-6">
        <CategoryCloud
          items={DUMMY_CATEGORIES_EN}
          title="Categories"
          value={linkValue}
          onChange={setLinkValue}
          getHref={(item) => `#category-${item.value}`}
        />
        <p className="text-sm text-muted-foreground">
          Chips are real links; the active one carries <code>aria-current=&quot;page&quot;</code>. Pass your router&apos;s
          link as <code>linkComponent</code>. A Ctrl / Cmd-click opens the link elsewhere and leaves the active chip
          alone. Current: <code>{linkValue ?? "none"}</code>
        </p>
      </TabsContent>

      <TabsContent value="rtl" className="mt-6 max-w-md rounded-2xl border border-border/50 bg-card p-6">
        <div dir="rtl" lang="ar">
          <CategoryCloud
            items={DUMMY_CATEGORIES_AR}
            title="التصنيفات"
            locale="ar"
            labels={{ count: (_n, formatted) => ` (${formatted})` }}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
