import { runDomainQuery } from "@/lib/supabase/domain-query";
import {
  claveComparable,
  estaColgada,
  limitesDeRango,
  MAX_FILAS_FOTOS,
  mensajeParaOperador,
  otsDeOrigen,
  resumirFotos,
  tiempoTotalMs,
  type DatosOt,
  type EstadoFoto,
  type RangoFotos,
  type ResumenFotos,
} from "./estado-fotos.logic";

/**
 * POL-406: lectura de los intentos de captura de foto (tabla de la migración 115) para la pantalla
 * «Estado de fotos». Va con la sesión del usuario, sin cliente admin ni ruta nueva: la política RLS
 * aísla por empresa (en `public`, por cuenta), y aquí se filtra por la cuenta activa. Solo lectura.
 *
 * Límite conocido: una OV antigua puede tener sus intentos en `public` aunque la cuenta tenga
 * esquema propio (ver `crearIntento`); esos no salen aquí.
 */

const TABLA = "orden_venta_surtido_captura_intento";
/** Tope de filas livianas para el resumen: Supabase corta en 1 000 por consulta. */
const MAX_FILAS_RESUMEN = 1000;

const COLUMNAS_FILA =
  "id_intento,id_orden_venta,id_orden_trabajo,estado,codigo_error,mensaje_error,numero_intento,tiempos,url_foto,created_at";

interface FilaIntentoDb {
  id_intento: string;
  id_orden_venta: string;
  id_orden_trabajo: string;
  estado: EstadoFoto;
  /** Solo para decidir qué mensaje mostrar: nunca sale de este servicio. */
  codigo_error: string | null;
  mensaje_error: string | null;
  numero_intento: number;
  tiempos: unknown;
  url_foto: string | null;
  created_at: string;
}

export interface FilaFoto {
  idIntento: string;
  idOrdenVenta: string;
  /** Código de la OV (ej. OV-00000552); null si no se pudo leer. */
  codigoOv: string | null;
  idOrdenTrabajo: string;
  /** Posición y nombre de la OT según el pedido de la OV; null si la OV ya no la tiene. */
  ot: DatosOt | null;
  estado: EstadoFoto;
  colgada: boolean;
  mensajeError: string | null;
  numeroIntento: number;
  tiempoTotalMs: number | null;
  urlFoto: string | null;
  creadoEn: string;
}

export interface EstadoFotos {
  resumen: ResumenFotos;
  filas: FilaFoto[];
}

type Respuesta<T> = { data: T | null; error: { message: string } | null };

/** El constructor de consultas de Supabase solo es «thenable»: `runDomainQuery` pide una promesa. */
function comoPromesa<T>(consulta: PromiseLike<unknown>): Promise<Respuesta<T>> {
  return Promise.resolve(consulta) as Promise<Respuesta<T>>;
}

export async function leerEstadoFotos(input: {
  /**
   * Cuenta activa. En el esquema de la empresa la política de seguridad deja ver todas las cuentas
   * de la empresa, así que el filtro por cuenta se hace aquí.
   */
  codigoCuenta: string;
  rango: RangoFotos;
  /** Si viene, la tabla muestra solo ese estado; el resumen sigue contando todo el rango. */
  estado?: EstadoFoto | null;
  ahora?: Date;
}): Promise<EstadoFotos> {
  const ahora = input.ahora ?? new Date();
  const { desde, hasta } = limitesDeRango(input.rango, ahora);

  const [livianas, filasDb] = await Promise.all([
    runDomainQuery<{ estado: EstadoFoto; created_at: string }[]>((client) =>
      comoPromesa(
        client
          .from(TABLA)
          .select("estado,created_at")
          .eq("codigo_cuenta", input.codigoCuenta)
          .gte("created_at", desde)
          .lt("created_at", hasta)
          .limit(MAX_FILAS_RESUMEN),
      ),
    ),
    runDomainQuery<FilaIntentoDb[]>((client) => {
      let consulta = client
        .from(TABLA)
        .select(COLUMNAS_FILA)
        .eq("codigo_cuenta", input.codigoCuenta)
        .gte("created_at", desde)
        .lt("created_at", hasta);
      if (input.estado) consulta = consulta.eq("estado", input.estado);
      return comoPromesa(
        consulta.order("created_at", { ascending: false }).limit(MAX_FILAS_FOTOS),
      );
    }),
  ]);

  const idsOv = [...new Set(filasDb.map((fila) => fila.id_orden_venta))];
  const codigos = new Map<string, string>();
  const otsPorOv = new Map<string, Map<string, DatosOt>>();
  if (idsOv.length > 0) {
    const ordenes = await runDomainQuery<
      { id_orden_venta: string; codigo: string | null; origen_correo: unknown }[]
    >((client) =>
      comoPromesa(
        client
          .from("orden_venta")
          .select("id_orden_venta,codigo,origen_correo")
          .in("id_orden_venta", idsOv),
      ),
    );
    for (const orden of ordenes) {
      if (orden.codigo) codigos.set(orden.id_orden_venta, orden.codigo);
      otsPorOv.set(orden.id_orden_venta, otsDeOrigen(orden.origen_correo));
    }
  }

  return {
    resumen: resumirFotos(livianas, ahora),
    filas: filasDb.map((fila) => ({
      idIntento: fila.id_intento,
      idOrdenVenta: fila.id_orden_venta,
      codigoOv: codigos.get(fila.id_orden_venta) ?? null,
      idOrdenTrabajo: fila.id_orden_trabajo,
      ot: otsPorOv.get(fila.id_orden_venta)?.get(claveComparable(fila.id_orden_trabajo)) ?? null,
      estado: fila.estado,
      colgada: estaColgada(fila, ahora),
      mensajeError:
        fila.estado === "fallo"
          ? mensajeParaOperador(fila.codigo_error, fila.mensaje_error)
          : null,
      numeroIntento: fila.numero_intento,
      tiempoTotalMs: tiempoTotalMs(fila.tiempos),
      urlFoto: fila.url_foto,
      creadoEn: fila.created_at,
    })),
  };
}
