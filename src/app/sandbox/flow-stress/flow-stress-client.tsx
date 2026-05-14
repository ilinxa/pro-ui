"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  FlowCanvas,
  PortsAt,
  type NodeRenderer,
  type PortType,
} from "@/registry/components/data/flow-canvas-01";
import {
  makeHeavyStressData,
  makeStressData,
} from "@/registry/components/data/flow-canvas-01/dummy-data";

// Heavy synthetic renderer — matches __type "heavy-stress" emitted by
// makeHeavyStressData. 4 ports (left-in, right-out, top-doc-in, bottom-doc-out)
// + 3 visible fields + 1 nested visual block. NOT coupled to ProjectCard01 or
// rich-card by design (Q28). MUST be at module scope per the xyflow rule
// (recreating renderers each render tears down + remounts every node).
type HeavyStressData = {
  __type: "heavy-stress";
  title?: string;
  description?: string;
  status?: "active" | "pending" | "archived";
  priority?: number;
  nested?: { label?: string; items?: Array<{ key: string; value: string }> };
};

const STATUS_TONE: Record<string, string> = {
  active: "bg-primary/15 text-primary",
  pending: "bg-muted text-muted-foreground",
  archived: "bg-destructive/15 text-destructive",
};

const heavyStressRenderer: NodeRenderer = {
  type: "heavy-stress",
  label: "Heavy Stress",
  // defaultPorts intentionally omitted — fixture already inlines `ports` per
  // node; the canvas's port-inflation step is skipped for these.
  render: (data) => {
    const d = data as HeavyStressData;
    const title = d.title ?? "Heavy node";
    const description = d.description ?? "";
    const status = d.status ?? "pending";
    const priority = d.priority ?? 0;
    const nestedLabel = d.nested?.label ?? "";
    const nestedItems = d.nested?.items ?? [];
    return (
      <div className="relative w-56 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm">
        <header className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold">{title}</span>
          <span
            className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${
              STATUS_TONE[status] ?? STATUS_TONE.pending
            }`}
          >
            {status}
          </span>
        </header>
        <p className="mb-2 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {description}
        </p>
        <div className="mb-2 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-mono">priority</span>
          <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-foreground">
            {priority}
          </span>
        </div>
        {nestedItems.length > 0 && (
          <div className="rounded-sm border border-border/60 bg-muted/30 p-2">
            {nestedLabel ? (
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {nestedLabel}
              </div>
            ) : null}
            <ul className="space-y-0.5 text-[10px]">
              {nestedItems.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="font-mono text-muted-foreground">
                    {item.key}
                  </span>
                  <span className="truncate font-mono">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <PortsAt ports={data.ports} position="left" />
        <PortsAt ports={data.ports} position="right" />
        <PortsAt ports={data.ports} position="top" />
        <PortsAt ports={data.ports} position="bottom" />
      </div>
    );
  },
};

// Sandbox-local additions to the canvas registries. FlowCanvas auto-merges
// the built-in `custom-json` renderer and 5 built-in port types; consumers
// only pass NEW entries (passing built-ins back in triggers last-wins
// collision warnings in dev). We add: the heavy-stress renderer + the `doc`
// port type used by heavy nodes' top/bottom handles.
const SANDBOX_PORT_TYPES: PortType[] = [
  { id: "doc", color: "var(--chart-3)", label: "Doc" },
];

const RENDERERS: NodeRenderer[] = [heavyStressRenderer];

// ── URL-param schema ──────────────────────────────────────────────────────
// n        — number of nodes (default 200)
// fixture  — "light" | "heavy" (default "light")
// visible  — "on" | "off" — toggles onlyRenderVisibleElements (default "off")
// ──────────────────────────────────────────────────────────────────────────

function parseCount(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 200;
  return Math.min(Math.max(0, Math.round(n)), 5000);
}

function parseFixture(raw: string | null): "light" | "heavy" {
  return raw === "heavy" ? "heavy" : "light";
}

function parseToggle(raw: string | null, fallback: boolean): boolean {
  if (raw === "on") return true;
  if (raw === "off") return false;
  return fallback;
}

// Rolling 1-second FPS reading. Authoritative measurements come from Chrome
// DevTools Performance (per the protocol §3); this overlay is for eyeballing
// only and explicitly NOT to be cited in review files.
function useRollingFPS(): number {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    let raf = 0;
    const tick = () => {
      frames++;
      const now = performance.now();
      const elapsed = now - lastTime;
      if (elapsed >= 1000) {
        setFps(Math.round((frames * 1000) / elapsed));
        frames = 0;
        lastTime = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

export default function FlowStressClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const n = parseCount(searchParams.get("n"));
  const fixture = parseFixture(searchParams.get("fixture"));
  const onlyVisible = parseToggle(searchParams.get("visible"), false);

  // Rebuilds only when n or fixture change — toggle-only changes don't
  // regenerate the canvas data (would skew measurements).
  const data = useMemo(() => {
    return fixture === "heavy" ? makeHeavyStressData(n) : makeStressData(n);
  }, [n, fixture]);

  const fps = useRollingFPS();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.replace(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Re-key the FlowCanvas when fixture or n changes so xyflow remounts cleanly
  // — measurements should not be polluted by partial re-renders carrying state
  // from a prior fixture.
  const canvasKey = `${fixture}-${n}-${onlyVisible ? "v1" : "v0"}`;

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/60 bg-background/80 px-4 py-2 text-xs backdrop-blur">
        <Link
          href="/sandbox"
          className="inline-flex items-center gap-1.5 rounded-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Sandbox
        </Link>

        <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />

        <div className="flex items-baseline gap-1.5 font-semibold">
          <span>Flow stress</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            devtools
          </span>
        </div>

        <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />

        <Field label="N">
          <input
            type="number"
            min={0}
            max={5000}
            step={50}
            value={n}
            onChange={(e) => updateParam("n", e.target.value)}
            className="w-20 rounded-sm border border-border bg-background px-2 py-0.5 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Field>

        <Field label="Fixture">
          <select
            value={fixture}
            onChange={(e) => updateParam("fixture", e.target.value)}
            className="rounded-sm border border-border bg-background px-2 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="light">light (custom-json)</option>
            <option value="heavy">heavy (synthetic)</option>
          </select>
        </Field>

        <Field label="onlyRenderVisibleElements">
          <button
            type="button"
            onClick={() => updateParam("visible", onlyVisible ? "off" : "on")}
            data-on={onlyVisible}
            className="rounded-sm border border-border bg-background px-2 py-0.5 text-xs font-medium data-[on=true]:border-primary data-[on=true]:bg-primary data-[on=true]:text-primary-foreground"
          >
            {onlyVisible ? "on" : "off"}
          </button>
        </Field>

        <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />

        <Field label="Edges">
          <span className="text-muted-foreground" title="Future (v0.3.0)">
            svg (only)
          </span>
        </Field>

        <Field label="LOD">
          <span className="text-muted-foreground" title="Future (v0.3.0)">
            off (only)
          </span>
        </Field>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            FPS
          </span>
          <span
            className="rounded-sm bg-muted px-2 py-0.5 font-mono text-sm font-semibold tabular-nums"
            data-fps-overlay
          >
            {fps}
          </span>
          <span className="hidden text-[10px] text-muted-foreground/70 sm:inline">
            overlay only — cite DevTools per protocol §9
          </span>
        </div>
      </header>

      <div className="relative flex-1 min-h-0">
        <FlowCanvas
          key={canvasKey}
          data={data}
          renderers={RENDERERS}
          portTypes={SANDBOX_PORT_TYPES}
          onlyRenderVisibleElements={onlyVisible}
          aria-label="Flow stress canvas"
        />

        <div className="pointer-events-none absolute bottom-2 left-2 rounded-sm bg-background/70 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
          {data.nodes.length} nodes · {data.edges.length} edges ·{" "}
          {fixture} fixture
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
