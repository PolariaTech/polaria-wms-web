import { getOrdenVentaDetalle } from "../../shared/services/sales.service";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { mapOrdenVentaToAlmacenPrintSheets } from "../print/map-orden-tarea-almacen";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import { applySurtidoCapturasToPrintSheets } from "../surtido/apply-surtido-to-print";
import { listOrdenSurtidoCapturasClient } from "../surtido/list-orden-surtido-capturas.client";
import { filtrarHojasElegidas, type ResumenOvBatch } from "./batch-seleccion";
import { ordenarHojasPorEntrega } from "./orden-impresion";

/** Cuántas OV se leen a la vez: rápido sin saturar el límite de peticiones del api. */
const OV_EN_PARALELO = 4;

type EjecutarEnCuenta = <T>(tarea: () => Promise<T>) => Promise<T>;

export interface CargarHojasBatchInput {
  codigoCuenta: string;
  resumen: readonly ResumenOvBatch[];
  zonaHoraria: string;
  runScoped: EjecutarEnCuenta;
  /** Se llama cada vez que termina de leerse una OV. */
  onProgreso?: (leidas: number, total: number) => void;
}

/**
 * Centro de consumo de cada OT de una OV (clave: número de OT, 1-based), tal como saldría en la
 * hoja impresa. Sirve para que el operador reconozca qué OT está marcando.
 */
export async function cargarCentrosConsumo(input: {
  codigoCuenta: string;
  row: OrdenVentaOperadorRow;
  zonaHoraria: string;
  runScoped: EjecutarEnCuenta;
}): Promise<Record<number, string>> {
  const { codigoCuenta, row, zonaHoraria, runScoped } = input;
  const detalle = await runScoped(() =>
    getOrdenVentaDetalle({ codigoCuenta, idOrdenVenta: row.idOrdenVenta }),
  );
  const centros: Record<number, string> = {};
  for (const hoja of mapOrdenVentaToAlmacenPrintSheets({
    listRow: row,
    detalle,
    timeZone: zonaHoraria,
  })) {
    const ot = hoja.tareaIndex ?? 1;
    const centro = hoja.centroConsumo.trim();
    if (centro && !centros[ot]) centros[ot] = centro;
  }
  return centros;
}

async function hojasDeOv(
  input: CargarHojasBatchInput,
  { row, ots }: ResumenOvBatch,
): Promise<OrdenTareaAlmacenPrintData[]> {
  const { codigoCuenta, runScoped, zonaHoraria } = input;
  let detalle;
  try {
    detalle = await runScoped(() =>
      getOrdenVentaDetalle({ codigoCuenta, idOrdenVenta: row.idOrdenVenta }),
    );
  } catch {
    // Sin el detalle la hoja saldría sin productos: no se imprime a medias.
    throw new Error(`No se pudo leer ${row.venta}. Inténtalo de nuevo.`);
  }

  const hojas = mapOrdenVentaToAlmacenPrintSheets({
    listRow: row,
    detalle,
    timeZone: zonaHoraria,
  });

  let conSurtido = hojas;
  try {
    const capturas = await runScoped(() =>
      listOrdenSurtidoCapturasClient({
        codigoCuenta,
        idOrdenVenta: row.idOrdenVenta,
      }),
    );
    conSurtido = applySurtidoCapturasToPrintSheets(hojas, capturas);
  } catch {
    // Igual que la previsualización de una OV: sin fotos se imprime la hoja base.
  }
  return filtrarHojasElegidas(conSurtido, ots);
}

/**
 * Hojas de impresión de lo elegido: solo las OT marcadas de cada OV (el PDF no lleva nada que
 * el operador no haya seleccionado), siempre ordenadas por fecha y hora de entrega.
 */
export async function cargarHojasBatch(
  input: CargarHojasBatchInput,
): Promise<OrdenTareaAlmacenPrintData[]> {
  const { resumen, onProgreso } = input;
  const porOv: OrdenTareaAlmacenPrintData[][] = new Array(resumen.length);
  let siguiente = 0;
  let leidas = 0;

  async function trabajador(): Promise<void> {
    while (siguiente < resumen.length) {
      const indice = siguiente;
      siguiente += 1;
      porOv[indice] = await hojasDeOv(input, resumen[indice]!);
      leidas += 1;
      onProgreso?.(leidas, resumen.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(OV_EN_PARALELO, resumen.length) }, trabajador),
  );
  return ordenarHojasPorEntrega(porOv.flat());
}
