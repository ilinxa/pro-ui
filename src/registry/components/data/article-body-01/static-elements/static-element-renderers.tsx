import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StaticElementProps {
  attributes?: Record<string, unknown>;
  children?: ReactNode;
  element: { type: string; [key: string]: unknown };
  className?: string;
  style?: CSSProperties;
}

interface StaticLeafProps {
  attributes?: Record<string, unknown>;
  children?: ReactNode;
  leaf: { [key: string]: unknown };
  className?: string;
  style?: CSSProperties;
}

// Plate's `attributes` carry data-slate-* metadata + a ref typed for various
// element kinds. We render bare HTML, so we cast to a permissive shape here.
// Strip `ref` — it's typed for a specific HTML element and TS can't reconcile
// across our union of output tags. The viewer is read-only; refs aren't load-bearing.
type Attrs = Omit<HTMLAttributes<HTMLElement>, "color" | "ref">;

function spreadAttrs(attributes: Record<string, unknown> | undefined): Attrs {
  if (!attributes) return {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ref: _ref, ...rest } = attributes as { ref?: unknown };
  return rest as Attrs;
}

export function StaticParagraph(props: StaticElementProps) {
  return (
    <p {...spreadAttrs(props.attributes)} className={cn("my-4 leading-relaxed", props.className)}>
      {props.children}
    </p>
  );
}

export function StaticH1(props: StaticElementProps) {
  return (
    <h1 {...spreadAttrs(props.attributes)} className={cn("mt-10 mb-4 text-4xl font-serif font-bold tracking-tight", props.className)}>
      {props.children}
    </h1>
  );
}

export function StaticH2(props: StaticElementProps) {
  return (
    <h2 {...spreadAttrs(props.attributes)} className={cn("mt-8 mb-3 text-3xl font-serif font-bold tracking-tight", props.className)}>
      {props.children}
    </h2>
  );
}

export function StaticH3(props: StaticElementProps) {
  return (
    <h3 {...spreadAttrs(props.attributes)} className={cn("mt-6 mb-2 text-2xl font-serif font-bold", props.className)}>
      {props.children}
    </h3>
  );
}

export function StaticH4(props: StaticElementProps) {
  return (
    <h4 {...spreadAttrs(props.attributes)} className={cn("mt-4 mb-2 text-xl font-serif font-semibold", props.className)}>
      {props.children}
    </h4>
  );
}

export function StaticBlockquote(props: StaticElementProps) {
  return (
    <blockquote
      {...spreadAttrs(props.attributes)}
      className={cn(
        "my-6 border-l-4 border-primary pl-6 py-2 italic text-muted-foreground bg-muted/30 rounded-r-md",
        props.className
      )}
    >
      {props.children}
    </blockquote>
  );
}

export function StaticHr(props: StaticElementProps) {
  return (
    <div {...spreadAttrs(props.attributes)} className={cn("my-8", props.className)}>
      <hr className="border-border" />
      {props.children}
    </div>
  );
}

export function StaticList(props: StaticElementProps) {
  const element = props.element as { listStyleType?: string; indent?: number };
  const listStyleType = element.listStyleType ?? "disc";
  const indent = (element.indent ?? 1) - 1;
  const ordered = listStyleType === "decimal";
  const className = cn(
    "my-4 ml-6",
    ordered ? "list-decimal" : "list-disc",
    props.className
  );
  const style = {
    ...(props.style ?? {}),
    marginLeft: indent > 0 ? `${indent * 1.5}rem` : undefined,
  };
  const attrs = spreadAttrs(props.attributes);

  if (ordered) {
    return (
      <ol {...attrs} className={className} style={style}>
        <li>{props.children}</li>
      </ol>
    );
  }
  return (
    <ul {...attrs} className={className} style={style}>
      <li>{props.children}</li>
    </ul>
  );
}

export function StaticCodeBlock(props: StaticElementProps) {
  return (
    <pre
      {...spreadAttrs(props.attributes)}
      className={cn(
        "my-6 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-sm",
        props.className
      )}
    >
      <code>{props.children}</code>
    </pre>
  );
}

export function StaticCodeLine(props: StaticElementProps) {
  return (
    <div {...spreadAttrs(props.attributes)} className={cn("font-mono", props.className)}>
      {props.children}
    </div>
  );
}

export function StaticTable(props: StaticElementProps) {
  return (
    <div {...spreadAttrs(props.attributes)} className={cn("my-6 overflow-x-auto", props.className)}>
      <table className="w-full border-collapse text-sm">
        <tbody>{props.children}</tbody>
      </table>
    </div>
  );
}

export function StaticTableRow(props: StaticElementProps) {
  return <tr {...spreadAttrs(props.attributes)} className={cn(props.className)}>{props.children}</tr>;
}

export function StaticTableCell(props: StaticElementProps) {
  return (
    <td
      {...spreadAttrs(props.attributes)}
      className={cn("border border-border px-3 py-2 align-top", props.className)}
    >
      {props.children}
    </td>
  );
}

export function StaticTableCellHeader(props: StaticElementProps) {
  return (
    <th
      {...spreadAttrs(props.attributes)}
      className={cn(
        "border border-border bg-muted/40 px-3 py-2 text-left font-semibold align-top",
        props.className
      )}
    >
      {props.children}
    </th>
  );
}

export function StaticImage(props: StaticElementProps) {
  const element = props.element as { url?: string; alt?: string; caption?: string };
  return (
    <div {...spreadAttrs(props.attributes)} className={cn("my-6", props.className)}>
      <figure>
        {element.url ? (
          <img
            src={element.url}
            alt={element.alt ?? ""}
            loading="lazy"
            className="w-full rounded-md border border-border"
          />
        ) : null}
        {element.caption ? (
          <figcaption className="mt-2 text-center text-xs text-muted-foreground">
            {element.caption}
          </figcaption>
        ) : null}
      </figure>
      {props.children}
    </div>
  );
}

export function StaticMediaEmbed(props: StaticElementProps) {
  const element = props.element as { url?: string };
  return (
    <div {...spreadAttrs(props.attributes)} className={cn("my-6", props.className)}>
      {element.url ? (
        <div className="aspect-video overflow-hidden rounded-md border border-border bg-muted/30">
          <iframe src={element.url} className="h-full w-full" allowFullScreen />
        </div>
      ) : null}
      {props.children}
    </div>
  );
}

export function StaticLink(props: StaticElementProps) {
  const element = props.element as { url?: string };
  return (
    <a
      {...spreadAttrs(props.attributes)}
      href={element.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-primary underline underline-offset-2 hover:text-primary/80",
        props.className
      )}
    >
      {props.children}
    </a>
  );
}

export function StaticCodeLeaf(props: StaticLeafProps) {
  return (
    <code
      {...(spreadAttrs(props.attributes) as HTMLAttributes<HTMLElement>)}
      className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]", props.className)}
    >
      {props.children}
    </code>
  );
}

export function StaticHighlightLeaf(props: StaticLeafProps) {
  return (
    <mark
      {...(spreadAttrs(props.attributes) as HTMLAttributes<HTMLElement>)}
      className={cn("rounded bg-primary/20 px-0.5 text-foreground", props.className)}
    >
      {props.children}
    </mark>
  );
}

export function StaticKbdLeaf(props: StaticLeafProps) {
  return (
    <kbd
      {...(spreadAttrs(props.attributes) as HTMLAttributes<HTMLElement>)}
      className={cn(
        "rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] shadow-sm",
        props.className
      )}
    >
      {props.children}
    </kbd>
  );
}
