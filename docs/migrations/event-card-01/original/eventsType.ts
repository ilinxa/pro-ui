export interface EventDetail {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  type: string;
  date: string;
  endDate?: string;
  time: string;
  location: string;
  address: string;
  capacity: number;
  registered: number;
  image: string;
  speakers: { name: string; title: string; image: string }[];
  schedule: { time: string; title: string; description: string }[];
  organizer: { name: string; phone: string; email: string };
  requirements: string[];
  featured?: boolean;
}


export type EventStatus = "expired" | "ongoing" | "upcoming" | "open" | "full" | "lastSpots";

export interface EventType {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  endDate?: string;
  time: string;
  location: string;
  capacity: number;
  registered: number;
  image: string;
  featured?: boolean;
}

export interface EventCardProps {
  event: EventType;
  index: number;
}


export type FilterType = "all" | "open" | "upcoming" | "ongoing" | "expired";