"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShareBar01 } from "./share-bar-01";
import {
  SHARE_BAR_01_DUMMY_COMPACT,
  SHARE_BAR_01_DUMMY_DEFAULT,
  SHARE_BAR_01_DUMMY_FULL,
  SHARE_BAR_01_DUMMY_TITLE,
  SHARE_BAR_01_DUMMY_TR,
  SHARE_BAR_01_DUMMY_URL,
} from "./dummy-data";
import type { ShareTarget } from "./types";

export default function ShareBar01Demo() {
  const [lastShared, setLastShared] = useState<string | null>(null);
  const [internalDialog, setInternalDialog] = useState<string | null>(null);

  const customTargets: ReadonlyArray<ShareTarget> = [
    { kind: "twitter" },
    { kind: "linkedin" },
    {
      kind: "custom",
      id: "send-to-teammate",
      icon: Send,
      ariaLabel: "Send to teammate",
      onClick: () => setInternalDialog("Internal share dialog opened (demo)"),
    },
    { kind: "copy" },
  ];

  return (
    <Tabs defaultValue="default" className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="full">Full + analytics</TabsTrigger>
        <TabsTrigger value="custom">Custom target</TabsTrigger>
        <TabsTrigger value="compact">Compact</TabsTrigger>
        <TabsTrigger value="i18n">Localized (TR)</TabsTrigger>
      </TabsList>

      <TabsContent value="default" className="mt-6 max-w-md">
        <ShareBar01
          targets={SHARE_BAR_01_DUMMY_DEFAULT}
          url={SHARE_BAR_01_DUMMY_URL}
          title={SHARE_BAR_01_DUMMY_TITLE}
          headingAs="h4"
          divider
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Click <strong>Copy link</strong> — icon flips to a check for 2s.
        </p>
      </TabsContent>

      <TabsContent value="full" className="mt-6 max-w-2xl">
        <ShareBar01
          targets={SHARE_BAR_01_DUMMY_FULL}
          url={SHARE_BAR_01_DUMMY_URL}
          title={SHARE_BAR_01_DUMMY_TITLE}
          via="ilinxa_news"
          hashtags={["ilinxa", "shadcn", "react"]}
          headingAs="h4"
          divider
          onShare={(target) => setLastShared(target)}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          {lastShared
            ? <>Last shared: <code>{lastShared}</code></>
            : <>Click any button to log via <code>onShare</code>.</>}
        </p>
      </TabsContent>

      <TabsContent value="custom" className="mt-6 max-w-md">
        <ShareBar01
          targets={customTargets}
          url={SHARE_BAR_01_DUMMY_URL}
          title={SHARE_BAR_01_DUMMY_TITLE}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Custom target with <code>onClick</code>:{" "}
          {internalDialog ? (
            <span className="text-primary">{internalDialog}</span>
          ) : (
            <span>click the paper-plane icon.</span>
          )}
        </p>
      </TabsContent>

      <TabsContent value="compact" className="mt-6 max-w-md">
        <ShareBar01
          targets={SHARE_BAR_01_DUMMY_COMPACT}
          url={SHARE_BAR_01_DUMMY_URL}
          title={SHARE_BAR_01_DUMMY_TITLE}
        />
      </TabsContent>

      <TabsContent value="i18n" className="mt-6 max-w-md">
        <ShareBar01
          targets={SHARE_BAR_01_DUMMY_TR}
          url={SHARE_BAR_01_DUMMY_URL}
          title="ShareBar01 — pro-ui paylaşım çubuğu"
          headingAs="h4"
          divider
          labels={{
            heading: "Paylaş",
            copyAria: "Bağlantıyı kopyala",
            copySuccess: "Bağlantı kopyalandı",
            copyError: "Bağlantı kopyalanamadı",
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
