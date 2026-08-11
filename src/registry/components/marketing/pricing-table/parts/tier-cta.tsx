import { isValidElement } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CtaSpec, CtaVariant } from "../types";

interface TierCtaProps {
  cta: ReactNode | CtaSpec;
  tierName: string;
  onTierCtaClick: (tierName: string) => void;
  className?: string;
}

function isCtaSpec(cta: ReactNode | CtaSpec): cta is CtaSpec {
  if (cta === null || typeof cta !== "object") return false;
  if (isValidElement(cta)) return false;
  const candidate = cta as Partial<CtaSpec>;
  if (typeof candidate.label !== "string") return false;
  return candidate.href !== undefined || candidate.onClick !== undefined;
}

function buttonVariantFor(variant: CtaVariant | undefined) {
  return variant === "outline" ? "outline" : "default";
}

export function TierCta({
  cta,
  tierName,
  onTierCtaClick,
  className,
}: TierCtaProps) {
  if (!isCtaSpec(cta)) {
    return <>{cta}</>;
  }

  const { label, href, onClick, variant, ariaLabel } = cta;
  const buttonVariant = buttonVariantFor(variant);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    onTierCtaClick(tierName);
    onClick?.();
    if (!href) event.preventDefault();
  };

  if (href) {
    // F-cross-13: no `<Button asChild>` — style the anchor with buttonVariants directly.
    return (
      <a
        href={href}
        onClick={handleClick}
        aria-label={ariaLabel}
        className={cn(buttonVariants({ variant: buttonVariant }), "w-full", className)}
      >
        {label}
      </a>
    );
  }

  if (onClick) {
    return (
      <Button
        type="button"
        variant={buttonVariant}
        className={cn("w-full", className)}
        onClick={handleClick}
        aria-label={ariaLabel}
      >
        {label}
      </Button>
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[pricing-table] tier "${tierName}" CTA spec has neither href nor onClick — rendering disabled button.`,
    );
  }

  return (
    <Button
      type="button"
      variant={buttonVariant}
      className={cn("w-full", className)}
      disabled
      aria-label={ariaLabel}
    >
      {label}
    </Button>
  );
}
