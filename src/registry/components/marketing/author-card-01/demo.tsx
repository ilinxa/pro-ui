"use client";

import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthorCard01 } from "./author-card-01";
import { AUTHOR_CARD_01_DUMMY } from "./dummy-data";

export default function AuthorCard01Demo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="with-image">With image</TabsTrigger>
        <TabsTrigger value="clickable">Clickable</TabsTrigger>
        <TabsTrigger value="muted">Muted tone</TabsTrigger>
        <TabsTrigger value="i18n">Turkish content</TabsTrigger>
      </TabsList>

      <TabsContent value="default" className="mt-6 max-w-md">
        <AuthorCard01 {...AUTHOR_CARD_01_DUMMY.withoutImage} />
      </TabsContent>

      <TabsContent value="with-image" className="mt-6 max-w-md">
        <AuthorCard01 {...AUTHOR_CARD_01_DUMMY.withImage} />
      </TabsContent>

      <TabsContent value="clickable" className="mt-6 max-w-md">
        <AuthorCard01 {...AUTHOR_CARD_01_DUMMY.clickable} />
        <p className="mt-3 text-xs text-muted-foreground">
          Hover the card or focus it with the keyboard — the whole surface is a
          link to <code>/team/daniel-park</code>.
        </p>
      </TabsContent>

      <TabsContent value="muted" className="mt-6 max-w-md">
        <AuthorCard01
          {...AUTHOR_CARD_01_DUMMY.collective}
          tone="muted"
          fallbackIcon={Users}
        />
      </TabsContent>

      <TabsContent value="i18n" className="mt-6 max-w-md">
        <AuthorCard01 {...AUTHOR_CARD_01_DUMMY.turkish} />
      </TabsContent>
    </Tabs>
  );
}
