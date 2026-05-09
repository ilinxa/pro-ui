export default function StatCardUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">Quick start</h3>
      <p className="text-muted-foreground">
        Single-metric dashboard widget. Required props are <code>value</code>{" "}
        and <code>label</code>. Add <code>delta</code> for vs-prior-period
        change, <code>trend</code> for a sparkline, <code>icon</code> for a
        leading visual marker, <code>variant</code> to change density.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { StatCard } from "@/components/stat-card"
import { DollarSign } from "lucide-react"

export function RevenueCard() {
  return (
    <StatCard
      value={12431}
      label="Revenue this month"
      icon={DollarSign}
      formatValue={(v) => \`$\${v.toLocaleString()}\`}
      delta={{ value: 0.124 }}
      trend={[8200, 8800, 9100, 10200, 10900, 11500, 12100, 12431]}
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Variants</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>default</code> — value + label + delta + sparkline. The
          canonical KPI strip card.
        </li>
        <li>
          <code>compact</code> — smaller value, no sparkline. Sidebar
          widgets and dense KPI grids.
        </li>
        <li>
          <code>detailed</code> — larger value + mandatory sparkline +
          larger icon. Hero KPI cards.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Delta polarity (`betterIsHigher`)
      </h3>
      <p className="text-muted-foreground">
        Default: <code>betterIsHigher: true</code> — a positive delta colors
        green, a negative delta colors red. Set <code>false</code> for cost
        / error metrics where ↑ is bad. The default <code>delta.format</code>{" "}
        is locale-aware <code>Intl.NumberFormat</code> percent —{" "}
        <code>delta.value</code> is a fraction (<code>0.124</code> ={" "}
        +12.4%).
      </p>
      <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<StatCard
  value={errorRate}
  label="Error rate (last 24h)"
  delta={{ value: 0.08, betterIsHigher: false }}  // up = bad → red
/>

<StatCard
  value={signupCount}
  label="New signups this week"
  delta={{
    value: 1240,
    format: (v) => v.toLocaleString(undefined, { signDisplay: "exceptZero" }),
  }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Custom value rendering
      </h3>
      <p className="text-muted-foreground">
        Use <code>renderValue</code> for unit superscripts, tooltips, or any
        composite value treatment. Receives <code>{"{ value, loading }"}</code>.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<StatCard
  value={42.7}
  label="Average response time"
  renderValue={({ value }) => (
    <span>
      {value.toFixed(1)}
      <span className="text-muted-foreground text-base ml-1">ms</span>
    </span>
  )}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Sparkline</h3>
      <p className="text-muted-foreground">
        Pass <code>trend</code> as a flat <code>number[]</code>; the
        component renders a built-in pure-SVG sparkline (no charting peer
        dep). Cap at 100 points; larger arrays are uniformly downsampled.
        For non-line shapes (bars, dual-axis) use the{" "}
        <code>renderTrend</code> slot. The <code>StatCardSparkline</code>{" "}
        sub-component is exported separately for standalone use:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { StatCardSparkline } from "@/components/stat-card"

<StatCardSparkline
  data={[42, 48, 55, 62, 68, 71, 67, 64]}
  className="h-8 w-32 text-primary"
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Loading + empty</h3>
      <p className="text-muted-foreground">
        <code>loading=true</code> renders a shape-matched skeleton —{" "}
        <code>aria-busy</code> + sr-only loading announcement. Skeleton size
        matches the loaded variant so there&apos;s no layout shift on
        hydration. <code>value=undefined</code> renders{" "}
        <code>labels.emptyValueLabel</code> (default <code>—</code>) at the
        value position; same height, muted color.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">i18n</h3>
      <p className="text-muted-foreground">
        Labels are overridable via the <code>labels</code> prop. Defaults are
        English; override <code>deltaPrefix</code>,{" "}
        <code>deltaPeriod</code>, <code>loadingLabel</code>,{" "}
        <code>increaseLabel</code>, <code>decreaseLabel</code>,{" "}
        <code>emptyValueLabel</code>. Number formatting via{" "}
        <code>delta.format</code> with a locale arg.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Root is <code>&lt;dl&gt;</code> — screen readers announce
          label-value pairs natively.
        </li>
        <li>
          Sparkline + arrow are <code>aria-hidden</code>; the delta has an
          sr-only <code>increaseLabel</code> /<code>decreaseLabel</code> so
          SRs say &quot;12.4% increase&quot; not &quot;12.4% up arrow&quot;.
        </li>
        <li>
          Linked variant uses overlay-link pattern: focus-visible ring on the
          card; the link element is transparent on top.
        </li>
        <li>
          Loading state is <code>aria-busy=&quot;true&quot;</code> with
          sr-only loading announcement.
        </li>
      </ul>
    </div>
  );
}
