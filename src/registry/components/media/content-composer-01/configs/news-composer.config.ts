import type { FieldConfig, FormSchema } from "@/registry/components/forms/json-form/json-form";
import type {
  ComposerConfig,
  ComposerDraft,
  ContentCardItem,
  ContentPaywall,
  ContentSensitivity,
  ContentTypeAdapter,
  InitialSource,
  MediaSlotValue,
  NewsArticleAuthor,
  NewsVisibility,
} from "../types";
import type { AuthorSourceConfig } from "../parts/field-author-picker";

/**
 * The news content type — one `ComposerConfig` (5 steps) + a co-located adapter
 * pair (QP-7). The config SHAPE is JSON-round-trippable; the one function value
 * (`authorSource`) is injected via the factory rather than carried in JSON
 * (consumer-specific), so the static config needs zero hydration entries.
 *
 * Steps: headline (metadata) → hero (media) → body (Plate) → details (metadata)
 * → visibility & gates (metadata, optional).
 */

const NEWS_STEP = {
  headline: "headline",
  hero: "hero",
  body: "body",
  meta: "meta",
  gates: "gates",
} as const;

// ─── json-form schema fragments ─────────────────────────────────────────────

const headlineSchema: FormSchema = {
  fields: [
    {
      name: "title",
      type: "text",
      label: "Headline",
      placeholder: "Write the headline…",
      validators: { required: "A headline is required." },
    },
    {
      name: "slug",
      type: "text",
      label: "Slug",
      placeholder: "auto / custom-url-slug",
      description: "Optional. Leave blank to let the backend derive it.",
    },
    {
      name: "excerpt",
      type: "textarea",
      label: "Excerpt / lead",
      placeholder: "A short summary shown on cards and in search…",
      rows: 3,
    },
  ],
};

const gatesSchema: FormSchema = {
  fields: [
    {
      name: "visibility",
      type: "select",
      label: "Visibility",
      defaultValue: "public",
      options: [
        { value: "public", label: "Public" },
        { value: "members", label: "Members" },
        { value: "subscribers", label: "Subscribers" },
        { value: "staff", label: "Staff" },
        { value: "unlisted", label: "Unlisted" },
      ],
    },
    { name: "isBreaking", type: "switch", label: "Breaking news" },
    { name: "isFeatured", type: "switch", label: "Featured" },
    { name: "isPinned", type: "switch", label: "Pinned" },
    { name: "isExclusive", type: "switch", label: "Exclusive" },
    { name: "isSponsored", type: "switch", label: "Sponsored" },
    {
      name: "sponsorLabel",
      type: "text",
      label: "Sponsor",
      placeholder: "Sponsored by…",
      visibleWhen: { field: "isSponsored", truthy: true },
    },
    { name: "sensitivity.isSensitive", type: "switch", label: "Sensitive content" },
    {
      name: "sensitivity.reason",
      type: "text",
      label: "Sensitivity reason",
      placeholder: "e.g. graphic imagery",
      visibleWhen: { field: "sensitivity.isSensitive", truthy: true },
    },
    { name: "paywall.isPaywalled", type: "switch", label: "Paywall" },
    {
      name: "paywall.tier",
      type: "text",
      label: "Paywall tier",
      placeholder: "subscribers",
      visibleWhen: { field: "paywall.isPaywalled", truthy: true },
    },
  ],
};

function metaSchema(authorSource?: AuthorSourceConfig): FormSchema {
  return {
    fields: [
      { name: "category", type: "text", label: "Category", placeholder: "World, Tech, Sport…" },
      {
        name: "authorEntity",
        type: "author-picker",
        label: "Author",
        dependsOn: [],
        // authorSource is composer-owned (NOT a json-form FieldConfig key, which
        // is closed). Injected here via the factory; cast suppresses the
        // excess-property check.
        config: { authorSource } as FieldConfig,
      },
      { name: "topics", type: "tags", label: "Topics", dependsOn: [] },
      { name: "tags", type: "tags", label: "Tags", dependsOn: [] },
      { name: "readTime", type: "number", label: "Read time (min)", min: 0 },
      { name: "language", type: "text", label: "Language (BCP-47)", placeholder: "en" },
    ],
  };
}

// ─── Config factory ─────────────────────────────────────────────────────────

export interface NewsComposerConfigOptions {
  /** async author loader for the author-picker field; absent → read-only chip */
  authorSource?: AuthorSourceConfig;
}

