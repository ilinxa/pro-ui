"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Globe, Newspaper, Plus, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { BusinessCreationRequestButton } from "@/features/business/components/BusinessCreationRequestButton";
import { CreateBusinessDialog } from "@/features/business/components/CreateBusinessDialog";
import { useBusinessMemberships, usePlatformMembership, useMembershipStore } from "@/stores/membership-store";
import { useUser } from "@/stores/auth-store";
import { fetchMyMembershipsApi } from "@/features/auth/api/membership-api";
import { useNavContext } from "@/hooks/use-nav-context";
import { cn } from "@/lib/utils";

interface SwitcherItem {
  key: string;
  label: string;
  icon: React.ElementType;
  href: string;
  isActive: boolean;
}

export function AccountSwitcher() {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();
  const user = useUser();
  const context = useNavContext();
  const businessMemberships = useBusinessMemberships();
  const platformMembership = usePlatformMembership();
  const setMemberships = useMembershipStore((s) => s.setMemberships);

  // Build CMS active item when inside cconsole
  const cmsActiveItem: SwitcherItem | null =
    context.type === "cms"
      ? {
          key: context.mode === "platform" ? "cms-platform" : `cms-biz-${context.slug}`,
          label:
            context.mode === "platform"
              ? "Platform CMS"
              : `${context.accountName} CMS`,
          icon: Newspaper,
          href:
            context.mode === "platform"
              ? "/cconsole/sites"
              : `/cconsole/${context.slug}/sites`,
          isActive: true,
        }
      : null;

  const items: SwitcherItem[] = [
    // CMS active context (shown first when inside cconsole)
    ...(cmsActiveItem ? [cmsActiveItem] : []),
    {
      key: "personal",
      label: "Personal",
      icon: User,
      href: "/home",
      isActive: context.type === "personal",
    },
    ...businessMemberships.map((m) => ({
      key: `biz-${m.account_slug}`,
      label: m.account_name,
      icon: Building2,
      href: `/bconsole/${m.account_slug}/dashboard`,
      isActive: context.type === "business" && context.slug === m.account_slug,
    })),
    ...(platformMembership
      ? [
          {
            key: "platform",
            label: "Platform",
            icon: Globe,
            href: "/pconsole/dashboard",
            isActive: context.type === "platform",
          },
        ]
      : []),
  ];

  const activeItem = items.find((i) => i.isActive) ?? items[0];

  function handleSelect(item: SwitcherItem) {
    setOpen(false);
    if (!item.isActive) {
      router.push(item.href);
    }
  }

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Switch account context"
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2 truncate">
            <activeItem.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{activeItem.label}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => handleSelect(item)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  item.isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">{item.label}</span>
                {item.isActive && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}

          {user && (
            user.can_create_business ? (
              <>
                <Separator className="my-1" />
                <button
                  onClick={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">Create Business</span>
                </button>
              </>
            ) : (
              <BusinessCreationRequestButton />
            )
          )}
        </div>
      </PopoverContent>
    </Popover>

    <CreateBusinessDialog
      open={createOpen}
      onOpenChange={setCreateOpen}
      onSuccess={async (slug) => {
        try {
          const memberships = await fetchMyMembershipsApi();
          setMemberships(memberships);
        } catch {
          // Memberships will refresh on next navigation
        }
        router.push(`/bconsole/${slug}/dashboard`);
      }}
    />
    </>
  );
}
