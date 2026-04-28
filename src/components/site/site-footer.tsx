import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="block size-1.5 rounded-[2px] bg-primary"
          />
          <span className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              ilinxa
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              /ui-pro
            </span>
          </span>
          <span aria-hidden className="ml-1 h-3 w-px bg-border/80" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            v0.1.0 · alpha
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Link
            href="/"
            className="transition-colors hover:text-foreground focus-visible:text-foreground outline-none"
          >
            Home
          </Link>
          <Link
            href="/components"
            className="transition-colors hover:text-foreground focus-visible:text-foreground outline-none"
          >
            Components
          </Link>
          <span aria-hidden className="h-3 w-px bg-border/80" />
          <span>© 2026 ilinxa</span>
        </div>
      </div>
    </footer>
  );
}
