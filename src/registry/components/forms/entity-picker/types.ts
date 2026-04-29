import type { ReactNode, Ref } from "react";

export interface EntityLike {
  id: string;
  label: string;
  kind?: string;
}

export interface KindMeta {
  label: string;
  color?: string;
}

export type PickerMode = "single" | "multi";

export interface RenderItemContext {
  selected: boolean;
  query: string;
}

export interface RenderTriggerContext<T extends EntityLike> {
  value: T | T[] | null;
  open: boolean;
  triggerRef: (node: HTMLElement | null) => void;
}

export interface RenderEmptyContext {
  query: string;
  itemCount: number;
}

export interface CommonPickerProps<T extends EntityLike> {
  items: ReadonlyArray<T>;

  match?: (item: T, query: string) => boolean;
  placeholder?: string;

  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  kinds?: Record<string, KindMeta>;
  showKindBadges?: boolean;

  renderItem?: (item: T, ctx: RenderItemContext) => ReactNode;
  renderTrigger?: (ctx: RenderTriggerContext<T>) => ReactNode;
  renderEmpty?: (ctx: RenderEmptyContext) => ReactNode;

  disabled?: boolean;
  triggerLabel?: string;
  id?: string;
  className?: string;

  ref?: Ref<EntityPickerHandle>;
}

export interface SinglePickerProps<T extends EntityLike>
  extends CommonPickerProps<T> {
  mode?: "single";
  value: T | null;
  onChange: (value: T | null) => void;
}

export interface MultiPickerProps<T extends EntityLike>
  extends CommonPickerProps<T> {
  mode: "multi";
  value: T[];
  onChange: (value: T[]) => void;
}

export type EntityPickerProps<T extends EntityLike> =
  | SinglePickerProps<T>
  | MultiPickerProps<T>;

export interface EntityPickerHandle {
  focus(): void;
  open(): void;
  close(): void;
  clear(): void;
}
