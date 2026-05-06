import type { ArticleBodyValue } from "@/registry/components/data/article-body-01";
import type { ScheduleListItem } from "@/registry/components/data/schedule-list-01";
import type { PeopleGridItem } from "@/registry/components/data/people-grid-01";

export interface EventDetailFixture {
  id: string;
  title: string;
  type: string;
  description: string;
  body: ArticleBodyValue;

  date: string;
  endDate?: string;
  time: string;

  location: string;
  address: string;
  image: string;

  capacity: number;
  registered: number;
  featured: boolean;

  registrationOpensAt: string;
  registrationClosesAt: string;

  schedule: ScheduleListItem[];
  speakers: PeopleGridItem[];
  organizer: { name: string; phone: string; email: string };
  requirements: string[];
}

export const demoNow = new Date("2026-06-01T12:00:00Z");

export const demoEvent: EventDetailFixture = {
  id: "istanbul-surdurulebilir-sehir-2026",
  title: "İstanbul Sürdürülebilir Şehir Konferansı 2026",
  type: "Konferans",
  description:
    "Kentleşme, çevre mühendisliği ve akıllı şehir teknolojilerini bir araya getiren İstanbul'un en kapsamlı sürdürülebilirlik etkinliği.",

  body: [
    {
      type: "p",
      children: [
        {
          text: "İstanbul Sürdürülebilir Şehir Konferansı 2026, kentsel dönüşüm, yeşil enerji ve akıllı şehir teknolojilerinin kesişim noktasında çalışan akademisyenleri, mühendisleri, belediye karar vericilerini ve sivil toplum temsilcilerini bir araya getiriyor.",
        },
      ],
    },
    {
      type: "p",
      children: [
        {
          text: "Üç gün süren program boyunca yedi ana oturum, on dört çalıştay ve bir poster sergisi düzenlenecek. Katılımcılar kentsel mobilite, su yönetimi, atık ekonomisi ve dijital ikiz uygulamaları üzerine derinlemesine örnekler ve uygulanabilir araçlar edinecek.",
        },
      ],
    },
    {
      type: "h3",
      children: [{ text: "Kimler katılmalı?" }],
    },
    {
      type: "p",
      children: [
        {
          text: "Yerel yönetim çalışanları, çevre ve şehir plancıları, akıllı şehir geliştiricileri, lisansüstü öğrenciler ve sürdürülebilirlik alanında çalışan sivil toplum gönüllüleri için tasarlandı.",
        },
      ],
    },
  ],

  date: "2026-06-15T09:00:00Z",
  endDate: "2026-06-17T18:00:00Z",
  time: "09:00 - 18:00",

  location: "İstanbul Kongre Merkezi",
  address: "Harbiye Mah., Darülbedai Cad., 34367 Şişli/İstanbul",
  image:
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2000&q=80",

  capacity: 500,
  registered: 423,
  featured: true,

  registrationOpensAt: "2026-04-15T00:00:00Z",
  registrationClosesAt: "2026-06-15T09:00:00Z",

  schedule: [
    {
      id: "s1",
      time: "09:00",
      endTime: "09:30",
      title: "Kayıt ve Karşılama",
      description: "Katılımcı kartlarının dağıtımı ve açılış kahvesi.",
    },
    {
      id: "s2",
      time: "09:30",
      endTime: "10:30",
      title: "Açılış Konuşması: Kentin Geleceği",
      description: "Prof. Dr. Ahmet Yılmaz — Şehir Plancılığı Bölümü",
    },
    {
      id: "s3",
      time: "10:45",
      endTime: "12:15",
      title: "Panel: Yeşil Mobilite ve Toplu Taşıma",
      description: "Üç büyükşehirden örnek vakalar ve karşılaştırmalı analiz.",
    },
    {
      id: "s4",
      time: "12:15",
      endTime: "13:30",
      title: "Öğle Yemeği",
      description: "Sergi alanında networking.",
    },
    {
      id: "s5",
      time: "13:30",
      endTime: "15:00",
      title: "Çalıştay: Akıllı Şehir Sensör Ağları",
      description: "Mehmet Demir liderliğinde uygulamalı oturum.",
    },
    {
      id: "s6",
      time: "15:15",
      endTime: "16:30",
      title: "Su Yönetimi ve Sıfır Atık Sunumları",
      description: "Dr. Elif Kaya ve sektör temsilcileri.",
    },
    {
      id: "s7",
      time: "16:45",
      endTime: "18:00",
      title: "Kapanış ve Sertifika Töreni",
      description: "Günün özeti, soru-cevap ve katılım belgelerinin dağıtımı.",
    },
  ],

  speakers: [
    {
      id: "sp1",
      name: "Prof. Dr. Ahmet Yılmaz",
      title: "Şehir Plancısı",
      image:
        "https://images.unsplash.com/photo-1559548331-f9cb98001426?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "sp2",
      name: "Dr. Elif Kaya",
      title: "Çevre Mühendisi",
      image:
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "sp3",
      name: "Mehmet Demir",
      title: "Akıllı Şehir Uzmanı",
      image:
        "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
    },
  ],

  organizer: {
    name: "KASDER — Kentsel Sürdürülebilirlik Derneği",
    phone: "+90 212 555 0142",
    email: "iletisim@kasder.org.tr",
  },

  requirements: [
    "Geçerli kimlik belgesi (TC kimlik kartı veya pasaport)",
    "Online kayıt formunun tamamlanmış olması",
    "Kurumsal katılımcılar için temsil yazısı",
    "Çalıştaylara katılım için ön kayıt onayı",
  ],
};
