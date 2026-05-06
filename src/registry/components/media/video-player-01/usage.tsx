export default function VideoPlayer01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mt-0 mb-2 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>VideoPlayer01</code> anywhere user-generated or
        editorial video plays — Instagram-post media, story viewers, news
        article inline videos, event recordings, product previews. The{" "}
        <code>isActive</code> prop pauses cleanly when the video goes
        off-screen, so consumers (carousels, story viewers) coordinate
        playback via a single boolean. Custom control UI via the{" "}
        <code>renderControls</code> slot; default overlay matches the
        kasder-style play / pause / mute pattern with auto-hide.
      </p>

      <h3 className="mt-6 mb-2 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { VideoPlayer01 } from "@/registry/components/media/video-player-01";

export function Example() {
  return (
    <div className="aspect-video">
      <VideoPlayer01 src={post.videoUrl} poster={post.posterUrl} />
    </div>
  );
}`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Carousel coordination via <code>isActive</code>
      </h3>
      <p className="text-muted-foreground">
        The host (carousel / story viewer) tracks which slide is current and
        sets <code>isActive</code> per slide. Inactive videos pause cleanly;
        active videos resume on consumer-driven gesture (no auto-resume).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`{slides.map((item, idx) => (
  <CarouselSlide key={item.id}>
    {item.type === "video" ? (
      <VideoPlayer01
        src={item.url}
        poster={item.poster}
        isActive={idx === currentIndex}
        onDoubleTap={() => onLike(post.id)}
      />
    ) : (
      <img src={item.url} alt={item.alt} />
    )}
  </CarouselSlide>
))}`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Decorative background loop
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<VideoPlayer01
  src="/hero/loop.mp4"
  controls={false}
  autoPlay
  loop
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Custom controls via <code>renderControls</code>
      </h3>
      <p className="text-muted-foreground">
        The slot fully replaces the default overlay. Receives the entire{" "}
        <code>VideoState</code> (isPlaying, isMuted, isLoaded, duration,
        currentTime, togglePlay, toggleMute). The video ref is intentionally
        NOT exposed — it would let consumers bypass our state machine.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<VideoPlayer01
  src={reel.videoUrl}
  renderControls={({ isPlaying, currentTime, duration, togglePlay }) => (
    <ReelsControlOverlay
      isPlaying={isPlaying}
      progress={currentTime / duration}
      onPlayToggle={togglePlay}
    />
  )}
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Captions via <code>tracks</code>
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<VideoPlayer01
  src={article.videoUrl}
  poster={article.videoPoster}
  objectFit="contain"
  controlsAutoHideMs={0}
  tracks={[
    { kind: "captions", src: "/captions/en.vtt", srcLang: "en", label: "English", default: true },
    { kind: "captions", src: "/captions/tr.vtt", srcLang: "tr", label: "Türkçe" },
  ]}
  labels={{ videoLabel: "Article video: Sustainable cities" }}
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Localized labels</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const TR_LABELS = {
  play: "Oynat",
  pause: "Duraklat",
  mute: "Sesi Kapat",
  unmute: "Sesi Aç",
  videoLabel: "Etkinlik videosu",
};

<VideoPlayer01 src={event.recordingUrl} labels={TR_LABELS} />`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Standalone <code>useDoubleTap</code> hook
      </h3>
      <p className="text-muted-foreground">
        Exported from <code>index.ts</code> for non-video double-tap-to-like
        contexts (image carousels, photo viewers, card double-tap-to-favorite).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { useDoubleTap } from "@/registry/components/media/video-player-01";

function PhotoWithLike({ src, onLike }: { src: string; onLike: () => void }) {
  const handleTap = useDoubleTap(onLike);
  return <img src={src} onClick={handleTap} className="..." />;
}

// Or with a custom window:
const handleTap = useDoubleTap(onLike, { windowMs: 400 });`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Anti-patterns</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Don&apos;t expect a video ref</strong> in{" "}
          <code>renderControls</code> — exposing it would let consumers
          bypass our state machine and cause desync. State + dispatchers
          only. v0.2 candidate: <code>renderVideoElement</code> for full
          takeover.
        </li>
        <li>
          <strong>Don&apos;t expect fullscreen / volume slider / PiP</strong>{" "}
          in v0.1 default controls. Add via <code>renderControls</code> if
          needed.
        </li>
        <li>
          <strong>
            Don&apos;t expect HLS / DASH / streaming format support
          </strong>{" "}
          — raw <code>&lt;video src&gt;</code> only in v0.1.
        </li>
        <li>
          <strong>Don&apos;t expect a buffering spinner / error UI</strong> —
          browser shows the poster on slow load + load failure. v0.2
          candidates.
        </li>
        <li>
          <strong>Don&apos;t auto-resume</strong> when{" "}
          <code>isActive</code> flips back to true. The component pauses on
          deactivation but doesn&apos;t auto-play on reactivation — consumer
          drives the play gesture.
        </li>
        <li>
          <strong>Don&apos;t inline define <code>labels</code></strong> if
          you care about <code>React.memo</code> — hoist the labels object
          to module scope. Same for <code>tracks</code> arrays.
        </li>
      </ul>

      <h3 className="mt-6 mb-2 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>&lt;video tabIndex=&#123;0&#125;&gt;</code> — keyboard
          focusable; Space toggles play/pause, M toggles mute (focus-only,
          per Q-P4 lock).
        </li>
        <li>
          Mute toggle gets <code>aria-pressed=&#123;isMuted&#125;</code>;
          label switches between &quot;Mute&quot; (action) and
          &quot;Unmute&quot; (action) so AT announces the action that the
          button will perform.
        </li>
        <li>
          Caption tracks via the <code>tracks</code> prop expose in the
          browser&apos;s native subtitle UI (CC button in fullscreen).
        </li>
        <li>
          Under <code>prefers-reduced-motion: reduce</code>, the auto-hide
          timer is skipped entirely — controls stay visible.
        </li>
        <li>
          Custom <code>renderControls</code> is the consumer&apos;s
          responsibility — preserve <code>aria-pressed</code> on toggle
          buttons + <code>aria-label</code> on icon-only triggers.
        </li>
      </ul>
    </div>
  );
}
