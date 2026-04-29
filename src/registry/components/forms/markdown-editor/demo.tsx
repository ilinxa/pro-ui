"use client";

import { useRef, useState } from "react";
import { Save, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownEditor } from "./markdown-editor";
import { defaultMarkdownToolbar } from "./default-toolbar";
import {
  GRAPH_NODES,
  NODE_KINDS,
  READ_ONLY_DOC,
  SAMPLE_DOC,
  SHORT_DOC,
} from "./dummy-data";
import type { MarkdownEditorHandle, ToolbarItem } from "./types";

function DemoFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">{children}</div>
  );
}

function BasicDemo() {
  const [value, setValue] = useState(SHORT_DOC);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Controlled <code>value</code> / <code>onChange</code>. Try <code>**bold**</code>,
          {" "}<code>*italic*</code>, or <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">⌘B</kbd>.
        </p>
        <MarkdownEditor
          value={value}
          onChange={setValue}
          ariaLabel="Basic markdown editor"
          minHeight="14rem"
        />
        <p className="text-xs text-muted-foreground">
          Length: <span className="font-mono">{value.length}</span> chars
        </p>
      </div>
    </DemoFrame>
  );
}

function ViewModesDemo() {
  const [value, setValue] = useState(SAMPLE_DOC);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Toggle between <code>edit</code>, <code>split</code>, and <code>preview</code> via the tabs.
          Split stacks vertically when the container is narrower than 480px.
        </p>
        <MarkdownEditor
          value={value}
          onChange={setValue}
          initialView="split"
          minHeight="22rem"
          maxHeight="28rem"
          ariaLabel="View-mode demo"
        />
      </div>
    </DemoFrame>
  );
}

function WikilinksDemo() {
  const [value, setValue] = useState(SAMPLE_DOC);
  const [lastClicked, setLastClicked] = useState<string | null>(null);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Type <code>[[</code> in the editor to open the wikilink picker. Resolved targets get
          accent styling; unresolved (e.g. <code>[[unknown reference]]</code>) flip to
          dashed-underline broken styling. Click a wikilink in the preview to fire{" "}
          <code>onWikilinkClick</code>.
        </p>
        <MarkdownEditor
          value={value}
          onChange={setValue}
          wikilinkCandidates={GRAPH_NODES}
          kinds={NODE_KINDS}
          onWikilinkClick={(target) => setLastClicked(target)}
          initialView="split"
          minHeight="22rem"
          maxHeight="28rem"
          ariaLabel="Wikilink demo"
        />
        <p className="text-xs text-muted-foreground">
          Last clicked target:{" "}
          <span className="font-mono">{lastClicked ?? "—"}</span>
        </p>
      </div>
    </DemoFrame>
  );
}

function CustomToolbarDemo() {
  const [value, setValue] = useState(SHORT_DOC);
  const customToolbar: ReadonlyArray<ToolbarItem> = [
    ...defaultMarkdownToolbar,
    { id: "sep-2", label: "", run: () => {} },
    {
      id: "callout",
      label: "Insert callout",
      icon: <Sparkles />,
      run: (ctx) => {
        ctx.insertText("\n> [!note]\n> ");
      },
    },
  ];
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Spread <code>defaultMarkdownToolbar</code> and append a custom item. The custom item
          receives <code>ToolbarCtx</code> with the live <code>EditorView</code>.
        </p>
        <MarkdownEditor
          value={value}
          onChange={setValue}
          toolbar={customToolbar}
          ariaLabel="Custom toolbar demo"
          minHeight="14rem"
        />
      </div>
    </DemoFrame>
  );
}

function ReadOnlyDemo() {
  const [value, setValue] = useState(READ_ONLY_DOC);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          <code>readOnly=true</code> — toolbar disabled, keymaps inert, no <code>onChange</code> fires.
          Syntax highlighting still active.
        </p>
        <MarkdownEditor
          value={value}
          onChange={setValue}
          readOnly
          wikilinkCandidates={GRAPH_NODES}
          kinds={NODE_KINDS}
          initialView="split"
          minHeight="18rem"
          ariaLabel="Read-only demo"
        />
      </div>
    </DemoFrame>
  );
}

