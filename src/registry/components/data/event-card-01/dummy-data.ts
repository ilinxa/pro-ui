import type { EventCard01Labels, EventCardItem } from "./types";

/**
 * Fixed reference date used by every demo card via the `now` prop.
 * Without this, demo statuses depend on the real wall clock — events that were
 * "upcoming" at build time silently become "expired" months later.
 *
 * 2026-06-01 12:00 UTC was chosen because all dummy event dates are relative to it.
 */
export const dummyNow = new Date("2026-06-01T12:00:00Z");

/** 8 events covering all 6 statuses + featured + capacity-less. */
export const dummyEvents: EventCardItem[] = [
  {
    id: "evt-open",
    title: "Future of Open Source: Annual Summit",
    type: "Conference",
    date: "2026-07-01",
    endDate: "2026-07-02",
    time: "09:00 - 18:00",
    location: "Istanbul Conference Center",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
    description:
      "Two days of talks, workshops, and hallway conversations with maintainers from across the open-source ecosystem.",
    capacity: 200,
    registered: 50,
  },
  {
    id: "evt-upcoming",
    title: "Tailwind v4 Deep-Dive Workshop",
    type: "Workshop",
    date: "2026-06-06",
    time: "14:00 - 17:00",
    location: "Online (Zoom)",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop",
    description:
      "Hands-on workshop covering Tailwind v4's new theme system, container queries, and OKLCH color migration.",
    capacity: 100,
    registered: 60,
  },
  {
    id: "evt-lastspots",
    title: "Designing for Accessibility: Component Audit",
    type: "Webinar",
    date: "2026-06-15",
    time: "10:00 - 11:30",
    location: "Online",
    image:
      "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&auto=format&fit=crop",
    description:
      "Walk through a real WCAG 2.1 AA audit on a production component library and the fixes that followed.",
    capacity: 100,
    registered: 85,
  },
  {
    id: "evt-ongoing",
    title: "Live Build: Knowledge Graph Editor",
    type: "Webinar",
    date: "2026-06-01",
    endDate: "2026-06-01",
    time: "16:00 - 18:00",
    location: "Online (Streaming)",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop",
    description:
      "Live coding session — building a force-directed knowledge graph editor on top of Sigma.js v3 and React 19.",
    capacity: 500,
    registered: 312,
  },
  {
    id: "evt-full",
    title: "Founders' Roundtable: Hiring in 2026",
    type: "Panel",
    date: "2026-06-11",
    time: "18:30 - 20:00",
    location: "Galata Hub, Istanbul",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop",
    description:
      "Five founders share what's working and what's not in technical hiring this year. Off the record.",
    capacity: 50,
    registered: 50,
  },
  {
    id: "evt-expired",
    title: "GraphQL Federation in Practice",
    type: "Training",
    date: "2026-05-23",
    endDate: "2026-05-24",
    time: "09:00 - 17:00",
    location: "Atlas Plaza, Ankara",
    image:
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&auto=format&fit=crop",
    description:
      "Two-day hands-on training on GraphQL federation v2 — from subgraph composition through production rollout.",
    capacity: 30,
    registered: 28,
  },
  {
    id: "evt-featured",
    title: "Knowledge Day 2026: Annual Member Gathering",
    type: "Conference",
    date: "2026-08-15",
    time: "10:00 - 22:00",
    location: "Istanbul Conference Center + Online",
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop",
    description:
      "Full-day flagship event — keynotes, breakout tracks, networking, and the annual Knowledge Day awards ceremony.",
    capacity: 300,
    registered: 100,
    featured: true,
  },
  {
    id: "evt-capacityless",
    title: "Open Office Hours (Drop-In)",
    type: "Webinar",
    date: "2026-09-01",
    time: "16:00 - 17:00",
    location: "Online (Drop-in link emailed week-of)",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop",
    description:
      "Casual drop-in office hours — no registration needed, no cap. Bring your questions about anything we ship.",
  },
];

