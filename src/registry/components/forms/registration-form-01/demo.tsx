"use client";

import { useCallback, useState } from "react";
import { GitBranch, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { RegistrationForm01 } from "./registration-form-01";
import {
  controlledRegistrationProps,
  defaultRegistrationProps,
  denseRegistrationProps,
  magicLinkRegistrationProps,
  oauthRegistrationProps,
  twoStepRegistrationProps,
} from "./dummy-data";
import type {
  RegistrationFormStatus,
  RegistrationSubmitPayload,
} from "./types";

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-3 rounded-lg border border-border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {caption ? (
          <p className="text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function LastPayloadPanel({
  payload,
}: {
  payload: RegistrationSubmitPayload | null;
}) {
  if (!payload) {
    return (
      <p className="text-xs italic text-muted-foreground">
        Submit any form to see the discriminated payload here.
      </p>
    );
  }
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

// ─── Tab 1: Default ──────────────────────────────────────────────────────────

function DefaultTab() {
  const [last, setLast] = useState<RegistrationSubmitPayload | null>(null);
  return (
    <Section
      title="Default — single-step"
      caption="Email + password + consent gate. The simplest shape."
    >
      <RegistrationForm01
        {...defaultRegistrationProps}
        onSubmit={(payload) => setLast(payload)}
      />
      <LastPayloadPanel payload={last} />
    </Section>
  );
}

// ─── Tab 2: OAuth ────────────────────────────────────────────────────────────

function OauthTab() {
  const [last, setLast] = useState<RegistrationSubmitPayload | null>(null);
  return (
    <Section
      title="OAuth row + oauthIcons slot"
      caption="The fixture leaves icons empty (text-only fallback). Here we wire lucide-react icons via the slot — Mail as a Google stand-in (no Google brand asset shipped) and Github for the github provider."
    >
      <RegistrationForm01
        {...oauthRegistrationProps}
        oauthIcons={{
          // lucide-react v1.x dropped branded icons (Google / GitHub /
          // Apple) to dodge licensing — these are generic stand-ins.
          // Consumers swap in their own brand-compliant SVGs.
          google: <Mail className="size-4" aria-hidden="true" />,
          github: <GitBranch className="size-4" aria-hidden="true" />,
        }}
        onOAuthClick={({ provider }) =>
          console.log(`[registration-form-01 demo] OAuth click:`, provider)
        }
        onSubmit={(payload) => setLast(payload)}
      />
      <LastPayloadPanel payload={last} />
    </Section>
  );
}

// ─── Tab 3: Two-step ─────────────────────────────────────────────────────────

function TwoStepTab() {
  const [last, setLast] = useState<RegistrationSubmitPayload | null>(null);
  return (
    <Section
      title="Two-step flow with skip"
      caption="Step 1 = email/password/consent. Step 2 = optional profile (firstName required, lastName + company optional). Skip-for-now button submits with `stepCompleted: 'step1'` so consumers can switch on the discriminant."
    >
      <RegistrationForm01
        {...twoStepRegistrationProps}
        onSubmit={(payload) => setLast(payload)}
      />
      <LastPayloadPanel payload={last} />
    </Section>
  );
}

// ─── Tab 4: Magic-link ───────────────────────────────────────────────────────

function MagicLinkTab() {
  const [last, setLast] = useState<RegistrationSubmitPayload | null>(null);
  return (
    <Section
      title="Magic-link strategy"
      caption="Drops the password input entirely; the form is email + consent + (optional) OAuth. Useful for low-friction sign-ups."
    >
      <RegistrationForm01
        {...magicLinkRegistrationProps}
        onSubmit={(payload) => setLast(payload)}
      />
      <LastPayloadPanel payload={last} />
    </Section>
  );
}

// ─── Tab 5: Dense ────────────────────────────────────────────────────────────

function DenseTab() {
  const [last, setLast] = useState<RegistrationSubmitPayload | null>(null);
  return (
    <Section
      title="Compact density"
      caption="Narrower max-width, tighter vertical rhythm. For sidebars, modals, or dense onboarding flows."
    >
      <RegistrationForm01
        {...denseRegistrationProps}
        onSubmit={(payload) => setLast(payload)}
      />
      <LastPayloadPanel payload={last} />
    </Section>
  );
}

// ─── Tab 6: Controlled status ────────────────────────────────────────────────

function ControlledTab() {
  const [status, setStatus] = useState<RegistrationFormStatus>("idle");
  const [last, setLast] = useState<RegistrationSubmitPayload | null>(null);

  // Mutual-exclusion contract: while `status` is provided, the component
  // is read-only on its own state. We own the transitions here.
  const handleSubmit = useCallback(
    async (payload: RegistrationSubmitPayload) => {
      setLast(payload);
      setStatus("submitting");
      // Simulate a network round-trip.
      await new Promise((r) => setTimeout(r, 800));
      // 70% success rate for the demo
      if (Math.random() > 0.3) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    },
    [],
  );

  return (
    <Section
      title="Controlled status (mutual-exclusion contract)"
      caption="`status` + `onStatusChange` controlled. The parent owns transitions; the component renders based on `status` and never self-transitions. 70% success rate so you can see both branches."
    >
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus("idle")}
        >
          Reset to idle
        </Button>
        <span className="text-xs text-muted-foreground">
          status: <span className="font-mono">{status}</span>
        </span>
      </div>
      <RegistrationForm01
        {...controlledRegistrationProps}
        status={status}
        onStatusChange={(next) =>
          console.log(`[registration-form-01 demo] status change requested:`, next)
        }
        errorMessage={
          status === "error"
            ? "Demo error — your account already exists."
            : undefined
        }
        onSubmit={handleSubmit}
      />
      <LastPayloadPanel payload={last} />
    </Section>
  );
}

// ─── Tab shell ───────────────────────────────────────────────────────────────

export default function RegistrationForm01Demo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="oauth">OAuth</TabsTrigger>
        <TabsTrigger value="two-step">Two-step</TabsTrigger>
        <TabsTrigger value="magic-link">Magic-link</TabsTrigger>
        <TabsTrigger value="dense">Dense</TabsTrigger>
        <TabsTrigger value="controlled">Controlled status</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="default" className="pt-3">
        <DefaultTab />
      </TabsContent>
      <TabsContent value="oauth" className="pt-3">
        <OauthTab />
      </TabsContent>
      <TabsContent value="two-step" className="pt-3">
        <TwoStepTab />
      </TabsContent>
      <TabsContent value="magic-link" className="pt-3">
        <MagicLinkTab />
      </TabsContent>
      <TabsContent value="dense" className="pt-3">
        <DenseTab />
      </TabsContent>
      <TabsContent value="controlled" className="pt-3">
        <ControlledTab />
      </TabsContent>
    </Tabs>
  );
}
