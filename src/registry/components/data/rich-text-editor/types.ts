import type { ReactNode } from "react";
import type { Value } from "platejs";

export type RichTextValue = Value;

export interface ImageUploadResult {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export type ImageUploader = (file: File) => Promise<ImageUploadResult>;

export interface RichTextEditorProps {
  value?: RichTextValue;
  defaultValue?: RichTextValue;
  onChange?: (value: RichTextValue) => void;
  onSave?: (value: RichTextValue) => void | Promise<void>;
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

export interface RichTextViewerProps {
  value: RichTextValue;
  className?: string;
  fallback?: ReactNode;
}

export const RICH_TEXT_EMPTY_VALUE: RichTextValue = [
  { type: "p", children: [{ text: "" }] },
];

export const RICH_TEXT_DEFAULT_PLACEHOLDER = "Write your article here…";
