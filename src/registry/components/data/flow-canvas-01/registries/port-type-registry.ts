"use client";

import type { PortType } from "../types";
import { useFlowCanvasContext } from "./canvas-context";

// Built-in port-type palette. Maps to design tokens, not raw colors.
// — data:  neutral grey (untyped / generic)
// — text:  blue   (--chart-5)
// — image: emerald (--chart-2)
// — card:  signal-lime (--primary, the accent)
// — event: cyan  (--chart-4)
// — doc:   teal  (--chart-3) — v0.2.5 add; bottom-only side enforced editor-side
//                              by @ilinxa/rich-card-in-flow's PortEditorStrip
//                              (no runtime enforcement here)
//
// Color descriptions in the description doc said "blue / orange / lime / rose" —
// the actual chart palette is lime → emerald → teal → cyan → blue, so we map to
// the closest semantic neighbor. Consumers override via the `portTypes` prop.
export const defaultPortTypes: PortType[] = [
  { id: "data", color: "var(--muted-foreground)", label: "Data" },
  { id: "text", color: "var(--chart-5)", label: "Text" },
  { id: "image", color: "var(--chart-2)", label: "Image" },
  { id: "card", color: "var(--primary)", label: "Card" },
  { id: "event", color: "var(--chart-4)", label: "Event" },
  { id: "doc", color: "var(--chart-3)", label: "Doc" },
];

export function findPortType(
  portTypes: PortType[],
  id: string,
): PortType | undefined {
  return portTypes.find((t) => t.id === id);
}

export function usePortType(id: string): PortType | undefined {
  const { portTypes } = useFlowCanvasContext();
  return findPortType(portTypes, id);
}
