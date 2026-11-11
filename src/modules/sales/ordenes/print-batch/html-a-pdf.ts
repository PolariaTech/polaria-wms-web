import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { calcularCortes } from "./cortes-de-pagina";

/** Carta vertical. El HTML se dibuja a 816 px de ancho (la carta a 96 dpi): una pantalla de papel. */
const PAGE_W = 215.9;
const PAGE_H = 279.4;
/** Aire arriba y abajo de cada hoja: la impresora no llega al borde y el marco no debe pegarse a él. */
const MARGEN_VERTICAL_MM = 10;
const ESCALA_RENDER = 1.5;
export const ANCHO_PAGINA_PX = 816;
/** REQ-297: si la OC es más ancha que la carta, se captura hasta 2× y luego escala al PDF. */
export const ANCHO_MAX_RENDER_PX = ANCHO_PAGINA_PX * 2;
/** Un HTML que pase de esto se corta: es una OC, no un libro, y cada página pesa en el paquete. */
export const MAX_PAGINAS_HTML = 10;
const ESPERA_MAXIMA_MS = 10_000;

/**
 * REQ-297: ancho de captura del HTML.
 * - Contenido angosto → carta (816) para llenar el PDF.
 * - Contenido más ancho → hasta 2× carta, luego `pdfDeHtml` lo escala al ancho carta.
 */
export function resolverAnchoRenderHtml(anchoNaturalPx: number): number {
  const natural = Math.max(0, Math.floor(anchoNaturalPx));
  if (natural <= ANCHO_PAGINA_PX) return ANCHO_PAGINA_PX;
  return Math.min(natural, ANCHO_MAX_RENDER_PX);
}

/**
 * Lo mínimo que se necesita de lo que dibuja `html2canvas`. `tinta` dice cuánto hay dibujado en
 * cada fila (para partir en hojas sin cortar un renglón) y `recortar` devuelve un tramo como imagen.
 */
export interface LienzoRenderizado {
  width: number;
  height: number;
  toDataURL: (tipo: string, calidad?: number) => string;
  recortar: (desdePx: number, hastaPx: number) => string;
  tinta?: readonly number[];
}

/** Columnas que no se miran a cada lado: ahí caen los filos verticales del marco, que son tinta en todas las filas. */
const COLUMNAS_DE_MARCO = 64;
/** Un píxel más oscuro que esto (suma de R+G+B) cuenta como tinta. */
const UMBRAL_TINTA = 600;

/**
 * Estilos de papel para una OC de cliente. Un `border="1"` pinta dos filos (el de la tabla y,
 * a 2 px, el de cada celda): se funden en uno. Las celdas respiran para que el texto no toque
 * el marco. REQ-297: TODO el HTML (no solo tablas) cabe y usa el ancho carta.
 */
export const ESTILOS_PAPEL = [
  "html,body{margin:0;width:100%!important;max-width:100%!important;background:#fff}",
  "body{padding:12px 10px;box-sizing:border-box;min-width:100%}",
  "body *{max-width:100%;box-sizing:border-box}",
  "table{width:100%!important;max-width:100%!important}",
  "img,svg,canvas,video{max-width:100%!important;height:auto}",
  "pre{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}",
  'table[border]:not([border="0"]){border-collapse:collapse}',
  'table[border]:not([border="0"])>tbody>tr>td,table[border]:not([border="0"])>tbody>tr>th{padding:5px 6px}',
  // La última fila es la que cierra el marco: más aire para que el borde no roce el último renglón.
  'table[border]:not([border="0"])>tbody>tr:last-child>td{padding-bottom:14px}',
  "td,th{overflow-wrap:anywhere;word-break:break-word}",
].join("");

/** REQ-297: quita width/max-width en px/pt/mm del CSS inline o de <style>. */
export function quitarAnchosFijosDeCss(css: string): string {
  return css
    .replace(/\b(?:max-)?width\s*:\s*\d+(?:\.\d+)?(?:px|pt|mm|cm|in)\s*;?/gi, "")
    .replace(/;;+/g, ";")
    .replace(/^\s*;\s*|\s*;\s*$/g, "")
    .trim();
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
        elemento.setAttribute(
          atributo.name,
          quitarAnchosFijosDeCss(limpiarCss(atributo.value)),
        );
      }
    }
  });
  doc.querySelectorAll("style").forEach((estilo) => {
    estilo.textContent = quitarAnchosFijosDeCss(
      limpiarCss(estilo.textContent ?? ""),
    );
  });
  // REQ-297: cualquier width fijo del HTML del cliente deja la hoja a medias.
  doc.querySelectorAll("[width]").forEach((elemento) => {
    elemento.removeAttribute("width");
  });
  const politica = doc.createElement("meta");
  politica.setAttribute("http-equiv", "Content-Security-Policy");
  politica.setAttribute("content", POLITICA);
  doc.head.prepend(politica);
  // Al final del `head`, después de lo del cliente, para que sus reglas de papel ganen.
  const papel = doc.createElement("style");
  papel.textContent = ESTILOS_PAPEL;
  doc.head.append(papel);
  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

