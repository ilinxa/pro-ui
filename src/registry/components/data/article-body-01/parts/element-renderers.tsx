"use client";

import type { ComponentProps, ReactNode } from "react";
import { PlateElement, type PlateElementProps } from "platejs/react";
import { cn } from "@/lib/utils";

type ElementProps = ComponentProps<typeof PlateElement>;

// Plate's `<PlateElement as="X">` discriminates the type of `attributes` per
// HTML element kind. When we forward `props.attributes` (typed for a wider
// element kind), TS rejects the narrower target. The runtime is just data-slate-*
// attributes — fine on any HTML element. Cast via this helper.
//
// Without this we'd pepper `attributes={props.attributes as never}` on every
// element. One central cast keeps the noise local.
function withAs<As extends string>(props: ElementProps, as: As): ElementProps & { as: As } {
  // The cast is intentional: we know `props.attributes` is the same data-slate-*
  // shape regardless of `as`. TS's discriminated-union narrowing doesn't help here.
  return { ...props, as, attributes: props.attributes as never } as ElementProps & {
    as: As;
  };
}

function Wrapped(props: ElementProps & { as?: string; className?: string; children: ReactNode }) {
  return <PlateElement {...(props as ElementProps)}>{props.children}</PlateElement>;
}

export function ParagraphElement(props: ElementProps) {
  return (
    <Wrapped {...withAs(props, "p")} className={cn("my-4 leading-relaxed", props.className)}>
      {props.children}
    </Wrapped>
  );
}

export function H1Element(props: ElementProps) {
  return (
    <Wrapped {...withAs(props, "h1")} className={cn("mt-10 mb-4 text-4xl font-serif font-bold tracking-tight", props.className)}>
      {props.children}
    </Wrapped>
  );
}

export function H2Element(props: ElementProps) {
  return (
    <Wrapped {...withAs(props, "h2")} className={cn("mt-8 mb-3 text-3xl font-serif font-bold tracking-tight", props.className)}>
      {props.children}
    </Wrapped>
  );
}

export function H3Element(props: ElementProps) {
  return (
    <Wrapped {...withAs(props, "h3")} className={cn("mt-6 mb-2 text-2xl font-serif font-bold", props.className)}>
      {props.children}
    </Wrapped>
  );
}

export function H4Element(props: ElementProps) {
  return (
    <Wrapped {...withAs(props, "h4")} className={cn("mt-4 mb-2 text-xl font-serif font-semibold", props.className)}>
      {props.children}
    </Wrapped>
  );
}

export function BlockquoteElement(props: ElementProps) {
  return (
    <Wrapped
      {...withAs(props, "blockquote")}
      className={cn(
        "my-6 border-l-4 border-primary pl-6 py-2 italic text-muted-foreground bg-muted/30 rounded-r-md",
        props.className
      )}
    >
      {props.children}
    </Wrapped>
  );
}

export function HrElement(props: ElementProps) {
  return (
    <PlateElement
      {...props}
      className={cn("my-8", props.className)}
      attributes={{ ...(props.attributes as Record<string, unknown>), contentEditable: false } as never}
    >
      <div>
        <hr className="border-border" />
      </div>
      {props.children}
    </PlateElement>
  );
}

export function ListElement(props: ElementProps) {
  const { element } = props as PlateElementProps;
  const listStyleType = (element as { listStyleType?: string }).listStyleType ?? "disc";
  const indent = ((element as { indent?: number }).indent ?? 1) - 1;
  const tag = (listStyleType === "decimal" ? "ol" : "ul") as "ol" | "ul";

  return (
    <Wrapped
      {...withAs(props, tag)}
      className={cn(
        "my-4 ml-6",
        listStyleType === "decimal" ? "list-decimal" : "list-disc",
        props.className
      )}
      style={{
        ...(props.style ?? {}),
        marginLeft: indent > 0 ? `${indent * 1.5}rem` : undefined,
      }}
    >
      <li>{props.children}</li>
    </Wrapped>
  );
}

export function CodeBlockElement(props: ElementProps) {
  return (
    <Wrapped
      {...withAs(props, "pre")}
      className={cn(
        "my-6 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-sm",
        props.className
      )}
    >
      <code>{props.children}</code>
    </Wrapped>
  );
}

export function CodeLineElement(props: ElementProps) {
  return (
    <Wrapped {...withAs(props, "div")} className={cn("font-mono", props.className)}>
      {props.children}
    </Wrapped>
  );
}

export function TableElement(props: ElementProps) {
  return (
    <PlateElement {...props} className={cn("my-6 overflow-x-auto", props.className)}>
      <table className="w-full border-collapse text-sm">
        <tbody>{props.children}</tbody>
      </table>
    </PlateElement>
  );
}

export function TableRowElement(props: ElementProps) {
  return (
    <Wrapped {...withAs(props, "tr")} className={cn(props.className)}>
      {props.children}
    </Wrapped>
  );
}

export function TableCellElement(props: ElementProps) {
  return (
    <Wrapped
      {...withAs(props, "td")}
      className={cn("border border-border px-3 py-2 align-top", props.className)}
    >
      {props.children}
    </Wrapped>
  );
}

export function TableCellHeaderElement(props: ElementProps) {
  return (
    <Wrapped
      {...withAs(props, "th")}
      className={cn(
        "border border-border bg-muted/40 px-3 py-2 text-left font-semibold align-top",
        props.className
      )}
    >
      {props.children}
    </Wrapped>
  );
}

// ImageElement is sealed in its own file (parts/image-element.tsx) — handles
// resize handle + caption editing. Re-exported here for downstream barrel-import
// continuity (editor-kit.ts imports it from this module).
export { ImageElement } from "./image-element";

export function MediaEmbedElement(props: ElementProps) {
  const { element } = props as PlateElementProps;
  const url = (element as { url?: string }).url;
  return (
    <PlateElement
      {...props}
      className={cn("my-6", props.className)}
      attributes={{ ...(props.attributes as Record<string, unknown>), contentEditable: false } as never}
    >
      <div className="aspect-video overflow-hidden rounded-md border border-border bg-muted/30">
        {url ? (
          <iframe src={url} className="h-full w-full" allowFullScreen />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            (embed)
          </div>
        )}
      </div>
      {props.children}
    </PlateElement>
  );
}

export function LinkElement(props: ElementProps) {
  const { element } = props as PlateElementProps;
  const url = (element as { url?: string }).url ?? "#";
  return (
    <Wrapped
      {...withAs(props, "a")}
      attributes={{
        ...(props.attributes as Record<string, unknown>),
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
      } as never}
      className={cn("text-primary underline underline-offset-2 hover:text-primary/80", props.className)}
    >
      {props.children}
    </Wrapped>
  );
}
