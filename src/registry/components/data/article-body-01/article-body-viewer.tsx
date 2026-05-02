import { createStaticEditor, PlateStatic } from "platejs/static";
import { cn } from "@/lib/utils";
import { articleBodyViewerPlugins } from "./plugins/viewer-kit";
import {
  ARTICLE_BODY_EMPTY_VALUE,
  type ArticleBodyValue,
  type ArticleBodyViewerProps,
} from "./types";

const VIEWER_PROSE_CLASSES =
  "prose prose-sm dark:prose-invert max-w-none [&_:where(p,h1,h2,h3,h4)]:my-0";

export function ArticleBodyViewer({
  value,
  className,
  fallback,
}: ArticleBodyViewerProps) {
  if (!value || value.length === 0) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <div className={cn(VIEWER_PROSE_CLASSES, className)}>
        <p className="text-muted-foreground">No content.</p>
      </div>
    );
  }

  const editor = createStaticEditor({
    plugins: articleBodyViewerPlugins,
    value: value as ArticleBodyValue,
  });

  return (
    <div className={cn(VIEWER_PROSE_CLASSES, className)}>
      <PlateStatic editor={editor} value={value as ArticleBodyValue} />
    </div>
  );
}

// Re-export for ergonomic destructuring + the empty-value sentinel.
export { ARTICLE_BODY_EMPTY_VALUE };
