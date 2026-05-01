"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewsletterCard01 } from "./newsletter-card-01";
import {
  NEWSLETTER_CARD_LABELS_TR,
  fakeSubmitError,
  fakeSubmitSuccess,
} from "./dummy-data";

export default function NewsletterCard01Demo() {
  return (
    <Tabs defaultValue="inline-form" className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="inline-form">Inline form</TabsTrigger>
        <TabsTrigger value="cta-only">CTA only</TabsTrigger>
        <TabsTrigger value="i18n">Custom labels</TabsTrigger>
        <TabsTrigger value="error">Error state</TabsTrigger>
        <TabsTrigger value="tones">Tones</TabsTrigger>
      </TabsList>

      <TabsContent value="inline-form" className="mt-6 max-w-md">
        <NewsletterCard01 onSubmit={fakeSubmitSuccess} />
      </TabsContent>

      <TabsContent value="cta-only" className="mt-6 max-w-md">
        <NewsletterCard01
          variant="cta-only"
          onSubmit={() => {
            window.alert("Open signup modal (demo placeholder)");
          }}
        />
      </TabsContent>

      <TabsContent value="i18n" className="mt-6 max-w-md">
        <NewsletterCard01
          labels={NEWSLETTER_CARD_LABELS_TR}
          onSubmit={fakeSubmitSuccess}
        />
      </TabsContent>

      <TabsContent value="error" className="mt-6 max-w-md">
        <NewsletterCard01 onSubmit={fakeSubmitError} />
      </TabsContent>

      <TabsContent value="tones" className="mt-6 grid gap-6 md:grid-cols-3">
        <NewsletterCard01 tone="primary" onSubmit={fakeSubmitSuccess} />
        <NewsletterCard01 tone="accent" onSubmit={fakeSubmitSuccess} />
        <NewsletterCard01 tone="muted" onSubmit={fakeSubmitSuccess} />
      </TabsContent>
    </Tabs>
  );
}
