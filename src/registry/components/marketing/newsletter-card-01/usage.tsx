export default function NewsletterCard01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>NewsletterCard01</code> for an email-capture CTA in
        a sidebar, footer, or hero — anywhere you want a brand-tinted block
        that asks visitors to subscribe. Two variants: inline-form (input +
        button) or cta-only (button-only, click leads elsewhere).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { NewsletterCard01 } from "@/registry/components/marketing/newsletter-card-01";

<NewsletterCard01
  onSubmit={async (email) => {
    await api.subscribe(email);
  }}
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        Returning a Promise from <code>onSubmit</code> auto-tracks the
        status: <code>idle → pending → success</code> on resolve, or{" "}
        <code>idle → pending → error</code> on reject. The card disables
        the input + button during pending and shows the appropriate status
        message.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">CTA-only variant</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<NewsletterCard01
  variant="cta-only"
  labels={{ button: "Sign up" }}
  onSubmit={() => openSignupModal()}
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        No email is captured here — the click handler typically opens a
        modal, navigates to a sign-up page, or triggers another flow.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Localization</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<NewsletterCard01
  labels={{
    title: "Bültenimize Katılın",
    body: "En güncel haberleri e-posta ile alın.",
    placeholder: "E-posta adresiniz",
    button: "Abone Ol",
    successMessage: "Teşekkürler! Aboneliğiniz tamamlandı.",
    errorMessage: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
  }}
  onSubmit={subscribeAction}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Three tones</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>primary</code> (default) — lime tint frame, signals the most
          editorial / brand-forward CTA.
        </li>
        <li>
          <code>accent</code> — accent-tone frame, useful when primary is
          already used elsewhere on the page.
        </li>
        <li>
          <code>muted</code> — neutral frame, good for low-noise placements
          like docs footers.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Controlled email value</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const [email, setEmail] = useState("");

<NewsletterCard01
  value={email}
  onChange={setEmail}
  onSubmit={async (currentEmail) => {
    await api.subscribe(currentEmail);
  }}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Controlled status</h3>
      <p className="text-muted-foreground">
        If your form needs status from outside (e.g. a global success banner
        elsewhere on the page), drive the <code>status</code> prop:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<NewsletterCard01
  status={mutation.status === "loading" ? "pending" : mutation.status === "success" ? "success" : mutation.status === "error" ? "error" : "idle"}
  onSubmit={(email) => mutation.mutate(email)}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          The form wraps input + button so Enter submits.
        </li>
        <li>
          Input has <code>aria-label</code> from{" "}
          <code>labels.emailLabel</code>; default is <code>Email address</code>.
        </li>
        <li>
          Status region uses <code>aria-live=&quot;polite&quot;</code> for
          success and <code>role=&quot;alert&quot;</code> for error.
        </li>
        <li>
          Button gets <code>aria-busy=&quot;true&quot;</code> during pending.
        </li>
        <li>
          Heading semantic level via <code>headingAs=&quot;h2&quot;</code> /{" "}
          <code>&quot;h3&quot;</code> / <code>&quot;h4&quot;</code>.
        </li>
      </ul>
    </div>
  );
}
