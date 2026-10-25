"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { StoryComposer } from "./story-composer";
import { SAMPLE_BRAND_STICKERS } from "./dummy-data";
import type { PublishedStory, StoryComposerLabels } from "./types";

/**
 * A complete Arabic label set: every story-composer key plus the nested
 * media-editor labels, so nothing in the RTL tab falls back to English.
 */
const AR_LABELS: StoryComposerLabels = {
  composerLabel: "إنشاء قصة",
  composerDescription:
    "أنشئ قصة جديدة بالتقاط صورة أو تسجيل فيديو أو كتابة نص فقط. اضغط زر الإغلاق للخروج.",
  modePhoto: "صورة",
  modeVideo: "فيديو",
  modeText: "نص",
  shutterPhoto: "التقاط صورة",
  shutterVideoStart: "بدء التسجيل",
  shutterVideoStop: "إيقاف التسجيل",
  galleryPicker: "اختيار من المعرض",
  switchCamera: "تبديل الكاميرا",
  permissionDeniedTitle: "الوصول إلى الكاميرا محظور",
  permissionDeniedBody:
    "نحتاج إلى إذن الكاميرا لالتقاط قصتك. فعّله من إعدادات المتصفح أو اختر ملفًا من المعرض.",
  permissionRetry: "حاول مرة أخرى",
  permissionUsePicker: "استخدم المعرض بدلًا من ذلك",
  permissionRequesting: "جارٍ طلب الكاميرا…",
  toolText: "نص",
  toolDraw: "رسم",
  toolStickers: "ملصقات",
  toolFilters: "فلاتر",
  toolAdjust: "ضبط",
  toolCrop: "اقتصاص",
  adjustBrightness: "السطوع",
  adjustContrast: "التباين",
  adjustSaturation: "التشبع",
  adjustBlur: "التمويه",
  drawColor: "اللون",
  drawBrush: "حجم الفرشاة",
  drawEraser: "ممحاة",
  textPlaceholder: "اكتب شيئًا…",
  textFontFamily: "الخط",
  textFontSize: "الحجم",
  publish: "نشر",
  publishing: "جارٍ النشر…",
  published: "تم النشر",
  close: "إغلاق",
  discardConfirmTitle: "تجاهل القصة؟",
  discardConfirmBody: "ستفقد الوسائط التي التقطتها وتعديلاتك. لا يمكن التراجع عن ذلك.",
  discardConfirm: "تجاهل",
  discardCancel: "متابعة التعديل",
  uploadFailedTitle: "فشل الرفع",
  uploadFailedBody: "حدث خطأ أثناء النشر. قصتك ما زالت هنا.",
  uploadRetry: "حاول مرة أخرى",
  uploadCancel: "إلغاء",
  uploadErrorNoDestination: "مرّر uploadUrl أو uploader للنشر.",
  uploadErrorHttp: (status) => `فشل الرفع (HTTP ${status})`,
  uploadErrorNetwork: "خطأ في شبكة الرفع",
  uploadErrorBadResponse: "استجابة الرفع ليست JSON",
  uploadCancelled: "تم إلغاء الرفع",
  detailsTitle: "أضف التفاصيل",
  detailsBack: "رجوع",
  captionLabel: "التعليق",
  captionPlaceholder: "اكتب تعليقًا…",
  captionCounter: (count, max) => `${count} / ${max}`,
  captionRequired: "أضف تعليقًا للنشر",
  captionTooLong: (max) => `التعليق طويل جدًا (الحد الأقصى ${max})`,
  recordingLabel: "جارٍ التسجيل",
  editor: {
    shell: {
      title: "محرر الوسائط",
      description: "التقط صورة أو سجّل فيديو أو اكتب نصًا فقط.",
      back: "رجوع",
      apply: "تطبيق",
      cancel: "إلغاء",
      backToCapture: "العودة إلى الالتقاط",
      editTools: "أدوات التعديل",
    },
    capture: {
      requestingCamera: "جارٍ طلب الكاميرا…",
      cameraIdle: {
        title: "الكاميرا جاهزة",
        body: "اضغط أدناه لتفعيل الكاميرا أو اختر ملفًا من المعرض.",
        enableCta: "تفعيل الكاميرا",
      },
      cameraDenied: {
        title: "الوصول إلى الكاميرا محظور",
        body: "نحتاج إلى إذن الكاميرا. فعّله من إعدادات المتصفح أو اختر ملفًا من المعرض.",
        retryCta: "حاول مرة أخرى",
        useGalleryCta: "استخدم المعرض بدلًا من ذلك",
      },
      noCameraTitle: "لا توجد كاميرا متاحة",
      cameraErrorTitle: "الكاميرا غير متاحة",
      galleryButton: "اختيار من المعرض",
      switchCamera: "تبديل الكاميرا",
      modes: { photo: "صورة", video: "فيديو", text: "نص" },
      shutter: {
        photo: "التقاط صورة",
        videoStart: "بدء التسجيل",
        videoStop: "إيقاف التسجيل",
      },
      recording: "جارٍ التسجيل",
      connectCta: "الاتصال بالكاميرا",
      connectHint: "اختر وضعًا من الأعلى أو انتقل مباشرة إلى الكاميرا.",
      errors: {
        videoUnsupported: "تسجيل الفيديو غير مدعوم هنا",
        videoFailed: "فشل تسجيل الفيديو",
        videoCodecUnavailable: "لا يمكن تسجيل أي من صيغ الفيديو المسموح بها في هذا المتصفح",
      },
    },
    toolbar: {
      text: "نص",
      draw: "رسم",
      stickers: "ملصقات",
      filters: "فلاتر",
      adjust: "ضبط",
      crop: "اقتصاص",
    },
    adjust: { brightness: "السطوع", contrast: "التباين", saturation: "التشبع", blur: "التمويه" },
    draw: { color: "اللون", brushSize: "حجم الفرشاة", eraser: "ممحاة" },
    text: {
      placeholder: "اكتب شيئًا…",
      fontFamily: "الخط",
      fontSize: "الحجم",
      alignLeft: "محاذاة لليسار",
      alignCenter: "توسيط",
      alignRight: "محاذاة لليمين",
      delete: "حذف النص",
      background: "الخلفية",
    },
    color: { hex: "Hex", swatch: (color) => `اللون ${color}` },
    crop: { free: "حر", aspectCount: (_count, formatted) => `(${formatted} نسب اقتصاص)` },
    canvas: {
      label: "لوحة محرر الوسائط — الأسهم للتحريك، +/- للتكبير، 0 للإعادة",
      resetZoom: "إعادة التكبير",
      resizeHandle: (corner) => `تغيير الحجم ${corner}`,
    },
    discard: {
      title: "تجاهل؟",
      body: "ستفقد الوسائط التي التقطتها وتعديلاتك.",
      cancel: "متابعة التعديل",
      confirm: "تجاهل",
    },
    intake: {
      prompt: "اختر صورة أو فيديو من جهازك.",
      unknownType: "غير معروف",
      unsupportedType: (fileType) => `نوع الملف غير مدعوم: ${fileType}`,
      fileTooLarge: (_sizeMb, _maxMb, sizeFormatted, maxFormatted) =>
        `حجم الملف ${sizeFormatted} م.ب — الحد الأقصى ${maxFormatted} م.ب`,
    },
    empty: {
      noSource: "لم يتم تقديم مصدر",
      noSourceHint: "مرّر initialSource أو فعّل وضع التقاط في enabledModes.",
      noSourceAria: "محرر الوسائط: لم يتم تقديم مصدر. مرّر initialSource أو فعّل وضع التقاط.",
      loadFailed: "تعذر تحميل المصدر",
      attempted: "المحاولة",
      enabled: "مفعّل",
      type: "النوع",
      blank: "(فارغ)",
      none: "(لا شيء)",
      noCaptureSource: "لا يوجد مصدر التقاط متاح",
      aspect: "النسبة:",
      sources: "المصادر:",
    },
  },
};

