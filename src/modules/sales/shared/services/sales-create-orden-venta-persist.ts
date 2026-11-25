import {
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { puedeEditarOrdenVenta } from "../constants/sales-status";
import type {
  OrdenVentaLineaInput,
  OrdenVentaOperadorRow,
  OrdenVentaRow,
} from "../types/sales.types";
import {
  ORDEN_VENTA_COLUMNS,
  type OrdenVentaLineasResumen,
} from "./sales-orden-venta.db";
import {
  fetchCompradorLabels,
  fetchCuentaOvSlaByCodigo,
} from "./sales-operador-labels";
import { mapOrdenVentaOperadorRow } from "./sales-operador-listado.service";

type CaptureFields = Record<string, string | null | unknown>;

export interface PersistCabeceraParams {
  codigoCuenta: string;
  idBodega: string;
  idCliente: string;
  idComprador: string;
  idCreador: string | null;
  idBodegaDestino: string | null;
  capture: CaptureFields;
  observaciones: string | null;
  idOrdenVentaExistente: string;
}

/** Carga el estado de la OV existente y valida que sea editable. */
async function assertOrdenExistenteEditable<
  T extends { estado: string },
>(
  codigoCuenta: string,
  idOrdenVentaExistente: string,
  select: string,
): Promise<T> {
  const existing = await runDomainQuery<T | null>((client) => {
    const query = client
      .from("orden_venta")
      .select(select)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_orden_venta", idOrdenVentaExistente)
      .maybeSingle();

    return query as unknown as Promise<{
      data: T | null;
      error: { message: string } | null;
    }>;
  });

  if (!existing) {
    throw new DomainServiceError(
      "No se encontró la orden de venta.",
      "NOT_FOUND",
    );
  }

  if (!puedeEditarOrdenVenta(existing.estado)) {
    throw new DomainServiceError(
      "Esta orden ya no se puede editar.",
      "MUTATION_FAILED",
    );
  }

  return existing;
}

/** REQ-134: avance sin productos → solo cabecera (no borra líneas). */
export async function updateHeaderOnlyDraft(
  params: Omit<PersistCabeceraParams, "idBodega" | "idCliente" | "idCreador">,
): Promise<OrdenVentaRow> {
  const {
    codigoCuenta,
    idOrdenVentaExistente,
    idComprador,
    idBodegaDestino,
    capture,
    observaciones,
  } = params;

  await assertOrdenExistenteEditable<{
    estado: string;
    id_bodega: string | null;
    id_cliente: string | null;
  }>(codigoCuenta, idOrdenVentaExistente, "estado,id_bodega,id_cliente");

  return runDomainMutation<OrdenVentaRow>((client) => {
    const query = client
      .from("orden_venta")
      .update({
        ...(idComprador ? { id_comprador: idComprador } : {}),
        id_bodega_destino: idBodegaDestino,
        ...capture,
        observaciones,
      })
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_orden_venta", idOrdenVentaExistente)
      .select(ORDEN_VENTA_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: OrdenVentaRow | null;
      error: { message: string } | null;
    }>;
  });
}

/** Actualiza cabecera de OV existente y reemplaza sus líneas, o inserta una nueva. */
export async function saveOrdenVentaCabecera(
  params: PersistCabeceraParams,
): Promise<OrdenVentaRow> {
  const {
    codigoCuenta,
    idBodega,
    idCliente,
    idComprador,
    idCreador,
    idBodegaDestino,
    capture,
    observaciones,
    idOrdenVentaExistente,
  } = params;
  let orden: OrdenVentaRow;

  if (idOrdenVentaExistente) {
    await assertOrdenExistenteEditable<{ estado: string }>(
      codigoCuenta,
      idOrdenVentaExistente,
      "estado",
    );

    orden = await runDomainMutation<OrdenVentaRow>((client) => {
      const query = client
        .from("orden_venta")
        .update({
          id_bodega: idBodega,
          id_cliente: idCliente,
          ...(idComprador ? { id_comprador: idComprador } : {}),
          id_bodega_destino: idBodegaDestino,
          ...capture,
          observaciones,
        })
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_orden_venta", idOrdenVentaExistente)
        .select(ORDEN_VENTA_COLUMNS)
        .single();

      return query as unknown as Promise<{
        data: OrdenVentaRow | null;
        error: { message: string } | null;
      }>;
    });

    await runDomainMutation((client) => {
      const query = client
        .from("orden_venta_linea")
        .delete()
        .eq("id_orden_venta", orden.id_orden_venta);

      return query as unknown as Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    });
  } else {
    // codigo vacío: el trigger trg_orden_venta_codigo_estandar asigna
    // OV-######## con MAX real del tenant (mismo camino que ingestar-pedido).
    // No calcular en app: un limit truncaba el máximo y chocaba unique key.
    orden = await runDomainMutation<OrdenVentaRow>((client) => {
      const query = client
        .from("orden_venta")
        .insert({
          codigo_cuenta: codigoCuenta,
          id_bodega: idBodega,
          id_cliente: idCliente,
          id_comprador: idComprador || null,
          id_creador: idCreador,
          id_bodega_destino: idBodegaDestino,
          ...capture,
          codigo: "",
          estado: "por_confirmar",
          observaciones,
        })
        .select(ORDEN_VENTA_COLUMNS)
        .single();

      return query as unknown as Promise<{
        data: OrdenVentaRow | null;
        error: { message: string } | null;
      }>;
    });
  }

  return orden;
}

export async function insertLineasOrdenVenta(
  idOrdenVenta: string,
  lineas: OrdenVentaLineaInput[],
  preciosUnitarios: Map<string, number>,
): Promise<void> {
  if (lineas.length === 0) return;

  await runDomainMutation((client) => {
    const query = client.from("orden_venta_linea").insert(
      lineas.map((linea) => {
        const idProducto = linea.idProducto.trim();
        const catalogPrecio = preciosUnitarios.get(idProducto) ?? 0;
        const precioUnitario =
          linea.precioUnitario != null && Number.isFinite(linea.precioUnitario)
            ? linea.precioUnitario
            : catalogPrecio;

        return {
          id_orden_venta: idOrdenVenta,
          id_producto: idProducto,
          cantidad_pedida: linea.cantidadPedida,
          precio_unitario: precioUnitario,
          cajas: linea.cajas ?? null,
          presentacion: linea.presentacion?.trim() || null,
          unidad_medida: linea.unidadMedida?.trim() || null,
          match_producto: linea.matchProducto ?? null,
        };
      }),
    );

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });
}

export function buildLineasResumenCreate(
  lineas: OrdenVentaLineaInput[],
  preciosUnitarios: Map<string, number>,
): OrdenVentaLineasResumen {
  return lineas.reduce(
    (acc, linea) => {
      const precioUnitario =
        linea.precioUnitario != null && Number.isFinite(linea.precioUnitario)
          ? linea.precioUnitario
          : (preciosUnitarios.get(linea.idProducto.trim()) ?? 0);
      return {
        count: acc.count + 1,
        cantidadKg: acc.cantidadKg + linea.cantidadPedida,
        total: acc.total + linea.cantidadPedida * precioUnitario,
      };
    },
    { count: 0, cantidadKg: 0, total: 0 },
  );
}

/** Arma la fila de operador para una OV recién creada/actualizada. */
export async function mapOrdenCreadaOperadorRow(
  orden: OrdenVentaRow,
  idComprador: string,
  lineasResumen: Map<string, OrdenVentaLineasResumen> = new Map(),
): Promise<OrdenVentaOperadorRow> {
  const compradorLabels = await fetchCompradorLabels(
    idComprador ? [idComprador] : [],
  );
  const slaByCuenta = await fetchCuentaOvSlaByCodigo([orden.codigo_cuenta]);
  return mapOrdenVentaOperadorRow(
    orden,
    compradorLabels,
    lineasResumen,
    new Map(),
    slaByCuenta,
  );
}
