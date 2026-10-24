# video-player — consumer guide

> Stage 3: usage notes for hosts. Current for **v0.3.0**.
>
> See [description](./video-player-procomp-description.md) for what & why; [plan](./video-player-procomp-plan.md) for how it's built.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/video-player
```

Optional fixtures (hotlink-friendly sample clips from test-videos.co.uk and MDN, a poster, and caption tracks that work with `crossOrigin`):

```bash
pnpm dlx shadcn@latest add @ilinxa/video-player-fixtures
```

Pulls shadcn `button` and `lucide-react`. No other peer deps.

## When to reach for it

Anywhere user-generated or editorial video plays: post media (it is the video renderer inside `media-carousel`), story viewers (`story-viewer` composes it with `controls={false}`), article inline video, event recordings, product previews.

**Not** for streaming formats (HLS / DASH) — raw `<video src>` only. Not implemented.

## Sizing the player

The component fills its container (`h-full w-full`). Always wrap it in a sized parent:

```tsx
<div className="aspect-video">
  <VideoPlayer src={post.videoUrl} poster={post.posterUrl} />
</div>
```

`aspect-video` (16:9), `aspect-square` (1:1 post), `aspect-[9/16]` (story), `aspect-[4/5]` (portrait post).

## What the default controls show

- **Before the first play:** a big centre play button, a duration badge (top end) once the duration is known, and the mute button (bottom end).
- **After it started:** a bottom row — pause (bottom start, while playing), the seek bar, elapsed / total time, the captions control (when `tracks` is not empty), the fullscreen button (`showFullscreen`) and mute (bottom end). The centre play button shows whenever it is paused (not while loading or failed). Taps on the time chip or the empty part of the row reach the video.
- **Buffering:** a spinner (`waiting` / `stalled`, or a URL refresh in flight). **Failed:** an overlay with the error text and **Retry**.
- During playback the controls hide after `controlsAutoHideMs` (2000) and come back on pointer movement, a tap, focus or a key anywhere in the player. They stay up while keyboard focus is on a control or the captions menu is open. Hidden controls take no clicks — a tap where the mute button was lands on the video. Under `prefers-reduced-motion` they never hide.

Turn parts off: `showSeekBar={false}`, `showTime={false}` (the 0.2 look). Fullscreen is opt-in: `showFullscreen`.

The bottom row (and the idle mute button) sit `--video-player-controls-bottom` above the bottom edge (default
`0.75rem`). Set it on any ancestor to clear your own overlay — media-carousel sets it to `1.75rem` while it shows
indicator dots.

## Common recipes

### 1. Minimal

```tsx
<VideoPlayer src={post.videoUrl} poster={post.posterUrl} />
```

Defaults: `muted`, `loop` (unless you pass `onEnded`), `playsInline`, `preload="metadata"`, controls with auto-hide.

### 2. Carousel coordination via `isActive`

The host toggles `isActive` per slide. An inactive video pauses, and nothing starts it while inactive. It does not auto-resume when it becomes active again — the viewer starts it.

```tsx
<VideoPlayer src={item.url} poster={item.poster} isActive={idx === currentIndex} />
```

`media-carousel` already does this (and also treats slides as inactive while the carousel is less than half in view).

### 3. Double tap to like

```tsx
<VideoPlayer src={post.videoUrl} onDoubleTap={() => like(post.id)} />
```

With `onDoubleTap`, a single tap waits out the 300 ms double-tap window and then toggles playback; a double tap calls `onDoubleTap` and never toggles playback. Without `onDoubleTap`, a single tap toggles immediately. Taps on the controls never count.

### 4. Expired URLs — refresh and resume

Signed CDN URLs expire. Give the player a way to get a fresh one:

```tsx
<VideoPlayer
  src={video.url}
  onMediaError={async (failedSrc) => (await api.refreshVideoUrl(video.id)).url}
/>
```

- Called **once per `src`**. While it runs the player shows its buffering state.
- A returned URL replaces the source; the player seeks back to where it failed and resumes playing if it was playing (and `isActive`).
- A void answer, a rejection, a throw, or a second error for the same `src` shows the error overlay; **Retry** reloads the current source and resumes at the same time.
- A new `src` from you starts over (it may be asked again).
- `onError(mediaError)` still fires on every error — use it for logging.

If you also write the refreshed URL into `src` yourself while `onMediaError` is pending (media-carousel does), that is
the same refresh and it resumes too. Any other new `src` is different media: it starts at 0, idle.

### 5. Captions

```tsx
<VideoPlayer
  src={article.videoUrl}
  crossOrigin="anonymous"
  tracks={[
    { kind: "captions", src: "https://cdn.example.com/en.vtt", srcLang: "en", label: "English" },
    { kind: "subtitles", src: "https://cdn.example.com/tr.vtt", srcLang: "tr", label: "Türkçe" },
  ]}
