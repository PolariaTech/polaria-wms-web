import { useCallback, useSyncExternalStore } from "react";

/**
 * Estado de la foto de una hoja y registro de las últimas fotos de este celular.
 *
 * Cada QR abre una pestaña con su propia hoja (OT). Para que quien sigue
 * escaneando vea si la foto anterior se subió o falló, cada pestaña deja su
 * estado en localStorage y las demás lo leen. Solo viajan ids y folio.
 */

/**
 * subiendo = la foto va camino al servidor (1 a 3 s); procesando = el servidor ya la
 * recibió y la lee en segundo plano (se sigue por `idIntento`); lista / fallo = terminó.
 */
export type FaseCaptura = "reposo" | "subiendo" | "procesando" | "lista" | "fallo";
export type EstadoRegistro = Exclude<FaseCaptura, "reposo">;

export interface RegistroCaptura {
  idOrdenVenta: string;
  idOrdenTrabajo: string;
  folio: string;
  /** «OT 2/9»: sin esto, las hojas de una misma OV se verían idénticas en la lista. */
  etiqueta?: string;
  /** Intento del servidor que se sigue mientras está «procesando». */
  idIntento?: string;
  /** Motivo, si falló. */
  mensaje?: string;
  estado: EstadoRegistro;
  /** Milisegundos (epoch) del último cambio de estado. */
  at: number;
}

const CLAVE_ALMACEN = "polaria:captura:sesion";
const MAX_REGISTROS = 20;
const VIGENCIA_MS = 12 * 60 * 60 * 1000;
/** Más que el límite de 60 s del servidor: pasado esto, «subiendo» ya no es creíble. */
export const SUBIENDO_VENCE_MS = 90_000;

const ESTADOS: readonly string[] = ["subiendo", "procesando", "lista", "fallo"];
const SIN_REGISTROS: RegistroCaptura[] = [];

export function claveRegistro(
  registro: Pick<RegistroCaptura, "idOrdenVenta" | "idOrdenTrabajo">,
): string {
  return `${registro.idOrdenVenta}|${registro.idOrdenTrabajo}`;
}

function esRegistro(valor: unknown): valor is RegistroCaptura {
  if (typeof valor !== "object" || valor === null) return false;
  const campos = valor as Record<string, unknown>;
  return (
    typeof campos.idOrdenVenta === "string" &&
    typeof campos.idOrdenTrabajo === "string" &&
    typeof campos.folio === "string" &&
    (campos.etiqueta === undefined || typeof campos.etiqueta === "string") &&
    (campos.idIntento === undefined || typeof campos.idIntento === "string") &&
    (campos.mensaje === undefined || typeof campos.mensaje === "string") &&
    typeof campos.estado === "string" &&
    ESTADOS.includes(campos.estado) &&
    typeof campos.at === "number"
  );
}

export function parsearRegistros(crudo: string | null): RegistroCaptura[] {
  if (!crudo) return SIN_REGISTROS;
  try {
    const datos: unknown = JSON.parse(crudo);
    if (!Array.isArray(datos)) return SIN_REGISTROS;
    return datos.filter(esRegistro);
  } catch {
    return SIN_REGISTROS;
  }
}

/** Reemplaza el registro de la misma hoja, descarta los vencidos y limita el total. */
export function fusionarRegistro(
  lista: RegistroCaptura[],
  nuevo: RegistroCaptura,
  ahora: number,
): RegistroCaptura[] {
  const clave = claveRegistro(nuevo);
  return [nuevo, ...lista.filter((r) => claveRegistro(r) !== clave)]
    .filter((r) => ahora - r.at < VIGENCIA_MS)
    .slice(0, MAX_REGISTROS);
}

/** Una subida que no confirmó a tiempo se muestra como fallida. */
export function estadoVisible(
  registro: RegistroCaptura,
  ahora: number,
): EstadoRegistro {
  if (registro.estado === "subiendo" && ahora - registro.at > SUBIENDO_VENCE_MS) {
    return "fallo";
  }
  return registro.estado;
}

export function otrasHojas(
  lista: RegistroCaptura[],
  propia: Pick<RegistroCaptura, "idOrdenVenta" | "idOrdenTrabajo">,
  ahora: number,
  max = 5,
): RegistroCaptura[] {
  const clavePropia = claveRegistro(propia);
  return lista
    .filter((r) => claveRegistro(r) !== clavePropia && ahora - r.at < VIGENCIA_MS)
    .sort((a, b) => b.at - a.at)
    .slice(0, max);
}

// ── Almacén (localStorage) con aviso a esta misma pestaña ─────────────────

const oyentes = new Set<() => void>();
let cacheCrudo: string | null | undefined;
let cacheValor: RegistroCaptura[] = SIN_REGISTROS;

function leerCrudo(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_ALMACEN);
  } catch {
    return null;
  }
}

function instantanea(): RegistroCaptura[] {
  const crudo = leerCrudo();
  if (crudo !== cacheCrudo) {
    cacheCrudo = crudo;
    cacheValor = parsearRegistros(crudo);
  }
  return cacheValor;
}

function suscribir(avisar: () => void): () => void {
  oyentes.add(avisar);
  const alCambiarOtraPestana = (evento: StorageEvent) => {
    if (evento.key === null || evento.key === CLAVE_ALMACEN) avisar();
  };
  window.addEventListener("storage", alCambiarOtraPestana);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", alCambiarOtraPestana);
  };
}

/** Guarda el estado de una hoja. Sin localStorage (modo privado) no hace nada. */
export function registrarCaptura(registro: RegistroCaptura): void {
  try {
    const actual = parsearRegistros(leerCrudo());
    const siguiente = fusionarRegistro(actual, registro, registro.at);
    window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(siguiente));
  } catch {
    return;
  }
  oyentes.forEach((avisar) => avisar());
}

export function useRegistrosCaptura(): RegistroCaptura[] {
  return useSyncExternalStore(suscribir, instantanea, () => SIN_REGISTROS);
}

/** Reloj que avanza cada `intervaloMs`; en el servidor vale 0. */
export function useAhora(intervaloMs: number): number {
  const suscribirReloj = useCallback(
    (avisar: () => void) => {
      const id = window.setInterval(avisar, intervaloMs);
      return () => window.clearInterval(id);
    },
    [intervaloMs],
  );
  return useSyncExternalStore(
    suscribirReloj,
    () => Math.floor(Date.now() / intervaloMs) * intervaloMs,
    () => 0,
  );
}
