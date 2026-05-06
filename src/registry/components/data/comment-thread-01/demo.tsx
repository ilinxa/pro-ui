"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommentThread01 } from "./comment-thread-01";
import {
  DUMMY_FLAT_COMMENTS,
  DUMMY_LARGE_THREAD,
  DUMMY_NESTED_DEPTH_2,
  DUMMY_NESTED_DEPTH_3,
  DUMMY_VIEWER,
  createDummySubscribe,
  generateOlderPage,
} from "./dummy-data";

function ConsoleSink({ tag, payload }: { tag: string; payload: unknown }) {
  // Demo-only no-op log helper.
  if (typeof console !== "undefined") {
    console.log(`[demo:${tag}]`, payload);
  }
}

function FlatTab() {
  return (
    <CommentThread01
      comments={DUMMY_FLAT_COMMENTS}
      currentUser={DUMMY_VIEWER}
      onAddComment={async (content) => {
        ConsoleSink({ tag: "add", payload: content });
      }}
      onLikeComment={(id, liked) =>
        ConsoleSink({ tag: "like", payload: { id, liked } })
      }
      onDeleteComment={(id) =>
        ConsoleSink({ tag: "delete", payload: id })
      }
      onReportComment={(id) =>
        ConsoleSink({ tag: "report", payload: id })
      }
    />
  );
}

function NestedDepth2Tab() {
  return (
    <CommentThread01
      comments={DUMMY_NESTED_DEPTH_2}
      currentUser={DUMMY_VIEWER}
      maxDepth={2}
      onAddComment={async (content, parentId) => {
        ConsoleSink({ tag: "reply", payload: { content, parentId } });
      }}
      onLikeComment={(id, liked) =>
        ConsoleSink({ tag: "like", payload: { id, liked } })
      }
    />
  );
}

function NestedDepth3Tab() {
  return (
    <CommentThread01
      comments={DUMMY_NESTED_DEPTH_3}
      currentUser={DUMMY_VIEWER}
      maxDepth={2}
      onAddComment={async (content, parentId) => {
        ConsoleSink({ tag: "reply", payload: { content, parentId } });
      }}
    />
  );
}

function PaginatedTab() {
  return (
    <CommentThread01
      comments={DUMMY_LARGE_THREAD}
      currentUser={DUMMY_VIEWER}
      pageSize={10}
      onAddComment={async (content) => {
        ConsoleSink({ tag: "add", payload: content });
      }}
      onLoadMore={async (page) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return generateOlderPage(page);
      }}
    />
  );
}

function RealtimeTab() {
  const subscribe = useMemo(() => createDummySubscribe(), []);
  return (
    <CommentThread01
      comments={DUMMY_FLAT_COMMENTS}
      currentUser={DUMMY_VIEWER}
      subscribe={subscribe}
      onSubscribeDelta={(d) => ConsoleSink({ tag: "delta", payload: d })}
      onAddComment={async (content) => {
        ConsoleSink({ tag: "add", payload: content });
      }}
      onLikeComment={(id, liked) =>
        ConsoleSink({ tag: "like", payload: { id, liked } })
      }
    />
  );
}

function DisabledComposerTab() {
  return (
    <CommentThread01
      comments={DUMMY_FLAT_COMMENTS}
      currentUser={undefined}
      composerEmptyState={
        <Card className="flex items-center justify-between rounded-md p-3">
          <span className="text-sm text-muted-foreground">
            Sign in to join the conversation.
          </span>
          <Button size="sm" variant="default">
            Sign in
          </Button>
        </Card>
      }
    />
  );
}

function CompactVariantTab() {
  return (
    <CommentThread01
      variant="compact"
      comments={DUMMY_NESTED_DEPTH_2}
      currentUser={DUMMY_VIEWER}
      maxDepth={1}
      indentPx={16}
    />
  );
}

export default function CommentThread01Demo() {
  const [tab, setTab] = useState("flat");
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid grid-cols-7">
        <TabsTrigger value="flat">Flat</TabsTrigger>
        <TabsTrigger value="depth2">Nested d2</TabsTrigger>
        <TabsTrigger value="depth3">Nested d3</TabsTrigger>
        <TabsTrigger value="paginated">Paginated</TabsTrigger>
        <TabsTrigger value="realtime">Realtime</TabsTrigger>
        <TabsTrigger value="disabled">No user</TabsTrigger>
        <TabsTrigger value="compact">Compact</TabsTrigger>
      </TabsList>

      <TabsContent value="flat" className="mt-4">
        <FlatTab />
      </TabsContent>
      <TabsContent value="depth2" className="mt-4">
        <NestedDepth2Tab />
      </TabsContent>
      <TabsContent value="depth3" className="mt-4">
        <NestedDepth3Tab />
      </TabsContent>
      <TabsContent value="paginated" className="mt-4">
        <PaginatedTab />
      </TabsContent>
      <TabsContent value="realtime" className="mt-4">
        <RealtimeTab />
      </TabsContent>
      <TabsContent value="disabled" className="mt-4">
        <DisabledComposerTab />
      </TabsContent>
      <TabsContent value="compact" className="mt-4">
        <CompactVariantTab />
      </TabsContent>
    </Tabs>
  );
}
