"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { ar, tr } from "date-fns/locale";
import { FilterBar } from "./filter-bar";
import {
  DUMMY_CATEGORIES_AR,
  DUMMY_CATEGORIES_EN,
  DUMMY_LABELS_AR,
  DUMMY_LABELS_TR,
  formatDateRangeTR,
} from "./dummy-data";
import type { FilterBarValue } from "./types";

function AccessoryButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}

export default function FilterBarDemo() {
  const [controlledValue, setControlledValue] = useState<FilterBarValue>({
    search: "",
    category: null,
    dateRange: { from: undefined, to: undefined },
  });

  return (
    <Tabs defaultValue="basic" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="controlled">Controlled</TabsTrigger>
        <TabsTrigger value="partial">Partial usage</TabsTrigger>
        <TabsTrigger value="i18n">Localized</TabsTrigger>
        <TabsTrigger value="options">Options</TabsTrigger>
        <TabsTrigger value="rtl">RTL</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="basic" className="mt-6">
        <FilterBar
          categories={DUMMY_CATEGORIES_EN}
          resultsCount={42}
        />
      </TabsContent>

      <TabsContent value="controlled" className="mt-6 space-y-4">
        <FilterBar
          categories={DUMMY_CATEGORIES_EN}
          search={controlledValue.search}
          onSearchChange={(search) =>
            setControlledValue((v) => ({ ...v, search }))
          }
          category={controlledValue.category}
          onCategoryChange={(category) =>
            setControlledValue((v) => ({ ...v, category }))
          }
          dateRange={controlledValue.dateRange}
          onDateRangeChange={(dateRange) =>
            setControlledValue((v) => ({ ...v, dateRange }))
          }
          resultsCount={42}
        />
        <pre className="rounded-md border border-border bg-muted p-4 text-xs">
          {JSON.stringify(
            {
              search: controlledValue.search,
              category: controlledValue.category,
              dateRange: {
                from: controlledValue.dateRange.from?.toISOString(),
                to: controlledValue.dateRange.to?.toISOString(),
              },
            },
            null,
            2,
          )}
        </pre>
      </TabsContent>

      <TabsContent value="partial" className="mt-6 space-y-8">
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">
            Search + chips only (date hidden)
          </p>
          <FilterBar
            categories={DUMMY_CATEGORIES_EN}
            hideDateRange
            resultsCount={42}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">
            Search + date only (categories hidden)
          </p>
          <FilterBar hideCategories resultsCount={42} />
        </div>
      </TabsContent>

      <TabsContent value="i18n" className="mt-6">
        <FilterBar
          categories={DUMMY_CATEGORIES_EN}
          labels={DUMMY_LABELS_TR}
          calendarLocale={tr}
          formatDateRange={formatDateRangeTR}
          resultsCount={12}
        />
      </TabsContent>

      <TabsContent value="options" className="mt-6 space-y-8">
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">
            searchAccessory + align=&quot;left&quot; + locale=&quot;tr&quot; (dates and grouped count)
          </p>
          <FilterBar
            categories={DUMMY_CATEGORIES_EN}
            align="left"
            locale="tr"
            defaultDateRange={{ from: new Date(2026, 9, 5), to: new Date(2026, 9, 19) }}
            resultsCount={1234}
            searchAccessory={<AccessoryButton label="Search options" />}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">
            align=&quot;right&quot; (the chip row follows it too)
          </p>
          <FilterBar categories={DUMMY_CATEGORIES_EN} align="right" resultsCount={1} />
        </div>
      </TabsContent>

      <TabsContent value="rtl" className="mt-6">
        <div dir="rtl" lang="ar">
          <FilterBar
            categories={DUMMY_CATEGORIES_AR}
            labels={DUMMY_LABELS_AR}
            locale="ar"
            calendarLocale={ar}
            align="left"
            resultsCount={12}
            searchAccessory={<AccessoryButton label="خيارات البحث" />}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