export function createNewsComposerConfig(
  opts: NewsComposerConfigOptions = {},
): ComposerConfig {
  return {
    id: "news",
    version: "1.0.0",
    title: "News article",
    adapterId: "news-content-item",
    presentation: "auto",
    autosave: { enabled: true, debounceMs: 800 },
    publishModes: ["draft", "publish", "schedule"],
    steps: [
      {
        id: NEWS_STEP.headline,
        title: "Headline",
        slot: "metadataFields",
        slotConfig: { columns: 1, schema: headlineSchema },
        validation: { mode: "all-fields-valid" },
      },
      {
        id: NEWS_STEP.hero,
        title: "Cover image",
        slot: "mediaSlot",
        slotConfig: {
          fieldName: "hero",
          enabledModes: ["photo"],
          enabledTools: ["crop", "filters", "adjust"],
          mediaSources: ["camera", "upload"],
          aspect: "16:9",
          presentation: "inline",
        },
        validation: {
          mode: "custom",
          rules: [{ field: "hero", mediaRequired: true, message: "A cover image is required." }],
        },
      },
      {
        id: NEWS_STEP.body,
        title: "Article",
        slot: "bodySlot",
        slotConfig: { substrate: "plate", fieldName: "body", placeholder: "Write the article…" },
        validation: {
          mode: "custom",
          rules: [{ field: "body", minLength: 1, message: "Write the article body." }],
        },
      },
      {
        id: NEWS_STEP.meta,
        title: "Details",
        slot: "metadataFields",
        slotConfig: { columns: 2, schema: metaSchema(opts.authorSource) },
      },
      {
        id: NEWS_STEP.gates,
        title: "Visibility & gates",
        slot: "metadataFields",
        slotConfig: { columns: 2, schema: gatesSchema },
        optional: true,
      },
    ],
  };
}

/** Default news config (no author loader — the author field is read-only). */
export const newsComposerConfig: ComposerConfig = createNewsComposerConfig();

// ─── Coercion helpers ───────────────────────────────────────────────────────

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v : undefined;
}
function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}
function bool(v: unknown): boolean {
  return v === true;
}
function strArr(v: unknown): string[] | undefined {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string")
    ? (v as string[])
    : undefined;
}
function toIso(v: string | Date | number): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "number") return new Date(v).toISOString();
  return v;
}

function metaBag(draft: ComposerDraft, stepId: string): Record<string, unknown> {
  const sv = draft.steps[stepId];
  return sv?.slot === "metadataFields" ? sv.value : {};
}
function mediaValue(draft: ComposerDraft, stepId: string): MediaSlotValue | undefined {
  const sv = draft.steps[stepId];
  return sv?.slot === "mediaSlot" ? sv.value : undefined;
}

function buildAuthorEntity(meta: Record<string, unknown>): NewsArticleAuthor | undefined {
  const a = meta.authorEntity as Record<string, unknown> | undefined;
  if (!a) return undefined;
  const id = str(a.id);
  const name = str(a.name);
  if (!id || !name) return undefined;
  return { id, name, ...(str(a.avatar) ? { avatar: str(a.avatar)! } : {}) };
}

function buildSensitivity(gates: Record<string, unknown>): ContentSensitivity | undefined {
  const s = gates.sensitivity as Record<string, unknown> | undefined;
  if (!s || bool(s.isSensitive) !== true) return undefined;
  return { isSensitive: true, ...(str(s.reason) ? { reason: str(s.reason)! } : {}) };
}

function buildPaywall(gates: Record<string, unknown>): ContentPaywall | undefined {
  const p = gates.paywall as Record<string, unknown> | undefined;
  if (!p || bool(p.isPaywalled) !== true) return undefined;
  return { isPaywalled: true, ...(str(p.tier) ? { tier: str(p.tier)! } : {}) };
}

function timestampsForStatus(draft: ComposerDraft, ctx: { now: Date }) {
  const nowIso = ctx.now.toISOString();
  switch (draft.status) {
    case "published":
      return { publishedAt: nowIso, updatedAt: nowIso };
    case "scheduled":
      return draft.scheduledFor
        ? { scheduledFor: draft.scheduledFor, updatedAt: nowIso }
        : { updatedAt: nowIso };
    default:
      // "draft" + "archived" (archived is reachable only via inverse re-seed):
      return { updatedAt: nowIso };
  }
}

// ─── Adapter (forward + inverse) ─────────────────────────────────────────────

