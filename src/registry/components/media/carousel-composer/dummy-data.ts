import type { CarouselComposerLabelsInput, MediaCarouselItem } from "./types";

/**
 * Sample carousel — a "re-edit" seed shape (remote URLs, no local blobs), as a
 * CMS would hydrate an existing post's media. Mixed photo + video proves the
 * collection doesn't separate kinds. Items have NO `blob`/`editorState`, so the
 * carousel treats them as unedited remote sources.
 *
 * Square (1:1) image sources so the demo's `aspect="auto"` resolves to a clean
 * 1:1 frame.
 */
export const dummyCarouselItems: MediaCarouselItem[] = [
  {
    id: "seed-1",
    kind: "image",
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&h=1080&fit=crop",
    width: 1080,
    height: 1080,
    fileName: "ridge-light.jpg",
  },
  {
    id: "seed-2",
    kind: "image",
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1080&h=1080&fit=crop",
    width: 1080,
    height: 1080,
    fileName: "city-dusk.jpg",
  },
  {
    id: "seed-3",
    kind: "video",
    url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    width: 1280,
    height: 720,
    fileName: "clip.mp4",
  },
  {
    id: "seed-4",
    kind: "image",
    url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1080&h=1080&fit=crop",
    width: 1080,
    height: 1080,
    fileName: "press.jpg",
  },
];

/** Mixed-ratio photos (wide, tall, square) so a fixed shared aspect has something to pan. */
export const dummyPanItems: MediaCarouselItem[] = [
  {
    id: "pan-1",
    kind: "image",
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&h=800&fit=crop",
    width: 1600,
    height: 800,
    fileName: "wide.jpg",
  },
  {
    id: "pan-2",
    kind: "image",
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=1400&fit=crop",
    width: 800,
    height: 1400,
    fileName: "tall.jpg",
  },
  { ...dummyCarouselItems[3], id: "pan-3" },
];

/** Host-owned upload state: item 1 is uploading at 40 %, item 2 failed. */
export const dummyStatusItems: MediaCarouselItem[] = [
  { ...dummyCarouselItems[0], id: "status-1", status: "uploading", progress: 0.4 },
  {
    ...dummyCarouselItems[1],
    id: "status-2",
    status: "error",
    error: "Network lost. Check your connection.",
  },
  { ...dummyCarouselItems[3], id: "status-3", status: "uploaded" },
];