/>
```

- One track → a captions toggle (`aria-pressed`). Several → a menu: "Off" plus each `label`, operable with ↑ / ↓ / Home / End / Escape.
- A track with `default: true` starts showing.
- **A caption file on another origin only loads with `crossOrigin`** — and then the VIDEO must also be served with CORS headers, or it fails to load. Leave `crossOrigin` unset for same-origin captions or a video host without CORS.

### 6. Fullscreen

```tsx
<VideoPlayer src={video.url} showFullscreen />
```

Uses the container's `requestFullscreen` (the controls stay on top), or the `<video>`'s `webkitEnterFullscreen` on iOS (native player). The button does not render where neither exists. Off by default.

### 7. Feed-wide sound preference (controlled `muted`)

```tsx
const [muted, setMuted] = useState(true);

<VideoPlayer src={a.url} muted={muted} onMutedChange={setMuted} />
<VideoPlayer src={b.url} muted={muted} onMutedChange={setMuted} />
```

With `onMutedChange`, `muted` is controlled: the prop wins on every render and the mute button only asks. Without it, `muted` is the starting value and the user's toggle applies until you change the prop.

Playback itself is not controllable by prop — a browser can refuse `play()`. Pause with `isActive={false}` or the handle.

### 8. Autoplay in view (opt-in)

```tsx
<VideoPlayer src={clip.url} autoPlayInView autoplayGroup="feed" />
```

- Plays, muted, while at least `autoPlayThreshold` (0.5) of the player is visible; pauses when it leaves.
- `autoplayGroup`: at most one player per group plays — one that starts (by autoplay or a tap) pauses the others.
- Off under `prefers-reduced-motion`, never while `isActive` is false, and does nothing where IntersectionObserver does not exist.
- With `muted` controlled to `false` it tries to play unmuted; a browser refusal is ignored.

### 9. Long feeds — `preload="none"` + `durationHint`

`preload="metadata"` (default) fetches each video's headers on render. For long feeds pass `preload="none"`; then the duration is unknown until play, so pass it from your API for the idle badge:

```tsx
<VideoPlayer src={v.url} poster={v.poster} preload="none" durationHint={v.durationSeconds} />
```

### 10. Lighter or custom controls — flat parts in `renderControls`

```tsx
import {
  VideoPlayer, VideoPlayerPlayButton, VideoPlayerSeekBar, VideoPlayerMuteButton, VideoPlayerStatus,
} from "@/components/video-player";

<VideoPlayer
  src={reel.url}
  renderControls={() => (
    <div className="pointer-events-none absolute inset-0">
      <VideoPlayerStatus />
      <div className="pointer-events-auto absolute inset-x-3 bottom-3 flex items-center gap-2">
        <VideoPlayerPlayButton />
        <VideoPlayerSeekBar className="flex-1" />
        <VideoPlayerMuteButton />
      </div>
    </div>
  )}
/>
```

Parts: `VideoPlayerPlayButton` (`size="sm" | "lg"`), `VideoPlayerMuteButton`, `VideoPlayerSeekBar`, `VideoPlayerTime`, `VideoPlayerDurationBadge`, `VideoPlayerFullscreenButton`, `VideoPlayerCaptionsButton`, `VideoPlayerStatus`. They read the player's context, so they only work inside `<VideoPlayer>` (they throw outside it). `useVideoPlayer()` gives your own parts the same state, labels and `formatTime`. `renderControls(state)` still receives the full `VideoState` for fully custom UI. Your overlay owns auto-hide: read `controlsVisible` from `useVideoPlayer()`.

### 11. Imperative handle

```tsx
const ref = useRef<VideoPlayerHandle>(null);
<VideoPlayer ref={ref} src={v.url} />
// ref.current?.play() · pause() · seek(30) · toggleMute() · toggleFullscreen()
```

The `<video>` element itself is not exposed (it would let a host bypass the state the controls read).

### 12. Labels, locale, direction

```tsx
const TR_LABELS: VideoPlayerLabels = {
  play: "Oynat", pause: "Duraklat", mute: "Sesi kapat", unmute: "Sesi aç", seek: "Konum",
  position: (_c, _t, f) => `${f.current} / ${f.total}`,
  fullscreen: "Tam ekran", exitFullscreen: "Tam ekrandan çık",
  captions: "Altyazılar", captionsMenu: "Altyazılar", captionsOff: "Kapalı",
  buffering: "Yükleniyor", error: "Bu video oynatılamıyor.", retry: "Tekrar dene",
};

<VideoPlayer src={v.url} labels={TR_LABELS} locale="tr" />
```

- Labels with a value are functions (`position`, `timeDisplay`, `durationBadge`); an `undefined` key keeps the default. **Hoist the object** — an inline object re-resolves every render.
- `locale` formats the time digits (default `"en"`; an invalid tag such as `"en_US"` falls back). `formatDuration(seconds, locale)` replaces the format entirely.
- `dir="rtl"` (or an RTL ancestor, read after mount): the seek bar fills from the right and → seeks backward.
- `DEFAULT_VIDEO_PLAYER_LABELS` is now `defaultVideoPlayerLabels` (the old name is a deprecated alias).

### 13. Decorative background loop (no controls)

```tsx
<VideoPlayer src="/hero/loop.mp4" controls={false} autoPlay />
```

`controls={false}` renders **no overlay at all** — no buttons, spinner or error overlay — and the focused video does not take ← / →, so a host's own arrow-key handling (story navigation) keeps working. Click-to-toggle and Space / M still work.

### 14. Lifecycle + progress callbacks

```tsx
<VideoPlayer
  src={video.url}
  onPlay={() => track("play")}
  onEnded={() => track("complete")}               // also turns the default loop off
  onProgress={({ currentTime, duration, buffered }) => report(currentTime / duration)}
  onLoadedMetadata={(duration) => setDuration(duration)}
