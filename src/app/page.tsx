import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMetaList } from "@/registry/manifest";
import { ORDERED_CATEGORIES } from "@/registry/categories";

export default function Home() {
  const components = getMetaList();
  const categoryCount = ORDERED_CATEGORIES.length;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-24">
      <div className="flex flex-col gap-6">
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
          A private library of high-level, fully-composed components on top of{" "}
          <span className="text-foreground">shadcn/ui</span>,{" "}
          <span className="text-foreground">Tailwind CSS v4</span>, and
          best-in-class open-source primitives. Each component is standalone,
          dynamic, and follows the shadcn customization model.
        </p>

        <div
          className="reveal-up mt-2 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "180ms" }}
        >
          <Button asChild size="lg">
            <Link href="/components">Browse components</Link>
          </Button>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {components.length} component{components.length === 1 ? "" : "s"} ·{" "}
            {categoryCount} categories
          </span>
        </div>
      </div>
    </div>
  );
}
