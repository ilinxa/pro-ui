"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  defineFieldRenderer,
  type NarrowedRendererArgs,
} from "@/registry/components/forms/json-form/lib/define-field-renderer";

// The hook-using body lives in a proper uppercase component (json-form renders
// the registry entry as a component, so hooks are legal at runtime — naming it
// this way also satisfies react-hooks/rules-of-hooks).
function TagsFieldImpl({
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  ariaProps,
}: NarrowedRendererArgs<string[], unknown>) {
  // RHF holds whatever it holds — defineFieldRenderer narrows types only, not
  // runtime — so guard the array.
  const tags = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState("");
  const locked = disabled || readOnly;

  const add = () => {
    const t = draft.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setDraft("");
  };

  return (
    <div
      role="group"
      aria-labelledby={ariaProps.labelledBy}
      aria-describedby={ariaProps["aria-describedby"]}
      data-aria-invalid={ariaProps["aria-invalid"] ? "true" : undefined}
      className="flex flex-wrap items-center gap-1.5"
    >
      {tags.map((t) => (
        <Badge key={t} variant="secondary" className="gap-1 pr-1">
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            disabled={locked}
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="rounded-full p-0.5 hover:bg-foreground/10 disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={draft}
        disabled={locked}
        className="h-7 w-32 flex-1"
        placeholder="Add tag…"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
            onChange(tags.slice(0, -1));
          }
        }}
      />
    </div>
  );
}

/**
 * `tags` field renderer — chip-input-with-create. json-form's built-in
 * `FieldType` has no chip-input, so the composer ships this as a content-
 * composer-owned custom `FieldRenderer`, registered via `fieldRegistry` and
 * referenced from JSON by `type: "tags"`. Exported for `fieldRegistry` reuse.
 *
 * Set `dependsOn: []` on the field in JSON (it doesn't read `allValues`) to opt
 * into json-form's snapshot subscription mode.
 */
export const tagsFieldRenderer = defineFieldRenderer<string[]>({
  displayName: "ComposerTagsField",
  impl: (args) => <TagsFieldImpl {...args} />,
});
