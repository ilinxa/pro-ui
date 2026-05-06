import type {
  ProjectCard01Labels,
  ProjectCardItem,
  ProjectCategoryStyle,
} from "./types";

/**
 * 6-project mixed fixture covering all 3 statuses + featured + image-fallback edge.
 * Ported from kasder kas-social-front-v0 `projectsData.ts` and translated to English defaults.
 */
export const dummyProjects: ProjectCardItem[] = [
  {
    id: "fikirtepe-renewal",
    title: "Fikirtepe Urban Renewal",
    category: "Urban Renewal",
    location: "Istanbul, Kadıköy",
    year: "2023",
    image:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=500&fit=crop",
    description:
      "One of Istanbul's largest urban renewal projects — 15,000 housing units modernised across the Fikirtepe district.",
    status: "ongoing",
  },
  {
    id: "izmir-quake-housing",
    title: "İzmir Earthquake Housing",
    category: "Disaster Management",
    location: "İzmir, Bayraklı",
    year: "2022",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=500&fit=crop",
    description:
      "Earthquake-resistant modern housing complex built in the aftermath of the 2020 İzmir earthquake.",
    status: "completed",
  },
  {
    id: "ankara-green-city",
    title: "Ankara Green City Initiative",
    category: "Sustainable Development",
    location: "Ankara, Etimesgut",
    year: "2024",
    image:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&h=500&fit=crop",
    description:
      "Net-zero carbon-footprint living district powered by renewable energy and integrated mobility.",
    status: "ongoing",
  },
  {
    id: "bursa-historic-preservation",
    title: "Bursa Historic Quarter Preservation",
    category: "Historic Preservation",
    location: "Bursa, Osmangazi",
    year: "2021",
    image:
      "https://images.unsplash.com/photo-1555521893-3a0d8f9e4b3e?w=800&h=500&fit=crop",
    description:
      "Restoration of the UNESCO World Heritage historical centre of Bursa, balancing daily life with preservation.",
    status: "completed",
    featured: true,
  },
  {
    id: "samsun-coastline",
    title: "Samsun Coastline Redesign",
    category: "Coastal Development",
    location: "Samsun, Atakum",
    year: "2022",
    image:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=500&fit=crop",
    description:
      "Modern, accessible public-space design along the Black Sea coastline, integrating recreation and ecology.",
    status: "ongoing",
  },
  {
    id: "mersin-port-renewal",
    title: "Mersin Port District Renewal",
    category: "Urban Renewal",
    location: "Mersin, Akdeniz",
    year: "2025",
    image: "",
    description:
      "Conversion of the historic port district into a tourism and culture hub — currently in detailed-planning phase.",
    status: "planned",
  },
];

/**
 * 5-entry English-keyed category map. Demonstrates the `categoryStyles` API.
 *
 * Solid-background classes for over-image legibility — light tints
 * (`bg-X/15 text-X`) read poorly over photographic backgrounds. Solid colors
 * with `text-white` (or `text-warning-foreground` for amber) preserve the
 * brand-color identity AND stay readable over any image content.
 */
export const dummyCategoryStyles: Record<string, ProjectCategoryStyle> = {
  "Urban Renewal": {
    className: "bg-primary/90 text-primary-foreground",
  },
  "Sustainable Development": {
    className: "bg-chart-3/90 text-white",
  },
  "Disaster Management": {
    className: "bg-warning/90 text-warning-foreground",
  },
  "Historic Preservation": {
    className: "bg-chart-4/90 text-white",
  },
  "Coastal Development": {
    className: "bg-chart-5/90 text-white",
  },
};

/**
 * Turkish-localized sibling fixture. Mirrors kasder's actual data shapes.
 */
export const dummyTrProjects: ProjectCardItem[] = [
  {
    id: "fikirtepe-renewal",
    title: "Fikirtepe Kentsel Dönüşüm Projesi",
    category: "Kentsel Dönüşüm",
    location: "İstanbul, Kadıköy",
    year: "2023",
    image:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=500&fit=crop",
    description:
      "İstanbul'un en büyük kentsel dönüşüm projelerinden biri olan Fikirtepe'de 15.000 konutun yenilenmesi.",
    status: "ongoing",
  },
  {
    id: "izmir-quake-housing",
    title: "İzmir Deprem Konutları",
    category: "Afet Yönetimi",
    location: "İzmir, Bayraklı",
    year: "2022",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=500&fit=crop",
    description:
      "2020 İzmir depremi sonrası inşa edilen depreme dayanıklı modern konut kompleksi.",
    status: "completed",
  },
  {
    id: "ankara-green-city",
    title: "Ankara Yeşil Şehir Projesi",
    category: "Sürdürülebilir Gelişim",
    location: "Ankara, Etimesgut",
    year: "2024",
    image:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&h=500&fit=crop",
    description:
      "Sıfır karbon ayak izi hedefleyen, yenilenebilir enerji kaynaklarıyla desteklenen yaşam alanı.",
    status: "ongoing",
  },
  {
    id: "bursa-historic-preservation",
    title: "Bursa Tarihi Doku Koruma",
    category: "Tarihi Koruma",
    location: "Bursa, Osmangazi",
    year: "2021",
    image:
      "https://images.unsplash.com/photo-1555521893-3a0d8f9e4b3e?w=800&h=500&fit=crop",
    description:
      "UNESCO Dünya Mirası listesindeki Bursa tarihi merkezinin restorasyonu.",
    status: "completed",
    featured: true,
  },
  {
    id: "samsun-coastline",
    title: "Samsun Sahil Şeridi Projesi",
    category: "Kentsel Tasarım",
    location: "Samsun, Atakum",
    year: "2022",
    image:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=500&fit=crop",
    description:
      "Karadeniz kıyısında modern ve erişilebilir kamusal alan tasarımı.",
    status: "ongoing",
  },
  {
    id: "mersin-port-renewal",
    title: "Mersin Liman Bölgesi Yenileme",
    category: "Kentsel Dönüşüm",
    location: "Mersin, Akdeniz",
    year: "2025",
    image: "",
    description:
      "Tarihi liman bölgesinin turizm ve kültür merkezine dönüştürülmesi — detaylı planlama aşamasında.",
    status: "planned",
  },
];

/**
 * Turkish-keyed category style map matching `dummyTrProjects` categories.
 */
export const dummyTrCategoryStyles: Record<string, ProjectCategoryStyle> = {
  "Kentsel Dönüşüm": {
    className: "bg-primary/90 text-primary-foreground",
  },
  "Sürdürülebilir Gelişim": {
    className: "bg-chart-3/90 text-white",
  },
  "Afet Yönetimi": {
    className: "bg-warning/90 text-warning-foreground",
  },
  "Tarihi Koruma": {
    className: "bg-chart-4/90 text-white",
  },
  "Kentsel Tasarım": {
    className: "bg-chart-5/90 text-white",
  },
};

/**
 * Turkish labels for the Localized demo tab. Pass alongside `dummyTrProjects`.
 */
export const dummyTrLabels: ProjectCard01Labels = {
  completed: "Tamamlandı",
  ongoing: "Devam Ediyor",
  planned: "Planlanan",
  viewDetails: "Detayları Gör",
  featuredAriaLabel: "Öne çıkan proje",
};
