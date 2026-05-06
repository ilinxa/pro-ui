import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, FolderTree, PackagePlus, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEntry } from "@/registry/manifest";

/** Outer page container for the docs tab. Constrains width + adds vertical rhythm. */
export function DocsContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 px-6 py-10">
      {children}
    </div>
  );
}

/** Section header + body, optional icon. */
export function DocsSection({
  title,
  icon: Icon,
  children,
  description,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon ? (
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : null}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="text-sm text-foreground">{children}</div>
    </section>
  );
}

/** Monospace shell-command code block with subtle bg + border. */
export function ShellBlock({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground",
        className,
      )}
    >
      <code>{code}</code>
    </pre>
  );
}

/** Quick-install block for a Tier-3 sandbox: installs every consumed component. */
export function InstallBlock({ slugs }: { slugs: string[] }) {
  if (slugs.length === 0) return null;
  const baseCmd = `pnpm dlx shadcn@latest add \\\n  ${slugs
    .map((s) => `@ilinxa/${s}`)
    .join(" \\\n  ")}`;
  const fixturesCmd = `pnpm dlx shadcn@latest add \\\n  ${slugs
    .map((s) => `@ilinxa/${s}-fixtures`)
    .join(" \\\n  ")}`;
  return (
    <DocsSection
      title="Quick install"
      icon={PackagePlus}
      description="Install every component this sandbox composes via the @ilinxa registry."
    >
      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            Components
          </p>
          <ShellBlock code={baseCmd} />
        </div>
        <div>
          <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            Fixtures (optional, recommended for getting started)
          </p>
          <ShellBlock code={fixturesCmd} />
        </div>
        <p className="text-xs text-muted-foreground">
          The page itself is host code, not a registry component — copy the
          assembly file from this repo as a starting point.
        </p>
      </div>
    </DocsSection>
  );
}

/** Linkable list of components used (resolves names from the registry). */
export function ComponentsUsedList({ slugs }: { slugs: string[] }) {
  const entries = slugs
    .map((slug) => ({ slug, entry: getEntry(slug) }))
    .filter((x) => x.entry);

  return (
    <DocsSection
      title="Components used"
      icon={ExternalLink}
      description="Each links to its detail page in the component catalog."
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {entries.map(({ slug, entry }) => (
          <li key={slug}>
            <Link
              href={`/components/${slug}`}
              className="group flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card px-3 py-2 transition-colors hover:border-foreground/20"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {entry!.meta.name}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {slug}
                </span>
              </span>
              <ExternalLink
                className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </DocsSection>
  );
}

/** File-tree style code overview block. */
export function CodeOverview({
  files,
}: {
  files: Array<{ path: string; description: string }>;
}) {
  return (
    <DocsSection
      title="Code overview"
      icon={FolderTree}
      description="The file structure of this sandbox in the repo."
    >
      <ul className="space-y-1.5 rounded-md border border-border/60 bg-muted/40 p-4 font-mono text-xs">
        {files.map((f) => (
          <li key={f.path} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
            <span className="text-foreground">{f.path}</span>
            <span className="text-muted-foreground sm:text-right sm:flex-1">
              {f.description}
            </span>
          </li>
        ))}
      </ul>
    </DocsSection>
  );
}

/** Bulleted developer-guide block for assembly notes / gotchas / decisions. */
export function DeveloperGuide({ children }: { children: ReactNode }) {
  return (
    <DocsSection
      title="Developer guide"
      icon={Wrench}
      description="Notes for hosts assembling this page in their own app."
    >
      <div className="prose prose-sm dark:prose-invert max-w-none [&_li]:my-1 [&_p]:my-2">
        {children}
      </div>
    </DocsSection>
  );
}
