import type { ReactNode } from "react";
import type { Value } from "platejs";

export type ArticleBodyValue = Value;

export interface ImageUploadResult {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export type ImageUploader = (file: File) => Promise<ImageUploadResult>;

export interface ArticleBodyEditorProps {
  value?: ArticleBodyValue;
  defaultValue?: ArticleBodyValue;
  onChange?: (value: ArticleBodyValue) => void;
  onSave?: (value: ArticleBodyValue) => void | Promise<void>;
  readOnly?: boolean;
  placeholder?: string;
  onImageUpload?: ImageUploader;
  className?: string;
  toolbarClassName?: string;
  contentClassName?: string;
  containerClassName?: string;
  hideToolbar?: boolean;
  autoFocus?: boolean;
}

export interface ArticleBodyViewerProps {
  value: ArticleBodyValue;
  className?: string;
  fallback?: ReactNode;
}

export const ARTICLE_BODY_EMPTY_VALUE: ArticleBodyValue = [
  { type: "p", children: [{ text: "" }] },
];

export const ARTICLE_BODY_DEFAULT_PLACEHOLDER = "Write your article here…";
