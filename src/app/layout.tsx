import type { Metadata } from "next";
// Self-hosted fonts via @fontsource-variable/* packages — no network fetch at
// build time, works offline. Closes F-cross-04 (next/font/google was failing
// `pnpm build` in offline / sandboxed envs). The font CSS variables consumed
// by Tailwind's @theme inline (--font-onest / --font-jetbrains-mono /
// --font-playfair-display) are now defined statically in globals.css.
import "@fontsource-variable/onest";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/playfair-display";
import { ThemeProvider } from "@/components/site/theme-provider";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "ilinxa-ui-pro",
  description:
    "Professional, fully-composed components built on shadcn/ui and Tailwind CSS v4.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col font-sans"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