// Demo-site uploader — pretends to upload (1.5s) and returns the blob's own
// object URL. Keeps every tab able to round-trip Publish → Done without a
// real backend; consumers wire `uploadUrl` or their own `uploader` for prod.
async function demoUploader(blob: Blob) {
  await new Promise((r) => setTimeout(r, 1500));
  return {
    url: URL.createObjectURL(blob),
    thumbnailUrl: URL.createObjectURL(blob),
  };
}

export default function StoryComposerDemo() {
  return (
    <Tabs defaultValue="default" className="flex flex-col gap-4">
      <SwipeTabsList>
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="photo-only">Photo only</TabsTrigger>
        <TabsTrigger value="custom-stickers">Custom stickers</TabsTrigger>
        <TabsTrigger value="custom-uploader">Custom uploader</TabsTrigger>
        <TabsTrigger value="no-confirm">No discard guard</TabsTrigger>
        <TabsTrigger value="caption">Caption step</TabsTrigger>
        <TabsTrigger value="rtl">RTL</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="default">
        <ComposerLauncher
          description="All three modes (photo / video / text), 36 built-in emoji stickers. Wired to a fake uploader for the docs site — consumers pass `uploadUrl` or a real `uploader` for prod."
          props={{ uploader: demoUploader }}
        />
      </TabsContent>

      <TabsContent value="photo-only">
        <ComposerLauncher
          description="hideModes={['video','text']} — photo-only flow (useful for product or content surfaces that don't accept video)."
          props={{
            uploader: demoUploader,
            hideModes: ["video", "text"],
          }}
        />
      </TabsContent>

      <TabsContent value="custom-stickers">
        <ComposerLauncher
          description="Adds a consumer-supplied sticker set (Ilinxa brand) alongside the built-in catalog. Toggle replaceBuiltinStickers to ship consumer-only."
          props={{
            uploader: demoUploader,
            stickers: [SAMPLE_BRAND_STICKERS],
          }}
        />
      </TabsContent>

      <TabsContent value="custom-uploader">
        <ComposerLauncher
          description="Custom async uploader — useful for S3 pre-signed PUT, Cloudinary direct upload, Mux. The composer hands the blob + metadata to your function and you return { url }."
          props={{ uploader: demoUploader }}
        />
      </TabsContent>

      <TabsContent value="no-confirm">
        <ComposerLauncher
          description="confirmOnDiscard={false} — silent discard on close, matching Instagram's behavior. Don't ship this in production unless you have a separate draft-recovery path."
          props={{ uploader: demoUploader, confirmOnDiscard: false }}
        />
      </TabsContent>

      <TabsContent value="caption">
        <ComposerLauncher
          description="caption={{ maxLength: 120, required: true }} — Publish opens a details step (caption + counter, Back / Publish). Upload-only: no camera tab unless you pass capture={mediaCapture}."
          props={{
            uploader: demoUploader,
            caption: { maxLength: 120, required: true },
          }}
        />
      </TabsContent>

      <TabsContent value="rtl">
        <div dir="rtl" lang="ar">
          <ComposerLauncher
            rtl
            description="dir=rtl — the document direction flips while the composer is open; labels are Arabic. The publish bar and details step use logical (start / end) positioning."
            props={{
              uploader: demoUploader,
              caption: { maxLength: 120 },
              locale: "ar",
              labels: AR_LABELS,
            }}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

interface ComposerLauncherProps {
  description: string;
  props: Partial<React.ComponentProps<typeof StoryComposer>>;
  /** Flip the document direction to rtl while the composer is open (portal content). */
  rtl?: boolean;
}

function ComposerLauncher({ description, props, rtl }: ComposerLauncherProps) {
  const [open, setOpen] = useState(false);

  // The composer renders in a portal outside any local dir="rtl" wrapper.
  useEffect(() => {
    if (!rtl || !open) return;
    const root = document.documentElement;
    const prev = root.dir;
    root.dir = "rtl";
    return () => {
      root.dir = prev;
    };
  }, [rtl, open]);

  const [lastPublished, setLastPublished] = useState<PublishedStory | null>(
    null,
  );

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {description}
      </p>
      <Button onClick={() => setOpen(true)}>Open composer</Button>
      <StoryComposer
        isOpen={open}
        onClose={() => setOpen(false)}
        onPublished={(story) => {
          setLastPublished(story);
          setOpen(false);
        }}
        {...props}
      />
      {lastPublished ? (
        <pre className="max-w-md overflow-x-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
          {JSON.stringify(lastPublished, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
