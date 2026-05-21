export default function RegistrationForm01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Drop <code>&lt;RegistrationForm01&gt;</code> when you need a
        production-grade sign-up surface. The component owns: email +
        password + ToS-consent + (optional) OAuth row + (optional)
        multi-step flow + password strength + (optional) magic-link mode
        + off-screen honeypot anti-spam + an accessible success swap. It
        does NOT own the backend call — your <code>onSubmit</code> handler
        wires Supabase / NextAuth / Clerk / raw <code>fetch</code> /
        whatever you use.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Quick start</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
        <code>{`"use client";

import { RegistrationForm01 } from "@/components/registration-form-01";

export function SignUp() {
  return (
    <RegistrationForm01
      heading="Create your account"
      consent={{
        required: true,
        label: "I agree to the Terms and Privacy Policy",
        href: "/terms",
      }}
      onSubmit={async (payload) => {
        if (payload.isHoneypotTripped) {
          // Spam bot filled the honeypot — silently flag upstream
          analytics.track("registration_honeypot_tripped");
          return;
        }
        await api.signUp(payload.values);
      }}
      signInHref="/sign-in"
    />
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Two-step flow + discriminated payload
      </h3>
      <p className="text-muted-foreground">
        Set <code>flow=&quot;two-step&quot;</code> to render email/password
        in step 1 and optional profile fields in step 2. The submit payload
        is a <strong>discriminated envelope</strong> — consumers MUST
        switch on <code>stepCompleted</code> because the &quot;Skip for
        now&quot; button submits with step-1 values only:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
        <code>{`<RegistrationForm01
  flow="two-step"
  fields={{
    firstName: { required: true },
    lastName: true,
    company: true,
  }}
  consent={{ required: true, label: <>I agree to the <Link href="/terms">Terms</Link></> }}
  onSubmit={async (payload) => {
    switch (payload.stepCompleted) {
      case "single":
      case "step2":
        // Full payload available — profile fields populated
        await api.signUp(payload.values);
        return;
      case "step1":
        // User clicked "Skip for now" — only step-1 fields present
        await api.signUp({
          email: payload.values.email,
          password: payload.values.password,
        });
        return;
    }
  }}
/>`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        Narrowing optional profile fields as <code>string | undefined</code> was
        rejected because it silently lets naïve destructuring
        (<code>{`const { firstName } = payload.values`}</code>) send{" "}
        <code>undefined</code> values to backend APIs. The envelope forces the
        discriminant. Set <code>skippableStepTwo={`{false}`}</code> to remove
        the &quot;Skip for now&quot; button entirely — then{" "}
        <code>stepCompleted</code> will always be <code>&quot;step2&quot;</code>{" "}
        for two-step flows.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        OAuth row + <code>oauthIcons</code> slot
      </h3>
      <p className="text-muted-foreground">
        Provider buttons render above the email field — vertical stack on
        mobile, horizontal flex on <code>sm:</code> and up. Default is
        text-only (&quot;Continue with Google&quot;); wire icons via the{" "}
        <code>oauthIcons</code> slot:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
        <code>{`import { GitBranch, Mail } from "lucide-react";
// Note: lucide-react v1+ dropped branded icons (Google / GitHub / Apple)
// to dodge licensing. Use generic stand-ins or your own brand-compliant
// SVGs — the slot is consumer-driven.

<RegistrationForm01
  oauthProviders={["google", "github"]}
  oauthIcons={{
    google: <Mail className="size-4" />,        // generic; swap for your brand SVG
    github: <GitBranch className="size-4" />,   // generic; swap for your brand SVG
  }}
  onOAuthClick={({ provider }) => {
    // Drive your OAuth redirect / SDK call here.
    // The component does NOT handle the handshake — it just fires the event.
    void signInWithProvider(provider);
  }}
  consent={{ required: true, label: "I agree to the Terms" }}
  onSubmit={...}
/>`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        Branded Google / Apple / Microsoft icons are NOT bundled (licensing
        + chunk-size). The slot is consumer-driven; supply your own SVG
        and you control attribution.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Magic-link strategy
      </h3>
      <p className="text-muted-foreground">
        Set <code>passwordStrategy=&quot;magic-link&quot;</code> to drop the
        password input entirely. The form becomes email + consent + (optional)
        OAuth, and your <code>onSubmit</code> handler emails a one-time link
        to the supplied address:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
        <code>{`<RegistrationForm01
  passwordStrategy="magic-link"
  submitButton={{ label: "Send me a link" }}
  consent={{ required: true, label: "I agree to the Terms" }}
  onSubmit={async (payload) => {
    await api.sendMagicLink(payload.values.email);
  }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Password policy + strength calculator
      </h3>
      <p className="text-muted-foreground">
        Configure validators via <code>passwordPolicy</code>:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
        <code>{`<RegistrationForm01
  passwordPolicy={{
    minLength: 12,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: false,
    showStrengthMeter: true,  // default
  }}
  // ... rest
/>`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        The built-in strength meter scores from <code>0</code>{" "}
        (empty/unrated) to <code>4</code> (excellent), using
        <code>(length, character-class-count)</code> — pure-client, no peer
        deps. For corporate password policies or zxcvbn-style dictionary
        checks, plug your own calculator via the{" "}
        <code>strengthCalculator</code> prop:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
        <code>{`import zxcvbn from "zxcvbn"; // your peer dep

<RegistrationForm01
  strengthCalculator={(password) => {
    if (!password) return 0;
    const { score } = zxcvbn(password); // returns 0-4
    return score as 0 | 1 | 2 | 3 | 4;
  }}
  // ...
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Controlled status (mutual-exclusion contract)
      </h3>
      <p className="text-muted-foreground">
        By default the component owns its <code>idle</code> →{" "}
        <code>submitting</code> → (<code>success</code> | <code>error</code>)
        lifecycle. To control it externally, pass <code>status</code> +{" "}
        <code>onStatusChange</code>. <strong>Mutual exclusion is explicit:</strong>
      </p>
      <ul className="ml-5 mt-2 list-disc space-y-1 text-muted-foreground">
        <li>
          If <code>status</code> is provided, internal state becomes
          read-only — the component reads <code>status</code> as source of
          truth and never self-transitions. <code>onStatusChange</code> fires
          when the component computes a transition for observers (you can
          reflect it back into your <code>status</code> state or ignore it).
        </li>
        <li>
          If <code>status</code> is omitted, internal state owns transitions
          and <code>onStatusChange</code> fires on each one.
        </li>
        <li>
          Mixing the two — passing <code>status</code> AND expecting the
          component to internally transition to <code>&quot;success&quot;</code> —
          is a contract violation. Pick one mode and stick with it.
        </li>
      </ul>
      <pre className="overflow-x-auto mt-2 rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
        <code>{`const [status, setStatus] = useState<RegistrationFormStatus>("idle");
const [serverError, setServerError] = useState<string | undefined>();

<RegistrationForm01
  status={status}
  onStatusChange={(next) => {
    /* observe-only — we own the actual transitions below */
  }}
  errorMessage={serverError}
  onSubmit={async (payload) => {
    setStatus("submitting");
    setServerError(undefined);
    try {
      await api.signUp(payload.values);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setServerError(e instanceof Error ? e.message : "Something went wrong");
    }
  }}
  // ...
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Honeypot anti-spam (why off-screen, not <code>display: none</code>)
      </h3>
      <p className="text-muted-foreground">
        Every flow includes a hidden <code>{`<input name="website">`}</code> field that
        real users cannot tab into or see. Spam bots tuned to fill{" "}
        <code>url</code> / <code>website</code> / <code>homepage</code> fields
        will fill it; the submit payload exposes the trip via{" "}
        <code>isHoneypotTripped: boolean</code>.
      </p>
      <p className="mt-2 text-muted-foreground">
        <strong>The field uses CSS off-screen positioning (`position:
        absolute; left: -9999px`), NOT `display: none`.</strong> Serious
        form-fill bots detect `display: none` and skip those fields, defeating
        the trap. The off-screen pattern keeps the field rendered (and
        fillable) while invisible to real users.
      </p>
      <p className="mt-2 text-muted-foreground">
        The component does NOT auto-reject tripped submissions — it surfaces
        the flag and lets you decide. Common consumer patterns: silently
        return success to the bot (preferred — avoids tipping them off) + fire
        an analytics event, OR reject with a generic error message:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
        <code>{`onSubmit={async (payload) => {
  if (payload.isHoneypotTripped) {
    analytics.track("registration_honeypot_tripped");
    return; // silently succeed — don't tell the bot it failed
  }
  await api.signUp(payload.values);
}}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>{`<section aria-labelledby={headingId}>`}</code> wraps the
          form; heading semantic level configurable via{" "}
          <code>headingAs</code> (default <code>h2</code>).
        </li>
        <li>
          Each input: <code>{`<label htmlFor>`}</code> →{" "}
          <code>{`<input id>`}</code> binding;{" "}
          <code>aria-describedby</code> points to the inline error region;{" "}
          <code>aria-invalid</code> flips on validation failure.
        </li>
        <li>
          Inline errors: <code>{`role="alert"`}</code> <strong>only when
          populated</strong> (so screen readers don&apos;t announce empty
          regions).
        </li>
        <li>
          Step indicator: <code>{`role="status" aria-live="polite"`}</code>{" "}
          — announces &quot;Step 2 of 2&quot; on transition.
        </li>
        <li>
          Success screen: <code>{`role="status" aria-live="polite"`}</code>{" "}
          — announces the success message on appear.
        </li>
        <li>
          OAuth divider:{" "}
          <code>{`role="separator" aria-orientation="horizontal"`}</code>{" "}
          with sr-only &quot;or&quot; label.
        </li>
        <li>
          Submit button: <code>aria-busy</code> + <code>disabled</code>{" "}
          during <code>submitting</code> status.
        </li>
        <li>
          Password show/hide toggle: <code>aria-pressed</code> +{" "}
          <code>aria-label</code> swap between &quot;Show password&quot; and
          &quot;Hide password&quot;.
        </li>
        <li>
          Honeypot: <code>aria-hidden=&quot;true&quot;</code> +{" "}
          <code>tabIndex={`{-1}`}</code> keep it off the AT tree and the
          keyboard tab order.
        </li>
        <li>
          Step transition: 150ms CSS opacity fade —{" "}
          <code>prefers-reduced-motion: reduce</code> collapses to a 0ms
          hard-swap so a11y tooling isn&apos;t disorientated.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">FAQ</h3>
      <dl className="space-y-2 text-muted-foreground">
        <dt className="font-medium text-foreground">
          Why isn&apos;t the submit button disabled when the form is invalid?
        </dt>
        <dd>
          That&apos;s an a11y anti-pattern — users get no feedback on
          what&apos;s wrong. The button stays enabled; submit triggers
          validation and surfaces inline errors. Use the controlled{" "}
          <code>status</code> escape hatch if you want explicit lock-out
          behavior.
        </dd>

        <dt className="font-medium text-foreground">
          Why a discriminated payload instead of optional profile fields?
        </dt>
        <dd>
          A flat <code>values</code> shape with{" "}
          <code>firstName?: string</code> reads naturally but silently lets{" "}
          <code>{`const { firstName } = payload.values`}</code> send{" "}
          <code>undefined</code> to backend APIs when the user skipped step 2.
          The discriminated envelope (<code>stepCompleted: &quot;single&quot;
          | &quot;step1&quot; | &quot;step2&quot;</code>) forces a{" "}
          <code>switch</code> on the discriminant.
        </dd>

        <dt className="font-medium text-foreground">
          Does this depend on <code>@ilinxa/json-form</code>?
        </dt>
        <dd>
          No. Hand-rolled on RHF v7 + zod v4 directly. Registration is a
          specific named surface with strong UX defaults that don&apos;t map
          cleanly onto json-form&apos;s schema-driven primitives. Pulling
          json-form&apos;s ~12 shadcn primitives + bundle for one form is
          overkill. The two components coexist —{" "}
          <code>@ilinxa/json-form</code> remains the right substrate for
          backend-driven / CMS-driven forms.
        </dd>

        <dt className="font-medium text-foreground">
          Why no built-in CAPTCHA?
        </dt>
        <dd>
          The off-screen honeypot is the v0.1 anti-spam. CAPTCHA / hCaptcha /
          Turnstile need a slot + a script-load contract that&apos;s out of
          scope for v0.1; planned for v0.2 if a real consumer asks. If your
          honeypot false-negative rate ever becomes a problem, add a CAPTCHA
          on top via your own slot rendered alongside this component.
        </dd>

        <dt className="font-medium text-foreground">
          How do I surface server errors (e.g., &quot;email already taken&quot;)?
        </dt>
        <dd>
          Pass the message via the controlled <code>errorMessage</code> prop;
          it renders a <code>{`role="alert"`}</code> banner above the form.
          Pair with controlled <code>status</code> if you want to keep the
          form mounted in <code>error</code> state instead of swapping to the
          success screen on resolve.
        </dd>
      </dl>
    </div>
  );
}
