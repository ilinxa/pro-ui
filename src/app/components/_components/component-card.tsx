import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ComponentMeta } from "@/registry/types";

function statusVariant(
  status: ComponentMeta["status"],
): "default" | "destructive" | "secondary" | "outline" {
  if (status === "stable") return "default";
  if (status === "deprecated") return "destructive";
  if (status === "beta") return "secondary";
  return "outline";
}

export function ComponentCard({ meta }: { meta: ComponentMeta }) {
  return (
    <Link
      href={`/components/${meta.slug}`}
      className="group focus:outline-none"
    >
      <Card className="h-full transition-colors group-hover:border-foreground/20 group-focus-visible:border-foreground/40">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">{meta.name}</CardTitle>
            <Badge variant={statusVariant(meta.status)} className="capitalize">
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
  );
}
