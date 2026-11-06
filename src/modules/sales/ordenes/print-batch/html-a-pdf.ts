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
/** Un HTML que pase de esto se corta: es una OC, no un libro, y cada página pesa en el paquete. */
export const MAX_PAGINAS_HTML = 10;
const ESPERA_MAXIMA_MS = 10_000;

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
 * el marco, y una línea sin espacios (una lista de correos) se parte en vez de ensanchar su
 * columna y aplastar la de al lado, que es lo que dejaba la hoja medio vacía.
 */
export const ESTILOS_PAPEL = [
  "html,body{margin:0;background:#fff}",
  "body{padding:24px}",
  'table[border]:not([border="0"]){border-collapse:collapse}',
  'table[border]:not([border="0"])>tbody>tr>td,table[border]:not([border="0"])>tbody>tr>th{padding:6px 8px}',
  // La última fila es la que cierra el marco: más aire para que el borde no roce el último renglón.
  'table[border]:not([border="0"])>tbody>tr:last-child>td{padding-bottom:16px}',
  "td,th{overflow-wrap:anywhere}",
].join("");

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
    const lienzo = await html2canvas(documento.body, {
      scale: ESCALA_RENDER,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: ANCHO_PAGINA_PX,
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
