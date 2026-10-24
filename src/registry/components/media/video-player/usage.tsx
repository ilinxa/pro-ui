export default function VideoPlayerUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mt-0 mb-2 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>VideoPlayer</code> anywhere user-generated or
        editorial video plays — Instagram-post media, story viewers, news
        article inline videos, event recordings, product previews. The{" "}
        <code>isActive</code> prop pauses cleanly when the video goes
        off-screen, so consumers (carousels, story viewers) coordinate
        playback via a single boolean. Custom control UI via the{" "}
        <code>renderControls</code> slot; default overlay matches the
        kasder-style corner pause / mute pattern, plus a seek bar and time, with auto-hide.
      </p>

      <h3 className="mt-6 mb-2 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { VideoPlayer } from "@/components/video-player";

export function Example() {
  return (
    <div className="aspect-video">
      <VideoPlayer src={post.videoUrl} poster={post.posterUrl} />
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
      <VideoPlayer
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
        <code>{`<VideoPlayer
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
        <code>{`<VideoPlayer
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
        <code>{`<VideoPlayer
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

      <h3 className="mt-6 mb-2 text-base font-semibold">Seek bar, time and fullscreen</h3>
      <p className="text-muted-foreground">
        The default overlay shows a seek bar and elapsed / total time. Before playback an idle duration badge shows; pass <code>durationHint</code> (seconds, from your API) to fill it before metadata loads. <code>showFullscreen</code> adds a fullscreen button (hidden when the browser has no fullscreen API). <code>seekStep</code> sets the seconds per arrow-key step (default 5; ← / → are mirrored in RTL). <code>controls=&#123;false&#125;</code> removes the overlay <em>and</em> the seek keys; Space and M still work when the video is focused.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<VideoPlayer
  src={post.videoUrl}
  durationHint={post.durationSeconds}
  showFullscreen
  seekStep={10}
/>`}</code>
      </pre>
      <h3 className="mt-6 mb-2 text-base font-semibold">Captions and <code>crossOrigin</code></h3>
      <p className="text-muted-foreground">
        One track renders a captions toggle; several render a menu with an Off item. A caption file on another origin needs <code>crossOrigin=&quot;anonymous&quot;</code> on the player <em>and</em> CORS headers on both the video and the caption file. Do not set <code>crossOrigin</code> on a video host that sends no CORS header — the video would fail to load.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<VideoPlayer
  src={cdnVideoUrl}
  crossOrigin="anonymous"
  tracks={[
    { kind: "captions", src: cdnEnVtt, srcLang: "en", label: "English" },
    { kind: "subtitles", src: cdnTrVtt, srcLang: "tr", label: "Türkçe" },
  ]}
/>`}</code>
      </pre>
      <h3 className="mt-6 mb-2 text-base font-semibold">Refreshing an expired URL with <code>onMediaError</code></h3>
      <p className="text-muted-foreground">
        When the media errors, <code>onMediaError(src)</code> is called <strong>once per <code>src</code></strong>. Return (or resolve) a new URL and the source is replaced; playback resumes at the same time and play state. While the promise is pending the player shows its buffering state. A void answer, a rejection or a second error shows the error overlay with a Retry button (<code>retry()</code> reloads and resumes). A new <code>src</code> resets the once-per-src budget. <code>onError</code> still fires on every error.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<VideoPlayer
  src={signedUrl}
  onMediaError={async () => {
    const fresh = await api.resignVideo(post.id);
    return fresh.url; // return nothing to show the error overlay
  }}
/>`}</code>
      </pre>
      <h3 className="mt-6 mb-2 text-base font-semibold">Controlled mute: <code>muted</code> + <code>onMutedChange</code></h3>
      <p className="text-muted-foreground">
        <code>muted</code> defaults to true. Passing <code>onMutedChange</code> as well makes it <strong>controlled</strong>: the prop wins on every render and the mute button calls <code>onMutedChange</code> instead of changing the element. Without <code>onMutedChange</code>, the viewer&apos;s toggle applies until the prop next changes. Use it for a feed-wide &quot;sound on&quot; switch.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const [muted, setMuted] = useState(true);

<VideoPlayer src={a} muted={muted} onMutedChange={setMuted} />
<VideoPlayer src={b} muted={muted} onMutedChange={setMuted} />`}</code>
      </pre>
      <h3 className="mt-6 mb-2 text-base font-semibold">Long feeds: autoplay in view, groups, <code>preload</code></h3>
      <p className="text-muted-foreground">
        <code>autoPlayInView</code> plays the video (muted) while at least <code>autoPlayThreshold</code> (default 0.5) of it is visible and pauses it when it leaves. Give players the same <code>autoplayGroup</code> and at most one plays: a player that starts pauses the others. Reduced motion disables autoplay-in-view. For long lists pass <code>preload=&quot;none&quot;</code> with a <code>durationHint</code> so off-screen videos load nothing but still show a duration.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`{posts.map((post) => (
  <VideoPlayer
    key={post.id}
    src={post.videoUrl}
    autoPlayInView
    autoplayGroup="home-feed"
    preload="none"
    durationHint={post.durationSeconds}
  />
))}`}</code>
      </pre>
      <h3 className="mt-6 mb-2 text-base font-semibold"><code>loop</code> and <code>onEnded</code></h3>
      <p className="text-muted-foreground">
        <code>loop</code> defaults to true — unless <code>onEnded</code> is passed, in which case it defaults to false (a looping video never ends). Pass <code>loop</code> yourself to force either.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<VideoPlayer src={clip} onEnded={() => goToNextSlide()} />`}</code>
      </pre>
      <h3 className="mt-6 mb-2 text-base font-semibold">Lifecycle and progress callbacks</h3>
      <p className="text-muted-foreground">
        <code>onPlay</code> / <code>onPause</code> / <code>onEnded</code> / <code>onLoadedMetadata(duration)</code> / <code>onError(mediaError)</code> mirror the element. <code>onTimeUpdate(currentTime, duration)</code> and <code>onProgress({"{ currentTime, duration, buffered }"})</code> report media time, throttled to one call per animation frame; <code>onProgress</code> also fires on the element&apos;s <code>progress</code> event with the buffered spans. Style hooks: <code>className</code> (wrapper), <code>videoClassName</code>, <code>controlsClassName</code> (default overlay only).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<VideoPlayer
  src={video.url}
  onProgress={({ currentTime, duration }) => report(currentTime / duration)}
  onLoadedMetadata={(d) => setDuration(d)}
/>`}</code>
      </pre>
      <h3 className="mt-6 mb-2 text-base font-semibold">Flat parts and the <code>ref</code> handle</h3>
      <p className="text-muted-foreground">
        Inside <code>renderControls</code> you can compose the flat parts instead of building a UI from <code>VideoState</code>: <code>VideoPlayerPlayButton</code> (<code>size</code> &quot;sm&quot; | &quot;lg&quot;), <code>VideoPlayerMuteButton</code>, <code>VideoPlayerSeekBar</code>, <code>VideoPlayerTime</code>, <code>VideoPlayerDurationBadge</code>, <code>VideoPlayerFullscreenButton</code>, <code>VideoPlayerCaptionsButton</code> and <code>VideoPlayerStatus</code> (spinner / error overlay — mount it or you lose both). Each takes an optional <code>className</code>; position them with logical utilities (<code>ms-auto</code>, <code>inset-x-0</code>). <code>useVideoPlayer()</code> reads the same context from your own part. The <code>ref</code> handle exposes <code>play()</code>, <code>pause()</code>, <code>seek(seconds)</code>, <code>toggleMute()</code> and <code>toggleFullscreen()</code>; it never exposes the <code>&lt;video&gt;</code> element.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const ref = useRef<VideoPlayerHandle>(null);

<VideoPlayer
  ref={ref}
  src={clip}
  renderControls={() => (
    <>
      <VideoPlayerStatus />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3">
        <VideoPlayerPlayButton />
        <VideoPlayerSeekBar />
        <VideoPlayerTime />
        <VideoPlayerMuteButton />
      </div>
    </>
  )}
/>

ref.current?.seek(30);`}</code>
      </pre>
      <h3 className="mt-6 mb-2 text-base font-semibold">Labels, locale and RTL</h3>
      <p className="text-muted-foreground">
        Every string is a typed label: pass any subset via <code>labels</code> (an <code>undefined</code> value never erases a default); <code>defaultVideoPlayerLabels</code> is exported for composition. <code>locale</code> (BCP-47, default &quot;en&quot;; an invalid tag falls back to &quot;en&quot;) formats the time text; <code>formatDuration</code> overrides it. Direction follows the ancestor&apos;s <code>dir</code> (or the <code>dir</code> prop): the seek bar fills from the end side and ← / → are mirrored.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<div dir="rtl" lang="ar">
  <VideoPlayer src={clip} locale="ar" labels={{ play: "تشغيل", pause: "إيقاف" }} />
