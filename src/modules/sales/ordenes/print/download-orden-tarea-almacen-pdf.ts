"use client";

import { buildOrdenTareaAlmacenHtml } from "./build-orden-tarea-almacen-html";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

/** Papel oficio latinoamericano (216 × 330 mm). */
const OFICIO_WIDTH_MM = 216;
const OFICIO_HEIGHT_MM = 330;

function sanitizePdfFilename(folio: string): string {
  const cleaned = folio.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "orden";
}

function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("No se pudo preparar la orden de almacén."));
    }, 10000);

    iframe.addEventListener(
      "load",
      () => {
        window.clearTimeout(timeoutId);
        resolve();
      },
      { once: true },
    );
  });
}

function createHiddenIframe(html: string): {
  iframe: HTMLIFrameElement;
  loaded: Promise<void>;
} {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Orden de almacén");
  Object.assign(iframe.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: `${OFICIO_WIDTH_MM}mm`,
    height: `${OFICIO_HEIGHT_MM}mm`,
    border: "0",
    zIndex: "-1",
    pointerEvents: "none",
  });
  const loaded = waitForIframeLoad(iframe);
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
  return { iframe, loaded };
}

async function prepareIframeDocument(iframe: HTMLIFrameElement): Promise<{
  doc: Document;
  win: Window;
}> {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    throw new Error("No se pudo preparar la orden de almacén.");
  }
  if (doc.fonts?.ready) {
    await doc.fonts.ready;
  }
  return { doc, win };
}

export async function printOrdenTareaAlmacen(
  data: OrdenTareaAlmacenPrintData,
): Promise<void> {
  const html = buildOrdenTareaAlmacenHtml(data);
  const { iframe, loaded } = createHiddenIframe(html);

  try {
    await loaded;
    const { win } = await prepareIframeDocument(iframe);

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        win.removeEventListener("afterprint", finish);
        iframe.remove();
        resolve();
      };

      win.addEventListener("afterprint", finish);
      win.focus();
      win.print();
      window.setTimeout(finish, 120000);
    });
  } catch (error) {
    iframe.remove();
    throw error;
  }
}

export async function downloadOrdenTareaAlmacenPdf(
  data: OrdenTareaAlmacenPrintData,
): Promise<void> {
  const { buildOrdenTareaAlmacenPdf } = await import(
    "./render-orden-tarea-almacen-pdf"
  );
  const filename = `orden-almacen-${sanitizePdfFilename(data.folio)}.pdf`;
  const pdf = buildOrdenTareaAlmacenPdf(data);
  pdf.save(filename);
}
