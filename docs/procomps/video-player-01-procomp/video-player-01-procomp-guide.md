# video-player-01 — consumer guide

> Stage 3: usage notes for hosts. Authored alongside implementation.
>
> See [description](./video-player-01-procomp-description.md) for what & why; [plan](./video-player-01-procomp-plan.md) for how it's built.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/video-player-01
```

Optional fixtures (5 royalty-free Pexels video URLs + sample track entry):

```bash
pnpm dlx shadcn@latest add @ilinxa/video-player-01-fixtures
```

Pulls shadcn `button` (already installed in 99% of projects), `lucide-react`. No other peer deps.

## When to reach for it

Anywhere user-generated or editorial video plays:

- Post media (Instagram-style cards) — composes inside `media-carousel-01` (next ship)
- Story viewers — composes inside `story-viewer-01` (later ship)
- News article inline videos
- Event recordings on detail pages
- Product video previews
- Standalone embedded videos

**Not** for streaming formats (HLS / DASH) — raw `<video src>` only. v0.2 candidate via `useHls` flag.

## Sizing the player

The component fills its container (`h-full w-full`). Always wrap in a sized parent:

```tsx
<div className="aspect-video">
  <VideoPlayer01 src={post.videoUrl} />
</div>
```

Common aspect ratios:

```tsx
<div className="aspect-video">       {/* 16:9 — landscape */}
<div className="aspect-square">      {/* 1:1 — Instagram post */}
<div className="aspect-[9/16]">      {/* 9:16 — vertical / story */}
<div className="aspect-[4/5]">       {/* 4:5 — Instagram portrait */}
```

## Common recipes

### 1. Minimal usage

```tsx
<div className="aspect-video">
  <VideoPlayer01 src={post.videoUrl} poster={post.posterUrl} />
</div>
```

That's it. Defaults: `muted=true`, `loop=true`, `playsInline=true`, controls visible with auto-hide after 2s.

### 2. Carousel coordination via `isActive`

The originating use case. The host (carousel) tracks which slide is current and toggles `isActive` per slide. Inactive videos pause cleanly; active videos resume on user gesture (no auto-resume — explicit by design).

```tsx
{slides.map((item, idx) => (
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
))}
```

### 3. Decorative background loop (no controls)

```tsx
<VideoPlayer01
  src="/hero/loop.mp4"
  controls={false}
  autoPlay
  loop
/>
```

`controls={false}` removes the entire overlay. Click-to-toggle on the video still works. Keyboard (Space, M) still works if the video is focused.

### 4. Custom controls via `renderControls`

Full slot takeover. Receives the entire `VideoState` (10 fields including imperative `togglePlay` / `toggleMute`).

```tsx
<VideoPlayer01
  src={reel.videoUrl}
  renderControls={({ isPlaying, currentTime, duration, togglePlay }) => (
    <ReelsControlOverlay
      isPlaying={isPlaying}
      progress={currentTime / duration}
      onPlayToggle={togglePlay}
    />
  )}
/>
```

The video ref is intentionally **not** exposed — exposing it would let consumers bypass our state machine and cause desync. State + dispatchers only.

### 5. Captions via `tracks`

```tsx
<VideoPlayer01
  src={article.videoUrl}
  poster={article.videoPoster}
  objectFit="contain"
  controlsAutoHideMs={0}
  tracks={[
    { kind: "captions", src: "/captions/en.vtt", srcLang: "en", label: "English", default: true },
    { kind: "captions", src: "/captions/tr.vtt", srcLang: "tr", label: "Türkçe" },
  ]}
  labels={{ videoLabel: "Article video: Sustainable cities" }}
/>
```

Browsers expose tracks in their native subtitle UI (CC button in fullscreen). `objectFit="contain"` letterboxes instead of cropping — better for editorial videos.

### 6. Localized labels

```tsx
const TR_LABELS = {
  play: "Oynat",
  pause: "Duraklat",
  mute: "Sesi Kapat",
  unmute: "Sesi Aç",
  videoLabel: "Etkinlik videosu",
} as const;

<VideoPlayer01 src={event.recordingUrl} labels={TR_LABELS} />
```

**Hoist the labels object to module scope** — defining it inline busts the internal `React.memo` (new object identity every render).

### 7. Lifecycle callbacks

```tsx
<VideoPlayer01
  src={video.url}
  onPlay={() => analytics.track("video.play", { id: video.id })}
  onPause={() => analytics.track("video.pause", { id: video.id })}
  onEnded={() => analytics.track("video.complete", { id: video.id })}
  onTimeUpdate={(t, d) => {
    // Throttled to one call per requestAnimationFrame max.
    const progress = t / d;
    if (progress > 0.25 && !milestones.has("25%")) {
      analytics.track("video.progress", { id: video.id, milestone: "25%" });
      milestones.add("25%");
    }
  }}
  onLoadedMetadata={(duration) => console.log("duration:", duration)}
  onError={(error) => console.error("video error:", error)}
/>
```

`onTimeUpdate` is rAF-throttled — caps at display refresh rate (~60Hz). Native `timeupdate` can fire 30×/sec in some browsers; this throttle keeps your callback safe to do work in.

### 8. Standalone `useDoubleTap` hook

Reusable for non-video double-tap-to-like contexts (image carousels, photo viewers, card double-tap-to-favorite).

```tsx
import { useDoubleTap } from "@ilinxa/video-player-01";

