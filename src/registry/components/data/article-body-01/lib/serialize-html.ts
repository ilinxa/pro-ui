import { createStaticEditor, serializeHtml } from "platejs/static";

import { articleBodyViewerPlugins } from "../plugins/viewer-kit";
import type { ArticleBodyValue } from "../types";

export interface SerializeHtmlOptions {
  /** Drop className attributes from the output. Default: false. */
  stripClassNames?: boolean;
  /**
   * Class names to keep when `stripClassNames` is true. Useful when you
   * want to preserve specific design-system classes but drop the rest.
   */
  preserveClassNames?: string[];
  /**
   * Drop data-slate-* attributes from the output. Default: true —
   * exported HTML usually shouldn't carry editor metadata.
   */
  stripDataAttributes?: boolean;
}

/**
 * Serialize an ArticleBodyValue to a static HTML string.
 *
 * Useful at export boundaries — RSS feeds, email digests, OG tag previews,
 * static-site rendering. Don't round-trip through HTML for storage; keep
 * JSON canonical and call this when you need the HTML form.
 *
 * Async because Plate uses `react-dom/server` under the hood. Server-only;
 * don't call from client components.
 */
export async function serializeArticleBodyToHtml(
  value: ArticleBodyValue,
  options: SerializeHtmlOptions = {}
): Promise<string> {
  const {
    stripClassNames = false,
    preserveClassNames,
    stripDataAttributes = true,
  } = options;

  const editor = createStaticEditor({
    plugins: articleBodyViewerPlugins,
    value,
  });

  return serializeHtml(editor, {
    stripClassNames,
    preserveClassNames,
    stripDataAttributes,
  });
}
