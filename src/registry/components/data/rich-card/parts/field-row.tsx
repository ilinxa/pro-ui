import { Check, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlatFieldValue } from "../types";
import type { FlatFieldType } from "../lib/infer-type";
import type { EditMode } from "../hooks/use-edit-mode";
import type { EditDispatchers, EditValidators } from "./card";
import { FieldKeyEdit, FieldValueEdit } from "./field-edit";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hasTime = /T\d{2}:\d{2}/.test(iso);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    ...(hasTime ? { timeStyle: "short" } : {}),
  }).format(d);
}

function renderValue(value: FlatFieldValue, type: FlatFieldType) {
  switch (type) {
    case "null":
      return <span className="text-muted-foreground">—</span>;
    case "boolean":
      return (
        <span className="inline-flex items-center gap-1.5">
          {value === true ? (
            <Check className="size-3.5 text-primary" aria-hidden="true" />
          ) : (
            <Minus
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          <span className="sr-only">{String(value)}</span>
        </span>
      );
    case "number":
      return (
        <span className="font-mono tabular-nums text-foreground/90">
          {String(value)}
        </span>
      );
    case "date":
      return (
        <span title={String(value)} className="text-foreground/90">
          {formatDate(String(value))}
        </span>
      );
    case "string":
    default:
      return <span>{String(value)}</span>;
  }
}

export function FieldRow({
  cardId,
  fieldKey,
  value,
  type,
  editable,
  editMode,
  setEditMode,
  validators,
  dispatchers,
}: {
  cardId: string;
  fieldKey: string;
  value: FlatFieldValue;
  type: FlatFieldType;
  editable: boolean;
  editMode: EditMode | null;
  setEditMode: (m: EditMode | null) => void;
  validators: EditValidators;
  dispatchers: EditDispatchers;
}) {
  const isEditingValue =
    editable &&
    editMode?.kind === "field-value" &&
    editMode.cardId === cardId &&
    editMode.key === fieldKey;
  const isEditingKey =
    editable &&
    editMode?.kind === "field-key" &&
    editMode.cardId === cardId &&
    editMode.key === fieldKey;

  const canEditValue = editable && type !== "null";

  return (
    <div className="group grid grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5">
      <dt
        className={cn(
          "truncate font-mono text-[11px] text-muted-foreground",
          editable && "cursor-text rounded-sm hover:bg-muted px-1 -mx-1",
        )}
        aria-readonly={editable ? undefined : true}
        onClick={() => {
          if (!editable) return;
          if (isEditingKey) return;
          setEditMode({ kind: "field-key", cardId, key: fieldKey });
        }}
      >
        {isEditingKey ? (
          <FieldKeyEdit
            initialKey={fieldKey}
            validate={(newKey) =>
              validators.fieldEditKey(cardId, fieldKey, newKey)
            }
            onCommit={(newKey) =>
              dispatchers.fieldEditKey(cardId, fieldKey, newKey)
            }
            onCancel={() => setEditMode(null)}
          />
        ) : (
          fieldKey
        )}
      </dt>
      <dd
        className="min-w-0 wrap-break-word text-sm text-foreground"
        aria-readonly={!canEditValue}
        onClick={() => {
          if (!canEditValue) return;
          if (isEditingValue) return;
          setEditMode({ kind: "field-value", cardId, key: fieldKey });
        }}
      >
        {isEditingValue ? (
          <FieldValueEdit
            initialValue={value}
            type={type}
            validate={(newValue) =>
              validators.fieldEditValue(cardId, fieldKey, newValue, type)
            }
            onCommit={(newValue) =>
              dispatchers.fieldEditValue(cardId, fieldKey, newValue, type)
            }
            onCancel={() => setEditMode(null)}
          />
        ) : (
          <span
            className={cn(
              canEditValue &&
                "cursor-text rounded-sm hover:bg-muted px-1 -mx-1",
            )}
          >
            {renderValue(value, type)}
          </span>
        )}
      </dd>
      {editable ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dispatchers.fieldRemove(cardId, fieldKey);
          }}
          aria-label={`Remove field ${fieldKey}`}
          className="inline-flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  );
}
