import type { PeopleGridItem } from "./types";

/** 3 speakers from the kasder Konuşmacılar block. */
export const dummySpeakers: PeopleGridItem[] = [
  {
    id: "s1",
    name: "Prof. Dr. Ahmet Yılmaz",
    title: "Şehir Plancısı",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "s2",
    name: "Dr. Elif Kaya",
    title: "Çevre Mühendisi",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "s3",
    name: "Mehmet Demir",
    title: "Akıllı Şehir Uzmanı",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
  },
];

/** 6-person team set — mix of with-image + without-image to demo initials fallback. */
export const dummyTeam: PeopleGridItem[] = [
  {
    id: "t1",
    name: "Ada Lovelace",
    title: "Chief Scientist",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "t2",
    name: "Grace Hopper",
    title: "Compiler Lead",
  },
  {
    id: "t3",
    name: "Alan Turing",
    title: "Cryptography",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "t4",
    name: "Katherine Johnson",
    title: "Numerical Analyst",
  },
  {
    id: "t5",
    name: "Linus Torvalds",
    title: "Kernel Maintainer",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "t6",
    name: "Madonna",
    title: "Designer",
  },
];

/** 5-person initials-only set — proves the fallback path. */
export const dummyBoard: PeopleGridItem[] = [
  { id: "b1", name: "Dr. Sara Ahmed", title: "Chair" },
  { id: "b2", name: "Prof. James O'Neill", title: "Vice-Chair" },
  { id: "b3", name: "Mr. Carlos Ruiz", title: "Treasurer" },
  { id: "b4", name: "Şükrü Çelik", title: "Secretary" },
  { id: "b5", name: "Ms. Priya Sharma", title: "Director" },
];
