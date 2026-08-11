"use client";

import { memo } from "react";
import { Background as XyBackground, BackgroundVariant } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { FlowCanvasBackgroundConfig } from "../types";

const DEFAULT_LIGHT = {
  from: "var(--background)",
  to: "var(--muted)",
  angle: 145,
};
const DEFAULT_DARK = {
  from: "var(--background)",
  to: "var(--card)",
  angle: 145,
};

const VARIANT_MAP = {
  dots: BackgroundVariant.Dots,
  grid: BackgroundVariant.Lines,
  cross: BackgroundVariant.Cross,
} as const;

function FlowCanvasBackgroundImpl({
  config,
}: {
  config?: FlowCanvasBackgroundConfig;
}) {
  const light = { ...DEFAULT_LIGHT, ...config?.light };
  const dark = { ...DEFAULT_DARK, ...config?.dark };
  const overlay = config?.overlay ?? "dots";
  const overlayOpacity = config?.overlayOpacity ?? 0.4;

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity",
          "[background:linear-gradient(var(--flow-canvas-light-angle),var(--flow-canvas-light-from),var(--flow-canvas-light-to))]",
          "dark:[background:linear-gradient(var(--flow-canvas-dark-angle),var(--flow-canvas-dark-from),var(--flow-canvas-dark-to))]",
        )}
        style={
          {
            "--flow-canvas-light-from": light.from,
            "--flow-canvas-light-to": light.to,
            "--flow-canvas-light-angle": `${light.angle}deg`,
            "--flow-canvas-dark-from": dark.from,
            "--flow-canvas-dark-to": dark.to,
            "--flow-canvas-dark-angle": `${dark.angle}deg`,
          } as React.CSSProperties
        }
      />
      {overlay !== "none" && (
        <XyBackground
          variant={VARIANT_MAP[overlay]}
          gap={20}
          size={1}
          color="var(--border)"
          style={{ opacity: overlayOpacity }}
        />
      )}
    </>
  );
}

export const FlowCanvasBackground = memo(FlowCanvasBackgroundImpl);
