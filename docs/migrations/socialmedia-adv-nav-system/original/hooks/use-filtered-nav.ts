"use client";

import { useShallow } from "zustand/react/shallow";

import { useMembershipStore } from "@/stores/membership-store";
import { NAV_CONFIG } from "@/lib/navigation-config";
import { useNavContext } from "@/hooks/use-nav-context";
import type { NavSection } from "@/types/navigation";

/**
 * Return nav sections filtered by the current context's permissions.
 *
 * - Personal context: all items (no permission gating)
 * - Business/Platform: items filtered by the user's membership permissions
 * - CMS: items filtered by the corresponding membership (platform or business)
 * - Empty sections are removed
 */
export function useFilteredNav(): NavSection[] {
  const context = useNavContext();
  const memberships = useMembershipStore(useShallow((s) => s.memberships));

  // Derive config key — CMS context maps to cms_platform or cms_business
  const configKey: keyof typeof NAV_CONFIG =
    context.type === "cms" ? `cms_${context.mode}` : context.type;
  const sections = NAV_CONFIG[configKey];

  if (context.type === "personal") {
    return sections;
  }

  if (context.type === "governance") {
    // Filter governance nav items by the user's platform membership permissions.
    // The governance user's authority comes from global-scoped platform permissions.
    const platformMembership = memberships.find(
      (m) => m.account_type === "platform" && m.status === "active",
    );

    if (!platformMembership) {
      // No platform membership — show only non-permissioned items (dashboard)
      return sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => !item.permission),
        }))
        .filter((section) => section.items.length > 0);
    }

    const permCodes = new Set(platformMembership.permissions.map((p) => p.code));

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => !item.permission || permCodes.has(item.permission),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }

  // CMS context: resolve the correct membership based on mode
  // Business/Platform context: resolve membership directly
  let membership;
  if (context.type === "cms") {
    membership =
      context.mode === "business"
        ? memberships.find(
            (m) =>
              m.account_type === "business" &&
              m.account_slug === context.slug &&
              m.status === "active",
          )
        : memberships.find((m) => m.account_type === "platform" && m.status === "active");
  } else {
    membership =
      context.type === "business"
        ? memberships.find(
            (m) =>
              m.account_type === "business" &&
              m.account_slug === context.slug &&
              m.status === "active",
          )
        : memberships.find((m) => m.account_type === "platform" && m.status === "active");
  }

  if (!membership) {
    return [];
  }

  const permCodes = new Set(membership.permissions.map((p) => p.code));

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.ownerOnly && !membership.is_owner) return false;
        if (item.minMembers && membership.account_max_members < item.minMembers) return false;
        if (item.permission && !permCodes.has(item.permission)) return false;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}
