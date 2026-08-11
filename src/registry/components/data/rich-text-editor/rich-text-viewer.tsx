import { createStaticEditor, PlateStatic } from "platejs/static";
import { cn } from "@/lib/utils";
import { richTextViewerPlugins } from "./plugins/viewer-kit";
import {
  RICH_TEXT_EMPTY_VALUE,
  type RichTextValue,
  type RichTextViewerProps,
} from "./types";

const VIEWER_PROSE_CLASSES =
  "prose prose-sm dark:prose-invert max-w-none [&_:where(p,h1,h2,h3,h4)]:my-0";

export function RichTextViewer({
  value,
  className,
  fallback,
}: RichTextViewerProps) {
  if (!value || value.length === 0) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <div className={cn(VIEWER_PROSE_CLASSES, className)}>
        <p className="text-muted-foreground">No content.</p>
      </div>
    );
  }

  const editor = createStaticEditor({
    plugins: richTextViewerPlugins,
    value: value as RichTextValue,
  });

  return (
    <div className={cn(VIEWER_PROSE_CLASSES, className)}>
      <PlateStatic editor={editor} value={value as RichTextValue} />
    </div>
  );
}

// Re-export for ergonomic destructuring + the empty-value sentinel.
export { RICH_TEXT_EMPTY_VALUE };
