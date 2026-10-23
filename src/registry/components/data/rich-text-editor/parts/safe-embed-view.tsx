import {
  EMBED_ALLOW,
  EMBED_DEFAULT_LABELS,
  EMBED_REFERRER_POLICY,
  EMBED_SANDBOX,
  resolveEmbed,
  type EmbedPolicy,
} from "../lib/safe-embed";

/**
 * The box contents shared by the editor's `MediaEmbedElement` and the static
 * viewer's `StaticMediaEmbed`: a sandboxed iframe for allowed https hosts, a
 * plain link card otherwise. No directive on purpose — no hooks, so it renders
 * in both server and client trees.
 */
export function SafeEmbedView({
  url,
  policy,
}: {
  url: string;
  policy: EmbedPolicy;
}) {
  const result = resolveEmbed(url, policy);
  if (result.kind === "iframe") {
    return (
      <iframe
        src={result.src}
        title={EMBED_DEFAULT_LABELS.iframeTitle}
        className="h-full w-full"
        sandbox={EMBED_SANDBOX}
        referrerPolicy={EMBED_REFERRER_POLICY}
        loading="lazy"
        allow={EMBED_ALLOW}
        allowFullScreen
      />
    );
  }
  return (
    <div className="flex h-full items-center justify-center p-4 text-sm">
      {result.href ? (
        <a
          href={result.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="break-all text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {result.text}
        </a>
      ) : (
        <span className="break-all text-muted-foreground">{result.text}</span>
      )}
    </div>
  );
}
