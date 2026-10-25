"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { EmptyState } from "./empty-state";
import { EMPTY_STATE_DUMMY_COPY, EMPTY_STATE_DUMMY_ILLUSTRATION } from "./dummy-data";
import type { EmptyStateVariant } from "./types";

const ALL_VARIANTS: EmptyStateVariant[] = [
  "default",
  "search",
  "error",
  "offline",
  "permission",
  "first-use",
];

/**
 * Stand-in for a host router's `Link` (next/link, react-router's Link ...): renders an anchor,
 * intercepts the click and "navigates" by logging. Kept local so the demo stays portable.
 */
function makeRouterLink(log: (message: string) => void) {
  return function RouterLink({
    href,
    onClick,
    className,
    children,
  }: {
    href: string;
    onClick?: () => void;
    className?: string;
    children?: ReactNode;
  }) {
    return (
      <a
        href={href}
        className={className}
        data-router-link=""
        onClick={(event) => {
          event.preventDefault();
          onClick?.();
          log(`router.push("${href}")`);
        }}
      >
        {children}
      </a>
    );
  };
}

export default function EmptyStateDemo() {
  const [lastClicked, setLastClicked] = useState<string | null>(null);
  const [navLog, setNavLog] = useState<string | null>(null);
  const [RouterLink] = useState(() => makeRouterLink(setNavLog));

  return (
    <Tabs defaultValue="variants" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="variants">Variants</TabsTrigger>
        <TabsTrigger value="sizes">Sizes</TabsTrigger>
        <TabsTrigger value="read-only">Read-only</TabsTrigger>
        <TabsTrigger value="illustration">Illustration</TabsTrigger>
        <TabsTrigger value="frames">Frames</TabsTrigger>
        <TabsTrigger value="router-link">Router link</TabsTrigger>
        <TabsTrigger value="rtl">RTL</TabsTrigger>
      </SwipeTabsList>

      {/* All 6 variants at md size — each variant's default icon + tone + copy. */}
      <TabsContent value="variants" className="mt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_VARIANTS.map((variant) => {
            const copy = EMPTY_STATE_DUMMY_COPY[variant];
            return (
              <EmptyState
                key={variant}
                variant={variant}
                size="md"
                frame="dashed"
                title={copy.title}
                description={copy.description}
                action={{
                  label: "Primary",
                  onClick: () => setLastClicked(`${variant} → Primary`),
                }}
              />
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {lastClicked ? (
            <>
              Last action: <code>{lastClicked}</code>
            </>
          ) : (
            "Click any Primary button to log the action."
          )}
        </p>
      </TabsContent>

      {/* sm / md / lg on the same variant, to compare type scale + icon scale + padding. */}
      <TabsContent value="sizes" className="mt-6">
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          <EmptyState
            size="sm"
            variant="search"
            title={EMPTY_STATE_DUMMY_COPY.search.title}
            description={EMPTY_STATE_DUMMY_COPY.search.description}
            action={{ label: "Clear filters" }}
          />
          <EmptyState
            size="md"
            variant="search"
            title={EMPTY_STATE_DUMMY_COPY.search.title}
            description={EMPTY_STATE_DUMMY_COPY.search.description}
            action={{ label: "Clear filters" }}
          />
          <EmptyState
            size="lg"
            variant="search"
            title={EMPTY_STATE_DUMMY_COPY.search.title}
            description={EMPTY_STATE_DUMMY_COPY.search.description}
            action={{ label: "Clear filters" }}
          />
        </div>
      </TabsContent>

      {/* No action/secondaryAction handlers at all — I2 proof: zero <button>/<a> in this tab's DOM. */}
      <TabsContent value="read-only" className="mt-6 max-w-md mx-auto">
        <EmptyState
          size="md"
          variant="permission"
          title={EMPTY_STATE_DUMMY_COPY.permission.title}
          description={EMPTY_STATE_DUMMY_COPY.permission.description}
          hint="Contact your workspace admin for access."
        />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          No <code>action</code> / <code>secondaryAction</code> passed — no
          buttons render (capability-gating, I2).
        </p>
      </TabsContent>

      {/* media slot (illustration wins over icon) + first-use's spinning dashed ring. */}
      <TabsContent value="illustration" className="mt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EmptyState
            size="md"
            variant="default"
            media={EMPTY_STATE_DUMMY_ILLUSTRATION}
            title="No charts yet"
            description="Illustrations replace the icon tile entirely (I3)."
            action={{ label: "Create chart" }}
          />
          <EmptyState
            size="md"
            variant="first-use"
            title={EMPTY_STATE_DUMMY_COPY["first-use"].title}
            description={EMPTY_STATE_DUMMY_COPY["first-use"].description}
            action={{ label: "Browse files" }}
            secondaryAction={{ label: "Learn more" }}
          />
        </div>
      </TabsContent>

      {/* frame="dashed" (dropzone-style) vs frame="card" (raised bg-card). */}
      <TabsContent value="frames" className="mt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EmptyState
            size="md"
            frame="dashed"
            variant="first-use"
            title="Drop files here"
            description="Or browse from your device."
            action={{ label: "Browse" }}
          />
          <EmptyState
            size="md"
            frame="card"
            variant="default"
            title="No integrations connected"
            description="Connect a service to start syncing data."
            action={{ label: "Connect" }}
            secondaryAction={{ label: "View docs", href: "#" }}
          />
        </div>
      </TabsContent>

      {/* linkComponent: href actions go through the host router's Link; disabled stays a Button. */}
      <TabsContent value="router-link" className="mt-6 max-w-md mx-auto">
        <EmptyState
          size="md"
          variant="first-use"
          frame="dashed"
          title="No posts yet"
          description="The actions below render through a local RouterLink stand-in."
          linkComponent={RouterLink}
          action={{ label: "Write a post", href: "/compose" }}
          secondaryAction={{ label: "Browse topics", href: "/topics", disabled: true }}
        />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {navLog ? (
            <>
              Navigated: <code>{navLog}</code>
            </>
          ) : (
            "Click Write a post: the router link logs instead of navigating. The disabled action is a plain disabled button."
          )}
        </p>
      </TabsContent>

      {/* RTL: logical utilities only, so the layout mirrors with no extra work. */}
      <TabsContent value="rtl" className="mt-6">
        <div dir="rtl" lang="ar" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EmptyState
            size="md"
            variant="search"
            frame="dashed"
            title="لا توجد نتائج"
            description="جرّب كلمة بحث مختلفة أو امسح عوامل التصفية."
            action={{ label: "مسح التصفية" }}
            secondaryAction={{ label: "عودة", href: "#" }}
          />
          <EmptyState
            size="md"
            variant="permission"
            frame="card"
            title="لا تملك صلاحية الوصول"
            description="تواصل مع مسؤول مساحة العمل."
            hint="رمز الخطأ 403"
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
