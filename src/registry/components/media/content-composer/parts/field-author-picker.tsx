"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, User } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  defineFieldRenderer,
  type NarrowedRendererArgs,
} from "@/registry/components/forms/json-form/lib/define-field-renderer";

export type AuthorEntity = { id: string; name: string; avatar?: string };

/**
 * The composer-owned async loader convention. NOT a json-form built-in:
 * the real `FieldConfig` is closed (code/date/rating/richText). The second
 * `defineFieldRenderer` generic carries this so `field.config.authorSource`
 * reads STRONGLY TYPED (not an implicit `unknown` widening).
 */
export type AuthorSourceConfig = (query: string) => Promise<AuthorEntity[]>;

function isAuthorEntity(v: unknown): v is AuthorEntity {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as AuthorEntity).id === "string" &&
    typeof (v as AuthorEntity).name === "string"
  );
}

// Hook-using body in a proper uppercase component (json-form renders the
// registry entry as a component, so hooks are legal at runtime — naming it this
// way also satisfies react-hooks/rules-of-hooks).
function AuthorPickerFieldImpl({
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  ariaProps,
  field,
}: NarrowedRendererArgs<AuthorEntity | null, AuthorSourceConfig>) {
  const authorSource = field.config?.authorSource;
  const selected = isAuthorEntity(value) ? value : null;
  const locked = disabled || readOnly;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AuthorEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const genRef = useRef(0);

  // Debounced async search with a generation guard (drops stale responses).
  // setLoading lives inside the timeout (not synchronously in the effect body)
  // so it can't trigger a cascading render.
  useEffect(() => {
    if (!open || !authorSource) return;
    const gen = ++genRef.current;
    const id = setTimeout(() => {
      setLoading(true);
      authorSource(query)
        .then((list) => {
          if (gen === genRef.current) setResults(list);
        })
        .catch(() => {
          if (gen === genRef.current) setResults([]);
        })
        .finally(() => {
          if (gen === genRef.current) setLoading(false);
        });
    }, 200);
    return () => clearTimeout(id);
  }, [open, query, authorSource]);

  // No loader configured → read-only display chip.
  if (!authorSource) {
    return (
      <div
        role="group"
        aria-labelledby={ariaProps.labelledBy}
        className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
      >
        <User className="size-4 text-muted-foreground" />
        {selected ? (
          <span>{selected.name}</span>
        ) : (
          <span className="text-muted-foreground">No author selected</span>
        )}
      </div>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onBlur();
      }}
    >
      <PopoverTrigger
        disabled={locked}
        aria-labelledby={ariaProps.labelledBy}
        aria-invalid={ariaProps["aria-invalid"]}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        <span
          className={cn(
            "flex items-center gap-2 truncate",
            !selected && "text-muted-foreground",
          )}
        >
          <User className="size-4 shrink-0" />
          {selected ? selected.name : "Select author…"}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-56 p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search authors…"
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Searching…
              </div>
            ) : (
              <>
                <CommandEmpty>No authors found.</CommandEmpty>
                <CommandGroup>
                  {results.map((a) => (
                    <CommandItem
                      key={a.id}
                      value={a.id}
                      onSelect={() => {
                        onChange(a);
                        setOpen(false);
                        onBlur();
                      }}
                    >
                      <User className="size-4" />
                      <span className="flex-1 truncate">{a.name}</span>
                      {selected?.id === a.id && <Check className="size-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * `author-picker` field renderer — an entity-picker combobox that manages its
 * OWN async fetch outside json-form's `options` machinery (json-form has no
 * built-in entity-picker). Registered via `fieldRegistry` and referenced from
 * JSON by `type: "author-picker"`. Exported for `fieldRegistry` reuse.
 *
 * The async loader comes from `field.config.authorSource`; when absent the
 * field renders a read-only display chip. Set `dependsOn: []` on the field.
 * Uses `PopoverTrigger` directly as the trigger button (no `asChild`) to stay
 * clear of the F-cross-13 divergence class.
 */
export const authorPickerFieldRenderer = defineFieldRenderer<
  AuthorEntity | null,
  AuthorSourceConfig
>({
  displayName: "ComposerAuthorPickerField",
  impl: (args) => <AuthorPickerFieldImpl {...args} />,
});
