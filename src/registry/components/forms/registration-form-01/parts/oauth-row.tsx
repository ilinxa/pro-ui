"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { getOAuthProviderLabel } from "../lib/oauth-providers";
import type { OAuthProvider, RegistrationLabels } from "../types";

export interface OauthRowProps {
  providers: ReadonlyArray<OAuthProvider>;
  icons?: Partial<Record<OAuthProvider, ReactNode>>;
  labels: Pick<RegistrationLabels, "orContinueWith" | "oauthLabelTemplate">;
  disabled?: boolean;
  onClick: (provider: OAuthProvider) => void;
}

/**
 * OAuth button row + "or" divider. Stacks vertically on mobile,
 * flex-row on `sm:` breakpoint and up. Each button renders an optional
 * consumer-supplied icon (`oauthIcons` slot) followed by the
 * `{provider}`-interpolated template label.
 *
 * Returns `null` when `providers` is empty so the caller doesn't need
 * to guard the mount.
 */
export function OauthRow({
  providers,
  icons,
  labels,
  disabled,
  onClick,
}: OauthRowProps) {
  if (providers.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
        {providers.map((provider) => (
          <Button
            key={provider}
            type="button"
            variant="outline"
            className="w-full sm:flex-1"
            disabled={disabled}
            onClick={() => onClick(provider)}
          >
            <span className="inline-flex items-center gap-2">
              {icons?.[provider] ?? null}
              {getOAuthProviderLabel(provider, labels.oauthLabelTemplate)}
            </span>
          </Button>
        ))}
      </div>
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={labels.orContinueWith}
        className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground"
      >
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span aria-hidden="true">{labels.orContinueWith}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
