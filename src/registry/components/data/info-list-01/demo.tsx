"use client";

import { CircleUser } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoList01 } from "./info-list-01";
import {
  dummyContactItems,
  dummyContactItemsTr,
  dummyEventDetails,
  dummyEventDetailsTr,
} from "./dummy-data";
import type { InfoListItem } from "./types";

const peopleItems = [
  {
    id: "p1",
    name: "Prof. Dr. Ahmet Yılmaz",
    role: "Şehir Plancısı",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
  },
  {
    id: "p2",
    name: "Dr. Elif Kaya",
    role: "Çevre Mühendisi",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=faces",
  },
  {
    id: "p3",
    name: "Mehmet Demir",
    role: "Akıllı Şehir Uzmanı",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
  },
];

const peopleItemsAsInfoListItems: InfoListItem[] = peopleItems.map((p) => ({
  id: p.id,
  icon: CircleUser,
  primary: p.name,
  secondary: p.role,
}));

export default function InfoList01Demo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="default">Default (TR)</TabsTrigger>
        <TabsTrigger value="compact">Compact (TR)</TabsTrigger>
        <TabsTrigger value="stacked">Both stacked</TabsTrigger>
        <TabsTrigger value="bare">Bare</TabsTrigger>
        <TabsTrigger value="custom">Custom renderItem</TabsTrigger>
      </TabsList>

      {/* 1. Default — kasder Etkinlik Bilgileri verbatim */}
      <TabsContent value="default" className="mt-6">
        <div className="max-w-md mx-auto">
          <InfoList01
            heading="Etkinlik Bilgileri"
            variant="comfortable"
            items={dummyEventDetailsTr}
          />
        </div>
      </TabsContent>

      {/* 2. Compact — kasder İletişim verbatim */}
      <TabsContent value="compact" className="mt-6">
        <div className="max-w-md mx-auto">
          <InfoList01
            heading="İletişim"
            variant="compact"
            items={dummyContactItemsTr}
          />
        </div>
      </TabsContent>

      {/* 3. Both stacked — full sidebar shape */}
      <TabsContent value="stacked" className="mt-6">
        <div className="max-w-md mx-auto space-y-6">
          <InfoList01
            heading="Etkinlik Bilgileri"
            variant="comfortable"
            items={dummyEventDetailsTr}
          />
          <InfoList01
            heading="İletişim"
            variant="compact"
            items={dummyContactItemsTr}
          />
        </div>
      </TabsContent>

      {/* 4. Bare — framed=false for embedded use */}
      <TabsContent value="bare" className="mt-6">
        <div className="max-w-md mx-auto rounded-2xl border border-border/50 bg-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Listing Details</h2>
            <InfoList01
              framed={false}
              variant="comfortable"
              items={dummyEventDetails}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">Contact</h2>
            <InfoList01
              framed={false}
              variant="compact"
              items={dummyContactItems}
            />
          </div>
        </div>
      </TabsContent>

      {/* 5. Custom renderItem — speakers with avatars */}
      <TabsContent value="custom" className="mt-6">
        <div className="max-w-md mx-auto space-y-2">
          <p className="text-sm text-muted-foreground">
            <code>renderItem(item)</code> — full row takeover. Here: avatar
            replaces the icon column for a speaker list.
          </p>
          <InfoList01
            heading="Konuşmacılar"
            variant="comfortable"
            items={peopleItemsAsInfoListItems}
            renderItem={(item) => {
              const person = peopleItems.find((p) => p.id === item.id);
              return (
                <div className="flex items-center gap-3">
                  <img
                    src={person?.image}
                    alt={person?.name ?? ""}
                    loading="lazy"
                    className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-primary/20"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {item.primary}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.secondary}
                    </p>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
