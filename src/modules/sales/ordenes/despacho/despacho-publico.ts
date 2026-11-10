export const ESTADO_ALISTADA = "alistada";
export const ESTADO_ALISTAMIENTO = "alistamiento";
export const ESTADO_DESPACHADA = "despachada";

export const ESTADOS_ORIGEN_DESPACHO = [
  ESTADO_ALISTADA,
  ESTADO_ALISTAMIENTO,
] as const;

const LARGO_MAXIMO_NOMBRE = 120;

export interface OrdenDespachoPublico {
  idOrdenVenta: string;
  codigo: string;
  estado: typeof ESTADO_ALISTADA | typeof ESTADO_ALISTAMIENTO;
  codigoCuenta: string;
  nombreCliente: string;
}

export interface ConfirmacionDespacho {
  idOrdenVenta: string;
  codigoCuenta: string;
  despachador: string;
  transportista: string;
}

export type ValidacionDespacho =
  | { ok: true; value: ConfirmacionDespacho }
  | { ok: false; error: string };

function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** La cuenta llega en el QR: ` /despacho?cuenta=023WA `. */
export function cuentaDespachoDesdeQuery(
  value: string | string[] | undefined,
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return texto(raw);
}

export function preguntaConfirmacionDespacho(
  codigo: string,
  nombreCliente: string,
): string {
  return `¿Seguro que quieres despachar ${codigo} de ${nombreCliente}?`;
}

/** El cliente de la orden es el nombre del comprador. */
export function nombreClienteDeComprador(comprador: unknown): string {
  const rel = Array.isArray(comprador) ? comprador[0] : comprador;
  if (!rel || typeof rel !== "object") return "—";
  const nombre = texto((rel as { nombre?: unknown }).nombre);
  return nombre || "—";
}

function nombrePersona(value: unknown): string | null {
  const nombre = texto(value);
  if (!nombre || nombre.length > LARGO_MAXIMO_NOMBRE) return null;
  return nombre;
}

export function validarConfirmacionDespacho(
  input: unknown,
): ValidacionDespacho {
  const body =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const idOrdenVenta = texto(body.idOrdenVenta);
  const codigoCuenta = texto(body.codigoCuenta);
  if (!idOrdenVenta || !codigoCuenta) {
    return { ok: false, error: "No se encontró la orden." };
  }

  const despachador = nombrePersona(body.despachador);
  if (!despachador) {
    const crudo = texto(body.despachador);
    return {
      ok: false,
      error: crudo
        ? "El nombre de quien despachó es demasiado largo."
        : "Escribe quién despachó la mercancía.",
    };
  }

  const transportista = nombrePersona(body.transportista);
  if (!transportista) {
    const crudo = texto(body.transportista);
    return {
      ok: false,
      error: crudo
        ? "El nombre del transportista es demasiado largo."
        : "Escribe quién es el transportista.",
    };
  }

  return {
    ok: true,
    value: { idOrdenVenta, codigoCuenta, despachador, transportista },
  };
}

export function partirOrdenesDespacho(ordenes: OrdenDespachoPublico[]): {
  alistada: OrdenDespachoPublico[];
  alistamiento: OrdenDespachoPublico[];
} {
  const alistada = ordenes.filter((orden) => orden.estado === ESTADO_ALISTADA);
  const alistamiento = ordenes.filter(
    (orden) => orden.estado === ESTADO_ALISTAMIENTO,
  );
  return { alistada, alistamiento };
}

export function esEstadoOrigenDespacho(
  estado: string | null | undefined,
): estado is (typeof ESTADOS_ORIGEN_DESPACHO)[number] {
  return (
    estado === ESTADO_ALISTADA || estado === ESTADO_ALISTAMIENTO
  );
}
