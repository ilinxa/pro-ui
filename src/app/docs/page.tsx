import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Developer documentation — ilinxa-proui",
  description:
    "Install ilinxa-proui components in your Next.js or React app via the shadcn-registry distribution model.",
};

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-24">
      <header className="mb-16 flex flex-col gap-4">
        <p
          className="reveal-up font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
          style={{ animationDelay: "0ms" }}
        >
          Developer documentation
        </p>
        <h1
          className="reveal-up text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          style={{ animationDelay: "60ms" }}
        >
          Install components from the ilinxa registry.
        </h1>
        <p
          className="reveal-up max-w-2xl text-base leading-relaxed text-muted-foreground"
          style={{ animationDelay: "120ms" }}
        >
          ilinxa pro-ui ships as a shadcn-registry: source files copy into your
          repo on install, you own the code. No npm package, no version pinning,
          no abstraction tax — re-run the install with{" "}
          <Code>--overwrite</Code> to pull upstream changes.
        </p>
      </header>

      <Section anchor="prerequisites" title="Prerequisites" delay={180}>
        <p>
          Your project must already have shadcn initialized. This seeds the{" "}
          <Code>cn</Code> helper at <Code>lib/utils.ts</Code> and the{" "}
          <Code>components.json</Code> config that the CLI reads.
        </p>
        <Pre>{`pnpm dlx shadcn@latest init`}</Pre>
        <p className="text-sm">
          Skip this step if you&rsquo;ve already used any shadcn component in
          the project.
        </p>
      </Section>

      <Section anchor="setup" title="One-time setup" delay={240}>
        <p>
          Add the <Code>@ilinxa</Code> namespace to your project&rsquo;s{" "}
          <Code>components.json</Code> (merge with your existing config):
        </p>
        <Pre>{`"registries": {
  "@ilinxa": "https://ilinxa-proui.vercel.app/r/{name}.json"
}`}</Pre>
        <p className="text-sm">
          The <Code>{"{name}"}</Code> placeholder is mandatory — the CLI rejects
          registries without it.
        </p>
      </Section>

      <Section
        anchor="install"
        title="Install your first component"
        delay={300}
      >
        <Pre>{`# Lean install — component source only
pnpm dlx shadcn@latest add @ilinxa/properties-form

# Or with dummy-data fixtures
pnpm dlx shadcn@latest add @ilinxa/properties-form-fixtures`}</Pre>
        <p>
          The CLI auto-installs shadcn primitives the component depends on
          (e.g. <Code>button</Code>, <Code>input</Code>, <Code>tooltip</Code>)
          and npm peer deps (<Code>lucide-react</Code>,{" "}
          <Code>@codemirror/*</Code>, <Code>@dnd-kit/*</Code>, etc.). Files land
          at <Code>components/{"<slug>"}/{"<sub-path>"}</Code> with the sealed
          folder intact.
        </p>
        <p className="mt-6">Use it in your code:</p>
        <Pre>{`import { PropertiesForm } from "@/components/properties-form";

export function TaskEditor() {
  return (
    <PropertiesForm
      schema={taskSchema}
      values={task}
      onSubmit={async (next) => { /* persist */ }}
    />
  );
}`}</Pre>
      </Section>

      <Section anchor="components" title="Available components" delay={360}>
        <p>
          Eight components, each with an optional <Code>-fixtures</Code> sibling
          for example data:
        </p>
        <ul className="mt-4 grid gap-3 not-prose">
          <Item
            slug="data-table"
            desc="Generic typed-columns data table — composable column definitions, host-owned data"
          />
          <Item
            slug="rich-card"
            desc="JSON-driven recursive card-tree viewer + structural editor with drag-drop, virtualization, undo/redo"
          />
          <Item
            slug="workspace"
            desc="Splittable canvas with corner-drag split/merge, edge-drag resize, registry-driven content"
          />
          <Item
            slug="properties-form"
            desc="Schema-driven form — six field types, three-state permissions, sync validation"
          />
          <Item
            slug="detail-panel"
            desc="Selection-aware compound container — Header / Body / Actions slots"
          />
          <Item
            slug="filter-stack"
            desc="Schema-driven filter panel — checkbox-list / toggle / text / custom"
          />
          <Item
            slug="entity-picker"
            desc="Searchable typed picker — single or multi mode, kind badges, custom render slots"
          />
          <Item
            slug="markdown-editor"
            desc="CodeMirror 6 + GFM + [[wikilink]] autocomplete + decoration"
          />
        </ul>
        <p className="mt-4 text-sm">
          <strong className="text-foreground">Note:</strong>{" "}
          <Code>force-graph</Code> is in alpha/preview on the demo site but
          not yet shipped via the registry. It will be added once stabilized.
        </p>
        <p className="mt-6">
          See per-component docs:{" "}
          <Link
            href="/components"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            browse the full catalog →
          </Link>
        </p>
      </Section>

      <Section
        anchor="update"
        title="Update an installed component"
        delay={420}
      >
        <p>
          shadcn-registry copies source verbatim — you own the code. To pull
          upstream changes:
        </p>
        <Pre>{`pnpm dlx shadcn@latest add @ilinxa/<slug> --overwrite`}</Pre>
        <p className="text-sm">
          Use <Code>--dry-run</Code> first to preview what would change, then
          merge any local modifications and ship.
        </p>
      </Section>

      <Section anchor="compatibility" title="Compatibility" delay={480}>
        <ul className="grid gap-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Next.js</strong> 14 / 15 / 16 —
            App Router &amp; Pages Router
          </li>
          <li>
            <strong className="text-foreground">React</strong> 19 (or 18 with
            graceful primitive variants)
          </li>
          <li>
            <strong className="text-foreground">Tailwind CSS</strong> v4 — CSS
            variables only, no <Code>tailwind.config.*</Code>
          </li>
          <li>
            <strong className="text-foreground">Package managers</strong> pnpm /
            bun / yarn — npm + React 19 needs <Code>--legacy-peer-deps</Code>
          </li>
        </ul>
      </Section>

      <Section anchor="troubleshooting" title="Troubleshooting" delay={540}>
        <Trouble
          symptom='Cannot find module "@/lib/utils"'
          fix="Run `pnpm dlx shadcn@latest init` in the consumer project. `shadcn add` doesn't seed the `cn` helper — `init` does."
        />
        <Trouble
          symptom={`Files landed at ./<slug>/... instead of ./components/<slug>/...`}
          fix="Your components.json has a non-default `aliases.components` (e.g. @/src/components). Either move the installed files post-install or adjust the alias."
        />
        <Trouble
          symptom="npm ERESOLVE on React 19 peer deps"
          fix="Use `--legacy-peer-deps`, or switch to pnpm/bun which resolve cleanly."
        />
        <Trouble
          symptom="Stale install after upstream registry update"
          fix="The CLI doesn't cache; the CDN does. Wait out the 5-minute TTL or append ?v=<hash> to the registry URL once."
        />
      </Section>

      <Section anchor="ai" title="AI / LLM access" delay={600}>
        <p>
          A concise, structured reference for AI agents (Claude Code, Cursor,
          GitHub Copilot, etc.) is available at:
        </p>
        <Pre>{`https://ilinxa-proui.vercel.app/llms.txt`}</Pre>
        <p>
          Point your AI assistant at this URL when working on a project that
          consumes the registry. It contains install steps, the full component
          list, common gotchas, and the namespace setup snippet — everything an
          AI needs to install components correctly without guessing.
        </p>
        <p className="mt-4">
          <Link
            href="/llms.txt"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Open llms.txt →
          </Link>
        </p>
      </Section>

      <Section anchor="contributing" title="Contributing" delay={660}>
        <p>Building or modifying components? Two reads:</p>
        <ul className="mt-4 grid gap-2 text-sm">
          <li>
            <Link
              href="https://github.com/ilinxa/pro-ui/blob/master/README.md"
              className="font-medium text-primary underline-offset-4 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              README →
            </Link>{" "}
            project setup, registry-build pipeline, scripts, design system
          </li>
          <li>
            <Link
              href="https://github.com/ilinxa/pro-ui/blob/master/docs/component-guide.md"
              className="font-medium text-primary underline-offset-4 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Component guide →
            </Link>{" "}
            anatomy, rules, lifecycle, worked end-to-end example
          </li>
        </ul>
      </Section>

      <footer className="reveal-up mt-16 flex flex-col gap-6 border-t border-border pt-8 text-sm text-muted-foreground" style={{ animationDelay: "720ms" }}>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <span className="font-mono uppercase tracking-[0.18em] text-foreground">
            Quick links
          </span>
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/components" className="hover:text-foreground">
            Components
          </Link>
          <Link href="/llms.txt" className="hover:text-foreground">
            llms.txt
          </Link>
          <Link
            href="https://github.com/ilinxa/pro-ui"
            className="hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/components">Browse the catalog</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}

function Section({
  anchor,
  title,
  delay,
  children,
}: {
  anchor: string;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <section
      id={anchor}
      className="reveal-up mb-14 flex scroll-mt-24 flex-col gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <div className="flex flex-col gap-4 text-base leading-relaxed text-muted-foreground [&_p]:max-w-prose">
        {children}
      </div>
    </section>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
      {children}
    </code>
  );
}

function Item({ slug, desc }: { slug: string; desc: string }) {
  return (
    <li className="flex flex-col gap-1 rounded-md border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link
          href={`/components/${slug}`}
          className="font-mono text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          @ilinxa/{slug}
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          + @ilinxa/{slug}-fixtures
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </li>
  );
}

function Trouble({ symptom, fix }: { symptom: string; fix: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="font-mono text-sm font-medium text-foreground">{symptom}</p>
      <p className="mt-2 text-sm text-muted-foreground">{fix}</p>
    </div>
  );
}
