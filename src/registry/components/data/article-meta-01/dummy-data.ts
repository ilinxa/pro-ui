import { Calendar, Clock, Eye, GitCommit, PlayCircle, Tag, User } from "lucide-react";
import type { ArticleMetaItem } from "./types";

export const ARTICLE_META_01_DUMMY: ReadonlyArray<ArticleMetaItem> = [
  { id: "author", icon: User, value: "Maya Chen", href: "/team/maya-chen" },
  { id: "date", icon: Calendar, value: "Apr 28, 2026" },
  { id: "read", icon: Clock, value: "5 min read", ariaLabel: "5 minute read" },
  { id: "views", icon: Eye, value: "12.4k", ariaLabel: "12,400 views" },
];

export const ARTICLE_META_01_DUMMY_CENTERED: ReadonlyArray<ArticleMetaItem> = [
  { id: "author", icon: User, value: "Daniel Park" },
  { id: "date", icon: Calendar, value: "March 15, 2026" },
];

export const ARTICLE_META_01_DUMMY_DOCS: ReadonlyArray<ArticleMetaItem> = [
  { id: "author", icon: User, value: "@maya", href: "/team/maya" },
  { id: "updated", icon: GitCommit, value: "Updated Apr 28" },
  { id: "version", icon: Tag, value: "v3.2.1" },
];

export const ARTICLE_META_01_DUMMY_VIDEO: ReadonlyArray<ArticleMetaItem> = [
  { id: "channel", icon: User, value: "Cinema Lab", href: "/channels/cinema-lab" },
  { id: "uploaded", icon: Calendar, value: "2 days ago" },
  { id: "duration", icon: PlayCircle, value: "12:34" },
  { id: "views", icon: Eye, value: "1.2M" },
];

export const ARTICLE_META_01_DUMMY_TEXT_ONLY: ReadonlyArray<ArticleMetaItem> = [
  { id: "category", value: "ENVIRONMENT" },
  { id: "issue", value: "Issue #42" },
  { id: "page", value: "Page 18" },
];
