import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CATEGORIES } from "@/registry/categories";
import { getAllSlugs, getEntry } from "@/registry/manifest";
import { ComposerPlayground } from "./_components/composer-playground";
import { FlowCanvasPlayground } from "./_components/flow-canvas-playground";
import { JsonFormPlayground } from "./_components/json-form-playground";
import { RichCardPlayground } from "./_components/rich-card-playground";
import { DemoSourceBlock } from "./_components/demo-source-block";
import { InstallationBlock } from "./_components/installation-block";
import { ViewCodeDialog } from "./_components/view-code-dialog";
import { getDemoSource } from "./_lib/source-map.generated";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Slug → live JSON playground. Each config-driven component renders a
 * `<JsonPlayground>` on its detail page: write the component's JSON config on
 * the left, Submit, see it render live on the right.
 */
const PLAYGROUNDS: Record<
  string,
  { description: ReactNode; render: () => ReactNode }
> = {
  "content-composer-01": {
    description: (
      <>
        This composer is defined entirely by a JSON{" "}
        <code className="font-mono text-foreground">ComposerConfig</code>. Edit
        it on the left — when it&apos;s valid, press{" "}
        <strong className="text-foreground">Submit</strong> to render a
        fully-functional composer from your config on the right (step nav,
        gates, autosave, and the metadata / body / media / carousel slots all
        live). Publish/Save assemble a result via a playground adapter.
      </>
    ),
    render: () => <ComposerPlayground />,
  },
  "json-form": {
    description: (
      <>
        json-form renders a form entirely from a JSON{" "}
        <code className="font-mono text-foreground">FormSchema</code>. Edit it on
        the left — when it&apos;s valid, press{" "}
        <strong className="text-foreground">Submit</strong> to render the live
        form on the right (fields, validators, conditional visibility all
        working). Submitting the form shows the collected values.
      </>
    ),
    render: () => <JsonFormPlayground />,
  },
  "rich-card": {
    description: (
      <>
        rich-card renders a recursive card tree from a JSON{" "}
        <code className="font-mono text-foreground">RichCardJsonNode</code>{" "}
        (scalar keys are fields, nested objects are subcards,{" "}
        <code className="font-mono text-foreground">__rcmeta</code> holds
        metadata). Edit it on the left, press{" "}
        <strong className="text-foreground">Submit</strong>, and the editable
        card renders on the right.
      </>
    ),
    render: () => <RichCardPlayground />,
  },
  "flow-canvas-01": {
    description: (
      <>
        flow-canvas renders a node graph from a JSON{" "}
        <code className="font-mono text-foreground">CanvasData</code> (
        <code className="font-mono text-foreground">nodes</code> +{" "}
        <code className="font-mono text-foreground">edges</code>). Nodes use a{" "}
        <code className="font-mono text-foreground">card</code> renderer or fall
        back to the built-in custom-JSON node; edges connect{" "}
        <code className="font-mono text-foreground">nodeId:portId</code> refs.
        Submit to render the live, interactive canvas.
      </>
    ),
    render: () => <FlowCanvasPlayground />,
  },
};

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) return {};
  return {
    title: `${entry.meta.name} — ilinxa-ui-pro`,
    description: entry.meta.description,
  };
}

export default async function ComponentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();

  const { meta, Demo, Usage } = entry;
  const category = CATEGORIES[meta.category];
  const demoSource = getDemoSource(slug);

  return (
    <div className="mx-auto w-full max-w-5xl overflow-x-hidden px-6 py-12 sm:overflow-x-visible">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/components" className="hover:text-foreground">
          Components
        </Link>
        <span aria-hidden>/</span>
        <span>{category.label}</span>
        <span aria-hidden>/</span>
        <span className="text-foreground">{meta.name}</span>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {meta.name}
          </h1>
          <Badge
            variant={
              meta.status === "stable"
                ? "default"
                : meta.status === "deprecated"
                  ? "destructive"
                  : meta.status === "beta"
                    ? "secondary"
                    : "outline"
            }
            className="capitalize"
          >
            {meta.status}
          </Badge>
          <span className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground">
            v{meta.version}
          </span>
        </div>
        <p className="max-w-2xl text-base text-muted-foreground">
          {meta.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">Category:</span>{" "}
            {category.label}
          </span>
          <span aria-hidden>·</span>
          <span>
            <span className="font-medium text-foreground">Updated:</span>{" "}
            {meta.updatedAt}
          </span>
          <span aria-hidden>·</span>
          <span>
            <span className="font-medium text-foreground">Created:</span>{" "}
            {meta.createdAt}
          </span>
          {meta.author ? (
            <>
              <span aria-hidden>·</span>
              <span>
                <span className="font-medium text-foreground">Author:</span>{" "}
                {typeof meta.author === "string"
                  ? meta.author
                  : meta.author.name}
              </span>
            </>
          ) : null}
        </div>
      </header>

      <Separator className="my-8" />

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Context
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-foreground">
          {meta.context}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Installation
        </h2>
        <InstallationBlock slug={meta.slug} />
      </section>

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </h2>
          {demoSource ? (
            <ViewCodeDialog source={demoSource} filename="demo.tsx" lang="tsx" />
          ) : null}
        </div>
        <div className="relative rounded-lg border border-border bg-background p-6">
          <Demo />
        </div>
      </section>

      {PLAYGROUNDS[slug] ? (
        <section className="mb-10">
          <div className="mb-3 flex flex-col gap-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Live playground
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {PLAYGROUNDS[slug].description}
            </p>
          </div>
          {PLAYGROUNDS[slug].render()}
        </section>
      ) : null}

      {demoSource ? (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Demo source
          </h2>
          <DemoSourceBlock
            source={demoSource}
            filename="demo.tsx"
            lang="tsx"
          />
        </section>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Usage
        </h2>
        <Usage />
      </section>

      <Separator className="my-8" />

      <section className="grid gap-8 sm:grid-cols-2">
        {meta.features && meta.features.length > 0 ? (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Features
            </h3>
            <ul className="ml-5 list-disc space-y-1 text-sm text-foreground">
              {meta.features.map((f) => (
                <li key={f} className="wrap-break-word">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {meta.dependencies ? (
          <div className="sm:col-span-2">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Dependencies
            </h3>
            <div className="flex flex-col gap-3 text-sm">
              {meta.dependencies.shadcn &&
              meta.dependencies.shadcn.length > 0 ? (
                <div>
                  <span className="font-medium text-foreground">
                    shadcn primitives:
                  </span>{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    {meta.dependencies.shadcn.join(", ")}
                  </span>
                </div>
              ) : null}
              {meta.dependencies.npm &&
              Object.keys(meta.dependencies.npm).length > 0 ? (
                <div>
                  <span className="font-medium text-foreground">
                    npm peer deps:
                  </span>{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    {Object.entries(meta.dependencies.npm)
                      .map(([k, v]) => `${k}@${v}`)
                      .join(", ")}
                  </span>
                </div>
              ) : null}
              {meta.dependencies.internal &&
              meta.dependencies.internal.length > 0 ? (
                <div>
                  <span className="font-medium text-foreground">
                    internal:
                  </span>{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    {meta.dependencies.internal.join(", ")}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
