import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** Carta vertical. El HTML se dibuja a 816 px de ancho (la carta a 96 dpi): una pantalla de papel. */
const PAGE_W = 215.9;
const PAGE_H = 279.4;
export const ANCHO_PAGINA_PX = 816;
/** Un HTML que pase de esto se corta: es una OC, no un libro, y cada página pesa en el paquete. */
export const MAX_PAGINAS_HTML = 10;
const ESPERA_MAXIMA_MS = 10_000;

/** Lo mínimo que se necesita de lo que dibuja `html2canvas`. */
export interface LienzoRenderizado {
  width: number;
  height: number;
  toDataURL: (tipo: string, calidad?: number) => string;
}
export type Renderizador = (htmlSeguro: string) => Promise<LienzoRenderizado>;

/** Las etiquetas que cargan, ejecutan o envían algo: una OC solo se necesita para leerla. */
const ETIQUETAS_PROHIBIDAS =
  "script,link,iframe,frame,object,embed,base,meta[http-equiv],form,input,button,textarea,select,audio,video,source,track";
const ATRIBUTOS_DE_RED = new Set(["href", "src", "srcset", "poster", "background", "action", "formaction", "xlink:href"]);
const POLITICA = "default-src 'none'; style-src 'unsafe-inline'; img-src data:";

function limpiarCss(css: string): string {
  return css.replace(/@import[^;]*;?/gi, "").replace(/url\(\s*(?!['"]?data:)[^)]*\)/gi, "none");
}

/**
 * El HTML viene de un cliente: se vuelve inerte antes de dibujarlo. Sin scripts, sin manejadores
 * de eventos, sin nada que se baje de la red (imágenes, hojas de estilo, fuentes) y con una política
 * que lo impide también al navegador. Se conserva el texto, las tablas y los estilos propios.
 */
export function sanitizarHtmlOc(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll(ETIQUETAS_PROHIBIDAS).forEach((nodo) => nodo.remove());
  doc.querySelectorAll("*").forEach((elemento) => {
    for (const atributo of Array.from(elemento.attributes)) {
      const nombre = atributo.name.toLowerCase();
      const valor = atributo.value.trim().toLowerCase();
      if (nombre.startsWith("on")) {
        elemento.removeAttribute(atributo.name);
      } else if (ATRIBUTOS_DE_RED.has(nombre) && !valor.startsWith("data:") && !valor.startsWith("#")) {
        elemento.removeAttribute(atributo.name);
      } else if (nombre === "style") {
        elemento.setAttribute(atributo.name, limpiarCss(atributo.value));
      }
    }
  });
  doc.querySelectorAll("style").forEach((estilo) => {
    estilo.textContent = limpiarCss(estilo.textContent ?? "");
  });
  const politica = doc.createElement("meta");
  politica.setAttribute("http-equiv", "Content-Security-Policy");
  politica.setAttribute("content", POLITICA);
  doc.head.prepend(politica);
  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

/** Dibuja el HTML ya limpio en un iframe fuera de pantalla, sin scripts, y lo fotografía. */
export async function renderizarEnIframe(htmlSeguro: string): Promise<LienzoRenderizado> {
  const marco = document.createElement("iframe");
  // `allow-same-origin` sin `allow-scripts`: se puede leer su documento pero no corre nada dentro.
  marco.setAttribute("sandbox", "allow-same-origin");
  marco.setAttribute("aria-hidden", "true");
  marco.style.cssText = `position:fixed;left:-10000px;top:0;width:${ANCHO_PAGINA_PX}px;height:1000px;border:0;`;
  marco.srcdoc = htmlSeguro;
  document.body.appendChild(marco);
  try {
    await new Promise<void>((listo, fallo) => {
      const reloj = setTimeout(() => fallo(new Error("El HTML tardó demasiado en cargar.")), ESPERA_MAXIMA_MS);
      marco.onload = () => {
        clearTimeout(reloj);
        listo();
      };
    });
    const documento = marco.contentDocument;
    if (!documento?.body) throw new Error("No se pudo abrir el HTML.");
    marco.style.height = `${documento.documentElement.scrollHeight}px`;
    return await html2canvas(documento.body, {
      scale: 1.5,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: ANCHO_PAGINA_PX,
    });
  } finally {
    marco.remove();
  }
}

/**
 * Pasa un HTML (por ejemplo la OC que exporta el sistema del cliente) a PDF. Queda como imagen:
 * es una copia para leer y revisar, no se puede seleccionar el texto. La imagen se reparte en
 * páginas carta; el HTML conserva así su aspecto sin depender de un navegador sin pantalla.
 */
export async function pdfDeHtml(
  html: string,
  nombreArchivo: string,
  renderizar: Renderizador = renderizarEnIframe,
): Promise<Uint8Array> {
  const lienzo = await renderizar(sanitizarHtmlOc(html));
  if (lienzo.width <= 0 || lienzo.height <= 0) {
    throw new Error(`${nombreArchivo} quedó en blanco al convertirlo.`);
  }

  const imagen = lienzo.toDataURL("image/jpeg", 0.8);
  const altoMm = lienzo.height * (PAGE_W / lienzo.width);
  const paginas = Math.min(MAX_PAGINAS_HTML, Math.max(1, Math.ceil(altoMm / PAGE_H)));
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [PAGE_W, PAGE_H], compress: true });
  for (let pagina = 0; pagina < paginas; pagina += 1) {
    if (pagina > 0) doc.addPage([PAGE_W, PAGE_H], "portrait");
    // La misma imagen en cada página, subida lo que ya se vio: la hoja solo muestra su tramo.
    doc.addImage(imagen, "JPEG", 0, 0 - pagina * PAGE_H, PAGE_W, altoMm);
  }
  return new Uint8Array(doc.output("arraybuffer"));
}