/** Cuánta tinta tiene cada fila del lienzo (0 a 1), sin contar los filos verticales del marco. */
function medirTinta(lienzo: HTMLCanvasElement): number[] {
  const contexto = lienzo.getContext("2d");
  const ancho = lienzo.width - 2 * COLUMNAS_DE_MARCO;
  if (!contexto || ancho <= 0 || lienzo.height <= 0) return [];
  const { data } = contexto.getImageData(COLUMNAS_DE_MARCO, 0, ancho, lienzo.height);
  const filas = new Array<number>(lienzo.height);
  for (let y = 0; y < lienzo.height; y += 1) {
    let oscuros = 0;
    for (let x = 0; x < ancho; x += 1) {
      const i = (y * ancho + x) * 4;
      if (data[i]! + data[i + 1]! + data[i + 2]! < UMBRAL_TINTA) oscuros += 1;
    }
    filas[y] = oscuros / ancho;
  }
  return filas;
}

/** Un tramo del lienzo como JPEG, sobre fondo blanco. */
function recortarLienzo(lienzo: HTMLCanvasElement, desdePx: number, hastaPx: number): string {
  const tramo = document.createElement("canvas");
  tramo.width = lienzo.width;
  tramo.height = Math.max(1, Math.round(hastaPx - desdePx));
  const contexto = tramo.getContext("2d");
  if (!contexto) throw new Error("No se pudo recortar la hoja.");
  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, tramo.width, tramo.height);
  contexto.drawImage(lienzo, 0, desdePx, lienzo.width, tramo.height, 0, 0, lienzo.width, tramo.height);
  return tramo.toDataURL("image/jpeg", 0.8);
}

/**
 * REQ-297: prepara el documento para capturar a ancho carta.
 * - Si el HTML es más angosto: lo escala (zoom) para llenar la carta.
 * - Si es más ancho: abre el marco hasta 2× carta; el PDF lo baja a carta.
 */
export function ajustarHtmlAlAnchoCarta(
  documento: Document,
  marco: HTMLIFrameElement,
): number {
  const cuerpo = documento.body;
  cuerpo.style.boxSizing = "border-box";
  cuerpo.style.transform = "";
  cuerpo.style.transformOrigin = "top left";
  (cuerpo.style as CSSStyleDeclaration & { zoom?: string }).zoom = "";
  cuerpo.style.minWidth = "";
  cuerpo.style.width = "auto";

  marco.style.width = `${ANCHO_PAGINA_PX}px`;
  const anchoNatural = Math.max(
    cuerpo.scrollWidth,
    documento.documentElement.scrollWidth,
    1,
  );

  if (anchoNatural < ANCHO_PAGINA_PX) {
    const escala = ANCHO_PAGINA_PX / anchoNatural;
    // `zoom` escala layout + pintura en Chromium (html2canvas lo respeta mejor que transform).
    (cuerpo.style as CSSStyleDeclaration & { zoom?: string }).zoom = String(escala);
    marco.style.width = `${ANCHO_PAGINA_PX}px`;
    marco.style.height = `${Math.max(Math.ceil(documento.documentElement.scrollHeight), 1)}px`;
    return ANCHO_PAGINA_PX;
  }

  const anchoRender = resolverAnchoRenderHtml(anchoNatural);
  marco.style.width = `${anchoRender}px`;
  cuerpo.style.minWidth = `${anchoRender}px`;
  cuerpo.style.width = `${anchoRender}px`;
  marco.style.height = `${Math.max(documento.documentElement.scrollHeight, 1)}px`;
  return anchoRender;
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

    // REQ-297: todo el HTML (no solo tablas) se mide y se escala al ancho carta.
    const anchoRender = ajustarHtmlAlAnchoCarta(documento, marco);

    const lienzo = await html2canvas(documento.body, {
      scale: ESCALA_RENDER,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: anchoRender,
    });
    return {
      width: lienzo.width,
      height: lienzo.height,
      toDataURL: (tipo, calidad) => lienzo.toDataURL(tipo, calidad),
      recortar: (desdePx, hastaPx) => recortarLienzo(lienzo, desdePx, hastaPx),
      tinta: medirTinta(lienzo),
    };
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

  const pxPorMm = lienzo.width / PAGE_W;
  const altoUtilMm = PAGE_H - 2 * MARGEN_VERTICAL_MM;
  const cortes = calcularCortes({
    alto: lienzo.height,
    altoPagina: altoUtilMm * pxPorMm,
    tinta: lienzo.tinta ?? [],
    maxPaginas: MAX_PAGINAS_HTML,
  });
  // Cada hoja lleva su propio tramo de imagen, con margen arriba y abajo; lo que sobra del
  // documento (si pasa del tope de hojas) se descarta.
  const ultimoCorte = cortes.at(-1) ?? 0;
  const final = Math.min(lienzo.height, ultimoCorte + altoUtilMm * pxPorMm);
  const limites = [0, ...cortes, cortes.length + 1 >= MAX_PAGINAS_HTML ? final : lienzo.height];
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [PAGE_W, PAGE_H], compress: true });
  for (let pagina = 0; pagina < limites.length - 1; pagina += 1) {
    if (pagina > 0) doc.addPage([PAGE_W, PAGE_H], "portrait");
    const desde = limites[pagina]!;
    const hasta = Math.min(lienzo.height, limites[pagina + 1]!);
    doc.addImage(lienzo.recortar(desde, hasta), "JPEG", 0, MARGEN_VERTICAL_MM, PAGE_W, (hasta - desde) / pxPorMm);
  }
  return new Uint8Array(doc.output("arraybuffer"));
}
