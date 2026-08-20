import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ORDERED_CATEGORIES } from "@/registry/categories";
import { getMetaList } from "@/registry/manifest";
import {
  SITE_URL,
  registriesSnippet,
  installCommand,
} from "@/lib/registry-constants";

export const metadata = {
  title: "Developer documentation",
  description:
    "Install ilinxa pro-ui components in your Next.js or React app via the shadcn-registry distribution model.",
};

export default function DocsPage() {
  const metas = getMetaList();
  const grouped = ORDERED_CATEGORIES.map((category) => ({
    category,
    list: metas.filter((m) => m.category === category.slug),
  })).filter((g) => g.list.length > 0);

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

      <Section anchor="setup" title="Namespace resolution — zero config" delay={240}>
        <p>
          The <Code>@ilinxa</Code> namespace is listed in the official shadcn
          registry directory, so the CLI resolves it automatically — no{" "}
          <Code>components.json</Code> configuration needed. Skip straight to
          the install command.
        </p>
        <p>
          <strong className="text-foreground">Fallback:</strong> if your CLI
          can&rsquo;t resolve <Code>@ilinxa</Code> (older or pinned CLI
          versions, self-hosted mirrors), register the namespace manually in
          your <Code>components.json</Code> (merge with your existing config):
        </p>
        <Pre>{registriesSnippet()}</Pre>
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
${installCommand("properties-form")}

# Or with dummy-data fixtures
${installCommand("properties-form-fixtures")}`}</Pre>
        <p>
          The CLI auto-installs shadcn primitives the component depends on
          (e.g. <Code>button</Code>, <Code>input</Code>, <Code>tooltip</Code>)
          and npm peer deps (<Code>lucide-react</Code>,{" "}
          <Code>@codemirror/*</Code>, <Code>@dnd-kit/*</Code>, etc.). Files land
          at <Code>components/{"<slug>"}/{"<sub-path>"}</Code> with the sealed
          folder intact — under <Code>src/</Code> if your project uses a{" "}
          <Code>src/</Code> directory. A custom <Code>aliases.components</Code>{" "}
          doesn&apos;t relocate them; imports are rewritten to your aliases
          either way, so the install compiles as-is.
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
          {metas.length} components across {grouped.length} categories, each
          with an optional <Code>-fixtures</Code> sibling for example data.
          This list renders from the live registry manifest, so it never goes
          stale.
        </p>
        <div className="not-prose mt-4 flex flex-col gap-5">
          {grouped.map(({ category, list }) => (
            <div key={category.slug}>
              <p className="mb-2 text-sm font-medium text-foreground">
                {category.label}{" "}
                <span className="font-normal text-muted-foreground">
                  · {list.length}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {list.map((m) => (
                  <Link
                    key={m.slug}
                    href={`/components/${m.slug}`}
                    className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    {m.slug}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
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
        <Pre>{`${installCommand("<slug>")} --overwrite`}</Pre>
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
          symptom={`Re-running add didn't pull upstream changes`}
          fix="Without --overwrite, locally-modified files are skipped — non-interactive runs auto-answer the overwrite prompt with 'no' and exit 0, so exit-code checks can't detect it. Add --overwrite to update; the CLI diffs per file, so unchanged files are left alone."
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
        <Pre>{`${SITE_URL}/llms.txt`}</Pre>
        <p>
          Point your AI assistant at this URL when working on a project that
          consumes the registry. It contains install steps, the full component
          list, common gotchas, and the fallback registry config — everything an
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

function Trouble({ symptom, fix }: { symptom: string; fix: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="font-mono text-sm font-medium text-foreground">{symptom}</p>
      <p className="mt-2 text-sm text-muted-foreground">{fix}</p>
    </div>
  );
}
