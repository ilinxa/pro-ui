// Demo placeholder — real 5-tab demo (Defaults / News-hero / Chat / Edit-only /
// Dark) lands in C12 per
// `docs/procomps/media-editor-01-procomp/media-editor-01-procomp-plan.md`.
//
// C2 ships a stub so the docs site type-checks; the procomp is NOT mounted in
// `src/registry/manifest.ts` until C6 (when the root component is real).

export default function MediaEditor01Demo() {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">media-editor-01 demo</p>
      <p className="mt-1">
        Placeholder. Real 5-tab demo lands in C12.
      </p>
    </div>
  );
}
