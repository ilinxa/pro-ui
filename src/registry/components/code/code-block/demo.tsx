"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "./code-block";
import {
  SAMPLE_EDIT_DEFAULT,
  SAMPLE_ERROR_ANNOTATIONS,
  SAMPLE_ERROR_TRACE,
  SAMPLE_JSON,
  SAMPLE_LONG_JSON,
  SAMPLE_PYTHON,
  SAMPLE_TERMINAL,
  SAMPLE_TS,
  SAMPLE_TS_HIGHLIGHTED,
  chunkString,
} from "./dummy-data";

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {caption ? (
          <p className="text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function StreamingDemo() {
  const [value, setValue] = useState("");
  const [streaming, setStreaming] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const replay = () => {
    // Cancel anything in flight
    for (const id of timeoutsRef.current) window.clearTimeout(id);
    timeoutsRef.current = [];
    setValue("");
    setStreaming(true);
    const chunks = chunkString(SAMPLE_TS, 10);
    let acc = "";
    chunks.forEach((c, i) => {
      const id = window.setTimeout(() => {
        acc += c;
        setValue(acc);
        if (i === chunks.length - 1) {
          // Final tokenize on stop
          window.setTimeout(() => setStreaming(false), 80);
        }
      }, i * 50);
      timeoutsRef.current.push(id);
    });
  };

  useEffect(() => {
    return () => {
      for (const id of timeoutsRef.current) window.clearTimeout(id);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={replay}>
          Replay streaming
        </Button>
        <span className="text-xs text-muted-foreground">
          {streaming ? "Streaming…" : value ? "Done" : "Click to start"}
        </span>
      </div>
      <CodeBlock
        lang="tsx"
        filename="counter.tsx"
        value={value}
        streaming={streaming}
        showCopy
      />
    </div>
  );
}

function EditDemo() {
  const [code, setCode] = useState(SAMPLE_EDIT_DEFAULT);
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <CodeBlock
        mode="edit"
        lang="ts"
        filename="greet.ts"
        value={code}
        onChange={({ value }) => setCode(value)}
        onSave={({ value }) => setSaved(value)}
        showCopy
      />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Press Cmd/Ctrl+S to save.</span>
        {saved ? (
          <span className="text-foreground">
            ✓ Saved {saved.length} chars
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function CodeBlockDemo() {
  return (
    <div className="flex flex-col gap-10">
      <Section
        title="1. View mode — TypeScript (the default)"
        caption="Filename + language pill + copy button. GitHub Light / Dark token palette."
      >
        <CodeBlock lang="tsx" filename="counter.tsx" value={SAMPLE_TS} />
      </Section>

      <Section
        title="2. Line highlights + annotations"
        caption="Highlighted rows draw the eye; severity icons in the gutter open tooltips with messages."
      >
        <CodeBlock
          lang="tsx"
          filename="counter.tsx"
          value={SAMPLE_TS}
          highlightedLines={SAMPLE_TS_HIGHLIGHTED}
          annotations={[
            { line: 5, type: "info", message: "Initial state is 0" },
            { line: 9, type: "warn", message: "Consider a setter callback" },
          ]}
          showLineNumbers
        />
      </Section>

      <Section
        title="3. Streaming — chat assistant style"
        caption="Click Replay to emit 10-char chunks at 50 ms intervals. Tail cursor blinks while streaming; tokenization stays smooth."
      >
        <StreamingDemo />
      </Section>

      <Section
        title="4. JSON config + long-block collapse"
        caption="Long blocks fade out with a 'Show all' button. Click to expand inline."
      >
        <CodeBlock
          lang="json"
          filename="package.json"
          value={SAMPLE_LONG_JSON}
          showLineNumbers
          maxLines={12}
        />
      </Section>

      <Section
        title="5. Terminal — virtual install walkthrough"
        caption="Structured `lines: TerminalLine[]` API. Input rows show the prompt; output rows are muted; error rows in destructive red. macOS traffic-light decoration optional."
      >
        <CodeBlock
          mode="terminal"
          filename="zsh"
          showTrafficLights
          lines={SAMPLE_TERMINAL}
        />
      </Section>

      <Section
        title="6. Edit mode — controlled CodeMirror editor"
        caption="Same JetBrains Mono font, same line-height, near-match token colors via custom CodeMirror HighlightStyle. v0.2.0 will swap in a pixel-perfect Shiki bridge."
      >
        <EditDemo />
      </Section>

      <Section
        title="7. Custom header — action slot"
        caption="The header `actions` slot accepts any ReactNode; pre-built buttons (copy, wrap, expand) compose around it."
      >
        <CodeBlock
          lang="ts"
          filename="run-me.ts"
          value={`// click Run to evaluate (consumer-managed)\nconsole.log("hello from ilinxa");`}
          showCopy
          showWrap
          actions={
            <Button size="sm" variant="outline" className="h-7">
              ▶ Run
            </Button>
          }
        />
      </Section>

      <Section
        title="8. Python sample — multi-language coverage"
        caption="Shiki loads grammars on demand; common languages stay synchronously bundled (~10), the rest dynamic-import."
      >
        <CodeBlock
          lang="python"
          filename="users.py"
          value={SAMPLE_PYTHON}
          showLineNumbers
          showWrap
          showExpand
        />
      </Section>

      <Section
        title="9. Error trace — annotations on a plain log"
        caption="`lang='plaintext'` works as a viewer for arbitrary text. Combine with annotations + line-highlights for a debug surface."
      >
        <CodeBlock
          lang="plaintext"
          filename="stderr.log"
          value={SAMPLE_ERROR_TRACE}
          highlightedLines={[1]}
          annotations={SAMPLE_ERROR_ANNOTATIONS}
          showLineNumbers
        />
      </Section>

      <Section
        title="10. Inline JSON (no chrome)"
        caption="`header={false}` for a minimal embed."
      >
        <CodeBlock lang="json" value={SAMPLE_JSON} header={false} />
      </Section>
    </div>
  );
}