export const dummyTypeStyles: Record<string, { className: string }> = {
  Conference: {
    className: "bg-primary/10 text-primary border-primary/20",
  },
  Webinar: {
    className: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  },
  Workshop: {
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  Panel: {
    className: "bg-secondary text-secondary-foreground border-secondary",
  },
  Training: {
    className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  },
};

/** 5 fully custom OKLCH-tinted entries — same English keys, different visuals. */
export const dummyCustomTypeStyles: Record<string, { className: string }> = {
  Conference: {
    className:
      "bg-[oklch(0.95_0.04_310)] text-[oklch(0.4_0.18_310)] border-[oklch(0.85_0.08_310)] dark:bg-[oklch(0.25_0.06_310)] dark:text-[oklch(0.85_0.16_310)]",
  },
  Webinar: {
    className:
      "bg-[oklch(0.95_0.04_220)] text-[oklch(0.4_0.18_220)] border-[oklch(0.85_0.08_220)] dark:bg-[oklch(0.25_0.06_220)] dark:text-[oklch(0.85_0.16_220)]",
  },
  Workshop: {
    className:
      "bg-[oklch(0.95_0.04_45)] text-[oklch(0.45_0.18_45)] border-[oklch(0.85_0.08_45)] dark:bg-[oklch(0.25_0.06_45)] dark:text-[oklch(0.85_0.16_45)]",
  },
  Panel: {
    className:
      "bg-[oklch(0.95_0.04_180)] text-[oklch(0.4_0.16_180)] border-[oklch(0.85_0.08_180)] dark:bg-[oklch(0.25_0.06_180)] dark:text-[oklch(0.85_0.14_180)]",
  },
  Training: {
    className:
      "bg-[oklch(0.95_0.04_355)] text-[oklch(0.45_0.18_355)] border-[oklch(0.85_0.08_355)] dark:bg-[oklch(0.25_0.06_355)] dark:text-[oklch(0.85_0.16_355)]",
  },
};

/** Turkish-localized event array — same dates / capacities, Turkish strings. */
export const dummyTrEvents: EventCardItem[] = dummyEvents.map((event) => {
  const trMap: Record<
    string,
    {
      title: string;
      description?: string;
      location?: string;
      type: string;
    }
  > = {
    "evt-open": {
      title: "Açık Kaynağın Geleceği: Yıllık Zirve",
      description:
        "Açık kaynak ekosisteminden bakım üstlenenlerle iki gün dolu konuşma, atölye ve koridor sohbeti.",
      location: "İstanbul Kongre Merkezi",
      type: "Konferans",
    },
    "evt-upcoming": {
      title: "Tailwind v4 Derinlemesine Atölye",
      description:
        "Tailwind v4'ün yeni tema sistemi, container query'leri ve OKLCH renk geçişini ele alan uygulamalı atölye.",
      location: "Çevrimiçi (Zoom)",
      type: "Çalıştay",
    },
    "evt-lastspots": {
      title: "Erişilebilirlik Tasarımı: Bileşen Denetimi",
      description:
        "Üretimdeki bir bileşen kütüphanesinde gerçek bir WCAG 2.1 AA denetimini ve sonrasındaki düzeltmeleri inceliyoruz.",
      location: "Çevrimiçi",
      type: "Seminer",
    },
    "evt-ongoing": {
      title: "Canlı Yayın: Bilgi Grafiği Editörü",
      description:
        "Canlı kodlama oturumu — Sigma.js v3 ve React 19 üzerine kuvvet yönlendirmeli bilgi grafiği editörü.",
      location: "Çevrimiçi (Yayın)",
      type: "Seminer",
    },
    "evt-full": {
      title: "Kurucular Yuvarlak Masası: 2026'da İşe Alım",
      description:
        "Beş kurucu, bu yıl teknik işe alımda neyin işe yaradığını ve neyin yaramadığını paylaşıyor.",
      location: "Galata Hub, İstanbul",
      type: "Panel",
    },
    "evt-expired": {
      title: "Pratikte GraphQL Federation",
      description:
        "GraphQL federation v2 üzerine iki günlük uygulamalı eğitim — alt graf kompozisyonundan üretim devreye alımına.",
      location: "Atlas Plaza, Ankara",
      type: "Eğitim",
    },
    "evt-featured": {
      title: "Bilgi Günü 2026: Yıllık Üye Buluşması",
      description:
        "Tüm gün süren amiral etkinlik — açılış konuşmaları, paralel oturumlar, network ve yıllık Bilgi Günü ödül töreni.",
      location: "İstanbul Kongre Merkezi + Çevrimiçi",
      type: "Konferans",
    },
    "evt-capacityless": {
      title: "Açık Ofis Saatleri (Önkayıtsız)",
      description:
        "Rahat ortamda, önkayıtsız ofis saatleri — kayıt gerekmiyor, kontenjan yok. Soru ve konularınızı getirin.",
      location: "Çevrimiçi (Bağlantı etkinlik haftasında e-posta ile)",
      type: "Seminer",
    },
  };

  const tr = trMap[event.id];
  return tr ? { ...event, ...tr } : event;
});

export const dummyTrTypeStyles: Record<string, { className: string }> = {
  Konferans: {
    className: "bg-primary/10 text-primary border-primary/20",
  },
  Seminer: {
    className: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  },
  Çalıştay: {
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  Panel: {
    className: "bg-secondary text-secondary-foreground border-secondary",
  },
  Eğitim: {
    className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  },
};

export const dummyTrLabels: EventCard01Labels = {
  expired: "Sona Erdi",
  ongoing: "Devam Ediyor",
  upcoming: "Yaklaşıyor",
  open: "Kayıt Açık",
  full: "Kontenjan Dolu",
  lastSpots: "Son Yerler",
  daysUntilSuffix: "gün kaldı",
  ongoingIndicator: "Şu an devam ediyor",
  spotsLeftSuffix: "yer kaldı",
  spotsLeftFull: "Dolu",
  capacityAriaPrefix: "Kayıtlı",
  capacityAriaSeparator: "/",
  ctaRegister: "Kayıt Ol",
  ctaJoin: "Katıl",
  ctaViewDetails: "Detayları Gör",
  ctaSoldOut: "Kontenjan Dolu",
  featuredAriaLabel: "Öne çıkan etkinlik",
};

/** Turkish formatter convenience — pass to `formatDate` prop on the Localized demo. */
export const formatDateTr = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
