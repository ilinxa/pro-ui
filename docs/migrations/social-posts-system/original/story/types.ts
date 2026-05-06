export interface StoryItem {
  id: string;
  type: "image" | "video";
  src: string;
  duration?: number; // in seconds, default 5 for images
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  items: StoryItem[];
  hasUnread: boolean;
  createdAt: Date;
}
