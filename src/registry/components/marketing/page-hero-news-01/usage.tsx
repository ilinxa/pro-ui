export default function PageHeroNews01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>PageHeroNews01</code> as the top-of-page hero band
        on any landing or section: news landing, blog index, marketing
        page, docs site, app welcome screen. Composes a gradient
        background, accent badge chip, large title with optional highlight
        subline, description, and a flexible content slot.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { PageHeroNews01 } from "@/registry/components/marketing/page-hero-news-01";

<PageHeroNews01
  badge="News & Updates"
  title="Latest Stories"
  titleHighlight="From Our Team"
  description="Insights and announcements."
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">With HeroStats</h3>
      <p className="text-muted-foreground">
        The <code>HeroStats</code> sub-component renders the typical icon-circle
        + bold value + small label triplet, designed for the white-on-gradient
        contrast inside the hero.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { HeroStats, PageHeroNews01 } from "@/registry/components/marketing/page-hero-news-01";
import { Newspaper, TrendingUp, Clock } from "lucide-react";

<PageHeroNews01 badge="News" title="Stories" description="Stay informed.">
  <HeroStats stats={[
    { icon: Newspaper, value: "500+", label: "Articles" },
    { icon: TrendingUp, value: "10K+", label: "Readers" },
    { icon: Clock, value: "Daily", label: "Updates" },
  ]} />
</PageHeroNews01>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">CTA cluster</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PageHeroNews01
  badge="New: v2.0"
  title="Build faster"
  titleHighlight="Ship sooner"
>
  <div className="flex justify-center gap-4">
    <Button size="lg" variant="secondary">Get started</Button>
    <Button size="lg" variant="outline">View docs</Button>
  </div>
</PageHeroNews01>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Density variations</h3>
      <p className="text-muted-foreground">
        Three options via the <code>density</code> prop:
      </p>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>compact</code> — <code>min-h-[40vh]</code>. Sub-page heroes,
          section dividers.
        </li>
        <li>
          <code>default</code> — <code>min-h-[70vh]</code>. Most landing pages.
        </li>
        <li>
          <code>full</code> — <code>min-h-screen</code>. Splash / welcome screens.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom title rendering</h3>
      <p className="text-muted-foreground">
        For mixed-color or italic-word titles beyond the simple{" "}
        <code>title</code> + <code>titleHighlight</code> combo, pass{" "}
        <code>titleSlot</code>:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PageHeroNews01
  title="" // unused when titleSlot is provided
  titleSlot={
    <h1 className="text-5xl font-bold text-white">
      The <em className="text-accent">future</em> of news
    </h1>
  }
  description="..."
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Animation</h3>
      <p className="text-muted-foreground">
        Reveal animation runs on mount via the project-wide{" "}
        <code>reveal-up</code> CSS keyframe with 60ms staggered delays
        (badge → title → description → children). Respects{" "}
        <code>prefers-reduced-motion</code> automatically (free via the
        existing keyframe). Disable entirely with{" "}
        <code>{"disableReveal={true}"}</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Section is a landmark with{" "}
          <code>aria-labelledby</code> pointing to the title id (auto-generated
          via <code>useId</code>).
        </li>
        <li>
          Badge icon is <code>aria-hidden</code>; badge text is the meaningful
          label.
        </li>
        <li>
          Heading semantic level configurable via{" "}
          <code>{"headingAs={\"h1\" | \"h2\" | \"h3\"}"}</code>. Default{" "}
          <code>h1</code>.
        </li>
        <li>
          Reduced-motion users see content instantly (no transitions).
        </li>
      </ul>
    </div>
  );
}
