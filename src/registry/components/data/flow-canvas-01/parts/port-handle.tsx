"use client";

import { Handle, Position, type IsValidConnection } from "@xyflow/react";
import { memo, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { usePortType } from "../registries/port-type-registry";
import type { Port } from "../types";

const POSITION_MAP = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
} as const;

// Wraps xyflow's <Handle /> with our typed-port semantics:
// - Color comes from the port-type registry (via usePortType).
// - id is forced (xyflow needs unique handle ids per node when same type).
// - type is derived from port.dir ('out' → 'source', 'in' → 'target').
// - position from port.side via POSITION_MAP.
//
// In M2 the handle renders correctly. M3 wires `isValidConnection` on the
// handle to the global typed-connection validator + multi-edge enforcement.
function PortHandleImpl({
  port,
  isValidConnection,
  className,
  style,
}: {
  port: Port;
  isValidConnection?: IsValidConnection;
  className?: string;
  style?: CSSProperties;
}) {
  const portType = usePortType(port.type);
  const color = portType?.color ?? "var(--muted-foreground)";

  return (
    <Handle
      id={port.id}
      type={port.dir === "out" ? "source" : "target"}
      position={POSITION_MAP[port.side]}
      isValidConnection={isValidConnection}
      aria-label={`${port.label ?? port.id} (${port.dir} ${port.type})`}
      className={cn("h-2.5! w-2.5! border-2!", className)}
      style={{
        background: color,
        borderColor: "var(--background)",
        ...style,
      }}
    />
  );
}

export const PortHandle = memo(PortHandleImpl);
