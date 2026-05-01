import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGroupedRegistry } from "@/registry/manifest";

export default function ComponentsIndexPage() {
  const groups = getGroupedRegistry();
  const totalCount = groups.reduce((sum, g) => sum + g.entries.length, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-12 flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          ilinxa-ui-pro
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Components
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          High-level, fully-composed components built on top of shadcn/ui and
          Tailwind. Each one is standalone, dynamic, and follows the shadcn
          customization model.
        </p>
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {totalCount} component{totalCount === 1 ? "" : "s"}
          </span>
          <span aria-hidden>·</span>
          <span>
            {groups.length} categor{groups.length === 1 ? "y" : "ies"}
          </span>
        </div>
      </header>

      {groups.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No components yet.
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {groups.map(({ category, entries }) => (
            <section key={category.slug}>
              <div className="mb-4 flex items-baseline justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {category.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {entries.length} item{entries.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map(({ meta }) => (
                  <Link
                    key={meta.slug}
                    href={`/components/${meta.slug}`}
                    className="group focus:outline-none"
                  >
                    <Card className="h-full transition-colors group-hover:border-foreground/20 group-focus-visible:border-foreground/40">
                      <CardHeader className="gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle className="text-base">
                            {meta.name}
                          </CardTitle>
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
                        </div>
                        <CardDescription className="line-clamp-2">
                          {meta.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {meta.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
