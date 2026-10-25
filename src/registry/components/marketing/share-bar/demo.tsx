"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { ShareBar } from "./share-bar";
import {
  SHARE_BAR_DUMMY_COMPACT,
  SHARE_BAR_DUMMY_DEFAULT,
  SHARE_BAR_DUMMY_FULL,
  SHARE_BAR_DUMMY_NATIVE,
  SHARE_BAR_DUMMY_TITLE,
  SHARE_BAR_DUMMY_TR,
  SHARE_BAR_DUMMY_URL,
} from "./dummy-data";
import type { ShareTarget } from "./types";

export default function ShareBarDemo() {
  const [lastShared, setLastShared] = useState<string | null>(null);
  const [copyEvents, setCopyEvents] = useState(0);
  const [nativeLog, setNativeLog] = useState<string | null>(null);
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
      <SwipeTabsList>
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="full">Full + analytics</TabsTrigger>
        <TabsTrigger value="custom">Custom target</TabsTrigger>
        <TabsTrigger value="compact">Compact</TabsTrigger>
        <TabsTrigger value="i18n">Localized (TR)</TabsTrigger>
        <TabsTrigger value="native">Native share</TabsTrigger>
        <TabsTrigger value="rtl">RTL</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="default" className="mt-6 max-w-md">
        <ShareBar
          targets={SHARE_BAR_DUMMY_DEFAULT}
          url={SHARE_BAR_DUMMY_URL}
          title={SHARE_BAR_DUMMY_TITLE}
          headingAs="h4"
          divider
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Click <strong>Copy link</strong> — icon flips to a check for 2s.
        </p>
      </TabsContent>

      <TabsContent value="full" className="mt-6 max-w-2xl">
        <ShareBar
          targets={SHARE_BAR_DUMMY_FULL}
          url={SHARE_BAR_DUMMY_URL}
          title={SHARE_BAR_DUMMY_TITLE}
          via="ilinxa_news"
          hashtags={["ilinxa", "shadcn", "react"]}
          headingAs="h4"
          divider
          onShare={(target) => setLastShared(target)}
          onCopySuccess={() => setCopyEvents((n) => n + 1)}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          {lastShared
            ? <>Last shared: <code>{lastShared}</code></>
            : <>Click any button to log via <code>onShare</code>.</>}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Copy successes (analytics): <code>{copyEvents}</code> — fires only on
          successful clipboard write, distinct from <code>onShare</code> which
          fires on every share-target click.
        </p>
      </TabsContent>

      <TabsContent value="custom" className="mt-6 max-w-md">
        <ShareBar
          targets={customTargets}
          url={SHARE_BAR_DUMMY_URL}
          title={SHARE_BAR_DUMMY_TITLE}
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
        <ShareBar
          targets={SHARE_BAR_DUMMY_COMPACT}
          url={SHARE_BAR_DUMMY_URL}
          title={SHARE_BAR_DUMMY_TITLE}
        />
      </TabsContent>

      <TabsContent value="i18n" className="mt-6 max-w-md">
        <ShareBar
          targets={SHARE_BAR_DUMMY_TR}
          url={SHARE_BAR_DUMMY_URL}
          title="ShareBar — pro-ui paylaşım çubuğu"
          headingAs="h4"
          divider
          labels={{
            heading: "Paylaş",
            copySuccess: "Bağlantı kopyalandı",
            copyError: "Bağlantı kopyalanamadı",
            targets: {
              twitter: "X'te paylaş",
              facebook: "Facebook'ta paylaş",
              copy: "Bağlantıyı kopyala",
            },
          }}
        />
      </TabsContent>

      <TabsContent value="native" className="mt-6 max-w-md space-y-3">
        <ShareBar
          targets={SHARE_BAR_DUMMY_NATIVE}
          url={SHARE_BAR_DUMMY_URL}
          title="ShareBar — pro-ui paylaşım çubuğu"
          headingAs="h4"
          divider
          labels={{
            heading: "Paylaş",
            targets: { native: "Paylaş", twitter: "X'te paylaş", copy: "Bağlantıyı kopyala" },
          }}
          onShare={(kind) => setNativeLog(`shared via ${kind}`)}
          onShareError={(err) => setNativeLog(`error: ${String((err as Error)?.message ?? err)}`)}
        />
        <p className="text-xs text-muted-foreground">
          The native button renders only where <code>navigator.share</code> exists (typically phones and some
          desktop browsers); elsewhere the other targets remain. {nativeLog ? <code>{nativeLog}</code> : null}
        </p>
      </TabsContent>

      <TabsContent value="rtl" className="mt-6 max-w-md">
        <div dir="rtl" lang="ar">
          <ShareBar
            targets={SHARE_BAR_DUMMY_NATIVE}
            url={SHARE_BAR_DUMMY_URL}
            title="شريط المشاركة"
            headingAs="h4"
            divider
            labels={{
              heading: "مشاركة",
              targets: { native: "مشاركة", twitter: "مشاركة على إكس", copy: "نسخ الرابط" },
              copySuccess: "تم نسخ الرابط",
            }}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
