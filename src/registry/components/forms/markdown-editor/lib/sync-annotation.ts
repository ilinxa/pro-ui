import { Annotation } from "@codemirror/state";

// Marks transactions originating from React value-prop sync so the updateListener
// skips firing onChange and avoids the value-sync echo (Q-P9 lock).
export const SyncAnnotation = Annotation.define<boolean>();