</div>`}</code>
      </pre>
      <h3 className="mt-6 mb-2 text-base font-semibold">Upgrading to 0.3.0</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Seek bar and time are on by default.</strong> Pass <code>showSeekBar=&#123;false&#125;</code> and <code>showTime=&#123;false&#125;</code> to restore the 0.2 look.
        </li>
        <li>
          <strong>Single tap is deferred 300 ms</strong> only when <code>onDoubleTap</code> is set (to tell it from a double tap). Without it a tap toggles playback at once.
        </li>
        <li>
          <strong><code>onEnded</code> without <code>loop</code> no longer loops.</strong> <code>loop</code> defaults to true, or to false when <code>onEnded</code> is passed. Pass <code>loop</code> explicitly to override.
        </li>
        <li>
          <strong><code>DEFAULT_VIDEO_PLAYER_LABELS</code> is now <code>defaultVideoPlayerLabels</code>.</strong> The old name stays as a deprecated alias for one minor.
        </li>
        <li>
          <strong>New labels</strong> (<code>seek</code>, <code>position</code>, <code>timeDisplay</code>, <code>durationBadge</code>, <code>fullscreen</code>, <code>exitFullscreen</code>, <code>captions</code>, <code>captionsMenu</code>, <code>captionsOff</code>, <code>buffering</code>, <code>error</code>, <code>retry</code>) — translate them if you pass <code>labels</code>.
        </li>
      </ul>
      <h3 className="mt-6 mb-2 text-base font-semibold">Localized labels</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const TR_LABELS = {
  play: "Oynat",
  pause: "Duraklat",
  mute: "Sesi Kapat",
  unmute: "Sesi Aç",
  videoLabel: "Etkinlik videosu",
};

<VideoPlayer src={event.recordingUrl} labels={TR_LABELS} />`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Standalone <code>useDoubleTap</code> hook
      </h3>
      <p className="text-muted-foreground">
        Exported from <code>index.ts</code> for non-video double-tap-to-like
        contexts (image carousels, photo viewers, card double-tap-to-favorite).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { useDoubleTap } from "@/components/video-player";

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
          only. A <code>renderVideoElement</code> slot for full takeover is not
          implemented (possible future addition).
        </li>
        <li>
          <strong>Don&apos;t expect a volume slider / PiP</strong> in the default controls. Add via <code>renderControls</code> if needed (fullscreen is <code>showFullscreen</code>).
        </li>
        <li>
          <strong>
            Don&apos;t expect HLS / DASH / streaming format support
          </strong>{" "}
          — raw <code>&lt;video src&gt;</code> only.
        </li>
        <li>
          <strong>Don&apos;t hand-roll the spinner / error overlay</strong> — the default controls (and <code>VideoPlayerStatus</code> in composed controls) show them.
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
          timer is skipped entirely — controls stay visible, and{" "}
          <code>autoPlayInView</code> is disabled.
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
