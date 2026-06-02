import { selectRecorderMime } from "../../media-editor-01";

export interface CompositeVideoOptions {
  sourceBlob: Blob;
  /** Seconds — trim range. Optional; defaults to full duration. */
  startSec?: number;
  endSec?: number;
  /** Renders one frame onto the canvas. Called per RAF tick. */
  renderFrame: (
    ctx: CanvasRenderingContext2D,
    sourceVideo: HTMLVideoElement,
  ) => void;
  /** Output dimensions — usually crop size. */
  outputWidth: number;
  outputHeight: number;
  /** Capture frame rate. Default 30. */
  fps?: number;
}

export interface CompositeVideoResult {
  blob: Blob;
  durationMs: number;
  mimeType: string;
}

/**
 * Bake text/sticker/drawing overlays into a video file (Q-P1a — full
 * Instagram parity).
 *
 * Pipeline:
 *   1. Play the source video in a hidden <video> from startSec → endSec
 *   2. Each requestVideoFrameCallback (or RAF) tick, renderFrame() draws
 *      both the video frame AND the overlay snapshot onto an offscreen
 *      <canvas> at outputWidth × outputHeight
 *   3. canvas.captureStream(fps) feeds a new MediaRecorder
 *   4. Audio tracks from the source video are mixed into the output stream
 *   5. On video-end (or endSec), stop the recorder; resolve with the blob
 *
 * The caller owns the overlay rendering (`renderFrame`) — typically that
 * function snapshots the current Konva stage with stage.toCanvas() and
 * draws it on top of the video frame. The composer wires that hook up at
 * publish time.
 */
export async function compositeVideo(
  opts: CompositeVideoOptions,
): Promise<CompositeVideoResult> {
  const {
    sourceBlob,
    startSec,
    endSec,
    renderFrame,
    outputWidth,
    outputHeight,
    fps = 30,
  } = opts;

  const mime = selectRecorderMime();
  if (!mime) {
    throw new Error(
      "This browser does not support MediaRecorder — video publish unavailable.",
    );
  }

  const sourceUrl = URL.createObjectURL(sourceBlob);
  const video = document.createElement("video");
  video.src = sourceUrl;
  video.muted = false;
  video.playsInline = true;
  video.crossOrigin = "anonymous";

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Source video failed to load"));
    });

    const begin = startSec ?? 0;
    const end = endSec ?? video.duration;
    video.currentTime = begin;

    // Build the output stream: canvas video + source audio (if any).
    const canvasStream = canvas.captureStream(fps);
    // Mix in original audio so the export isn't silent.
    try {
      // captureStream on the video element only works in some browsers;
      // fall back to a MediaStreamAudioSourceNode chain otherwise.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vAny = video as any;
      if (typeof vAny.captureStream === "function") {
        const srcStream: MediaStream = vAny.captureStream();
        for (const track of srcStream.getAudioTracks()) {
          canvasStream.addTrack(track);
        }
      } else if (typeof vAny.mozCaptureStream === "function") {
        const srcStream: MediaStream = vAny.mozCaptureStream();
        for (const track of srcStream.getAudioTracks()) {
          canvasStream.addTrack(track);
        }
      }
    } catch {
      /* audio mixing best-effort; some browsers lock down crossorigin */
    }

    const recorder = new MediaRecorder(canvasStream, { mimeType: mime });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const startedAt = Date.now();

    // RAF loop drives the canvas frames. We stop when the video crosses
    // `end`, or earlier if the video ends naturally.
    let raf = 0;
    const tick = () => {
      if (video.currentTime >= end || video.ended) {
        recorder.state === "recording" && recorder.stop();
        return;
      }
      renderFrame(ctx, video);
      raf = requestAnimationFrame(tick);
    };

    return await new Promise<CompositeVideoResult>((resolve, reject) => {
      recorder.onstop = () => {
        cancelAnimationFrame(raf);
        video.pause();
        const blob = new Blob(chunks, { type: mime });
        resolve({ blob, durationMs: Date.now() - startedAt, mimeType: mime });
      };
      recorder.onerror = (ev) => {
        cancelAnimationFrame(raf);
        const e =
          (ev as unknown as { error?: Error }).error ??
          new Error("MediaRecorder failed during composite");
        reject(e);
      };

      recorder.start(250);
      video
        .play()
        .then(() => {
          tick();
        })
        .catch(reject);
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
