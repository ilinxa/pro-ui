import {
  Building,
  Calendar,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import type { InfoListItem } from "./types";

const MapLinkAction = (
  <span className="inline-flex items-center gap-1 text-sm text-primary mt-1 hover:underline cursor-pointer">
    View on map <ExternalLink aria-hidden="true" className="w-3 h-3" />
  </span>
);

const MapLinkActionTr = (
  <span className="inline-flex items-center gap-1 text-sm text-primary mt-1 hover:underline cursor-pointer">
    Haritada Gör <ExternalLink aria-hidden="true" className="w-3 h-3" />
  </span>
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
