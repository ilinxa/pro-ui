"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ColorSwatchPicker } from "./color-swatch-picker";
import { fitFontSize } from "../lib/text-card-export";
import type { GradientPreset, FontOption } from "../../media-editor";
import type { MediaEditorResolvedLabels } from "../types";

/** Smallest font the card steps down to; below it the input scrolls. */
export const TEXT_CARD_FLOOR_PX = 14;
const TEXT_CARD_MIN_BASE_PX = 24;
const TEXT_CARD_MAX_BASE_PX = 48;
/** Space kept clear above and below the text when the control bar is not measurable (SSR / hidden). */
const TEXT_CARD_RESERVE_PX = 88;
/** The control bar's bottom offset (`1.25rem`) plus a small gap, added to its measured height. */
const TEXT_CARD_BAR_CLEARANCE_PX = 28;

/**
 * Auto-grow the input to its content and fit the font to the card: starts at
 * 7 % of the card width (24..48 px), steps down (binary search) to
 * `TEXT_CARD_FLOOR_PX` until the text fits. Past the floor the input keeps the
 * available height and scrolls (documented limit: very long text).
 * Does nothing while the card has no layout (hidden / not yet measured).
 */
export function fitTextCard(
  card: HTMLElement,
  input: HTMLTextAreaElement,
  /** Space kept clear at the bottom (the control bar); default: the unmeasured bar reserve. */
  reservePx: number = TEXT_CARD_RESERVE_PX,
  /** Space kept clear at the top (a host's top chrome); default: `reservePx`, at most 88. */
  topReservePx: number = Math.min(reservePx, TEXT_CARD_RESERVE_PX),
): void {
  const cardW = card.clientWidth;
  const cardH = card.clientHeight;
  if (cardW <= 0 || cardH <= 0) return;
  const base = Math.min(
    TEXT_CARD_MAX_BASE_PX,
    Math.max(TEXT_CARD_MIN_BASE_PX, cardW * 0.07),
  );
  // The input is centred in the space between the reserves (the card's padding), so a
  // tall control bar — the gradient picker open — never covers text, even on a small card.
  card.style.paddingTop = `${topReservePx}px`;
  card.style.paddingBottom = `${reservePx}px`;
  const available = Math.max(
    cardH - reservePx - topReservePx,
    TEXT_CARD_FLOOR_PX * 1.2,
  );
  const contentHeight = (px: number) => {
    input.style.setProperty("--tc-fs", `${px}px`);
    input.style.height = "auto";
    // An empty card sizes for its wrapped placeholder (rows=1 would cut it to one line).
    if (input.value === "" && input.placeholder) {
      input.value = input.placeholder;
      try {
        return input.scrollHeight;
      } finally {
        input.value = "";
      }
    }
    return input.scrollHeight;
  };
  const px = fitFontSize({
    base,
    floor: TEXT_CARD_FLOOR_PX,
    fits: (p) => contentHeight(p) <= available,
  });
  const h = contentHeight(px);
  if (h > 0) input.style.height = `${Math.min(h, available)}px`;
}

export interface TextOnlyCanvasProps {
  gradients: GradientPreset[];
  fonts: FontOption[];
  colorPresets: string[];
  labels: MediaEditorResolvedLabels;
  className?: string;
}

export interface TextOnlyCanvasState {
  text: string;
  fontFamily: string;
  textColor: string;
  gradientId: string;
}

/**
 * Text-only mode capture surface.
 *
 * Rendered as a styled DOM element (NOT Konva) so `exportTextOnlyBlob()`
 * can rasterise it via the SVG-foreignObject technique on publish. The
 * forwardRef exposes the canvas <div> element so the publish path can
 * pass it to the exporter.
 */
export const TextOnlyCanvas = forwardRef<
  HTMLDivElement,
  TextOnlyCanvasProps & {
    value: TextOnlyCanvasState;
    onChange: (next: TextOnlyCanvasState) => void;
  }
