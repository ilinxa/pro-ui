"use client";

import { useCallback, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PdfRotation } from "../types";

interface UsePdfPrintArgs {
  pdfDocument: PDFDocumentProxy | null;
  rotation: PdfRotation;
  /** Render scale for print. Higher = sharper output, more memory. Default: 2. */
  printScale?: number;
}

export interface UsePdfPrintReturn {
  print: () => Promise<void>;
  isPrinting: boolean;
}

/**
 * Print the loaded document by rendering each page to a high-DPI canvas,
 * embedding them in a hidden iframe as images, and triggering print() on
 * that iframe. Sharper output than printing the live viewer canvas.
 */
export function usePdfPrint(args: UsePdfPrintArgs): UsePdfPrintReturn {
  const { pdfDocument, rotation, printScale = 2 } = args;
  const [isPrinting, setIsPrinting] = useState(false);

  const print = useCallback(async () => {
    if (isPrinting) return;
    if (!pdfDocument) return;
    setIsPrinting(true);

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const cleanup = () => {
      try {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      } catch {
        // ignore
      }
      setIsPrinting(false);
    };

    try {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) {
        cleanup();
        return;
      }

      doc.open();
      doc.write(
        `<!DOCTYPE html><html><head><style>` +
          `@page { margin: 0; size: auto; }` +
          `html, body { margin: 0; padding: 0; background: #fff; }` +
          `.pdf-print-page { page-break-after: always; display: flex; align-items: center; justify-content: center; }` +
          `.pdf-print-page:last-child { page-break-after: auto; }` +
          `img { display: block; max-width: 100%; max-height: 100vh; }` +
          `</style></head><body></body></html>`,
      );
      doc.close();

      const body = doc.body;
      const numPages = pdfDocument.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: printScale, rotation });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({
          canvas,
          canvasContext: ctx,
          viewport,
        } as Parameters<typeof page.render>[0]).promise;

        const dataUrl = canvas.toDataURL("image/png");
        const wrapper = doc.createElement("div");
        wrapper.className = "pdf-print-page";
        const img = doc.createElement("img");
        img.src = dataUrl;
        wrapper.appendChild(img);
        body.appendChild(wrapper);

        canvas.width = 0;
        canvas.height = 0;
      }

      const onAfterPrint = () => {
        win.removeEventListener("afterprint", onAfterPrint);
        cleanup();
      };
      win.addEventListener("afterprint", onAfterPrint);

      win.focus();
      win.print();

      // Safety net in case afterprint never fires.
      setTimeout(cleanup, 60000);
    } catch (err) {
      cleanup();
      throw err;
    }
  }, [pdfDocument, rotation, printScale, isPrinting]);

  return { print, isPrinting };
}
