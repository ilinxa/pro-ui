import { cn } from "@/lib/utils";
import type { HeroStatsProps } from "../types";

/**
 * 3-stat row pattern from the kasder NewsHero — icon-circle + bold value
 * + small label, repeated horizontally. Designed to live inside the hero's
 * `children` slot; inherits white text from the gradient background.
 */
export function HeroStats({ stats, className }: HeroStatsProps) {
  return (
    <div className={cn("flex flex-wrap justify-center gap-8", className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="flex items-center gap-3 text-white/90">
            {Icon ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <div className="text-left">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
