import { Suspense } from "react";
import FlowStressClient from "./flow-stress-client";

export const metadata = {
  title: "Flow Stress (devtools) — ilinxa pro-ui",
  description:
    "Non-published perf-measurement page for flow-canvas. Toggleable levers + FPS overlay; pair with the protocol at docs/procomps/flow-canvas-procomp/research/2026-05-14-measurement-protocol.md.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FlowStressClient />
    </Suspense>
  );
}
