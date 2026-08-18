export default function CodeBlockUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        <code>CodeBlock</code> is the substrate for every &ldquo;render code professionally&rdquo;
        surface in the library: chat assistants, fenced markdown blocks, JSON/config viewers,
        card-tree &ldquo;code&rdquo; sections, virtual terminal walkthroughs, and snippet editors.
        Three modes (<code>view</code> / <code>edit</code> / <code>terminal</code>) cover the
        common cases. Streaming-friendly. Language-agnostic.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic — view</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { CodeBlock } from "@/components/code-block";

<CodeBlock filename="app.tsx" value={code} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Edit mode (controlled)</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<CodeBlock
  mode="edit"
  lang="ts"
  filename="greet.ts"
  value={code}
  onChange={({ value }) => setCode(value)}
  onSave={({ value }) => save(value)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Streaming (chat assistant)</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<CodeBlock
  lang="ts"
  value={partial}
  streaming={isStillStreaming}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Terminal</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<CodeBlock
  mode="terminal"
  showTrafficLights
  lines={[
    { kind: "input",  text: "$ pnpm install" },
    { kind: "output", text: "Resolving... done" },
    { kind: "error",  text: "ENOENT: no such file" },
  ]}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Content-Security-Policy (read this before self-hosting)
      </h3>
      <p className="text-muted-foreground">
        The default highlighter engine is <strong>WebAssembly</strong>. Under a strict CSP your{" "}
        <code>script-src</code> must include <code>&apos;wasm-unsafe-eval&apos;</code>, or the
        browser refuses the compile outright (
        <em>Wasm code generation disallowed by embedder</em>) and highlighting can never run — no
        component can override its host&apos;s CSP. Either widen the policy, or switch engines:
      </p>
      <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
        {`// No WebAssembly at all — for CSP-restricted hosts.
// Slightly narrower grammar coverage is the trade.
<CodeBlock value={code} lang="ts" regexEngine="javascript" />`}
      </pre>
      <p className="mt-2 text-muted-foreground">
        Highlighters are cached <strong>per engine</strong>, so mixing both on one page is safe.
        Either way the block never goes blank: if highlighting is unavailable the raw code renders
        as plain text and the body is marked <code>data-highlight=&quot;failed&quot;</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Filename → lang priority:</strong> <code>lang</code> (if set) wins; else{" "}
          <code>filenameToLang</code> consumer override; else built-in extension map; else{" "}
          <code>plaintext</code>.
        </li>
        <li>
          <strong>Streaming:</strong> explicit <code>streaming</code> prop. Final clean-tokenize
          fires when you flip it back to <code>false</code>. Don&apos;t auto-detect from update
          frequency.
        </li>
        <li>
          <strong>RSC posture:</strong> the v0.1.0 client variant SSRs the first paint fine in
          Next.js. A dedicated zero-client-Shiki <code>/server</code> export defers to a later minor.
        </li>
        <li>
          <strong>Edit ↔ view continuity:</strong> near-match in v0.1.0 (custom CodeMirror
          HighlightStyle approximating GitHub Light + Dark Default). Pixel-perfect Shiki bridge
          defers to a later minor.
        </li>
        <li>
          <strong>Diff:</strong> use <code>lang=&quot;diff&quot;</code> for unified diff text in v0.1.0;
          split-view will be a sibling <code>code-diff</code> component.
        </li>
        <li>
          <strong>Soft-failure:</strong> a failed editor mount renders an inline error plus a{" "}
          <em>Reload as view-only</em> control (labels <code>editorFailed</code> /{" "}
          <code>reloadAsViewOnly</code>); a failed highlight renders the raw code. Neither ever
          leaves an empty panel.
        </li>
        <li>
          <strong>Long blocks:</strong> opt-in via <code>maxLines</code>; renders a fade-out +
          &ldquo;Show all (N more lines)&rdquo; button.
        </li>
      </ul>
    </div>
  );
}
