import type { ThumbListItem } from "./types";

export const THUMB_LIST_01_DUMMY: ReadonlyArray<ThumbListItem> = [
  {
    id: "1",
    title: "How sustainable cities are rethinking density",
    imageSrc:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=300&fit=crop&auto=format",
    imageAlt: "City skyline at dusk",
    meta: "5 min read",
    href: "/news/sustainable-density",
  },
  {
    id: "2",
    title: "Public transit on the rebound",
    imageSrc:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop&auto=format",
    imageAlt: "Bus station at night",
    meta: "3 min read",
    href: "/news/public-transit",
  },
  {
    id: "3",
    title: "What e-bikes are doing to city centers",
    imageSrc:
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop&auto=format",
    imageAlt: "E-bikes in a row",
    meta: "8 min read",
    href: "/news/ebikes",
  },
  {
    id: "4",
    title: "Mapping the unmapped — community-led OSM",
    imageSrc:
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop&auto=format",
    imageAlt: "Hands pointing at a paper map",
    meta: "6 min read",
    href: "/news/community-osm",
  },
];

export const THUMB_LIST_01_DUMMY_TR: ReadonlyArray<ThumbListItem> = [
  {
    id: "1",
    title: "Sürdürülebilir şehirler nasıl yeniden tasarlanıyor",
    imageSrc:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=300&fit=crop&auto=format",
    meta: "5 dk okuma",
    href: "/haberler/1",
  },
  {
    id: "2",
    title: "Toplu taşımanın geri dönüşü",
    imageSrc:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop&auto=format",
    meta: "3 dk okuma",
    href: "/haberler/2",
  },
  {
    id: "3",
    title: "E-bisikletler şehir merkezlerini nasıl değiştiriyor",
    imageSrc:
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop&auto=format",
    meta: "8 dk okuma",
    href: "/haberler/3",
  },
];

export interface DatedThumbListItem extends ThumbListItem {
  publishedAt: string;
}

export const THUMB_LIST_01_DUMMY_DATED: ReadonlyArray<DatedThumbListItem> = [
  {
    id: "a",
    title: "What we got wrong about remote-first",
    imageSrc:
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&auto=format",
    href: "/posts/a",
    publishedAt: "2026-04-15",
  },
  {
    id: "b",
    title: "Five tools we replaced this quarter",
    imageSrc:
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&h=300&fit=crop&auto=format",
    href: "/posts/b",
    publishedAt: "2026-04-08",
  },
  {
    id: "c",
    title: "Why we deleted half our docs",
    imageSrc:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop&auto=format",
    href: "/posts/c",
    publishedAt: "2026-03-22",
  },
];
