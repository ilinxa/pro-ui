# video-player-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — derived from kasder `PostVideoPlayer.tsx` (128 LOC), the `<video>` wrapper used inside post media carousels.
>
> Second of 8 components in the social-posts-system arc. Narrow primitive — useful even if downstream `media-carousel-01` / `story-viewer-01` ships are deferred. Establishes the slot-based-controls pattern, the `isActive` auto-pause contract, and the `useDoubleTap` helper that the carousel will consume.

## Problem

Every product surface that plays user-generated video — Instagram-post media, story viewers, news article inline videos, event recordings, product previews — needs the same `<video>` wrapper: muted-autoplay-friendly defaults, optional play/pause/mute control overlay that auto-hides during playback, **`isActive` prop to pause cleanly when out-of-view** (critical for multi-video carousels — kasder posts can have 2+ videos in one slide group, all of which would otherwise multi-play). Built ad-hoc per project: hardcoded control UI, no `isActive` contract (videos in carousels keep playing on inactive slides), no slot for custom controls (you fork the file to change the design), no double-tap callback (the post double-tap-to-like UX needs it), no caption track support.

## In scope

- **`<video>` wrapper with safe Instagram-style defaults** — `muted=true`, `loop=true`, `playsInline=true`, `preload="metadata"`, `disablePictureInPicture` opt-in.
- **`isActive: boolean`** — when `false`, video pauses + resets `isPlaying` state. **Critical contract:** consumer-driven (carousel sets `isActive` based on which slide is current). Component has no opinion about who else exists; pure pause-on-deactivate.
- **`controls?: boolean`** (default `true`) — master toggle for the control overlay. When `false`, no UI overlay at all (decorative video / autoplay loop use case).
- **`renderControls?: (state: VideoState) => ReactNode`** — full slot takeover; consumer renders custom overlay with full state access. Default control overlay matches kasder's pattern (big play/pause center button + bottom-right mute toggle + auto-hide).
- **Auto-hide controls during playback** — `controlsAutoHideMs?: number` (default `2000`). After N ms of `isPlaying` without mouse movement, fade controls to `opacity-0`. Reappear on hover/click. Pass `0` to disable auto-hide entirely (controls always visible).
- **Double-tap callback** — `onDoubleTap?: () => void`. Fires on a 300ms-window double-tap detection. Composes into post-card's double-tap-to-like UX. Component itself does NOT render any visual — that's the host's concern (heart-burst lives in `engagement-bar-01`'s `<EngagementHeartBurst>` sub-export).
- **Lifecycle callbacks** — `onPlay?` / `onPause?` / `onEnded?` / `onTimeUpdate?(currentTime, duration)`. Throttled `onTimeUpdate` (one fire per `requestAnimationFrame` max) to avoid hot-path overhead.
- **Caption tracks** — `tracks?: VideoTrack[]` maps to `<track>` elements (kind / src / srcLang / label / default). Cheap a11y win; honors browser-native subtitle UI.
- **Object fit** — `objectFit?: "cover" | "contain"` (default `"cover"`). Cover for Instagram-style square crops; contain for letterboxed news-article videos.
- **Keyboard controls** — Space=toggle play/pause, M=toggle mute. Wired on the video element with `tabIndex={0}` for focus.
- **i18n labels** — `labels?: { play?, pause?, mute?, unmute?, videoLabel? }` with English defaults. All control buttons + the video element get aria-labels from this object.
- **Responsiveness** — fills its container; consumer sizes the wrapping `<div>`. No internal aspect-ratio enforcement.
- **a11y** — `aria-label` on the `<video>` element (from `labels.videoLabel`); `aria-label` on each control button; `aria-pressed` on mute toggle; `motion-safe:` on control fade transitions; reduced-motion users see controls always-visible (no auto-hide).
- **SSR-safe** — `<video>` tag renders server-side; client hydrates with state. No DOM-only construction.
- **`useDoubleTap` hook exported standalone** — reusable for image-carousel double-tap-to-like (where there's no `<video>` involved). Same 300ms-window detection. Public from `index.ts`.

## Out of scope (v0.2 candidates)

- **Volume slider** — mute-only in v0.1 (matches kasder; matches Instagram). Volume slider is a separate UX with its own risk surface (touch dragging, accessibility, keyboard).
- **Fullscreen toggle** — `requestFullscreen()` API is supported but adds button + state. Consumer can add via `renderControls`. Default controls stay minimal in v0.1.
- **Picture-in-picture** — PiP requires an explicit user gesture and toggle UI; defer.
- **HLS / DASH / streaming formats** — raw `<video src>` only. Streaming lands in v0.2 via a `useHls?: boolean` flag + `hls.js` peer dep, OR via a `renderVideoElement?` slot escape hatch.
- **Buffering spinner overlay** — kasder doesn't show one; v0.1 trusts the browser's default poster + native loading. v0.2 candidate.
- **Error UI** — when video fails to load, `<video>` shows the poster image (browser default). v0.2: `renderError?: (error) => ReactNode` slot for a retry / fallback UX.
- **Playback rate** — no 1.0× / 1.5× / 2× selector. v0.2.
- **Per-source resolution switching** — single `src` only. Multi-resolution `<source>` children would require a different prop shape.
- **Subtitles styling beyond browser default** — `<track>` is rendered; styling stays browser-native. v0.2 if real demand.
- **Public `useVideoState` hook export** — internal-only in v0.1. The state is delivered to consumers via the `renderControls` slot prop. If real consumers need to render their own `<video>` driven by our state, expose in v0.2.
- **Server-component compatibility** — the component is `"use client"` (it owns video state, gestures, observers). The `<video>` element itself works in RSC; consumers wanting a pure SSR `<video>` (no controls) can use a raw `<video>` tag — this component is for the interactive-control case.

## Target consumers

- **`media-carousel-01`** (next ship after this) — post media (photos + videos in one strip). Sets `isActive` per slide.
- **`story-viewer-01`** — full-screen story playback with segmented progress.
- News article inline videos (could retrofit via `content-card-news-01`'s slot-based design).
- Event recordings (post-event playback on detail pages).
- Product video previews.
- Standalone embedded videos in any sandbox demo.

## Rough API sketch

```tsx
<VideoPlayer01 src={post.videoUrl} />
```

Most consumers can stop here — defaults match Instagram-post UX (muted autoplay, controls auto-hide).

For carousels (the originating use case):

```tsx
<VideoPlayer01
  src={item.videoUrl}
  poster={item.posterUrl}
  isActive={index === currentIndex}
  onDoubleTap={() => onLike(post.id)}
/>
```

For news articles (full controls always visible, contain-fit, captions):

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

For decorative looping background video (no controls):

```tsx
<VideoPlayer01
  src="/hero/loop.mp4"
  controls={false}
  objectFit="cover"
/>
```

For custom control UI (e.g., reels-style scrubber + reactions row):

```tsx
<VideoPlayer01
  src={reel.videoUrl}
  renderControls={({ isPlaying, isMuted, currentTime, duration, togglePlay, toggleMute }) => (
    <ReelsControlOverlay
      isPlaying={isPlaying}
      isMuted={isMuted}
      progress={currentTime / duration}
      onPlayToggle={togglePlay}
      onMuteToggle={toggleMute}
    />
  )}
/>
```

## Example usages

**1. Post media carousel slide** (the originating use case — paired with `media-carousel-01`):
```tsx
{media.map((item, idx) => (
  <CarouselSlide key={item.id}>
    {item.type === "video" ? (
      <VideoPlayer01
        src={item.url}
        poster={item.poster}
        isActive={idx === currentIndex}
        onDoubleTap={() => triggerLikeBurst(post.id)}
      />
    ) : (
      <img src={item.url} alt={item.alt} className="..." />
    )}
  </CarouselSlide>
))}
```

**2. Story viewer item** (composed inside `story-viewer-01`):
```tsx
<VideoPlayer01
  src={story.items[currentItemIndex].src}
  isActive={!isPaused}
  controls={false}
  loop={false}
  onEnded={goToNextItem}
  onTimeUpdate={(t, d) => setProgress(t / d)}
/>
```

**3. Standalone hook for image double-tap-to-like** (no `<video>` involved):
```tsx
import { useDoubleTap } from "@/registry/components/media/video-player-01";

function PhotoWithLike({ src, onLike }: { src: string; onLike: () => void }) {
  const handleTap = useDoubleTap(onLike);
  return <img src={src} onClick={handleTap} className="..." />;
}
```

## Public exports (from `index.ts`)

```ts
export { VideoPlayer01 } from "./video-player-01";
export type {
  VideoPlayer01Props,
  VideoPlayer01Labels,
  VideoState,
  VideoTrack,
} from "./types";
export { DEFAULT_VIDEO_PLAYER_LABELS } from "./types";
export { useDoubleTap } from "./hooks/use-double-tap"; // standalone, no <video> dep
export { meta } from "./meta";
```

## Open questions for the plan stage

1. **Component category — `media` (NEW) or `data`?** The analysis defaulted to `data`; the project has a `media` category at [src/registry/categories.ts:46-50](../../../src/registry/categories.ts#L46) defined as "Image galleries, video players, carousels, file viewers" — exactly this. **Recommendation: `media`.** First occupant. Same posture for upcoming `media-carousel-01`, `story-rail-01`, `story-viewer-01` (3 more `media`-category components in this arc).
2. **Default `controlsAutoHideMs` value?** kasder uses 2000ms; standard for video players. Lock at 2000.
3. **Should we wire `onTimeUpdate` to `requestAnimationFrame` throttling?** Native `<video>` fires `timeupdate` ~4× per second per spec, but some browsers fire ~30×. rAF-throttling caps it at the display refresh rate. **Recommendation: yes** — perf-safe default.
4. **Keyboard scope — global or only when video has focus?** Native `<video controls>` only handles keys when focused. Match that posture (focus required) so multiple videos on one page don't fight for Space.
5. **`onDoubleTap` window — 300ms hard-coded or configurable?** kasder uses 300ms. Mirror that. Configurable via `useDoubleTap(handler, { windowMs: number })` for hook consumers; component-level uses default 300ms.
6. **`tracks` prop — array of objects or `children` slot accepting `<track>` elements?** Array of objects is more ergonomic for the data-driven case (most common); requires zero peer knowledge of `<track>` API. Lock to array.
7. **`renderControls` receives the entire `<video>` ref or just state?** State only. Exposing the ref leaks substrate — hosts could call native methods that conflict with our state machine. If they need raw access, they fork via `renderVideoElement?` slot (v0.2 candidate; not v0.1).
8. **Fullscreen support — drop entirely from default controls or add a fullscreen prop?** Drop from default controls. Hosts who need it add via `renderControls`. Keeps API minimal.
9. **Should `controls={false}` disable keyboard shortcuts too?** No — Space/M still work even with controls hidden (decorative-video case where the user can still interact). Document.
10. **Mute-toggle `aria-pressed` semantics?** Mute is a toggle button — `aria-pressed={isMuted}`. `labels.mute` reads "Mute" (action verb), `labels.unmute` reads "Unmute". Whichever button is currently rendered gets the correct label.

## Pre-emptive locks (from analysis review)

- **No framer-motion** in this component. Control fade is CSS opacity transition. Heart burst lives in `engagement-bar-01`'s sibling sub-export, not here.
- **No Embla** dep. This component is just `<video>` + control overlay; Embla is `media-carousel-01`'s concern.
- **No client-state library** (no Zustand / Jotai). Local React state via `useReducer` for the video state machine — `useReducer` not `useState` because there are 4+ state fields and several actions (play/pause/mute/loaded/timeupdate) that need atomic transitions.
- **`<video>` `key` is stable on `src` change** — when `src` swaps, React re-renders the same `<video>` element with new `src`. Browser handles the load. We don't manually unmount.

---

**Awaiting your sign-off before I draft the plan doc** (`video-player-01-procomp-plan.md`). The plan will lock the open questions above, spec the 11-file tree (root + 2 parts + 2 hooks + 6 standard), define the 5-tab demo (Default / Custom controls / Captions / Decorative no-controls / isActive auto-pause across carousel), and pin the implementation order (Phase A: hooks + types + scaffolding; Phase B: video element + state machine + default controls; Phase C: demo + usage + meta + ship).
