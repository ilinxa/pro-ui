import {
  Building,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Target,
  Users,
} from "lucide-react";
import type { InfoListItem } from "./types";

const MapLinkAction = (
  <button
    type="button"
    className="inline-flex items-center gap-1 text-sm text-primary mt-1 hover:underline cursor-pointer"
  >
    View on map <ExternalLink aria-hidden="true" className="w-3 h-3" />
  </button>
);

const MapLinkActionTr = (
  <button
    type="button"
    className="inline-flex items-center gap-1 text-sm text-primary mt-1 hover:underline cursor-pointer"
  >
    Haritada Gör <ExternalLink aria-hidden="true" className="w-3 h-3" />
  </button>
);

export const dummyEventDetails: InfoListItem[] = [
  {
    id: "date",
    icon: Calendar,
    primary: "May 31, 2026 — Sunday",
    secondary: "09:00 - 18:00",
  },
  {
    id: "location",
    icon: MapPin,
    primary: "Istanbul Conference Center",
    secondary: "Darülbedai Caddesi No:3, Şişli/Istanbul",
    action: MapLinkAction,
  },
  {
    id: "capacity",
    icon: Users,
    primary: "500-person capacity",
    secondary: "423 registered",
  },
];

export const dummyEventDetailsTr: InfoListItem[] = [
  {
    id: "date",
    icon: Calendar,
    primary: "31 Mayıs 2026 Pazar",
    secondary: "09:00 - 18:00",
  },
  {
    id: "location",
    icon: MapPin,
    primary: "İstanbul Kongre Merkezi",
    secondary: "Darülbedai Caddesi No:3, 34367 Harbiye/Şişli/İstanbul",
    action: MapLinkActionTr,
  },
  {
    id: "capacity",
    icon: Users,
    primary: "500 Kişilik Kapasite",
    secondary: "423 kişi kayıtlı",
  },
];

export const dummyContactItems: InfoListItem[] = [
  {
    id: "org",
    icon: Building,
    primary: "Sustainability Foundation",
  },
  {
    id: "phone",
    icon: Phone,
    primary: "+90 (212) 555 0123",
    href: "tel:+902125550123",
  },
  {
    id: "email",
    icon: Mail,
    primary: "info@example.com",
    href: "mailto:info@example.com",
  },
];

export const dummyContactItemsTr: InfoListItem[] = [
  {
    id: "org",
    icon: Building,
    primary: "Sürdürülebilir Şehircilik Derneği",
  },
  {
    id: "phone",
    icon: Phone,
    primary: "+90 (212) 555 0123",
    href: "tel:+902125550123",
  },
  {
    id: "email",
    icon: Mail,
    primary: "iletisim@dernek.org",
    href: "mailto:iletisim@dernek.org",
  },
];

/**
 * A business "About" block: mission, hours, address, website and phone. The mission is a long value —
 * show it with `variant="compact"` + `wrap` (without `wrap` it truncates and carries a `title`).
 */
export const dummyBusinessAbout: InfoListItem[] = [
  {
    id: "mission",
    icon: Target,
    primary:
      "We help neighbourhood cafes and bakeries source seasonal, locally grown ingredients, cut food waste and keep every supplier relationship fair, transparent and long-term across the whole region.",
  },
  {
    id: "hours",
    icon: Clock,
    primary: "Mon-Fri 08:00 - 18:00, Sat 09:00 - 14:00",
  },
  {
    id: "address",
    icon: MapPin,
    primary: "Darülbedai Caddesi No:3, Şişli/Istanbul",
  },
  {
    id: "website",
    icon: Globe,
    primary: "www.example-bakery-supply.com",
    href: "https://www.example-bakery-supply.com",
  },
  {
    id: "phone",
    icon: Phone,
    primary: "+90 (212) 555 0123",
    href: "tel:+902125550123",
  },
];

/** Arabic rows for the RTL demo tab and tests. */
export const dummyBusinessAboutAr: InfoListItem[] = [
  {
    id: "mission",
    icon: Target,
    primary:
      "نساعد المقاهي والمخابز المحلية على الحصول على مكونات موسمية مزروعة محلياً، وتقليل هدر الطعام، والحفاظ على علاقات عادلة وشفافة وطويلة الأمد مع جميع الموردين في المنطقة.",
  },
  {
    id: "hours",
    icon: Clock,
    primary: "الاثنين - الجمعة 08:00 - 18:00",
  },
  {
    id: "address",
    icon: MapPin,
    primary: "شارع دار البدائي رقم 3، شيشلي، إسطنبول",
  },
  {
    id: "website",
    icon: Globe,
    primary: "www.example-bakery-supply.com",
    href: "https://www.example-bakery-supply.com",
  },
  {
    id: "phone",
    icon: Phone,
    primary: "+90 (212) 555 0123",
    href: "tel:+902125550123",
  },
];
