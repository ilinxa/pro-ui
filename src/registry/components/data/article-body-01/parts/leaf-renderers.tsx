"use client";

import type { ComponentProps } from "react";
import { PlateLeaf } from "platejs/react";
import { cn } from "@/lib/utils";

type LeafProps = ComponentProps<typeof PlateLeaf>;

export function CodeLeaf(props: LeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="code"
      className={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]",
        props.className
      )}
    >
      {props.children}
    </PlateLeaf>
  );
}

export function HighlightLeaf(props: LeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="mark"
      className={cn(
        "rounded bg-primary/20 px-0.5 text-foreground",
        props.className
      )}
    >
      {props.children}
    </PlateLeaf>
  );
}

export function KbdLeaf(props: LeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="kbd"
      className={cn(
        "rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] shadow-sm",
        props.className
      )}
    >
      {props.children}
    </PlateLeaf>
  );
}
