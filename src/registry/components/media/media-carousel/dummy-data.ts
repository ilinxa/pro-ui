import type { MediaCarouselLabels, MediaItem } from "./types";

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
    url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
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
    url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    poster:
      "https://images.pexels.com/videos/856005/free-video-856005.jpg?auto=compress&cs=tinysrgb&w=1280",
  },
];

const PX = "https://images.pexels.com/photos";
const PX_Q = "?auto=compress&cs=tinysrgb&w=1280";

/** Platform post carousel — mixed image sizes with intrinsic `width` / `height` (landscape, portrait, panoramic). */
export const prototypeItems: MediaItem[] = [
  { id: "pr1", type: "image", url: `${PX}/1738986/pexels-photo-1738986.jpeg${PX_Q}`, alt: "Mountain at sunrise", width: 1280, height: 853 },
  { id: "pr2", type: "image", url: `${PX}/2387873/pexels-photo-2387873.jpeg${PX_Q}`, alt: "Forest path with morning light", width: 853, height: 1280 },
  { id: "pr3", type: "image", url: `${PX}/1366919/pexels-photo-1366919.jpeg${PX_Q}`, alt: "City skyline at dusk", width: 1280, height: 720 },
  { id: "pr4", type: "image", url: `${PX}/1366913/pexels-photo-1366913.jpeg${PX_Q}`, alt: "Evening lights downtown", width: 1280, height: 427 },
];

/** Same shape, different leading ratio — pair with `aspect="natural-clamped"` to see the clamp (3:4 becomes 4:5). */
export const mixedRatioItems: MediaItem[] = [
  { id: "mr1", type: "image", url: `${PX}/2387873/pexels-photo-2387873.jpeg${PX_Q}`, alt: "Forest path", width: 600, height: 800 },
  { id: "mr2", type: "image", url: `${PX}/1738986/pexels-photo-1738986.jpeg${PX_Q}`, alt: "Mountain", width: 1280, height: 853 },
  { id: "mr3", type: "image", url: `${PX}/1366919/pexels-photo-1366919.jpeg${PX_Q}`, alt: "City skyline", width: 1280, height: 720 },
];

const POSTER =
  "https://images.pexels.com/videos/856005/free-video-856005.jpg?auto=compress&cs=tinysrgb&w=1280";

/** Two videos (poster + url, with dimensions) and an image. */
export const videoItems: MediaItem[] = [
  { id: "v1", type: "video", url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4", poster: POSTER, width: 1280, height: 720 },
  { id: "v2", type: "image", url: `${PX}/1738986/pexels-photo-1738986.jpeg${PX_Q}`, alt: "Mountain at sunrise", width: 1280, height: 853 },
  { id: "v3", type: "video", url: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4", poster: POSTER, width: 1280, height: 720 },
];

/** An image whose URL has "expired" — `onMediaError` resolves a working one. */
export const brokenImageItem: MediaItem = {
  id: "broken1",
  type: "image",
  url: "/__missing__/expired.jpg",
  alt: "Image with an expired URL",
  width: 1280,
  height: 853,
};

/** The URL `onMediaError` resolves for `brokenImageItem`. */
export const refreshedImageUrl = `${PX}/1738986/pexels-photo-1738986.jpeg${PX_Q}`;

/** Companion slides so the error-refresh tab is a real carousel. */
export const errorRefreshItems: MediaItem[] = [
  brokenImageItem,
  { id: "er2", type: "image", url: `${PX}/2387873/pexels-photo-2387873.jpeg${PX_Q}`, alt: "Forest path", width: 853, height: 1280 },
];

/** Arabic labels (function forms, Arabic-Indic digits through `locale="ar"`). */
export const arLabels: MediaCarouselLabels = {
  carouselLabel: "معرض الوسائط",
  previousSlide: "الشريحة السابقة",
  nextSlide: "الشريحة التالية",
  goToSlide: (position) => `انتقل إلى الشريحة ${position.toLocaleString("ar")}`,
  slideAriaLabel: (position, total) =>
    `الشريحة ${position.toLocaleString("ar")} من ${total.toLocaleString("ar")}`,
  counter: (position, total, format) => `${format(position)} / ${format(total)}`,
  carouselRoleDescription: "معرض",
  slideRoleDescription: "شريحة",
};

/** Turkish labels (function forms). */
export const trLabels: MediaCarouselLabels = {
  carouselLabel: "Medya galerisi",
  previousSlide: "Önceki slayt",
  nextSlide: "Sonraki slayt",
  goToSlide: (position) => `${position}. slayta git`,
  slideAriaLabel: (position, total) => `Slayt ${position} / ${total}`,
  counter: (position, total, format) => `${format(position)}/${format(total)}`,
  carouselRoleDescription: "galeri",
  slideRoleDescription: "slayt",
};
