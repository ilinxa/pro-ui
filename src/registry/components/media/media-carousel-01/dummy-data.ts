import type { MediaItem } from "./types";

/** Mixed image + video — kasder gallery demo (5 slides, video at index 2). */
export const DUMMY_MIXED_MEDIA: MediaItem[] = [
  {
    id: "1",
    type: "image",
    url: "https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Mountain at sunrise",
  },
  {
    id: "2",
    type: "image",
    url: "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Forest path with morning light",
  },
  {
    id: "3",
    type: "video",
    url: "https://videos.pexels.com/video-files/856005/856005-hd_1280_720_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/856005/free-video-856005.jpg?auto=compress&cs=tinysrgb&w=1280",
  },
  {
    id: "4",
    type: "image",
    url: "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "City skyline at dusk",
  },
  {
    id: "5",
    type: "image",
    url: "https://images.pexels.com/photos/1366913/pexels-photo-1366913.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Evening lights downtown",
  },
];

/** Photos-only — product gallery demo. */
export const DUMMY_PRODUCT_PHOTOS: MediaItem[] = [
  {
    id: "p1",
    type: "image",
    url: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Sneaker side view",
  },
  {
    id: "p2",
    type: "image",
    url: "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Sneaker top view",
  },
  {
    id: "p3",
    type: "image",
    url: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Sneaker detail",
  },
  {
    id: "p4",
    type: "image",
    url: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Sneaker on display",
  },
];

/** Single image — proves single-item shortcut. */
export const DUMMY_SINGLE_IMAGE: MediaItem[] = [
  {
    id: "s1",
    type: "image",
    url: "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=1280",
    alt: "Forest path",
  },
];

/** Single video — proves single-item shortcut + video. */
export const DUMMY_SINGLE_VIDEO: MediaItem[] = [
  {
    id: "sv1",
    type: "video",
    url: "https://videos.pexels.com/video-files/856005/856005-hd_1280_720_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/856005/free-video-856005.jpg?auto=compress&cs=tinysrgb&w=1280",
  },
];
