export default function ShareBar01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        A horizontal cluster of social-share buttons + a copy-link button,
        typically at the bottom of an article (or pinned to the side as a
        share rail). Each social button opens the platform&apos;s share intent
        in a new window with the page&apos;s URL prefilled; the copy button
        writes the URL to the clipboard with a 2-second visual + audible
        success affordance.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { ShareBar01 } from "@/registry/components/marketing/share-bar-01"

export function ArticleFooter() {
  return (
    <ShareBar01
      url="https://example.com/news/sustainable-cities"
      title="Sustainable cities, then and now"
      headingAs="h4"
      divider
      targets={[
        { kind: "twitter" },
        { kind: "facebook" },
        { kind: "linkedin" },
        { kind: "copy" },
      ]}
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Built-in platforms</h3>
      <p className="text-muted-foreground">
        Twitter / Facebook / LinkedIn / Reddit / WhatsApp / Telegram / Email /
        Threads / Bluesky — each ships with a share-intent URL template + a
        default Lucide icon + a default English aria-label. Override the icon
        or aria-label per target if you want a different look or different
        text.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom targets</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { Send } from "lucide-react"

<ShareBar01
  url={article.canonicalUrl}
  targets={[
    { kind: "twitter" },
    { kind: "linkedin" },
    {
      kind: "custom",
      id: "send-to-teammate",
      icon: Send,
      ariaLabel: "Send to teammate",
      onClick: () => openInternalShareDialog(article.id),
    },
    { kind: "copy" },
  ]}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Analytics hook</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ShareBar01
  targets={[{ kind: "twitter" }, { kind: "facebook" }, { kind: "copy" }]}
  onShare={(target) => analytics.track("article.share", { id: article.id, target })}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        <code>onShare(targetKind)</code> fires after a successful share-intent
        open or successful copy. For granular hooks use <code>onCopySuccess</code>{" "}
        / <code>onCopyError</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">URL resolution</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          If <code>url</code> is provided, that&apos;s what gets shared.
        </li>
        <li>
          Otherwise, <code>window.location.href</code> is read{" "}
          <em>at click time</em> on the client — never during render. SSR-safe.
        </li>
        <li>
          Pass <code>title</code> / <code>text</code> / <code>via</code> /{" "}
          <code>hashtags</code> for templates that accept them (Twitter, Email,
          WhatsApp, etc.).
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Copy fallback</h3>
      <p className="text-muted-foreground">
        Copy uses <code>navigator.clipboard.writeText</code> first; if that
        isn&apos;t available (older browsers, insecure HTTP context, embedded
        webviews), it falls back to the deprecated{" "}
        <code>document.execCommand(&quot;copy&quot;)</code> on a hidden
        textarea. Both paths are inside a <code>try/catch</code> so the error
        state surfaces to <code>onCopyError</code> + the icon flip.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          External links open in a new window with{" "}
          <code>noopener,noreferrer</code> for safety.
        </li>
        <li>
          Copy success/error feedback is dual-channel: visible icon flip +{" "}
          <code>aria-live</code> announcement (<code>polite</code> for success,{" "}
          <code>alert</code> for errors).
        </li>
        <li>
          The 2-second success-reset timeout is cleared on unmount — no{" "}
          <code>setState after unmount</code> warning.
        </li>
        <li>
          Threads + Bluesky icons fall back to <code>Share2</code> from
          lucide-react until first-party icons land. Override via{" "}
          <code>target.icon</code> if you ship custom SVGs.
        </li>
        <li>
          The component is exported as <code>React.memo</code>. Memoize the{" "}
          <code>targets</code> array (or use a module-level constant) for the
          memo to bite — inline arrays defeat it.
        </li>
        <li>
          Don&apos;t reach for this if you need share-count metrics — pure
          action surface, no API calls.
        </li>
      </ul>
    </div>
  );
}
