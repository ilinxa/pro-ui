"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  EdgeRenderer,
  NodeRecord,
  NodeRenderer,
  PortType,
} from "../types";

export type FlowCanvasContextValue = {
  renderers: NodeRenderer[];
  portTypes: PortType[];
  edgeTypes: EdgeRenderer[];
  readOnly: boolean;
  selectionMode: "single" | "multi";
  onNodeUpdate?: (node: NodeRecord) => void;
  // v0.2.1 — bubbled up from a renderer's ctx.onEditRequest call.
  // Identity is stabilized inside flow-canvas-01.tsx via ref-mirror so consumers
  // passing inline `onEditRequest={...}` don't cascade re-renders across every
  // NodeAdapter. Identity only flips on the wired/unwired transition.
  onEditRequest?: (nodeId: string, subPath?: string) => void;
};

export const FlowCanvasContext = createContext<FlowCanvasContextValue | null>(
  null,
);

export function useFlowCanvasContext(): FlowCanvasContextValue {
  const ctx = useContext(FlowCanvasContext);
  if (!ctx) {
    throw new Error(
      "useFlowCanvasContext must be used inside <FlowCanvas /> — wrap your tree in the FlowCanvas component before calling registry hooks.",
    );
  }
  return ctx;
}

export function FlowCanvasContextProvider({
  value,
  children,
}: {
  value: FlowCanvasContextValue;
  children: ReactNode;
}) {
  return (
    <FlowCanvasContext.Provider value={value}>
      {children}
    </FlowCanvasContext.Provider>
  );
}
