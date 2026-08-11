import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import type { ToneClasses } from "./tone-resolver";

interface AuthorAvatarProps {
  imageSrc?: string;
  imageAlt: string;
  fallbackIcon: ComponentType<{ className?: string }>;
  toneClasses: ToneClasses;
}

export function AuthorAvatar({
  imageSrc,
  imageAlt,
  fallbackIcon: Icon,
  toneClasses,
}: AuthorAvatarProps) {
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={imageAlt}
        loading="lazy"
        className="w-16 h-16 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center shrink-0",
        toneClasses.avatarBg
      )}
      aria-hidden="true"
    >
      <Icon className={cn("w-8 h-8", toneClasses.avatarIcon)} />
    </div>
  );
}
