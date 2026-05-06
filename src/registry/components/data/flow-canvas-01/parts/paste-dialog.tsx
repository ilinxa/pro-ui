"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { coerceToNodeData } from "../lib/coerce-to-node-data";
import { parseJsonSafe } from "../lib/parse-json";
import type { NodeData } from "../types";

export function PasteDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NodeData) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    const parsed = parseJsonSafe(text);
    if (parsed === undefined) {
      setError("Could not parse — make sure the input is valid JSON.");
      return;
    }
    const data = coerceToNodeData(parsed);
    if (!data) {
      setError("JSON must be an object (arrays and primitives aren't nodes).");
      return;
    }
    onSubmit(data);
    setText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paste JSON</DialogTitle>
          <DialogDescription>
            Paste a JSON object to spawn it as a node. Unknown shapes render as
            a custom-JSON node automatically.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`{"__type":"prompt","template":"Translate to French"}`}
          className="h-40 font-mono text-xs"
          autoFocus
        />
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!text.trim()}>
            Add node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
