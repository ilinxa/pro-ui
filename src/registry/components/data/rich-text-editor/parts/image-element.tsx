"use client";

import {
  type ChangeEvent,
  type ComponentProps,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  PlateElement,
  type PlateElementProps,
  useEditorRef,
  useNodePath,
  useReadOnly,
} from "platejs/react";
import { cn } from "@/lib/utils";

type ElementProps = ComponentProps<typeof PlateElement>;

interface ImageNode {
  url?: string;
  alt?: string;
  caption?: string;
  width?: string | number;
  height?: string | number;
}

const MIN_WIDTH_PCT = 20;
const MAX_WIDTH_PCT = 100;

function parseWidthPercent(width: string | number | undefined): number {
  if (typeof width === "number") return width;
  if (!width) return MAX_WIDTH_PCT;
  const match = /^(\d+(?:\.\d+)?)\s*%$/.exec(width);
  return match ? Number(match[1]) : MAX_WIDTH_PCT;
}

export function ImageElement(props: ElementProps) {
  const { element } = props as PlateElementProps;
  const node = element as ImageNode & { type: string };
  const url = node.url;
  const alt = node.alt ?? "";
  const caption = node.caption ?? "";

  const editor = useEditorRef();
  const path = useNodePath(element);
  const readOnly = useReadOnly();

  const widthPct = parseWidthPercent(node.width);
  const [draftWidthPct, setDraftWidthPct] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const commitWidth = useCallback(
    (next: number) => {
      const clamped = Math.max(MIN_WIDTH_PCT, Math.min(MAX_WIDTH_PCT, next));
      editor.tf.setNodes({ width: `${clamped.toFixed(0)}%` }, { at: path });
    },
    [editor, path]
  );

  const handleResizeStart = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const parent = wrapper.parentElement;
      if (!parent) return;

      const parentWidth = parent.getBoundingClientRect().width;
      const startX = e.clientX;
      const startPct = parseWidthPercent(node.width);
      isDraggingRef.current = true;

      const onMove = (ev: MouseEvent) => {
        const deltaPx = ev.clientX - startX;
        const deltaPct = (deltaPx / parentWidth) * 100;
        const next = Math.max(
          MIN_WIDTH_PCT,
          Math.min(MAX_WIDTH_PCT, startPct + deltaPct)
        );
        setDraftWidthPct(next);
      };

      const onUp = (ev: MouseEvent) => {
        const deltaPx = ev.clientX - startX;
        const deltaPct = (deltaPx / parentWidth) * 100;
        commitWidth(startPct + deltaPct);
        setDraftWidthPct(null);
        isDraggingRef.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [commitWidth, node.width]
  );

  // Cleanup if component unmounts mid-drag.
  useEffect(() => {
    return () => {
      isDraggingRef.current = false;
    };
  }, []);

  const handleCaptionChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      editor.tf.setNodes({ caption: e.target.value }, { at: path });
    },
    [editor, path]
  );

  const effectivePct = draftWidthPct ?? widthPct;
  const wrapperStyle: CSSProperties = { width: `${effectivePct.toFixed(0)}%` };

  return (
    <PlateElement
      {...props}
      className={cn("my-6", props.className)}
      attributes={
        {
          ...(props.attributes as Record<string, unknown>),
          contentEditable: false,
        } as never
      }
    >
      <figure className="group/img flex flex-col items-center">
        <div ref={wrapperRef} className="relative" style={wrapperStyle}>
          {url ? (
            <img
              src={url}
              alt={alt}
              loading="lazy"
              className="w-full rounded-md border border-border"
              draggable={false}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
              (image)
            </div>
          )}
          {!readOnly ? (
            <button
              type="button"
              aria-label="Resize image"
              onMouseDown={handleResizeStart}
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2",
                "h-12 w-1.5 cursor-ew-resize rounded-full bg-primary/40",
                "opacity-0 transition-opacity hover:opacity-100 group-hover/img:opacity-100",
                "ring-1 ring-primary/20 hover:bg-primary/70"
              )}
              tabIndex={-1}
            />
          ) : null}
        </div>

        {(caption || !readOnly) ? (
          readOnly ? (
            caption ? (
              <figcaption className="mt-2 max-w-[80%] text-center text-xs text-muted-foreground">
                {caption}
              </figcaption>
            ) : null
          ) : (
            <input
              type="text"
              value={caption}
              onChange={handleCaptionChange}
              placeholder="Caption (optional)"
              aria-label="Image caption"
              className={cn(
                "mt-2 w-3/4 max-w-prose bg-transparent text-center text-xs",
                "text-muted-foreground placeholder:text-muted-foreground/60",
                "focus:outline-none focus:ring-1 focus:ring-ring focus:rounded-sm"
              )}
            />
          )
        ) : null}
      </figure>
      {props.children}
    </PlateElement>
  );
}
