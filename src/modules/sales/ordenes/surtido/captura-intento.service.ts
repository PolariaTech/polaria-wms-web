import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveTenantSchemaForCuenta } from "@/modules/sales/shared/services/sales-catalog.server";

/**
 * Intentos de captura de foto (REQ-247): una fila por foto enviada desde el QR.
 * El api responde en cuanto la foto está recibida y el resto corre aparte;
 * esta tabla es lo que lee la pantalla para saber cómo va cada foto.
 */

const TABLA = "orden_venta_surtido_captura_intento";
const FK_VIOLADA = "23503";
const MAX_IDS_POR_CONSULTA = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** La función de Vercel dura 60 s: pasado esto, un intento «en curso» se da por perdido. */
export const INTENTO_VENCE_MS = 120_000;

export type EstadoIntento = "recibida" | "procesando" | "lista" | "fallo";

/** Dónde vive el intento: esquema del cliente, o null si está en public. */
export interface RefIntento {
  idIntento: string;
  esquema: string | null;
}

export interface IntentoCaptura {
  idIntento: string;
  estado: EstadoIntento;
  codigoError: string | null;
  mensajeError: string | null;
  urlFoto: string | null;
  numeroIntento: number;
}

interface FilaIntento {
  id_intento: string;
  estado: EstadoIntento;
  codigo_error: string | null;
  mensaje_error: string | null;
  url_foto: string | null;
  numero_intento: number;
  created_at: string;
}

type IntentoEncontrado = { ref: RefIntento; fila: FilaIntento };

export const MENSAJE_SIN_RESPUESTA =
  "La foto no terminó de procesarse. Toca Reintentar o tómala de nuevo.";

function clienteAdmin(): SupabaseClient {
  const cliente = getSupabaseAdminClient();
  if (!cliente) throw new Error("Supabase admin no configurado.");
  return cliente;
}

function tabla(cliente: SupabaseClient, esquema: string | null) {
  return esquema ? cliente.schema(esquema).from(TABLA) : cliente.from(TABLA);
}

const esquemaPorCuenta = new Map<string, string | null>();

/** El esquema de una cuenta no cambia: se consulta una vez por proceso. */
async function esquemaDeCuenta(
  cliente: SupabaseClient,
  codigoCuenta: string,
): Promise<string | null> {
  const clave = codigoCuenta.trim();
  if (esquemaPorCuenta.has(clave)) return esquemaPorCuenta.get(clave) ?? null;
  const esquema = await resolveTenantSchemaForCuenta(cliente, clave);
  esquemaPorCuenta.set(clave, esquema);
  return esquema;
}

/** Solo para pruebas. */
export function olvidarEsquemasEnCache(): void {
  esquemaPorCuenta.clear();
}

/** Reserva la fila de una foto recién recibida. */
export async function crearIntento(input: {
  idOrdenVenta: string;
  idOrdenTrabajo: string;
  codigoCuenta: string;
}): Promise<RefIntento> {
  const cliente = clienteAdmin();
  const fila = {
    id_orden_venta: input.idOrdenVenta,
    id_orden_trabajo: input.idOrdenTrabajo,
    codigo_cuenta: input.codigoCuenta,
  };
  const esquema = await esquemaDeCuenta(cliente, input.codigoCuenta);

  const primero = await tabla(cliente, esquema)
    .insert(fila)
    .select("id_intento")
    .single();
  if (!primero.error && primero.data) {
    return { idIntento: String(primero.data.id_intento), esquema };
  }

  // Una OV antigua puede vivir en public aunque la cuenta tenga esquema propio.
  if (esquema && primero.error?.code === FK_VIOLADA) {
    const segundo = await tabla(cliente, null)
      .insert(fila)
      .select("id_intento")
      .single();
    if (!segundo.error && segundo.data) {
      return { idIntento: String(segundo.data.id_intento), esquema: null };
    }
    throw new Error(segundo.error?.message ?? "No se pudo registrar la foto.");
  }
  throw new Error(primero.error?.message ?? "No se pudo registrar la foto.");
}

async function actualizar(
  ref: RefIntento,
  cambios: Record<string, unknown>,
): Promise<void> {
  const { error } = await tabla(clienteAdmin(), ref.esquema)
    .update({ ...cambios, updated_at: new Date().toISOString() })
    .eq("id_intento", ref.idIntento);
  if (error) throw new Error(error.message);
}

export function marcarProcesando(ref: RefIntento): Promise<void> {
  return actualizar(ref, {
    estado: "procesando",
    codigo_error: null,
    mensaje_error: null,
  });
}

/** Guardar la URL en cuanto exista permite reintentar aunque la IA no llegue a terminar. */
export function guardarUrlFoto(ref: RefIntento, urlFoto: string): Promise<void> {
  return actualizar(ref, { url_foto: urlFoto });
}

export function marcarLista(
  ref: RefIntento,
  datos: { modelo: string; tiempos: Record<string, number>; urlFoto: string | null },
): Promise<void> {
  return actualizar(ref, {
    estado: "lista",
    modelo: datos.modelo,
    tiempos: datos.tiempos,
    ...(datos.urlFoto ? { url_foto: datos.urlFoto } : {}),
    terminado_at: new Date().toISOString(),
  });
}