function OnSaveDemo() {
  const [value, setValue] = useState(SHORT_DOC);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">⌘S</kbd> /{" "}
          <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">Ctrl+S</kbd> to fire{" "}
          <code>onSave</code>. The browser&apos;s native save is suppressed only when{" "}
          <code>onSave</code> is supplied.
        </p>
        <MarkdownEditor
          value={value}
          onChange={setValue}
          onSave={(v) => {
            setSavedAt(new Date().toLocaleTimeString());
            setValue(v);
          }}
          ariaLabel="onSave demo"
          minHeight="14rem"
        />
        <p className="text-xs text-muted-foreground">
          {savedAt ? (
            <>
              <Save aria-hidden="true" className="inline size-3" /> Saved at{" "}
              <span className="font-mono">{savedAt}</span>
            </>
          ) : (
            <>Nothing saved yet — try ⌘S.</>
          )}
        </p>
      </div>
    </DemoFrame>
  );
}

function NoToolbarDemo() {
  const [value, setValue] = useState(SHORT_DOC);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          <code>toolbar=false</code> hides the toolbar pane. The view-toggle still renders.
          Hosts can pass <code>showPreviewToggle=false</code> to lock the editor to a single view.
        </p>
        <MarkdownEditor
          value={value}
          onChange={setValue}
          toolbar={false}
          ariaLabel="No-toolbar demo"
          minHeight="12rem"
        />
      </div>
    </DemoFrame>
  );
}

function HandleDemo() {
  const [value, setValue] = useState("Use the buttons below to drive the editor from outside.\n\n");
  const ref = useRef<MarkdownEditorHandle>(null);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Imperative handle — <code>focus()</code>, <code>insertText()</code>,{" "}
          <code>undo()</code>, <code>redo()</code>, <code>getSelection()</code>.
        </p>
        <MarkdownEditor
          ref={ref}
          value={value}
          onChange={setValue}
          ariaLabel="Imperative handle demo"
          minHeight="14rem"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.focus()}>
            focus()
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => ref.current?.insertText("✨ ")}
          >
            insertText(&quot;✨ &quot;)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => ref.current?.undo()}
          >
            undo()
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => ref.current?.redo()}
          >
            redo()
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const sel = ref.current?.getSelection();
              if (sel) {
                alert(
                  `selection [${sel.from}, ${sel.to}]: ${sel.text || "(empty)"}`,
                );
              }
            }}
          >
            getSelection()
          </Button>
        </div>
        <Badge variant="secondary" className="font-mono text-[10px]">
          {value.length} chars
        </Badge>
      </div>
    </DemoFrame>
  );
}

export default function MarkdownEditorDemo() {
  return (
    <Tabs defaultValue="basic">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="views">View modes</TabsTrigger>
        <TabsTrigger value="wikilinks">Wikilinks</TabsTrigger>
        <TabsTrigger value="custom-toolbar">Custom toolbar</TabsTrigger>
        <TabsTrigger value="read-only">Read-only</TabsTrigger>
        <TabsTrigger value="save">onSave</TabsTrigger>
        <TabsTrigger value="no-toolbar">No toolbar</TabsTrigger>
        <TabsTrigger value="handle">Imperative handle</TabsTrigger>
      </TabsList>
      <TabsContent value="basic" className="mt-4">
        <BasicDemo />
      </TabsContent>
      <TabsContent value="views" className="mt-4">
        <ViewModesDemo />
      </TabsContent>
      <TabsContent value="wikilinks" className="mt-4">
        <WikilinksDemo />
      </TabsContent>
      <TabsContent value="custom-toolbar" className="mt-4">
        <CustomToolbarDemo />
      </TabsContent>
      <TabsContent value="read-only" className="mt-4">
        <ReadOnlyDemo />
      </TabsContent>
      <TabsContent value="save" className="mt-4">
        <OnSaveDemo />
      </TabsContent>
      <TabsContent value="no-toolbar" className="mt-4">
        <NoToolbarDemo />
      </TabsContent>
      <TabsContent value="handle" className="mt-4">
        <HandleDemo />
      </TabsContent>
    </Tabs>
  );
}
