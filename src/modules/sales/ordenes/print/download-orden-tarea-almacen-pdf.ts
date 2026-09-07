"use client";

import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

/** Papel carta (coincide con el PDF de imprimir/descargar). */
const PAGE_WIDTH_MM = 215.9;
const PAGE_HEIGHT_MM = 279.4;

function sanitizePdfFilename(folio: string): string {
  const cleaned = folio.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "orden";
}

function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("No se pudo preparar la orden de venta."));
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

function createHiddenIframe(src: string): {
  iframe: HTMLIFrameElement;
  loaded: Promise<void>;
} {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Orden de venta");
  Object.assign(iframe.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: `${PAGE_WIDTH_MM}mm`,
    height: `${PAGE_HEIGHT_MM}mm`,
    border: "0",
    zIndex: "-1",
    pointerEvents: "none",
  });
  const loaded = waitForIframeLoad(iframe);
  iframe.src = src;
  document.body.appendChild(iframe);
  return { iframe, loaded };
}

/** Misma hoja que Descargar: imprime el PDF jsPDF, no el HTML aparte. */
export async function printOrdenTareaAlmacen(
  data: OrdenTareaAlmacenPrintData,
): Promise<void> {
  const { buildOrdenTareaAlmacenPdf } = await import(
    "./render-orden-tarea-almacen-pdf"
  );
  const pdf = buildOrdenTareaAlmacenPdf(data);
  // jsPDF tipa "bloburl" como URL; iframe.src / revokeObjectURL esperan string.
  const blobUrl = pdf.output("bloburl").toString();
  const { iframe, loaded } = createHiddenIframe(blobUrl);

  try {
    await loaded;
    // El visor PDF del iframe a veces necesita un tick antes de print().
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 250);
    });

    const win = iframe.contentWindow;
    if (!win) {
      throw new Error("No se pudo preparar la orden de venta.");
    }

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        win.removeEventListener("afterprint", finish);
        iframe.remove();
        URL.revokeObjectURL(blobUrl);
        resolve();
      };

      win.addEventListener("afterprint", finish);
      win.focus();
      win.print();
      window.setTimeout(finish, 120000);
    });
  } catch (error) {
    iframe.remove();
    URL.revokeObjectURL(blobUrl);
    throw error;
  }
}

export async function downloadOrdenTareaAlmacenPdf(
  data: OrdenTareaAlmacenPrintData,
): Promise<void> {
  const { buildOrdenTareaAlmacenPdf } = await import(
    "./render-orden-tarea-almacen-pdf"
  );
  const filename = `orden-venta-${sanitizePdfFilename(data.folio)}.pdf`;
  const pdf = buildOrdenTareaAlmacenPdf(data);
  pdf.save(filename);
}
