"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AreaContextContext } from "../hooks/use-area-context";
import type { AreaContext } from "../types";

export function AreaBody({
  ctx,
  children,
  className,
}: {
  ctx: AreaContext;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AreaContextContext.Provider value={ctx}>
      <ScrollArea className={cn("h-full w-full", className)}>
        <div className="h-full w-full">{children}</div>
      </ScrollArea>
    </AreaContextContext.Provider>
  );
}