function toContentItem(
  draft: ComposerDraft,
  ctx: { now: Date; currentUser?: { id: string; name: string } },
): ContentCardItem {
  const headline = metaBag(draft, NEWS_STEP.headline);
  const meta = metaBag(draft, NEWS_STEP.meta);
  const gates = metaBag(draft, NEWS_STEP.gates);
  const media = mediaValue(draft, NEWS_STEP.hero);

  const id = draft.contentId ?? `news-${ctx.now.getTime()}`;
  const title = str(headline.title);
  if (!title) {
    throw new Error("news adapter: `title` is required — the gate should have blocked publish.");
  }
  const image = str(media?.exportedUrl);
  if (!image) {
    throw new Error(
      "news adapter: a cover image is required (upload the hero before publishing).",
    );
  }

  const authorEntity = buildAuthorEntity(meta);
  const sensitivity = buildSensitivity(gates);
  const paywall = buildPaywall(gates);

  return {
    id,
    title,
    image,
    status: draft.status,
    ...(str(headline.slug) ? { slug: str(headline.slug)! } : {}),
    ...(str(headline.excerpt) ? { excerpt: str(headline.excerpt)! } : {}),
    ...(str(meta.category) ? { category: str(meta.category)! } : {}),
    ...(num(meta.readTime) !== undefined ? { readTime: num(meta.readTime)! } : {}),
    ...(str(meta.language) ? { language: str(meta.language)! } : {}),
    ...(strArr(meta.topics) ? { topics: strArr(meta.topics)! } : {}),
    ...(strArr(meta.tags) ? { tags: strArr(meta.tags)! } : {}),
    ...(str(gates.visibility) ? { visibility: str(gates.visibility)! as NewsVisibility } : {}),
    ...(bool(gates.isPinned) ? { isPinned: true } : {}),
    ...(bool(gates.isFeatured) ? { isFeatured: true } : {}),
    ...(bool(gates.isBreaking) ? { isBreaking: true } : {}),
    ...(bool(gates.isExclusive) ? { isExclusive: true } : {}),
    ...(bool(gates.isSponsored) ? { isSponsored: true } : {}),
    ...(str(gates.sponsorLabel) ? { sponsorLabel: str(gates.sponsorLabel)! } : {}),
    ...(authorEntity ? { authorEntity } : {}),
    ...(sensitivity ? { sensitivity } : {}),
    ...(paywall ? { paywall } : {}),
    ...timestampsForStatus(draft, ctx),
    // OMITTED (never zeroed): likeCount / commentCount / shareCount /
    // bookmarkCount / views / isLiked / isBookmarked / quotedArticle — assigning
    // them would clobber real engagement on the page's PATCH/merge re-edit.
  };
}

function fromContentItem(item: ContentCardItem): {
  draft: Partial<ComposerDraft>;
  mediaInitialSource?: InitialSource;
} {
  const draft: Partial<ComposerDraft> = {
    contentType: "news",
    contentId: item.id,
    status: item.status ?? "draft",
    ...(item.scheduledFor !== undefined ? { scheduledFor: toIso(item.scheduledFor) } : {}),
    steps: {
      [NEWS_STEP.headline]: {
        slot: "metadataFields",
        value: {
          title: item.title,
          ...(item.slug !== undefined ? { slug: item.slug } : {}),
          ...(item.excerpt !== undefined ? { excerpt: item.excerpt } : {}),
        },
      },
      [NEWS_STEP.meta]: {
        slot: "metadataFields",
        value: {
          ...(item.category !== undefined ? { category: item.category } : {}),
          ...(item.topics !== undefined ? { topics: item.topics } : {}),
          ...(item.tags !== undefined ? { tags: item.tags } : {}),
          ...(item.readTime !== undefined ? { readTime: item.readTime } : {}),
          ...(item.language !== undefined ? { language: item.language } : {}),
          ...(item.authorEntity ? { authorEntity: item.authorEntity } : {}),
        },
      },
      [NEWS_STEP.gates]: {
        slot: "metadataFields",
        value: {
          ...(item.visibility !== undefined ? { visibility: item.visibility } : {}),
          ...(item.isPinned !== undefined ? { isPinned: item.isPinned } : {}),
          ...(item.isFeatured !== undefined ? { isFeatured: item.isFeatured } : {}),
          ...(item.isBreaking !== undefined ? { isBreaking: item.isBreaking } : {}),
          ...(item.isExclusive !== undefined ? { isExclusive: item.isExclusive } : {}),
          ...(item.isSponsored !== undefined ? { isSponsored: item.isSponsored } : {}),
          ...(item.sponsorLabel !== undefined ? { sponsorLabel: item.sponsorLabel } : {}),
          ...(item.sensitivity ? { sensitivity: item.sensitivity } : {}),
          ...(item.paywall ? { paywall: item.paywall } : {}),
        },
      },
      [NEWS_STEP.hero]: {
        slot: "mediaSlot",
        value: { exportedUrl: item.image },
      },
      // NO body step — the body re-seeds via the separate initialBody leg.
    },
  };
  return { draft, mediaInitialSource: { kind: "url", url: item.image, mode: "photo" } };
}

export const newsContentItemAdapter: ContentTypeAdapter<ContentCardItem> = {
  contentType: "news",
  toContentItem,
  fromContentItem,
};
