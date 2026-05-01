"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterBar01 } from "./filter-bar-01";
import {
  DUMMY_CATEGORIES_EN,
  DUMMY_LABELS_TR,
  formatDateRangeTR,
} from "./dummy-data";
import type { FilterBarValue } from "./types";

export default function FilterBar01Demo() {
  const [controlledValue, setControlledValue] = useState<FilterBarValue>({
    search: "",
    category: null,
    dateRange: { from: undefined, to: undefined },
  });

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="controlled">Controlled</TabsTrigger>
        <TabsTrigger value="partial">Partial usage</TabsTrigger>
        <TabsTrigger value="i18n">Localized</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-6">
        <FilterBar01
          categories={DUMMY_CATEGORIES_EN}
          resultsCount={42}
        />
      </TabsContent>

      <TabsContent value="controlled" className="mt-6 space-y-4">
        <FilterBar01
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
          <FilterBar01
            categories={DUMMY_CATEGORIES_EN}
            hideDateRange
            resultsCount={42}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">
            Search + date only (categories hidden)
          </p>
          <FilterBar01 hideCategories resultsCount={42} />
        </div>
      </TabsContent>

      <TabsContent value="i18n" className="mt-6">
        <FilterBar01
          categories={DUMMY_CATEGORIES_EN}
          labels={DUMMY_LABELS_TR}
          formatDateRange={formatDateRangeTR}
          resultsCount={12}
        />
      </TabsContent>
    </Tabs>
  );
}
