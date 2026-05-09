"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "./stat-card";
import { StatCardSparkline } from "./parts/sparkline";
import {
  STAT_CARD_DUMMY_ACTIVE_USERS,
  STAT_CARD_DUMMY_ERROR_RATE,
  STAT_CARD_DUMMY_LATENCY,
  STAT_CARD_DUMMY_REVENUE,
  STAT_CARD_DUMMY_SIGNUPS,
  STAT_CARD_DUMMY_UPTIME,
} from "./dummy-data";

export default function StatCardDemo() {
  const [loading, setLoading] = useState(false);

  return (
    <Tabs defaultValue="default" className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="compact">Compact</TabsTrigger>
        <TabsTrigger value="detailed">Detailed</TabsTrigger>
        <TabsTrigger value="loading">Loading</TabsTrigger>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="matrix">Color logic matrix</TabsTrigger>
        <TabsTrigger value="custom-value">Custom value</TabsTrigger>
        <TabsTrigger value="sparkline-only">Sparkline only</TabsTrigger>
        <TabsTrigger value="i18n">Localized (TR)</TabsTrigger>
      </TabsList>

      {/* Default — 4-card KPI strip */}
      <TabsContent value="default" className="mt-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            {...STAT_CARD_DUMMY_REVENUE}
            icon={DollarSign}
            formatValue={(v) =>
              typeof v === "number"
                ? `$${v.toLocaleString()}`
                : String(v)
            }
          />
          <StatCard
            {...STAT_CARD_DUMMY_ERROR_RATE}
            icon={AlertTriangle}
            formatValue={(v) =>
              typeof v === "number" ? `${(v * 100).toFixed(2)}%` : String(v)
            }
          />
          <StatCard
            {...STAT_CARD_DUMMY_ACTIVE_USERS}
            icon={Users}
            formatValue={(v) => v.toLocaleString()}
          />
          <StatCard
            {...STAT_CARD_DUMMY_LATENCY}
            icon={Clock}
            formatValue={(v) =>
              typeof v === "number" ? `${v.toFixed(1)} ms` : String(v)
            }
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Default variant — 4-card strip. Revenue defaults to{" "}
          <code>betterIsHigher: true</code> (↑ green); error rate sets{" "}
          <code>betterIsHigher: false</code> (↑ red); latency went down with{" "}
          <code>betterIsHigher: false</code> (↓ green).
        </p>
      </TabsContent>

      {/* Compact — sidebar widgets */}
      <TabsContent value="compact" className="mt-6">
        <div className="grid max-w-sm gap-3">
          <StatCard
            value={42}
            label="Posts this week"
            variant="compact"
            delta={{ value: 0.18 }}
          />
          <StatCard
            value={"12.4k"}
            label="Reach"
            variant="compact"
            delta={{ value: 0.04 }}
          />
          <StatCard
            value={0.067}
            label="Engagement rate"
            variant="compact"
            formatValue={(v) =>
              typeof v === "number" ? `${(v * 100).toFixed(1)}%` : String(v)
            }
            delta={{ value: -0.012 }}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Compact variant — sidebar / dense KPI grid. No sparkline; tighter
          vertical rhythm.
        </p>
      </TabsContent>

      {/* Detailed — hero KPI cards */}
      <TabsContent value="detailed" className="mt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            {...STAT_CARD_DUMMY_REVENUE}
            variant="detailed"
            icon={DollarSign}
            formatValue={(v) =>
              typeof v === "number" ? `$${v.toLocaleString()}` : String(v)
            }
            delta={{ value: 0.124, period: "vs last 30 days" }}
            href="#"
            ariaLabel="Revenue this month — open detail"
          />
          <StatCard
            {...STAT_CARD_DUMMY_UPTIME}
            variant="detailed"
            icon={ShieldCheck}
            formatValue={(v) =>
              typeof v === "number" ? `${(v * 100).toFixed(2)}%` : String(v)
            }
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Detailed variant — hero KPI cards. Larger value, mandatory
          sparkline, larger icon. Revenue card is linked (focus-ring + cursor
          pointer when keyboarded).
        </p>
      </TabsContent>

      {/* Loading state */}
      <TabsContent value="loading" className="mt-6">
        <div className="mb-4">
          <Button onClick={() => setLoading((l) => !l)} size="sm">
            {loading ? "Stop loading" : "Start loading"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            {...STAT_CARD_DUMMY_REVENUE}
            icon={DollarSign}
            loading={loading}
            formatValue={(v) =>
              typeof v === "number" ? `$${v.toLocaleString()}` : String(v)
            }
          />
          <StatCard
            {...STAT_CARD_DUMMY_ERROR_RATE}
            icon={AlertTriangle}
            loading={loading}
          />
          <StatCard
            {...STAT_CARD_DUMMY_ACTIVE_USERS}
            icon={Users}
            loading={loading}
          />
          <StatCard
            {...STAT_CARD_DUMMY_LATENCY}
            icon={Clock}
            loading={loading}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Toggle to flip <code>loading</code> on each card. Skeleton matches
          the loaded shape — no layout shift on hydration.
        </p>
      </TabsContent>

      {/* Empty state */}
      <TabsContent value="empty" className="mt-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            value={undefined}
            label="Awaiting data"
            icon={Users}
          />
          <StatCard
            value={undefined}
            label="No baseline yet"
            icon={Clock}
            labels={{ emptyValueLabel: "No data" }}
          />
          <StatCard value={undefined} label="Pending" variant="compact" />
          <StatCard
            value={undefined}
            label="Pending hero"
            variant="detailed"
            icon={ShieldCheck}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          When <code>value === undefined</code>, the card renders{" "}
          <code>labels.emptyValueLabel</code> (default <code>—</code>) at the
          value position with muted styling — same height as a real value, no
          layout jump.
        </p>
      </TabsContent>

      {/* Color logic matrix — 5 cells */}
      <TabsContent value="matrix" className="mt-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            value={120}
            label="positive × betterIsHigher: true"
            variant="compact"
            delta={{ value: 0.124 }}
          />
          <StatCard
            value={120}
            label="positive × betterIsHigher: false"
            variant="compact"
            delta={{ value: 0.124, betterIsHigher: false }}
          />
          <StatCard
            value={120}
            label="negative × betterIsHigher: true"
            variant="compact"
            delta={{ value: -0.124 }}
          />
          <StatCard
            value={120}
            label="negative × betterIsHigher: false"
            variant="compact"
            delta={{ value: -0.124, betterIsHigher: false }}
          />
          <StatCard
            value={120}
            label="zero (any betterIsHigher)"
            variant="compact"
            delta={{ value: 0 }}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          5 visually-distinct combinations. Zero delta renders neutral
          regardless of <code>betterIsHigher</code> (the 6th &quot;cell&quot;
          would be visually identical, so it&apos;s elided here).
        </p>
      </TabsContent>

      {/* Custom value — unit superscript pattern */}
      <TabsContent value="custom-value" className="mt-6">
        <div className="grid max-w-md gap-4">
          <StatCard
            value={42.7}
            label="Average response time"
            icon={Clock}
            renderValue={({ value }) => (
              <span>
                {typeof value === "number" ? value.toFixed(1) : value}
                <span className="ml-1 text-base text-muted-foreground">ms</span>
              </span>
            )}
            delta={{ value: -0.08, betterIsHigher: false }}
          />
          <StatCard
            {...STAT_CARD_DUMMY_SIGNUPS}
            icon={Users}
            formatValue={(v) =>
              typeof v === "number" ? v.toLocaleString() : String(v)
            }
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          <code>renderValue</code> takes over the value cell entirely (used
          here for the unit-superscript &quot;ms&quot; treatment). Signup
          card uses <code>delta.format</code> override for absolute-count
          delta — &quot;+1,240&quot; instead of the default &quot;+1240%&quot;.
        </p>
      </TabsContent>

      {/* Standalone sparkline */}
      <TabsContent value="sparkline-only" className="mt-6">
        <div className="grid max-w-md gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <span className="text-sm font-medium">CPU utilization</span>
            <StatCardSparkline
              data={[42, 48, 55, 62, 68, 71, 67, 64]}
              className="h-8 w-32 text-primary"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <span className="text-sm font-medium">Memory pressure</span>
            <StatCardSparkline
              data={[0.82, 0.85, 0.88, 0.84, 0.81, 0.79, 0.83, 0.86]}
              className="h-8 w-32 text-destructive"
            />
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          <code>&lt;StatCardSparkline&gt;</code> is a sibling export — usable
          standalone, no card chrome. <code>className</code> drives size +
          color (text-color inheritance via <code>currentColor</code>).
        </p>
      </TabsContent>

      {/* i18n */}
      <TabsContent value="i18n" className="mt-6">
        <div className="grid max-w-md gap-4">
          <StatCard
            value={12431}
            label="Bu ay gelir"
            icon={DollarSign}
            formatValue={(v) =>
              typeof v === "number" ? `₺${v.toLocaleString("tr-TR")}` : String(v)
            }
            delta={{
              value: 0.124,
              format: (v) =>
                v.toLocaleString("tr-TR", {
                  style: "percent",
                  signDisplay: "exceptZero",
                  maximumFractionDigits: 1,
                }),
              period: "geçen aya kıyasla",
            }}
            labels={{
              deltaPrefix: "vs.",
              deltaPeriod: "geçen dönem",
              increaseLabel: "artış",
              decreaseLabel: "azalış",
              loadingLabel: "Veri yükleniyor…",
              emptyValueLabel: "—",
            }}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          All consumer-visible strings overridable via <code>labels</code>.
          Number formatting via <code>delta.format</code> + locale arg
          (here <code>tr-TR</code>).
        </p>
      </TabsContent>
    </Tabs>
  );
}
