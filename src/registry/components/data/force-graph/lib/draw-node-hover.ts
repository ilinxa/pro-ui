import type { ResolvedTheme } from "../types";

/**
 * Sigma's stock `drawDiscNodeHover` hardcodes a white fill and black
 * shadow for the hover label card, which is unreadable on a dark
 * canvas. This factory builds a structurally-identical hover renderer
 * that uses theme-derived colors instead.
 *
 * Type parameters are loose `unknown` to avoid pulling Sigma's internal
 * `Settings` / `NodeDisplayData` types into our public surface — the
 * real shapes are enforced at the call site by Sigma at runtime.
 */
export function makeDrawNodeHover(theme: ResolvedTheme) {
  return function drawNodeHover(
    context: CanvasRenderingContext2D,
    data: { x: number; y: number; size: number; label: string | null },
    settings: { labelSize: number; labelFont: string; labelWeight: string },
  ): void {
    const { labelSize, labelFont, labelWeight } = settings;
    context.font = `${labelWeight} ${labelSize}px ${labelFont}`;

    context.fillStyle = theme.background;
    context.strokeStyle = theme.labelColor;
    context.lineWidth = 1;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 2;
    context.shadowBlur = 12;
    context.shadowColor = "rgba(0, 0, 0, 0.45)";

    const PADDING = 4;
    if (typeof data.label === "string" && data.label.length > 0) {
      const textWidth = context.measureText(data.label).width;
      const boxWidth = Math.round(textWidth + PADDING * 2 + 4);
      const boxHeight = Math.round(labelSize + PADDING * 2);
      const radius = Math.max(data.size, labelSize / 2) + PADDING;
      const angleRadian = Math.asin(boxHeight / 2 / radius);
      const xDeltaCoord = Math.sqrt(
        Math.abs(radius ** 2 - (boxHeight / 2) ** 2),
      );

      context.beginPath();
      context.moveTo(data.x + xDeltaCoord, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
      context.lineTo(data.x + xDeltaCoord, data.y - boxHeight / 2);
      context.arc(data.x, data.y, radius, angleRadian, -angleRadian);
      context.closePath();
      context.fill();
      // Shadow only on the fill — the stroke shouldn't double up.
      context.shadowBlur = 0;
      context.shadowOffsetY = 0;
      context.stroke();
    } else {
      context.beginPath();
      context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
      context.closePath();
      context.fill();
      context.shadowBlur = 0;
      context.shadowOffsetY = 0;
    }

    // Draw the label text.
    if (typeof data.label === "string" && data.label.length > 0) {
      context.fillStyle = theme.labelColor;
      context.fillText(
        data.label,
        data.x + Math.max(data.size, labelSize / 2) + PADDING + 2,
        data.y + labelSize / 3,
      );
    }
  };
}
