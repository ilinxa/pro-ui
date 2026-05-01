"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { HeroStats, PageHeroNews01 } from "./page-hero-news-01";
import {
  NEWS_HERO_DEFAULTS,
  NEWS_HERO_DEFAULTS_TR,
  NEWS_HERO_STATS_EN,
  NEWS_HERO_STATS_TR,
} from "./dummy-data";

export default function PageHeroNews01Demo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="stats">With HeroStats</TabsTrigger>
        <TabsTrigger value="cta">CTA cluster</TabsTrigger>
        <TabsTrigger value="density">Density</TabsTrigger>
        <TabsTrigger value="i18n">Localized</TabsTrigger>
      </TabsList>

      <TabsContent value="default" className="mt-6 overflow-hidden rounded-2xl border border-border/50">
        <PageHeroNews01
          badge={NEWS_HERO_DEFAULTS.badge}
          badgeIcon={NEWS_HERO_DEFAULTS.badgeIcon}
          title={NEWS_HERO_DEFAULTS.title}
          titleHighlight={NEWS_HERO_DEFAULTS.titleHighlight}
          description={NEWS_HERO_DEFAULTS.description}
        />
      </TabsContent>

      <TabsContent value="stats" className="mt-6 overflow-hidden rounded-2xl border border-border/50">
        <PageHeroNews01
          badge={NEWS_HERO_DEFAULTS.badge}
          badgeIcon={NEWS_HERO_DEFAULTS.badgeIcon}
          title={NEWS_HERO_DEFAULTS.title}
          titleHighlight={NEWS_HERO_DEFAULTS.titleHighlight}
          description={NEWS_HERO_DEFAULTS.description}
        >
          <HeroStats stats={NEWS_HERO_STATS_EN} />
        </PageHeroNews01>
      </TabsContent>

      <TabsContent value="cta" className="mt-6 overflow-hidden rounded-2xl border border-border/50">
        <PageHeroNews01
          badge="New: v2.0"
          title="Build faster"
          titleHighlight="Ship sooner"
          description="The component library for teams that move."
        >
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary">
              Get started
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white">
              View docs
            </Button>
          </div>
        </PageHeroNews01>
      </TabsContent>

      <TabsContent value="density" className="mt-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Three density levels — <code>compact</code> (40vh), <code>default</code> (70vh), <code>full</code> (100vh).
          Below: compact only (full-screen variants would dominate the demo).
        </p>
        <div className="overflow-hidden rounded-2xl border border-border/50">
          <PageHeroNews01
            density="compact"
            headingAs="h2"
            title="Pricing"
            description="Simple plans for teams of any size."
          />
        </div>
      </TabsContent>

      <TabsContent value="i18n" className="mt-6 overflow-hidden rounded-2xl border border-border/50">
        <PageHeroNews01
          badge={NEWS_HERO_DEFAULTS_TR.badge}
          badgeIcon={NEWS_HERO_DEFAULTS_TR.badgeIcon}
          title={NEWS_HERO_DEFAULTS_TR.title}
          titleHighlight={NEWS_HERO_DEFAULTS_TR.titleHighlight}
          description={NEWS_HERO_DEFAULTS_TR.description}
        >
          <HeroStats stats={NEWS_HERO_STATS_TR} />
        </PageHeroNews01>
      </TabsContent>
    </Tabs>
  );
}
