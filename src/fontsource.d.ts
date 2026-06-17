// Ambient declarations for the @fontsource-variable/* packages.
// These ship CSS files (registering @font-face rules) with no TS types.
// Required so side-effect imports in app/layout.tsx typecheck.
declare module "@fontsource-variable/onest";
declare module "@fontsource-variable/jetbrains-mono";
declare module "@fontsource-variable/playfair-display";

// blackboard-01 handwriting fonts (self-loaded by BlackboardRoot via
// components/data/blackboard-01/blackboard-fonts.ts). Sub-path specifiers must
// be declared individually — package-level decls don't cover "/300.css" etc.
declare module "@fontsource/kalam/300.css";
declare module "@fontsource/kalam/400.css";
declare module "@fontsource/kalam/700.css";
declare module "@fontsource-variable/caveat";
declare module "@fontsource/patrick-hand";
declare module "@fontsource/shadows-into-light";
