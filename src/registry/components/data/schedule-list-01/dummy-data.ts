import { Coffee, Users, Utensils } from "lucide-react";
import type { ScheduleListItem } from "./types";

export const dummySchedule: ScheduleListItem[] = [
  {
    id: "1",
    time: "09:00",
    title: "Registration & Welcome Coffee",
    description: "Check-in and networking",
    icon: Coffee,
  },
  {
    id: "2",
    time: "10:00",
    endTime: "10:30",
    title: "Opening Keynote",
    description: "Annual address by the Board",
  },
  {
    id: "3",
    time: "11:00",
    title: "Panel: Future Cities",
    description: "Interactive discussion with experts",
    icon: Users,
  },
  {
    id: "4",
    time: "13:00",
    title: "Lunch",
    icon: Utensils,
  },
  {
    id: "5",
    time: "14:30",
    endTime: "16:30",
    title: "Workshops",
    description: "Parallel breakout sessions",
    href: "#workshops",
  },
  {
    id: "6",
    time: "17:00",
    title: "Closing & Networking",
    description: "Wrap-up and cocktail reception",
  },
];

export const dummyScheduleTr: ScheduleListItem[] = [
  {
    id: "1",
    time: "09:00",
    title: "Kayıt ve Karşılama Kahvaltısı",
    description: "Katılımcı kayıtları ve networking",
  },
  {
    id: "2",
    time: "10:00",
    title: "Açılış Konuşması",
    description: "Dernek Başkanı tarafından açılış",
  },
  {
    id: "3",
    time: "11:00",
    title: "Panel: Geleceğin Şehirleri",
    description: "Uzman panelimizle interaktif tartışma",
  },
  {
    id: "4",
    time: "13:00",
    title: "Öğle Yemeği",
    description: "Networking lunch",
  },
  {
    id: "5",
    time: "14:30",
    title: "Çalıştaylar",
    description: "Paralel çalıştay oturumları",
  },
  {
    id: "6",
    time: "17:00",
    title: "Kapanış ve Networking",
    description: "Sonuç bildirisi ve kokteyl",
  },
];
