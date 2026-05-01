import type { Metadata } from "next";
import { Onest, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/site/theme-provider";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "latin-ext"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  display: "swap",
});

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
      className={`${onest.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} h-full antialiased`}
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
