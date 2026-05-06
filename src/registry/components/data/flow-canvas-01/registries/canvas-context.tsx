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