/>
```

`onTimeUpdate` and `onProgress` are rAF-throttled and report media time (`onProgress` also fires on the `progress` event, with the buffered spans).

### 15. Standalone `useDoubleTap`

```tsx
import { useDoubleTap } from "@/components/video-player";

const handleTap = useDoubleTap(onLike);                                   // single tap silent
const handleTap2 = useDoubleTap(onLike, { onSingleTap: openLightbox });   // single tap after the window
```

300 ms default window (`windowMs`). Taps inside interactive controls (`button`, `a`, form fields, `[role="button"]`, `[role="slider"]`, `[role="menuitemradio"]`) are ignored.

## Upgrading to 0.3.0

| Change | What to do |
|---|---|
| The default controls show the seek bar and time | `showSeekBar={false}` / `showTime={false}` for the 0.2 look |
| With `onDoubleTap`, a single tap toggles playback 300 ms later | nothing — this is the fix for play-then-pause on a double tap |
| `onEnded` without `loop` → `loop` defaults to `false` | pass `loop` explicitly to keep looping (then `onEnded` never fires) |
| Hidden controls no longer take clicks | nothing |
| A focused video (controls on) takes ← / → to seek, with `preventDefault` | a parent arrow-key handler should skip `defaultPrevented` events (media-carousel 0.3.1 and media-library 0.2.3 do); `controls={false}` keeps arrows free |
| `DEFAULT_VIDEO_PLAYER_LABELS` renamed | use `defaultVideoPlayerLabels` (alias kept) |

## Anti-patterns

| Don't | Why |
|---|---|
| Forget the sized parent | The player fills `h-full w-full`; without a sized wrapper it collapses. |
| Put `crossOrigin` on a video host without CORS headers | The video stops loading. Only set it for cross-origin caption files on a CORS-enabled host. |
| Use `autoPlay` with `muted={false}` | Browsers refuse unmuted autoplay; the video stays paused until a tap. (`autoPlayInView` mutes the player first — unless `muted` is controlled to `false`, then the same refusal applies.) |
| Expect auto-resume when `isActive` flips back to true | It pauses on deactivation and waits for the viewer. |
| Define `labels` / `tracks` inline | Re-resolves on every render. Hoist them. |
| Render the flat parts outside `<VideoPlayer>` | They read its context and throw. |

## Accessibility

- The `<video>` is focusable: **Space** play / pause, **M** mute, **← / →** seek (while controls render; mirrored under RTL). Focus-only — several players on a page never fight for keys.
- The seek bar is a `role="slider"` with `aria-valuetext` from `labels.position`; ← / → / ↑ / ↓ / PageUp / PageDown / Home / End. Handled keys call `preventDefault`, so a surrounding carousel ignores them.
- Toggles carry `aria-pressed` (mute, captions, fullscreen); every icon button has an `aria-label` from `labels`.
- The spinner is a `role="status"` live region that announces `labels.buffering`; the error text is `role="alert"`.
- Focus inside the player wakes hidden controls, so keyboard users never act on an invisible button.
- Reduced motion: no auto-hide, no autoplay-in-view, no spinner animation.

## Limitations

- No HLS / DASH. No volume slider (mute only). No playback-rate selector. No picture-in-picture. Not implemented.
- `useVideoState` is internal — use the parts / `useVideoPlayer()` inside `renderControls`.
- Direction is read once after mount; pass `dir` if your app switches direction at runtime without remounting.
- `toggleFullscreen()` (handle and state) does nothing where no fullscreen API exists — check `state.canFullscreen`. On iOS the native player owns leaving fullscreen.
- Inside a Radix dialog (e.g. media-library's lightbox), Escape in the captions menu also closes the dialog: Radix listens for Escape on the document before the menu sees it.
- The component is `"use client"`.

## Composition siblings

- [`media-carousel`](../media-carousel-procomp/) — renders it for video slides; forwards its own `onMediaError` through the player, so a refreshed video resumes.
- [`story-viewer`](../story-viewer-procomp/) — composes it with `controls={false}`, `loop={false}`, `autoPlay` and `onEnded`.
- [`media-library`](../media-library-procomp/) — lazy-loads it for video previews.

## Cross-folder imports

Other registry components import from this folder by specific file — `media-carousel` and `story-viewer` import `../../video-player/video-player`, and `media-carousel` imports `../../video-player/hooks/use-double-tap` — never through `index.ts` (the shadcn import rewriter mangles barrel re-exports across folders). See [`docs/component-guide.md` §11.6](../../component-guide.md).