function PhotoWithLike({ src, onLike }: { src: string; onLike: () => void }) {
  const handleTap = useDoubleTap(onLike);
  return <img src={src} onClick={handleTap} className="..." />;
}

// Custom window:
const handleTap = useDoubleTap(onLike, { windowMs: 400 });
```

300ms default window matches iOS standard. Single tap is silent; only the second tap within `windowMs` fires.

## Anti-patterns

| Don't | Why |
|---|---|
| Forget to wrap in a sized parent | Component fills `h-full w-full`; without an aspect-ratio wrapper it collapses. |
| Expect a video ref in `renderControls` | Bypasses state machine → desync. v0.2 candidate: `renderVideoElement` slot for full takeover. |
| Expect fullscreen / volume slider / PiP in v0.1 default controls | Add via `renderControls` if needed. v0.2 candidates. |
| Expect HLS / DASH support | Raw `<video src>` only. v0.2 via `useHls?: boolean` flag + `hls.js` peer dep. |
| Expect a buffering spinner / error UI | Browser shows poster on slow load + load failure. v0.2 candidates (`renderError` slot). |
| Expect auto-resume when `isActive` flips back to true | Pauses on deactivation, doesn't auto-play on reactivation. Consumer drives play gesture. |
| Define `labels` / `tracks` inline | Busts `React.memo`. Hoist to module scope. |
| Use `autoPlay` + `muted={false}` | Browser rejects unmuted autoplay; `play()` rejects silently; user must click. Default `muted=true` keeps autoplay working. |

## Browser autoplay policy

Modern browsers (Chrome, Safari, Firefox) **require either `muted=true` OR a prior user gesture** before video can autoplay. The defaults (`muted=true`) keep autoplay working for the 99% case.

If you want unmuted autoplay (rare — bad UX in feeds), you're explicitly fighting the platform. The component's `togglePlay` swallows `play()` rejections silently; the video stays paused until the user clicks.

## Accessibility

- The `<video>` element is `tabIndex={0}` — keyboard focusable. **Space** toggles play/pause; **M** toggles mute. Focus-only (per Q-P4 lock) — multiple videos on a page don't fight for keys.
- Mute toggle gets `aria-pressed={isMuted}`; the label switches between "Mute" (action) and "Unmute" (action) so AT announces the action the button will perform, not a static state.
- Caption tracks via `tracks` expose in the browser's native subtitles UI (CC button in fullscreen).
- Under `prefers-reduced-motion: reduce`, the auto-hide timer is **skipped entirely** — controls stay visible during playback. Motion-sensitive users don't have to hunt for re-revealing controls.
- Custom `renderControls` is the consumer's responsibility — preserve `aria-pressed` on toggles + `aria-label` on icon-only buttons.

## Limitations / caveats

- **No fullscreen toggle in default controls** (v0.1). Add via `renderControls` if needed. v0.2 candidate.
- **No volume slider** (v0.1). Mute-only. Matches kasder + Instagram UX.
- **No HLS/DASH/streaming format support** (v0.1). v0.2 candidate via `useHls?: boolean` flag.
- **No buffering spinner overlay** (v0.1). Browser shows poster during load.
- **No error UI** (v0.1). Browser shows poster on load failure. v0.2 candidate via `renderError?` slot.
- **No playback rate selector** (v0.1).
- **No picture-in-picture** (v0.1).
- **`useVideoState` hook is internal-only** — state delivered to consumers via the `renderControls` slot. v0.2 if real demand for hosts to drive their own `<video>` with our state.
- **Component is `"use client"`** (it owns video state, gestures, observers). Consumers wanting a pure server-rendered `<video>` (no controls) can use a raw `<video>` tag — this component is for the interactive case.

## Composition siblings

- [`expandable-text-01`](../expandable-text-01-procomp/) — sibling primitive in the social-posts-system arc; first ship.
- [`media-carousel-01`](../media-carousel-01-procomp/) (next ship) — composes this for video items in mixed image+video carousels. Sets `isActive` per slide.
- [`story-viewer-01`](../story-viewer-01-procomp/) (later ship) — composes this with `controls={false}` + onTimeUpdate for segmented progress bar fill.

## v0.2 candidates

- Fullscreen toggle (`requestFullscreen()` + button in default controls)
- Volume slider
- HLS/DASH support via `useHls?: boolean` flag + `hls.js` peer dep, OR `renderVideoElement?` slot
- Buffering spinner overlay
- Error UI via `renderError?: (error) => ReactNode` slot
- Playback rate selector
- Picture-in-picture toggle
- Public `useVideoState` hook export
- Programmatic seeking via imperative handle (currently only togglePlay/toggleMute exposed via slot state)

## Cross-folder import contract

When this component composes another registry component (cross-folder import), it imports only from the OTHER component's `<slug>.tsx` file — never from `lib/`, `hooks/`, or `parts/` sub-folders. Conversely, when other registry components compose `video-player-01` (e.g., `media-carousel-01`'s built-in video handler), they import only from `video-player-01.tsx`. The `useDoubleTap` hook is intentionally re-exported there for that reason.

The constraint comes from how `pnpm dlx shadcn add` rewrites import paths in installed copies; sub-folder paths often don't survive cleanly. Anything you want shareable across folder boundaries MUST be re-exported from `<slug>.tsx`.

See [`docs/component-guide.md` §11.6](../../component-guide.md) — *Cross-folder import constraint*.
