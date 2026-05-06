import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import "./engagement-heart-burst.css";

export interface EngagementHeartBurstProps {
  /** Increment to trigger the burst animation. 0 = never burst (initial). */
  trigger: number;
  /** Override classes for the burst container (typically positions the overlay). */
  className?: string;
}

/**
 * RSC-compatible CSS-keyframe heart burst. No "use client" — purely declarative.
 * The `key={trigger}` pattern remounts the inner div each time the trigger
 * counter changes, restarting the keyframe from the beginning.
 *
 * Host typical wiring:
 *
 *   const [burstKey, setBurstKey] = useState(0);
 *   <MediaCarousel01
 *     onDoubleTap={() => setBurstKey((k) => k + 1)}
 *   />
 *   <EngagementHeartBurst
 *     trigger={burstKey}
 *     className="absolute inset-0 flex items-center justify-center pointer-events-none"
 *   />
 */
export function EngagementHeartBurst({
  trigger,
  className,
}: EngagementHeartBurstProps) {
  if (trigger === 0) return null;

  return (
    <div
      key={trigger}
      aria-hidden="true"
      className={cn(
        "pointer-events-none flex items-center justify-center",
        className,
      )}
    >
      <Heart className="engagement-heart-burst-icon h-24 w-24 fill-current text-destructive" />
    </div>
  );
}
