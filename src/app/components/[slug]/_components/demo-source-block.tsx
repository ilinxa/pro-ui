import { CodeBlock } from "@/registry/components/code/code-block";

// Inline code-block view of the demo source between Preview and Usage. The
// Phase 1 "canonical code" surface — closes the no-code-on-page gap without
// touching the 41 prose-rich usage.tsx files. Theme follows the page (Shiki
// dual-theme CSS variables); copy + expand-to-modal built-in.
export function DemoSourceBlock({
  source,
  filename = "demo.tsx",
  lang = "tsx",
}: {
  source: string;
  filename?: string;
  lang?: string;
}) {
  return (
    <CodeBlock
      value={source}
      filename={filename}
      lang={lang}
      mode="view"
      showCopy
      showLineNumbers
      showExpand
      maxLines={28}
    />
  );
}
