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

/** Embed hardening options shared by the editor, viewer and serializer. */
export interface RichTextEmbedPolicyProps {
  /**
   * Hostnames allowed to render as an iframe. `*.example.com` matches any
   * subdomain. REPLACES the default list (YouTube, youtube-nocookie, Vimeo
   * player). Embeds on other hosts render as a plain link.
   */
  embedAllowList?: string[];
  /** Custom predicate; wins over `embedAllowList`. Receives the parsed https URL. */
  isEmbedAllowed?: (url: URL) => boolean;
}

export interface RichTextEditorProps extends RichTextEmbedPolicyProps {
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

export interface RichTextViewerProps extends RichTextEmbedPolicyProps {
  value: RichTextValue;
  className?: string;
  fallback?: ReactNode;
}

export const RICH_TEXT_EMPTY_VALUE: RichTextValue = [
  { type: "p", children: [{ text: "" }] },
];

export const RICH_TEXT_DEFAULT_PLACEHOLDER = "Write your article here…";
