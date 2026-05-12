"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCopyToClipboard } from "@/registry/components/code/code-block/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

const REGISTRY_BASE = "https://ilinxa-proui.vercel.app/r";
const REGISTRY_NAMESPACE = "@ilinxa";
const REGISTRY_FRAGMENT = `"registries": {
  "${REGISTRY_NAMESPACE}": "${REGISTRY_BASE}/{name}.json"
}`;

type PM = "pnpm" | "npm" | "yarn" | "bun";

// Runner prefix for `shadcn@latest <subcommand>`. Source: README.md install
// section + public/llms.txt — keep in sync with the four canonical install
// surfaces (README / llms.txt / src/app/docs / src/app/page).
const PM_RUNNER: Record<PM, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
};

const PM_ORDER: PM[] = ["pnpm", "npm", "yarn", "bun"];

function CopyableCommand({
  command,
  label = "Copy command",
}: {
  command: string;
  label?: string;
}) {
  const { copy, copied } = useCopyToClipboard();
  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2",
        "font-mono text-[13px] leading-snug text-card-foreground shadow-sm",
      )}
    >
      <span className="select-none text-muted-foreground" aria-hidden>
        $
      </span>
      <code className="flex-1 overflow-x-auto whitespace-nowrap">
        {command}
      </code>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={copied ? "Copied" : label}
        onClick={() => copy(command)}
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check aria-hidden className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy aria-hidden className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

function CopyableSnippet({
  snippet,
  label,
}: {
  snippet: string;
  label: string;
}) {
  const { copy, copied } = useCopyToClipboard();
  return (
    <div className="relative rounded-md border border-border bg-card shadow-sm">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={copied ? "Copied" : label}
        onClick={() => copy(snippet)}
        className="absolute right-1.5 top-1.5 z-10 h-7 w-7 text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check aria-hidden className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy aria-hidden className="h-3.5 w-3.5" />
        )}
      </Button>
      <pre className="overflow-x-auto px-3 py-2 pr-10 font-mono text-[13px] leading-snug text-card-foreground">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}

function StepLabel({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[11px] font-medium text-muted-foreground"
      >
        {index}
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </div>
    </div>
  );
}

export function InstallationBlock({ slug }: { slug: string }) {
  const [activePM, setActivePM] = useState<PM>("pnpm");
  const runner = PM_RUNNER[activePM];
  const initCommand = `${runner} shadcn@latest init`;
  const addCommand = `${runner} shadcn@latest add ${REGISTRY_NAMESPACE}/${slug}`;
  const addFixturesCommand = `${runner} shadcn@latest add ${REGISTRY_NAMESPACE}/${slug}-fixtures`;
  const jsonUrl = `${REGISTRY_BASE}/${slug}.json`;

  return (
    <Tabs defaultValue="command" className="w-full">
      <TabsList variant="line" className="mb-3">
        <TabsTrigger value="command">Command</TabsTrigger>
        <TabsTrigger value="manual">Manual</TabsTrigger>
      </TabsList>

      <TabsContent value="command" className="mt-0 flex flex-col gap-4">
        <Tabs
          value={activePM}
          onValueChange={(v) => setActivePM(v as PM)}
          className="w-full"
        >
          <TabsList variant="line">
            {PM_ORDER.map((pm) => (
              <TabsTrigger key={pm} value={pm} className="font-mono text-xs">
                {pm}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2">
          <StepLabel
            index={1}
            title="Initialize shadcn (once per project)"
            description="Seeds lib/utils.ts and components.json. Skip if you've already used any shadcn component."
          />
          <CopyableCommand command={initCommand} label="Copy init command" />
        </div>

        <div className="flex flex-col gap-2">
          <StepLabel
            index={2}
            title="Register the @ilinxa namespace (once per project)"
            description="Add to your components.json. Merge with existing config."
          />
          <CopyableSnippet
            snippet={REGISTRY_FRAGMENT}
            label="Copy registries snippet"
          />
        </div>

        <div className="flex flex-col gap-2">
          <StepLabel index={3} title="Install the component" />
          <CopyableCommand command={addCommand} label="Copy install command" />
          <p className="text-xs text-muted-foreground">
            Add{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              -fixtures
            </code>{" "}
            for dummy data:
          </p>
          <CopyableCommand
            command={addFixturesCommand}
            label="Copy fixtures install command"
          />
        </div>
      </TabsContent>

      <TabsContent value="manual" className="mt-0">
        <div className="rounded-md border border-border bg-card p-4 text-sm text-card-foreground shadow-sm">
          <p className="mb-2 text-muted-foreground">
            Inspect the registry artifact directly and copy each file to its
            listed target:
          </p>
          <a
            href={jsonUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 font-mono text-[13px] text-primary underline-offset-4 hover:underline"
          >
            {jsonUrl}
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            Each <code className="font-mono">files[]</code> entry lists a{" "}
            <code className="font-mono">target</code> path relative to your
            project root (e.g.{" "}
            <code className="font-mono">components/{slug}/...</code>). You
            will also need to install the shadcn primitives and npm peer deps
            the artifact lists.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