/** Complete Turkish labels — every key, so no English reaches the screen. */
export const turkishLabels: CarouselComposerLabelsInput = {
  dropzoneTitle: "Fotoğraf ve videoları buraya sürükleyin",
  dropzoneBrowse: "Gözat",
  dropzoneHint: (max) => `veya en fazla ${max} dosya bırakın`,
  dropzoneBusy: "Medya ekleniyor…",
  addMore: "Daha fazla ekle",
  edit: "Düzenle",
  editDone: "Bitti",
  editCancel: "Vazgeç",
  editSaving: "Kaydediliyor…",
  editError: "Düzenleme kaydedilemedi. Tekrar deneyin.",
  remove: "Kaldır",
  removeItem: ({ position, total }) => `${total} öğeden ${position}. öğeyi kaldır`,
  reorderHint: "Sıralamak için sürükleyin",
  maxReached: (max) => `En fazla ${max} öğe eklenebilir`,
  videoNotEditable: "Video düzenleme kullanılamıyor.",
  finishEditingHint: "Sıralamak veya medya eklemek için düzenlemeyi bitirin",
  itemAria: ({ position, total, kind }) =>
    `${total} öğeden ${position}. medya, ${kind === "image" ? "fotoğraf" : "video"}`,
  dismissErrors: "Kapat",
  itemsAdded: (count) => `${count} öğe eklendi`,
  itemRemoved: "Öğe kaldırıldı",
  drag: {
    instructions:
      "Bir öğeyi almak için boşluk tuşuna basın. Sürüklerken ok tuşlarıyla taşıyın. Yeni yerine bırakmak için yeniden boşluk tuşuna, iptal etmek için Escape tuşuna basın.",
    pickedUp: (position) => `${position}. öğe alındı.`,
    over: (position, overPosition) =>
      `${position}. öğe ${overPosition}. konumun üzerinde.`,
    dropped: (position, total) => `Öğe ${total} içinde ${position}. konuma bırakıldı.`,
    droppedInPlace: (position) => `${position}. öğe bırakıldı.`,
    cancelled: (position) => `Sıralama iptal edildi; ${position}. öğe geri döndü.`,
  },
  altLabel: "Alternatif metin",
  altPlaceholder: "Görmeyen kişiler için bu görseli açıklayın",
  altCounter: (length, max) => `${length}/${max}`,
  uploadProgress: (progress, { position, total }) =>
    `${total} öğeden ${position}. yükleniyor, %${Math.round(progress * 100)}`,
  uploadFailed: "Yükleme başarısız",
  retry: "Tekrar dene",
  uploadStatus: ({ status, position, total, error }) => {
    const at = `${total} öğeden ${position}.`;
    switch (status) {
      case "pending":
        return `${at} yükleme bekliyor`;
      case "uploading":
        return `${at} yükleniyor`;
      case "uploaded":
        return `${at} yüklendi`;
      case "error":
        return `${at} yüklenemedi${error ? `: ${error}` : ""}`;
    }
  },
  durationLabel: (formatted) => `Süre ${formatted}`,
  aspectSwitch: "En boy oranı",
  aspectOption: (aspect, format) => {
    if (aspect === "original") return "Orijinal";
    if (aspect === "free") return "Serbest";
    const [w, h] = aspect.split(":");
    return `${format(Number(w))}:${format(Number(h))}`;
  },
  altPlaceholderVideo: "Görmeyen kişiler için bu videoyu açıklayın",
  panHint: "Fotoğrafı yeniden konumlandırın. Sürükleyin veya ok tuşlarını kullanın.",
  moveEarlier: ({ position }) => `${position}. öğeyi öne taşı`,
  moveLater: ({ position }) => `${position}. öğeyi arkaya taşı`,
  moved: (position, total) => `Öğe ${total} içinde ${position}. konuma taşındı.`,
  errors: {
    unsupportedType: ({ type }) => `Desteklenmeyen dosya türü: ${type || "bilinmiyor"}`,
    kindNotAccepted: ({ kind }) =>
      `${kind === "image" ? "Görsel" : "Video"} dosyaları kabul edilmiyor.`,
    fileTooLarge: ({ sizeMb, maxMb }) =>
      `Dosya ${sizeMb.toFixed(1)} MB; en fazla ${maxMb} MB olabilir.`,
    videoTooLong: ({ seconds, maxSeconds }) =>
      `Video ${Math.round(seconds)} sn; en fazla ${maxSeconds} sn olabilir.`,
  },
};

