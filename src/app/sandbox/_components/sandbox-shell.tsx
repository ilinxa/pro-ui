"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SandboxMeta } from "../_lib/manifest";

export interface SandboxShellProps {
  meta: SandboxMeta;
  demo: ReactNode;
  docs: ReactNode;
}

/**
 * Wraps a sandbox route with a sticky tab strip (Demo / Code) + back-link bar.
 * Demo content renders full-bleed; docs content is wrapped in a max-w container
 * by the consumer (kept out of the shell so demos can take the full viewport).
 */
export function SandboxShell({ meta, demo, docs }: SandboxShellProps) {
  return (
    <Tabs defaultValue="demo" className="flex flex-col">
      <div className="sticky top-14 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-2.5">
          <Link
            href="/sandbox"
            className="inline-flex items-center gap-1.5 rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Sandbox
          </Link>

          <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />

          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="truncate text-sm font-semibold text-foreground">
              {meta.title}
            </span>
            <Badge
              variant={
                meta.status === "stable"
                  ? "default"
                  : meta.status === "beta"
                    ? "secondary"
                    : "outline"
              }
              className="hidden capitalize sm:inline-flex"
            >
              {meta.status}
            </Badge>
          </div>

          <TabsList className="h-8">
            <TabsTrigger value="demo" className="text-xs">
              Demo
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="gap-1.5 text-xs"
              aria-label="Code and documentation"
            >
              <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{"<>"}</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value="demo" className="outline-none">
        {demo}
      </TabsContent>
      <TabsContent value="code" className="outline-none">
        {docs}
      </TabsContent>
    </Tabs>
  );
}
