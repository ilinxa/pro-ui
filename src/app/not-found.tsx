import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-start justify-center px-6 py-24">
      <p
        className="reveal-up font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
        style={{ animationDelay: "0ms" }}
      >
        404
      </p>
      <h1
        className="reveal-up mt-4 text-balance text-6xl font-semibold tracking-tight text-foreground sm:text-7xl"
        style={{ animationDelay: "60ms" }}
      >
        This page doesn&rsquo;t exist.
      </h1>
      <p
        className="reveal-up mt-4 max-w-md text-base leading-relaxed text-muted-foreground"
        style={{ animationDelay: "120ms" }}
      >
        The route you followed may be broken, or the page may have moved.
      </p>
      <div
        className="reveal-up mt-8 flex flex-wrap items-center gap-3"
        style={{ animationDelay: "180ms" }}
      >
        <Button asChild size="lg">
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/components">Browse components</Link>
        </Button>
      </div>
    </div>
  );
}
