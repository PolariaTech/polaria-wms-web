/** Formato y separación de los datos de un correo (REQ-104). Todo en hora de Colombia. */

const FORMATO_RECIBIDO = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

/** Hora de Colombia (UTC-5), sea cual sea la zona del equipo. */
export function formatearRecibido(iso: string | null): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? "—" : FORMATO_RECIBIDO.format(fecha);
}

const FORMATO_COMPLETO = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** Fecha y hora completas en hora de Colombia (UTC-5). */
export function formatearFechaCompleta(iso: string | null): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? "—" : FORMATO_COMPLETO.format(fecha);
}

export interface DireccionCorreo {
  nombre: string | null;
  correo: string;
}

/**
 * Separa `"Ana Torres" <ana@x.com>, ventas@x.com` en personas. Las comas dentro de comillas
 * o de `<…>` no separan: un nombre como "Torres, Ana" sigue siendo una sola persona.
 */
export function separarDirecciones(texto: string | null): DireccionCorreo[] {
  if (!texto) return [];
  const partes: string[] = [];
  let actual = "";
  let enComillas = false;
  let enAngulos = false;
  for (const caracter of texto) {
    if (caracter === '"') enComillas = !enComillas;
    else if (!enComillas && caracter === "<") enAngulos = true;
    else if (!enComillas && caracter === ">") enAngulos = false;
    if (caracter === "," && !enComillas && !enAngulos) {
      partes.push(actual);
      actual = "";
    } else {
      actual += caracter;
    }
  }
  partes.push(actual);

  return partes
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) => {
      const conNombre = /^"?([^"<]*?)"?\s*<([^>]+)>$/.exec(parte);
      if (conNombre) {
        const nombre = (conNombre[1] ?? "").trim();
        return { nombre: nombre || null, correo: (conNombre[2] ?? "").trim() };
      }
      return { nombre: null, correo: parte.replace(/^"|"$/g, "") };
    });
}

/** El flujo guarda todos los adjuntos en una sola columna, separados por « | ». */
export function separarAdjuntos(valor: string | null): string[] {
  if (!valor) return [];
  return valor
    .split("|")
    .map((nombre) => nombre.trim())
    .filter(Boolean);
}

/** El mensaje de un error, listo para mostrárselo a quien opera. */
export function mensajeDeError(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Ocurrió un error inesperado. Intenta de nuevo.";
}

/** `YYYY-MM-DD` del campo de fecha → instante en hora de Colombia (UTC-5). */
export function inicioDelDiaColombia(dia: string): string {
  return `${dia}T00:00:00.000-05:00`;
}

export function finDelDiaColombia(dia: string): string {
  return `${dia}T23:59:59.999-05:00`;
}

const FORMATO_TAMANO = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

/** Tamaño de un archivo para leerlo de un vistazo: `812 B`, `48 KB`, `1,5 MB`. */
export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${FORMATO_TAMANO.format(bytes / 1024)} KB`;
  return `${FORMATO_TAMANO.format(bytes / (1024 * 1024))} MB`;
}

/** Solo estos tipos se abren en una pestaña: PDF e imágenes que no ejecutan nada (no SVG). */
export function esVistaPreviaSegura(mimeType: string): boolean {
  return /^(application\/pdf|image\/(png|jpe?g|gif|webp))$/i.test(mimeType.trim());
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const ETIQUETAS_QUE_NO_VAN =
  "script, iframe, frame, frameset, object, embed, form, base, link, meta, applet";
const ATRIBUTOS_CON_ENLACE = ["href", "src", "action", "formaction", "xlink:href"];

/**
 * Limpia el HTML de un correo, que es contenido ajeno: quita lo que ejecuta o redirige y hace
 * que los enlaces abran en otra pestaña sin dar acceso a esta. Es una segunda barrera: el marco
 * aislado y su política de contenido ya impiden ejecutar nada.
 */
export function sanearHtmlDelCorreo(html: string): string {
  const documento = new DOMParser().parseFromString(html, "text/html");
  documento.querySelectorAll(ETIQUETAS_QUE_NO_VAN).forEach((nodo) => nodo.remove());
  documento.querySelectorAll("*").forEach((nodo) => {
    for (const atributo of Array.from(nodo.attributes)) {
      const nombre = atributo.name.toLowerCase();
      const esScript = atributo.value.trim().toLowerCase().startsWith("javascript:");
      if (nombre.startsWith("on") || (ATRIBUTOS_CON_ENLACE.includes(nombre) && esScript)) {
        nodo.removeAttribute(atributo.name);
      }
    }
  });
  documento.querySelectorAll("a").forEach((enlace) => {
    enlace.setAttribute("target", "_blank");
    enlace.setAttribute("rel", "noopener noreferrer");
  });
  return documento.body.innerHTML;
}

/** ¿El correo trae imágenes que se bajarían de internet? Cargarlas avisa al remitente que se abrió. */
export function tieneImagenesExternas(html: string): boolean {
  return /<img\b[^>]*\bsrc\s*=\s*["']?https?:/i.test(html);
}

const ESTILO_DEL_CORREO =
  "body{margin:16px;font:14px/1.5 system-ui,sans-serif;color:#1a1a1a;background:#fff;overflow-wrap:anywhere}" +
  "img{max-width:100%;height:auto}pre{white-space:pre-wrap;font:inherit}a{color:#0b6b5c}";

/**
 * Modo oscuro de Polaria (fondo #020609, texto #f8f8f6) para un contenido pensado sobre blanco:
 * se invierte todo el documento y se parte de #fdf9f6, que invertido da el fondo de Polaria; las
 * imágenes se invierten de nuevo para que no se vean en negativo.
 */
const ESTILO_OSCURO =
  "html{filter:invert(1) hue-rotate(180deg);background:#fdf9f6}" +
  "body{background:#fdf9f6;color:#1a1a1a}img{filter:invert(1) hue-rotate(180deg)}";

/**
 * El documento que se muestra dentro del marco aislado. Su política de contenido bloquea
 * scripts, formularios y conexiones; las imágenes de internet solo se permiten si se pide.
 */
export function armarDocumentoDelCorreo(opciones: {
  html: string;
  texto: string;
  permitirImagenes: boolean;
  /** Fondo oscuro de Polaria en lugar del blanco. */
  oscuro?: boolean;
}): string {
  const cuerpo = opciones.html.trim()
    ? sanearHtmlDelCorreo(opciones.html)
    : `<pre>${escaparHtml(opciones.texto)}</pre>`;
  const imagenes = opciones.permitirImagenes ? "img-src data: blob: https:" : "img-src data: blob:";
  const politica = `default-src 'none'; ${imagenes}; style-src 'unsafe-inline'; font-src data:`;
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<meta http-equiv="Content-Security-Policy" content="${politica}">` +
    `<base target="_blank"><style>${ESTILO_DEL_CORREO}${opciones.oscuro ? ESTILO_OSCURO : ""}</style></head><body>${cuerpo}</body></html>`
  );
}
