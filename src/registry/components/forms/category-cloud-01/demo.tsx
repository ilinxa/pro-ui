"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryCloud01 } from "./category-cloud-01";
import { DUMMY_CATEGORIES_EN, DUMMY_CATEGORIES_TR } from "./dummy-data";

export default function CategoryCloud01Demo() {
  const [controlledValue, setControlledValue] = useState<string | null>(null);

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="counts">With counts</TabsTrigger>
        <TabsTrigger value="controlled">Controlled</TabsTrigger>
        <TabsTrigger value="i18n">Localized</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-6 max-w-md rounded-2xl border border-border/50 bg-card p-6">
        <CategoryCloud01
          items={["All", "Tech", "Design", "Engineering", "Marketing", "Operations"]}
          title="Filter by department"
        />
      </TabsContent>

      <TabsContent value="counts" className="mt-6 max-w-md rounded-2xl border border-border/50 bg-card p-6">
        <CategoryCloud01 items={DUMMY_CATEGORIES_EN} title="Categories" />
      </TabsContent>

      <TabsContent value="controlled" className="mt-6 max-w-md space-y-4 rounded-2xl border border-border/50 bg-card p-6">
        <CategoryCloud01
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
        <CategoryCloud01 items={DUMMY_CATEGORIES_TR} title="Kategoriler" ariaLabel="Kategori filtresi" />
      </TabsContent>
    </Tabs>
  );
}
