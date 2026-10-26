import type {
  FilterBarCategoryItem,
  FilterBarLabels,
} from "./types";

export const DUMMY_CATEGORIES_EN: FilterBarCategoryItem[] = [
  { value: "urban-development", label: "Urban Development" },
  { value: "sustainability", label: "Sustainability" },
  { value: "technology", label: "Technology" },
  { value: "events", label: "Events" },
  { value: "announcement", label: "Announcement" },
  { value: "research", label: "Research" },
];

export const DUMMY_LABELS_TR: FilterBarLabels = {
  searchPlaceholder: "Haber ara...",
  searchAriaLabel: "Haber arama",
  allLabel: "Tümü",
  dateButtonText: "Tarih Filtrele",
  clearDateLabel: "Tarihi temizle",
  clearDateText: "Tarihi Temizle",
  resultsCountText: (count) => `${count} haber bulundu`,
  categoriesAriaLabel: "Kategori filtresi",
};

/** Custom Turkish-locale date-range formatter via `Intl.DateTimeFormat`. */
const TR_SHORT = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
});

export const formatDateRangeTR = ({
  from,
  to,
}: {
  from: Date;
  to: Date;
}): string => `${TR_SHORT.format(from)} - ${TR_SHORT.format(to)}`;

export const DUMMY_CATEGORIES_AR: FilterBarCategoryItem[] = [
  { value: "urban-development", label: "التطوير العمراني" },
  { value: "sustainability", label: "الاستدامة" },
  { value: "technology", label: "التقنية" },
  { value: "events", label: "الفعاليات" },
];

export const DUMMY_LABELS_AR: FilterBarLabels = {
  searchPlaceholder: "ابحث في الأخبار...",
  searchAriaLabel: "بحث في الأخبار",
  allLabel: "الكل",
  dateButtonText: "تصفية حسب التاريخ",
  clearDateLabel: "مسح تصفية التاريخ",
  clearDateText: "مسح التاريخ",
  resultsCountText: (count) => `تم العثور على ${count} خبر`,
  categoriesAriaLabel: "تصفية حسب الفئة",
};