>(function TextOnlyCanvas(
  { gradients, fonts, colorPresets, labels, value, onChange, className },
  ref,
) {
  const [pickerOpen, setPickerOpen] = useState<"gradient" | "font" | null>(
    null,
  );
  const cardRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const setCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      cardRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Grow the input to its content and step the font down until every line
  // fits the card (down to FLOOR_PX; past that the input scrolls).
  const fit = useCallback(() => {
    const card = cardRef.current;
    const input = inputRef.current;
    if (!card || !input) return;
    // Reserve the bar's real height (it grows with the gradient picker open).
    const barH = barRef.current?.offsetHeight ?? 0;
    fitTextCard(
      card,
      input,
      barH > 0 ? barH + TEXT_CARD_BAR_CLEARANCE_PX : TEXT_CARD_RESERVE_PX,
    );
  }, []);

  useLayoutEffect(() => {
    fit();
  }, [fit, value.text, value.fontFamily, labels.textPlaceholder, pickerOpen]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => fit()) : null;
    ro?.observe(card);
    if (barRef.current) ro?.observe(barRef.current);
    // A web font that arrives late changes the line breaks: `ready` is
    // one-shot, so also re-fit whenever a later load finishes.
    let cancelled = false;
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    fonts?.ready?.then(() => {
      if (!cancelled) fit();
    });
    const onFontsLoaded = () => {
      if (!cancelled) fit();
    };
    fonts?.addEventListener?.("loadingdone", onFontsLoaded);
    return () => {
      cancelled = true;
      ro?.disconnect();
      fonts?.removeEventListener?.("loadingdone", onFontsLoaded);
    };
  }, [fit]);

  const activeGradient =
    gradients.find((g) => g.id === value.gradientId) ?? gradients[0];

  const update = (patch: Partial<TextOnlyCanvasState>) =>
    onChange({ ...value, ...patch });

  return (
    <div
      className={cn("relative flex-1 flex flex-col overflow-hidden", className)}
    >
      {/* Render surface — exported as PNG on publish */}
      <div
        ref={setCardRef}
        className="absolute inset-0 grid place-items-center"
        // The card is the size container: font + wrap width are relative to it
        // (cqi), never to the viewport.
        style={{
          background: activeGradient?.background ?? "#000",
          containerType: "size",
        }}
      >
        <textarea
          ref={inputRef}
          data-slot="textcard-input"
          value={value.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder={labels.textPlaceholder}
          rows={1}
          aria-label={labels.textPlaceholder}
          className="resize-none bg-transparent text-center placeholder:text-current/40 focus:outline-none"
          style={{
            width: "min(calc(100cqi - 4rem), 40rem)",
            color: value.textColor,
            fontFamily: value.fontFamily,
            // `--tc-fs` is set by `fitTextCard` (fitted px); the clamp is the
            // pre-measure / SSR value and equals its starting size.
            fontSize: "var(--tc-fs, clamp(1.5rem, 7cqi, 3rem))",
            lineHeight: 1.2,
            fontWeight: 600,
            textShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        />
      </div>

      {/* Bottom control bar — gradient picker + font + color */}
      <div
        ref={barRef}
        className="absolute left-0 right-0 z-20 flex flex-col gap-2 px-3"
        style={{
          bottom: "max(1.25rem, env(safe-area-inset-bottom))",
        }}
      >
        {pickerOpen === "gradient" ? (
          <div className="flex items-center gap-2 overflow-x-auto rounded-2xl bg-media-overlay backdrop-brightness-75 backdrop-blur-md p-2">
            {gradients.map((g) => {
              const isActive = g.id === value.gradientId;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => update({ gradientId: g.id })}
                  aria-label={g.label}
                  aria-pressed={isActive}
                  className={cn(
                    "flex-none size-10 rounded-full ring-2 transition-shadow",
                    isActive ? "ring-media-overlay-foreground" : "ring-transparent",
                  )}
                  style={{ background: g.background }}
                />
              );
            })}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 rounded-2xl bg-media-overlay backdrop-brightness-75 backdrop-blur-md p-2 text-media-overlay-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setPickerOpen((p) => (p === "gradient" ? null : "gradient"))
            }
            aria-pressed={pickerOpen === "gradient"}
            className="text-xs gap-2 text-media-overlay-foreground hover:bg-media-overlay-foreground/10 hover:text-media-overlay-foreground"
          >
            <span
              className="inline-block size-4 rounded-full ring-2 ring-media-overlay-foreground/40"
              style={{ background: activeGradient?.background ?? "#000" }}
              aria-hidden
            />
            <span>{labels.textBackground}</span>
          </Button>

          <div className="flex items-center gap-2">
            <select
              value={value.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              aria-label={labels.textFontFamily}
              className="h-7 rounded-md bg-media-overlay border border-media-overlay-foreground/15 px-2 text-xs"
            >
              {fonts.map((font) => (
                <option
                  key={font.id}
                  value={font.family}
                  style={{ fontFamily: font.family }}
                >
                  {font.label}
                </option>
              ))}
            </select>
            <ColorSwatchPicker
              value={value.textColor}
              presets={colorPresets}
              onChange={(c) => update({ textColor: c })}
              ariaLabel={labels.drawColor}
              labels={labels}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