/** Complete Arabic labels — every key. */
export const arabicLabels: CarouselComposerLabelsInput = {
  dropzoneTitle: "اسحب الصور والفيديوهات إلى هنا",
  dropzoneBrowse: "تصفح",
  dropzoneHint: (max) => `أو أفلت حتى ${max} ملفات`,
  dropzoneBusy: "جارٍ إضافة الوسائط…",
  addMore: "إضافة المزيد",
  edit: "تعديل",
  editDone: "تم",
  editCancel: "إلغاء",
  editSaving: "جارٍ الحفظ…",
  editError: "تعذر حفظ التعديل. حاول مرة أخرى.",
  remove: "إزالة",
  removeItem: ({ position, total }) => `إزالة العنصر ${position} من ${total}`,
  reorderHint: "اسحب لإعادة الترتيب",
  maxReached: (max) => `تم بلوغ الحد الأقصى (${max} عناصر)`,
  videoNotEditable: "تعديل الفيديو غير متاح.",
  finishEditingHint: "أنهِ التعديل لإعادة الترتيب أو إضافة وسائط",
  itemAria: ({ position, total, kind }) =>
    `العنصر ${position} من ${total}، ${kind === "image" ? "صورة" : "فيديو"}`,
  dismissErrors: "إغلاق",
  // Arabic number agreement: 1 singular, 2 dual, 3-10 plural noun, 11+ singular accusative.
  itemsAdded: (count) => {
    if (count === 1) return "تمت إضافة عنصر واحد";
    if (count === 2) return "تمت إضافة عنصرين";
    const n = count % 100;
    return n >= 3 && n <= 10 ? `تمت إضافة ${count} عناصر` : `تمت إضافة ${count} عنصرًا`;
  },
  itemRemoved: "تمت إزالة العنصر",
  drag: {
    instructions:
      "لالتقاط عنصر، اضغط على مفتاح المسافة. أثناء السحب، استخدم مفاتيح الأسهم لتحريكه. اضغط المسافة مرة أخرى لإفلاته في موضعه الجديد، أو Escape للإلغاء.",
    pickedUp: (position) => `تم رفع العنصر ${position}.`,
    over: (position, overPosition) => `العنصر ${position} فوق الموضع ${overPosition}.`,
    dropped: (position, total) => `أُفلت العنصر في الموضع ${position} من ${total}.`,
    droppedInPlace: (position) => `أُفلت العنصر ${position}.`,
    cancelled: (position) => `أُلغيت إعادة الترتيب؛ عاد العنصر ${position}.`,
  },
  altLabel: "النص البديل",
  altPlaceholder: "صف هذه الصورة لمن لا يستطيعون رؤيتها",
  altCounter: (length, max) => `${length}/${max}`,
  uploadProgress: (progress, { position, total }) =>
    `العنصر ${position} من ${total} قيد الرفع، ${Math.round(progress * 100)}٪`,
  uploadFailed: "فشل الرفع",
  retry: "إعادة المحاولة",
  uploadStatus: ({ status, position, total, error }) => {
    const at = `العنصر ${position} من ${total}`;
    switch (status) {
      case "pending":
        return `${at} بانتظار الرفع`;
      case "uploading":
        return `${at} قيد الرفع`;
      case "uploaded":
        return `${at} تم رفعه`;
      case "error":
        return `${at} فشل رفعه${error ? `: ${error}` : ""}`;
    }
  },
  durationLabel: (formatted) => `المدة ${formatted}`,
  aspectSwitch: "نسبة العرض إلى الارتفاع",
  aspectOption: (aspect, format) => {
    if (aspect === "original") return "الأصلية";
    if (aspect === "free") return "حرة";
    const [w, h] = aspect.split(":");
    return `${format(Number(w))}:${format(Number(h))}`;
  },
  altPlaceholderVideo: "صف هذا الفيديو لمن لا يستطيعون رؤيته",
  panHint: "أعد وضع الصورة. اسحبها أو استخدم مفاتيح الأسهم.",
  moveEarlier: ({ position }) => `نقل العنصر ${position} إلى موضع أسبق`,
  moveLater: ({ position }) => `نقل العنصر ${position} إلى موضع أبعد`,
  moved: (position, total) => `نُقل العنصر إلى الموضع ${position} من ${total}.`,
  errors: {
    unsupportedType: ({ type }) => `نوع ملف غير مدعوم: ${type || "غير معروف"}`,
    kindNotAccepted: ({ kind }) =>
      `ملفات ${kind === "image" ? "الصور" : "الفيديو"} غير مقبولة هنا.`,
    fileTooLarge: ({ sizeMb, maxMb }) =>
      `حجم الملف ${sizeMb.toFixed(1)} ميغابايت؛ الحد الأقصى ${maxMb} ميغابايت.`,
    videoTooLong: ({ seconds, maxSeconds }) =>
      `مدة الفيديو ${Math.round(seconds)} ث؛ الحد الأقصى ${maxSeconds} ث.`,
  },
};
