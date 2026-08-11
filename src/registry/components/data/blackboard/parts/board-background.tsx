import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BoardBackground as BoardBackgroundValue } from "../types";

export interface BoardBackgroundProps {
  background: BoardBackgroundValue;
  children?: ReactNode;
  className?: string;
}

/**
 * Renders the board surface — a solid color or a custom image with a darkening
 * overlay (so chalk stays legible) — plus a subtle chalk-dust vignette. Pure +
 * context-free. The vignette is pure CSS (no image asset) to keep it light.
 */
export function BoardBackground({ background, children, className }: BoardBackgroundProps) {
  const isImage = background.kind === "image";
  const overlay = isImage ? background.overlay ?? 0.45 : 0;

  const surfaceStyle: CSSProperties = isImage
    ? { backgroundImage: `url(${background.url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: background.value };

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={surfaceStyle}>
      {/* darkening scrim for image backgrounds */}
      {isImage ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-black"
          style={{ opacity: overlay }}
        />
      ) : null}
      {/* chalk-dust vignette — pure CSS, very subtle */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.05), transparent 60%)," +
            "radial-gradient(100% 100% at 50% 120%, rgba(0,0,0,0.28), transparent 55%)",
        }}
      />
      {children}
    </div>
  );
}
