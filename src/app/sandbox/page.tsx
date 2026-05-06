import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SANDBOXES } from "./_lib/manifest";

export const metadata = {
  title: "Sandbox — ilinxa-ui-pro",
  description:
    "Tier-3 assembled-page demos that prove the registry composes into real product surfaces.",
};

export default function SandboxIndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-12 flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          ilinxa-ui-pro
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Sandbox
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Tier-3 assembled-page demos. Each sandbox composes registry components
          into a real product surface. Sandboxes are host code, not registry
          components — they prove the kit works end-to-end.
        </p>
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {SANDBOXES.length} sandbox{SANDBOXES.length === 1 ? "" : "es"}
          </span>
        </div>
      </header>

      {SANDBOXES.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No sandboxes yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SANDBOXES.map((sandbox) => (
            <Link
              key={sandbox.slug}
              href={`/sandbox/${sandbox.slug}`}
              className="group focus:outline-none"
            >
              <Card className="h-full transition-colors group-hover:border-foreground/20 group-focus-visible:border-foreground/40">
                <CardHeader className="gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{sandbox.title}</CardTitle>
                    <Badge
                      variant={
                        sandbox.status === "stable"
                          ? "default"
                          : sandbox.status === "beta"
                            ? "secondary"
                            : "outline"
                      }
                      className="capitalize"
                    >
                      {sandbox.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {sandbox.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {sandbox.domain}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                    Open
                    <ArrowRight
                      className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
