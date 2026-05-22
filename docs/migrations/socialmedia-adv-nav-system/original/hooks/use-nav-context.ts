"use client";

import { usePathname } from "next/navigation";
import { useShallow } from "zustand/react/shallow";

import { useMembershipStore } from "@/stores/membership-store";
import type { NavContext } from "@/types/navigation";

const BCONSOLE_REGEX = /^\/bconsole\/([^/]+)/;

/** Static route segments under /cconsole/ that belong to the platform CMS. */
const CCONSOLE_PLATFORM_SEGMENTS = new Set(["sites", "templates", "media", "api-keys", "businesses"]);

/**
 * Derive the current navigation context from the URL pathname.
 *
 * - `/cconsole/...` → CMS context (platform or business mode)
 * - `/bconsole/[slug]/...` → business context (with membership lookup)
 * - `/pconsole/...` → platform context (with membership lookup)
 * - `/gconsole/...` → governance context
 * - Everything else → personal context
 */
export function useNavContext(): NavContext {
  const pathname = usePathname();
  const memberships = useMembershipStore(useShallow((s) => s.memberships));

  // CMS Console: /cconsole/... (platform or business)
  if (pathname.startsWith("/cconsole")) {
    const segments = pathname.split("/").filter(Boolean); // ["cconsole", ...]
    const secondSegment = segments[1];

    // Platform CMS: /cconsole, /cconsole/sites, /cconsole/templates, etc.
    if (!secondSegment || CCONSOLE_PLATFORM_SEGMENTS.has(secondSegment)) {
      const platMembership = memberships.find(
        (m) => m.account_type === "platform" && m.status === "active",
      );
      return { type: "cms", mode: "platform", accountId: platMembership?.account_id ?? "" };
    }

    // Business CMS: /cconsole/[slug]/...
    const slug = secondSegment;
    const bizMembership = memberships.find(
      (m) => m.account_type === "business" && m.account_slug === slug && m.status === "active",
    );
    return {
      type: "cms",
      mode: "business",
      slug,
      accountId: bizMembership?.account_id ?? "",
      accountName: bizMembership?.account_name ?? slug,
    };
  }

  // Business Console: /bconsole/[slug]/...
  const businessMatch = pathname.match(BCONSOLE_REGEX);
  if (businessMatch) {
    const slug = businessMatch[1];
    const membership = memberships.find(
      (m) => m.account_type === "business" && m.account_slug === slug && m.status === "active",
    );
    return {
      type: "business",
      slug,
      accountId: membership?.account_id ?? "",
      accountName: membership?.account_name ?? slug,
    };
  }

  if (pathname.startsWith("/gconsole")) {
    return { type: "governance" };
  }

  if (pathname.startsWith("/pconsole")) {
    const membership = memberships.find(
      (m) => m.account_type === "platform" && m.status === "active",
    );
    return {
      type: "platform",
      accountId: membership?.account_id ?? "",
    };
  }

  return { type: "personal" };
}
