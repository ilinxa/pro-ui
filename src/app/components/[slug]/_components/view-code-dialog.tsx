"use client";

import { Code2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CodeBlock } from "@/registry/components/code/code-block";

// "View Code" trigger used in the Preview section heading row. Button → centered
// Dialog containing the demo source rendered through code-block. Modal is wider
// than the page preview to fit long demos comfortably. The button renders in
// normal flow; positioning is up to the caller.
export function ViewCodeDialog({
  source,
  filename = "demo.tsx",
  lang = "tsx",
  triggerLabel = "View Code",
}: {
  source: string;
  filename?: string;
  lang?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-7 shrink-0 gap-1.5 text-xs"
        >
          <Code2 aria-hidden className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-4xl gap-4 p-0 sm:!max-w-4xl">
        <DialogHeader className="border-b border-border px-5 py-3">
          <DialogTitle className="font-mono text-sm font-medium">
            {filename}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-auto px-5 pb-5">
          <CodeBlock
            value={source}
            filename={filename}
            lang={lang}
            mode="view"
            showCopy
            showLineNumbers
            header={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
