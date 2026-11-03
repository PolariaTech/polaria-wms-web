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
