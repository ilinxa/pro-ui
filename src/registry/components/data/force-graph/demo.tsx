"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ForceGraph } from "./force-graph";
import { SMALL_GRAPH, SMALL_GRAPH_STATIC } from "./dummy-data";
import type {
  ForceGraphHandle,
  GraphInput,
  GraphSource,
  ThemeKey,
} from "./types";

function DemoFrame({
  children,
  height = 460,
}: {
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-md border border-border bg-card"
      style={{ height }}
    >
      {children}
    </div>
  );
}

function BasicDemo() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Static snapshot of a small research graph — three people, three papers,
        two topics, two doc nodes. Soft (muted) edges run to <code>doc</code>
        nodes and across the per-edgetype <code>softVisual</code> flag; default
        edges render at full foreground.
      </p>
      <DemoFrame>
        <ForceGraph data={SMALL_GRAPH} ariaLabel="Small research graph" />
      </DemoFrame>
    </div>
  );
}

function StaticPositionsDemo() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Same graph with <code>settings.layoutEnabled = false</code> and every
        node pinned at import time — positions are honored exactly, FA2
        worker stays idle.
      </p>
      <DemoFrame>
        <ForceGraph
          data={SMALL_GRAPH_STATIC}
          ariaLabel="Pinned static graph"
        />
      </DemoFrame>
    </div>
  );
}

function ImperativeHandleDemo() {
  const ref = useRef<ForceGraphHandle | null>(null);
  const [layoutOn, setLayoutOn] = useState(true);
  const [snapshotPreview, setSnapshotPreview] = useState<string>("");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Exercises the <code>ForceGraphHandle</code> ref API: layout
        toggle, kick, pin, position-readout, and the substrate-leak
        escape hatches (<code>getSigmaInstance</code>,{" "}
        <code>getGraphologyInstance</code>).
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const next = !layoutOn;
            setLayoutOn(next);
            ref.current?.setLayoutEnabled(next);
          }}
        >
          Layout: {layoutOn ? "on" : "off"} (toggle)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => ref.current?.rerunLayout()}
        >
          Rerun layout
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => ref.current?.pinAllPositions()}
        >
          Pin all
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => ref.current?.resetCamera({ animate: true })}
        >
          Reset camera
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const snap = ref.current?.getSnapshot();
            const positions = ref.current?.getNodePositions() ?? [];
            setSnapshotPreview(
              `nodes=${snap?.nodes.length ?? 0} edges=${
                snap?.edges.length ?? 0
              } groups=${snap?.groups.length ?? 0} positions=${positions.length}`,
            );
          }}
        >
          Read snapshot
        </Button>
      </div>
      <DemoFrame>
        <ForceGraph
          ref={ref}
          data={SMALL_GRAPH}
          ariaLabel="Imperative handle demo"
        />
      </DemoFrame>
      {snapshotPreview ? (
        <p className="font-mono text-xs text-muted-foreground">
          {snapshotPreview}
        </p>
      ) : null}
    </div>
  );
}

function CustomThemeDemo() {
  const customColors = useMemo<Partial<Record<ThemeKey, string>>>(
    () => ({
      background: "oklch(0.16 0.02 280)",
      edgeDefault: "oklch(0.85 0.15 30)",
      edgeMuted: "oklch(0.55 0.05 280)",
      labelColor: "oklch(0.95 0.03 280)",
    }),
    [],
  );
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Demonstrates <code>theme=&quot;custom&quot;</code> +{" "}
        <code>customColors</code> override — host supplies a partial palette;
        missing keys fall back to dark-theme defaults per decision #8.
      </p>
      <DemoFrame>
        <ForceGraph
          data={SMALL_GRAPH}
          theme="custom"
          customColors={customColors}
          ariaLabel="Custom theme demo"
        />
      </DemoFrame>
    </div>
  );
}

function LiveSourceDemo() {
  const source = useMemo<GraphInput>(() => {
    const s: GraphSource = {
      async loadInitial() {
        // Simulate a network round-trip so the loading overlay is visible.
        await new Promise((resolve) => setTimeout(resolve, 350));
        return SMALL_GRAPH;
      },
    };
    return s;
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Demonstrates the <code>GraphSource</code> contract:{" "}
        <code>loadInitial()</code> resolves asynchronously; the component
        shows a loading overlay until the snapshot arrives, then validates
        + imports. <code>subscribe</code> + <code>applyMutation</code> are
        type-supported but not exercised in v0.1 (they activate in v0.3).
      </p>
      <DemoFrame>
        <ForceGraph data={source} ariaLabel="Live source demo" />
      </DemoFrame>
    </div>
  );
}

export default function ForceGraphDemo() {
  return (
    <Tabs defaultValue="basic" className="flex flex-col gap-4">
      <TabsList>
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="static">Static positions</TabsTrigger>
        <TabsTrigger value="handle">Imperative handle</TabsTrigger>
        <TabsTrigger value="theme">Custom theme</TabsTrigger>
        <TabsTrigger value="live">Live source</TabsTrigger>
      </TabsList>
      <TabsContent value="basic">
        <BasicDemo />
      </TabsContent>
      <TabsContent value="static">
        <StaticPositionsDemo />
      </TabsContent>
      <TabsContent value="handle">
        <ImperativeHandleDemo />
      </TabsContent>
      <TabsContent value="theme">
        <CustomThemeDemo />
      </TabsContent>
      <TabsContent value="live">
        <LiveSourceDemo />
      </TabsContent>
    </Tabs>
  );
}
