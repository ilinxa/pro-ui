// Ambient declarations for the @fontsource-variable/* packages.
// These ship CSS files (registering @font-face rules) with no TS types.
// Required so side-effect imports in app/layout.tsx typecheck.
declare module "@fontsource-variable/onest";
declare module "@fontsource-variable/jetbrains-mono";
declare module "@fontsource-variable/playfair-display";
