"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertiesForm } from "./properties-form";
import {
  PRIORITY_OPTIONS,
  TASK_BASELINE,
  TASK_SCHEMA,
  TASK_SCHEMA_MIXED,
  TASK_SCHEMA_VALIDATED,
  type TaskValues,
} from "./dummy-data";
import type {
  FieldRendererProps,
  PropertiesFormField,
  SubmitResult,
} from "./types";

function ReadDemo() {
  const [values, setValues] = useState<TaskValues>(TASK_BASELINE);
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <PropertiesForm<TaskValues>
        schema={TASK_SCHEMA}
        values={values}
        onChange={setValues}
        mode="read"
        ariaLabel="Task — read mode"
      />
    </div>
  );
}

function EditDemo() {
  const [values, setValues] = useState<TaskValues>(TASK_BASELINE);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const onSubmit = useCallback(async (): Promise<SubmitResult> => {
    await new Promise((r) => setTimeout(r, 600));
    setSavedAt(new Date().toLocaleTimeString());
    return { ok: true };
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-5">
      <PropertiesForm<TaskValues>
        schema={TASK_SCHEMA}
        values={values}
        onChange={setValues}
        onSubmit={onSubmit}
        mode="edit"
        ariaLabel="Task — edit mode"
      />
      {savedAt ? (
        <p className="text-xs text-muted-foreground">
          Last saved at <span className="font-mono">{savedAt}</span>
        </p>
      ) : null}
    </div>
  );
}

function MixedPermissionsDemo() {
  const [values, setValues] = useState<TaskValues>(TASK_BASELINE);
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">
        Status &amp; Assignee are read-only with hover tooltips. Completed is hidden via permission.
      </p>
      <PropertiesForm<TaskValues>
        schema={TASK_SCHEMA_MIXED}
        values={values}
        onChange={setValues}
        mode="edit"
        ariaLabel="Task — mixed permissions"
      />
    </div>
  );
}

function ValidationDemo() {
  const [values, setValues] = useState<TaskValues>({
    ...TASK_BASELINE,
    title: "tiny",
    estimatedHours: -3,
    assignee: "no-at-sign",
  });
  const [submitOutcome, setSubmitOutcome] = useState<string | null>(null);

  const formValidate = useCallback((vs: TaskValues) => {
    const errors: Record<string, string> = {};
    if (vs.priority === "urgent" && vs.status === "todo") {
      errors.priority = "Urgent tasks shouldn't sit in To do — pick a status.";
    }
    return Object.keys(errors).length > 0 ? errors : undefined;
  }, []);

  const onSubmit = useCallback(async (vs: TaskValues): Promise<SubmitResult> => {
    await new Promise((r) => setTimeout(r, 350));
    setSubmitOutcome(`Submitted: ${vs.title}`);
    return { ok: true };
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">
        Per-field validators (length, numeric range, format) plus a form-level cross-field rule.
      </p>
      <PropertiesForm<TaskValues>
        schema={TASK_SCHEMA_VALIDATED}
        values={values}
        onChange={setValues}
        validate={formValidate}
        onSubmit={onSubmit}
        mode="edit"
        ariaLabel="Task — validation"
      />
      {submitOutcome ? (
        <p className="text-xs text-muted-foreground">{submitOutcome}</p>
      ) : null}
    </div>
  );
}

function TagsRenderer({
  value,
  onChange,
  field,
  disabled,
  fieldId,
  errorId,
  error,
}: FieldRendererProps) {
  const tags = useMemo<string[]>(
    () =>
      Array.isArray(value)
        ? (value as unknown[]).filter(
            (t): t is string => typeof t === "string",
          )
        : [],
    [value],
  );
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...tags, trimmed]);
    setDraft("");
    inputRef.current?.focus();
  }, [draft, tags, onChange]);

  const removeTag = useCallback(
    (t: string) => onChange(tags.filter((x) => x !== t)),
    [tags, onChange],
  );

  return (
    <div
      aria-describedby={error ? errorId : undefined}
      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent p-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
    >
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 pr-1 font-mono text-xs"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => removeTag(tag)}
            disabled={disabled}
            className="rounded-sm p-0.5 hover:bg-foreground/10 disabled:opacity-50"
          >
            <X aria-hidden="true" className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        id={fieldId}
        type="text"
        value={draft}
        disabled={disabled}
        placeholder={tags.length === 0 ? field.placeholder ?? "Add a tag…" : ""}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
          } else if (e.key === "Backspace" && draft.length === 0 && tags.length > 0) {
            e.preventDefault();
            onChange(tags.slice(0, -1));
          }
        }}
        className="min-w-24 flex-1 bg-transparent px-1.5 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={addTag}
        disabled={disabled || draft.trim().length === 0}
        className="ml-auto"
      >
        <Plus aria-hidden="true" className="size-3" />
        Add
      </Button>
    </div>
  );
}

interface TaggedTaskValues extends TaskValues {
  tags: string[];
}

function CustomRendererDemo() {
  const [values, setValues] = useState<TaggedTaskValues>({
    ...TASK_BASELINE,
    tags: ["security", "auth", "v2"],
  });

  const schema = useMemo<ReadonlyArray<PropertiesFormField>>(
    () => [
      ...TASK_SCHEMA,
      {
        key: "tags",
        type: "string",
        label: "Tags",
        description: "Comma or Enter to commit. Backspace removes the last.",
        renderer: TagsRenderer,
        placeholder: "Add a tag…",
      },
    ],
    [],
  );

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <PropertiesForm<TaggedTaskValues>
        schema={schema}
        values={values}
        onChange={setValues}
        mode="edit"
        ariaLabel="Task — custom tags renderer"
      />
    </div>
  );
}

export default function PropertiesFormDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="read">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="read">Read mode</TabsTrigger>
          <TabsTrigger value="edit">Edit + submit</TabsTrigger>
          <TabsTrigger value="mixed">Mixed permissions</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="custom">Custom renderer</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4">
          <ReadDemo />
        </TabsContent>
        <TabsContent value="edit" className="mt-4">
          <EditDemo />
        </TabsContent>
        <TabsContent value="mixed" className="mt-4">
          <MixedPermissionsDemo />
        </TabsContent>
        <TabsContent value="validation" className="mt-4">
          <ValidationDemo />
        </TabsContent>
        <TabsContent value="custom" className="mt-4">
          <CustomRendererDemo />
        </TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground">
        The PRIORITY_OPTIONS list has {PRIORITY_OPTIONS.length} levels — see <code>dummy-data.ts</code> for the full schemas.
      </p>
    </div>
  );
}
