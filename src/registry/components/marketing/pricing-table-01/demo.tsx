"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { PricingTable01 } from "./pricing-table-01";
import {
  PRICING_DEMO_LABELS_TR,
  PRICING_DEMO_TIERS_THREE,
  PRICING_DEMO_TIERS_TWO,
} from "./dummy-data";
import type { BillingPeriod } from "./types";

function ControlledDemo() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const [log, setLog] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-6">
      <PricingTable01
        heading="Plans"
        subheading="Controlled toggle + analytics example."
        billingToggle="monthly-annual"
        billing={billing}
        onBillingChange={setBilling}
        tiers={PRICING_DEMO_TIERS_THREE}
        onTierCtaClick={(name) =>
          setLog((prev) =>
            [`${new Date().toLocaleTimeString()} · ${name}`, ...prev].slice(0, 5),
          )
        }
      />
      <aside className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
        <div className="mb-2 font-medium text-foreground">
          External state · billing = {billing}
        </div>
        {log.length === 0 ? (
          <p>Click a tier CTA to log analytics events here.</p>
        ) : (
          <ul className="flex flex-col gap-1 font-mono">
            {log.map((entry, idx) => (
              <li key={`${entry}-${idx}`}>{entry}</li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

export default function PricingTable01Demo() {
  return (
    <Tabs defaultValue="cards" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="cards">Cards · toggle</TabsTrigger>
        <TabsTrigger value="two-tier">Free / Paid</TabsTrigger>
        <TabsTrigger value="table">Comparison table</TabsTrigger>
        <TabsTrigger value="controlled">Controlled + analytics</TabsTrigger>
        <TabsTrigger value="i18n">Custom labels (TR)</TabsTrigger>
        <TabsTrigger value="tones">Tones</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="cards" className="mt-6">
        <PricingTable01
          heading="Plans for every team"
          subheading="Start free, scale when you're ready."
          billingToggle="monthly-annual"
          tiers={PRICING_DEMO_TIERS_THREE}
        />
      </TabsContent>

      <TabsContent value="two-tier" className="mt-6">
        <PricingTable01
          heading="Simple, transparent pricing"
          tiers={PRICING_DEMO_TIERS_TWO}
        />
      </TabsContent>

      <TabsContent value="table" className="mt-6">
        <PricingTable01
          heading="Compare plans"
          subheading="Every feature, side by side."
          layout="table"
          billingToggle="monthly-annual"
          tiers={PRICING_DEMO_TIERS_THREE}
        />
      </TabsContent>

      <TabsContent value="controlled" className="mt-6">
        <ControlledDemo />
      </TabsContent>

      <TabsContent value="i18n" className="mt-6">
        <PricingTable01
          heading="Her ekip için planlar"
          subheading="Ücretsiz başlayın, ihtiyacınız olduğunda büyüyün."
          billingToggle="monthly-annual"
          labels={PRICING_DEMO_LABELS_TR}
          tiers={PRICING_DEMO_TIERS_THREE}
        />
      </TabsContent>

      <TabsContent value="tones" className="mt-6 flex flex-col gap-12">
        <PricingTable01
          heading="Primary"
          tone="primary"
          tiers={PRICING_DEMO_TIERS_TWO}
        />
        <PricingTable01
          heading="Accent"
          tone="accent"
          tiers={PRICING_DEMO_TIERS_TWO}
        />
        <PricingTable01
          heading="Muted"
          tone="muted"
          tiers={PRICING_DEMO_TIERS_TWO}
        />
      </TabsContent>
    </Tabs>
  );
}
