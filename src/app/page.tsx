import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMetaList } from "@/registry/manifest";
import { ORDERED_CATEGORIES } from "@/registry/categories";

export default function Home() {
  const components = getMetaList();
  const categoryCount = ORDERED_CATEGORIES.length;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-24">
      <section className="flex min-h-[60vh] flex-col justify-center gap-6">
        <p
          className="reveal-up font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
          style={{ animationDelay: "0ms" }}
        >
          ilinxa-ui-pro
        </p>
        <h1
          className="reveal-up text-balance text-5xl font-semibold tracking-tight text-foreground sm:text-6xl"
          style={{ animationDelay: "60ms" }}
        >
          Professional components, built once, reused everywhere.
        </h1>
        <p
          className="reveal-up max-w-xl text-base leading-relaxed text-muted-foreground"
          style={{ animationDelay: "120ms" }}
        >
          A library of high-level, fully-composed components on top of{" "}
          <span className="text-foreground">shadcn/ui</span>,{" "}
          <span className="text-foreground">Tailwind CSS v4</span>, and
          best-in-class open-source primitives. Distributed via{" "}
          <span className="text-foreground">shadcn-registry</span> — install
          source files into your repo, you own the code.
        </p>

        <div
          className="reveal-up mt-2 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "180ms" }}
        >
          <Button asChild size="lg">
            <Link href="/components">Browse components</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/docs">Read the docs</Link>
          </Button>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {components.length} component{components.length === 1 ? "" : "s"} ·{" "}
            {categoryCount} categories
          </span>
        </div>
      </section>

      <section className="mt-32 flex flex-col gap-6">
        <p
          className="reveal-up font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
          style={{ animationDelay: "240ms" }}
        >
          Quick start
        </p>
        <h2
          className="reveal-up text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          style={{ animationDelay: "300ms" }}
        >
          Install into any Next or React app in three steps.
        </h2>

        <ol className="mt-2 grid gap-8">
          <li
            className="reveal-up grid gap-3"
            style={{ animationDelay: "360ms" }}
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                01
              </span>
              <h3 className="text-lg font-medium text-foreground">
                Initialize shadcn (skip if already done)
              </h3>
            </div>
            <pre className="overflow-x-auto rounded-md border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground">
              <code>{`pnpm dlx shadcn@latest init`}</code>
            </pre>
          </li>

          <li
            className="reveal-up grid gap-3"
            style={{ animationDelay: "420ms" }}
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                02
              </span>
              <h3 className="text-lg font-medium text-foreground">
                Register the namespace in components.json
              </h3>
            </div>
            <pre className="overflow-x-auto rounded-md border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground">
              <code>{`"registries": {
  "@ilinxa": "https://ilinxa-proui.vercel.app/r/{name}.json"
}`}</code>
            </pre>
          </li>

          <li
            className="reveal-up grid gap-3"
            style={{ animationDelay: "480ms" }}
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                03
              </span>
              <h3 className="text-lg font-medium text-foreground">
                Install a component
              </h3>
            </div>
            <pre className="overflow-x-auto rounded-md border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground">
              <code>{`pnpm dlx shadcn@latest add @ilinxa/properties-form`}</code>
            </pre>
            <p className="text-sm text-muted-foreground">
              Add{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                -fixtures
              </code>{" "}
              suffix to install with example data:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                @ilinxa/properties-form-fixtures
              </code>
            </p>
          </li>
        </ol>

        <div
          className="reveal-up mt-6 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "540ms" }}
        >
          <Button asChild variant="outline">
            <Link href="/docs">Detailed guide</Link>
          </Button>
          <Link
            href="/llms.txt"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
          >
            llms.txt for AI assistants →
          </Link>
        </div>
      </section>
    </div>
  );
}
