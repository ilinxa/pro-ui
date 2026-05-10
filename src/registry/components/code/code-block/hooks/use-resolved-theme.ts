"use client";
import { useEffect, useState } from "react";

function readInitialIsDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

/**
 * Observes the document's `.dark` class. Used informationally only —
 * the actual palette swap happens via CSS variables on the
 * `.code-block-editor` host element. Useful for assistive-tech
 * announcements or `aria-` attributes that need the resolved theme.
 */
export function useResolvedTheme(): "light" | "dark" {
  const [isDark, setIsDark] = useState<boolean>(readInitialIsDark);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark ? "dark" : "light";
}