export function marcarFallo(
  ref: RefIntento,
  datos: {
    codigo: string;
    mensaje: string;
    tiempos?: Record<string, number>;
    urlFoto?: string | null;
  },
): Promise<void> {
  return actualizar(ref, {
    estado: "fallo",
    codigo_error: datos.codigo.slice(0, 40),
    mensaje_error: datos.mensaje,
    ...(datos.tiempos ? { tiempos: datos.tiempos } : {}),
    ...(datos.urlFoto ? { url_foto: datos.urlFoto } : {}),
    terminado_at: new Date().toISOString(),
  });
}

/** Vuelve a dejar el intento en cola para reprocesar la misma foto. */
export function prepararReintento(
  ref: RefIntento,
  numeroIntento: number,
): Promise<void> {
  return actualizar(ref, {
    estado: "recibida",
    numero_intento: numeroIntento,
    codigo_error: null,
    mensaje_error: null,
    terminado_at: null,
  });
}

async function seleccionar(
  cliente: SupabaseClient,
  esquema: string | null,
  ids: string[],
  idOrdenVenta: string,
): Promise<IntentoEncontrado[]> {
  const { data, error } = await tabla(cliente, esquema)
    .select(
      "id_intento,estado,codigo_error,mensaje_error,url_foto,numero_intento,created_at",
    )
    .in("id_intento", ids)
    .eq("id_orden_venta", idOrdenVenta);
  if (error) throw new Error(error.message);
  return ((data ?? []) as FilaIntento[]).map((fila) => ({
    ref: { idIntento: fila.id_intento, esquema },
    fila,
  }));
}

async function buscar(input: {
  ids: string[];
  idOrdenVenta: string;
  codigoCuenta: string;
}): Promise<IntentoEncontrado[]> {
  // Los ids vienen del navegador: uno que no sea UUID haría fallar la consulta entera.
  const ids = [...new Set(input.ids.filter((id) => UUID.test(id)))].slice(0, MAX_IDS_POR_CONSULTA);
  if (ids.length === 0) return [];
  const cliente = clienteAdmin();
  const esquema = await esquemaDeCuenta(cliente, input.codigoCuenta);

  const encontrados = await seleccionar(cliente, esquema, ids, input.idOrdenVenta);
  if (!esquema || encontrados.length >= ids.length) return encontrados;

  const yaVistos = new Set(encontrados.map((e) => e.ref.idIntento));
  const enPublic = await seleccionar(cliente, null, ids, input.idOrdenVenta);
  return [...encontrados, ...enPublic.filter((e) => !yaVistos.has(e.ref.idIntento))];
}

function aIntento(fila: FilaIntento, estado: EstadoIntento): IntentoCaptura {
  const perdido = estado === "fallo" && fila.estado !== "fallo";
  return {
    idIntento: fila.id_intento,
    estado,
    codigoError: perdido ? "sin_respuesta" : fila.codigo_error,
    mensajeError: perdido ? MENSAJE_SIN_RESPUESTA : fila.mensaje_error,
    urlFoto: fila.url_foto,
    numeroIntento: fila.numero_intento,
  };
}

function estaPerdido(fila: FilaIntento, ahora: number): boolean {
  const enCurso = fila.estado === "recibida" || fila.estado === "procesando";
  return enCurso && ahora - new Date(fila.created_at).getTime() > INTENTO_VENCE_MS;
}

/**
 * Estado de varios intentos de una OV. Un intento que lleva demasiado tiempo en curso
 * (la función murió sin avisar) se marca como fallo aquí mismo: no hace falta un barrido.
 */
export async function leerIntentos(input: {
  ids: string[];
  idOrdenVenta: string;
  codigoCuenta: string;
}): Promise<IntentoCaptura[]> {
  const encontrados = await buscar(input);
  const ahora = Date.now();
  return Promise.all(
    encontrados.map(async ({ ref, fila }) => {
      if (!estaPerdido(fila, ahora)) return aIntento(fila, fila.estado);
      await marcarFallo(ref, {
        codigo: "sin_respuesta",
        mensaje: MENSAJE_SIN_RESPUESTA,
      }).catch(() => undefined);
      return aIntento(fila, "fallo");
    }),
  );
}

/** Un intento con su referencia, para reintentarlo desde la foto guardada. */
export async function cargarIntento(input: {
  idIntento: string;
  idOrdenVenta: string;
  codigoCuenta: string;
}): Promise<{ ref: RefIntento; intento: IntentoCaptura } | null> {
  const [encontrado] = await buscar({
    ids: [input.idIntento],
    idOrdenVenta: input.idOrdenVenta,
    codigoCuenta: input.codigoCuenta,
  });
  if (!encontrado) return null;
  const estado = estaPerdido(encontrado.fila, Date.now()) ? "fallo" : encontrado.fila.estado;
  return { ref: encontrado.ref, intento: aIntento(encontrado.fila, estado) };
}
