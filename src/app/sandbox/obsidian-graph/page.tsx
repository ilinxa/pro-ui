"use client";

import dynamic from "next/dynamic";

const ObsidianGraph = dynamic(() => import("./obsidian-graph"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0a0908] text-[#f5e8d2]/60">
      Loading graph…
    </div>
  ),
});

export default function ObsidianGraphSandboxPage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] min-h-150 w-full">
      <ObsidianGraph />
    </div>
  );
}
