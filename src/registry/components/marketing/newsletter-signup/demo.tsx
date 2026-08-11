"use client";

import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { NewsletterSignup } from "./newsletter-signup";
import {
  NEWSLETTER_SIGNUP_LABELS_TR,
  fakeSubmitError,
  fakeSubmitSuccess,
} from "./dummy-data";

export default function NewsletterSignupDemo() {
  return (
    <Tabs defaultValue="inline-form" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="inline-form">Inline form</TabsTrigger>
        <TabsTrigger value="cta-only">CTA only</TabsTrigger>
        <TabsTrigger value="i18n">Custom labels</TabsTrigger>
        <TabsTrigger value="error">Error state</TabsTrigger>
        <TabsTrigger value="tones">Tones</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="inline-form" className="mt-6 max-w-md">
        <NewsletterSignup onSubmit={fakeSubmitSuccess} />
      </TabsContent>

      <TabsContent value="cta-only" className="mt-6 max-w-md">
        <NewsletterSignup
          variant="cta-only"
          onSubmit={() => {
            window.alert("Open signup modal (demo placeholder)");
          }}
        />
      </TabsContent>

      <TabsContent value="i18n" className="mt-6 max-w-md">
        <NewsletterSignup
          labels={NEWSLETTER_SIGNUP_LABELS_TR}
          onSubmit={fakeSubmitSuccess}
        />
      </TabsContent>

      <TabsContent value="error" className="mt-6 max-w-md">
        <NewsletterSignup onSubmit={fakeSubmitError} />
      </TabsContent>

      <TabsContent value="tones" className="mt-6 grid gap-6 md:grid-cols-3">
        <NewsletterSignup tone="primary" onSubmit={fakeSubmitSuccess} />
        <NewsletterSignup tone="accent" onSubmit={fakeSubmitSuccess} />
        <NewsletterSignup tone="muted" onSubmit={fakeSubmitSuccess} />
      </TabsContent>
    </Tabs>
  );
}
