import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  normalizeIdOrdenTrabajo,
  parseOrigenCorreoJson,
  type OrdenTrabajoHija,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import { filterLineasByOrdenTrabajoHija } from "../utils/ot/filter-lineas-by-orden-trabajo";
import {
  capturaTieneAlistoCompleto,
  capturaTieneDespacho,
  capturaTieneFactura,
  capturaTieneRevisoCompleto,
  computeEstadoAlistamientoFromCapturas,
  estadoSurtidoEsAvance,
  puedeAplicarEstadoAlistamiento,
} from "./compute-estado-alistamiento";
import { adminFrom, resolveOrdenAdminContext } from "./orden-surtido-admin";
import { listOrdenSurtidoCapturas } from "./orden-surtido-captura-queries";

/**
 * Tras subir una foto QR, actualiza el estado de la OV:
 * confirmada → alistamiento → alistada (Alistó) → revisada (Revisó) → despachada (Despachó) → facturada (Factura OK).
 * Gana la marca más avanzada de cualquier foto. La firma de Despachó o de Factura (OK)
 * no depende de los chulos. Solo avanza; no regresa un hito ya alcanzado.
 */
export async function syncOrdenVentaEstadoAlistamiento(input: {
  idOrdenVenta: string;
  idOrdenTrabajo?: string | null;
}): Promise<{ estado: string | null; updated: boolean }> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, input.idOrdenVenta);
  if (!ctx) {
    throw new Error("Orden de venta no encontrada para alistamiento.");
  }

  const { data: orden, error: ordenError } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta",
  )
    .select("id_orden_venta,estado,origen_correo")
    .eq("id_orden_venta", input.idOrdenVenta)
    .maybeSingle();

  if (ordenError) throw new Error(ordenError.message);
  if (!orden) {
    throw new Error("Orden de venta no encontrada para alistamiento.");
  }

  const estadoActual = String(orden.estado ?? "").trim();
  if (!puedeAplicarEstadoAlistamiento(estadoActual)) {
    return { estado: estadoActual || null, updated: false };
  }

  const hijas = groupOrigenCorreoToOrdenesTrabajo(
    parseOrigenCorreoJson(orden.origen_correo),
  );
  const capturas = await listOrdenSurtidoCapturas(input.idOrdenVenta);
  const capturaByOt = new Map(
    capturas.map((row) => [normalizeIdOrdenTrabajo(row.idOrdenTrabajo), row]),
  );
  const conFoto = new Set(
    [...capturaByOt.keys()].filter((key) => {
      const row = capturaByOt.get(key);
      return Boolean(row?.urlFoto?.trim() || row);
    }),
  );

  const { data: lineaRows } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_linea",
  )
    .select(
      "id_linea_orden_venta,id_orden_venta,id_producto,cantidad_pedida,cantidad_despachada,notas",
    )
    .eq("id_orden_venta", input.idOrdenVenta)
    .order("id_linea_orden_venta", { ascending: true })
    .limit(500);

  const lineasOrden = (lineaRows ?? []).map((row) => ({
    id_linea_orden_venta: String(
      (row as { id_linea_orden_venta?: string }).id_linea_orden_venta ?? "",
    ),
    id_orden_venta: input.idOrdenVenta,
    id_producto: String((row as { id_producto?: string }).id_producto ?? ""),
    cantidad_pedida: Number(
      (row as { cantidad_pedida?: number | string }).cantidad_pedida ?? 0,
    ),
    cantidad_despachada: Number(
      (row as { cantidad_despachada?: number | string }).cantidad_despachada ??
        0,
    ),
    notas: String((row as { notas?: string | null }).notas ?? "") || null,
    producto_nombre: null as string | null,
    producto_sku: null as string | null,
    precio_unitario: null as number | null,
  }));

  const capturaDeOt = (hija: OrdenTrabajoHija | null) => {
    const otKey = normalizeIdOrdenTrabajo(hija?.id);
    return (
      (otKey ? capturaByOt.get(otKey) : undefined) ??
      capturaByOt.get("") ??
      capturaByOt.get("default") ??
      capturas[0]
    );
  };

  const lineasEsperadasDeOt = (hija: OrdenTrabajoHija | null): number => {
    const captura = capturaDeOt(hija);
    if (!captura) return 0;
    const lineasOt = filterLineasByOrdenTrabajoHija(
      lineasOrden as never,
      hija && hija.renglones.length > 0 ? hija : null,
      {
        emptyFallback:
          !hija || hija.renglones.length === 0 || hijas.length <= 1
            ? "all"
            : "none",
      },
    );
    return lineasOt.length > 0
      ? lineasOt.length
      : (captura.payload.lineas?.length ?? 0);
  };

  const countAlistoCompletoForOt = (hija: OrdenTrabajoHija | null): boolean => {
    const captura = capturaDeOt(hija);
    if (!captura) return false;
    const lineasOt = filterLineasByOrdenTrabajoHija(
      lineasOrden as never,
      hija && hija.renglones.length > 0 ? hija : null,
      {
        emptyFallback:
          !hija || hija.renglones.length === 0 || hijas.length <= 1
            ? "all"
            : "none",
      },
    );
    const esperadas =
      lineasOt.length > 0
        ? lineasOt.length
        : (captura.payload.lineas?.length ?? 0);
    return capturaTieneAlistoCompleto(captura.payload, esperadas);
  };

  const countRevisoCompletoForOt = (hija: OrdenTrabajoHija | null): boolean => {
    const captura = capturaDeOt(hija);
    if (!captura) return false;
    return capturaTieneRevisoCompleto(
      captura.payload,
      lineasEsperadasDeOt(hija),
    );
  };

  const countDespachoForOt = (hija: OrdenTrabajoHija | null): boolean => {
    const captura = capturaDeOt(hija);
    if (!captura) return false;
    return capturaTieneDespacho(captura.payload);
  };

  const countFacturaForOt = (hija: OrdenTrabajoHija | null): boolean => {
    const captura = capturaDeOt(hija);
    if (!captura) return false;
    return capturaTieneFactura(captura.payload);
  };

  const totalOrdenesTrabajo = hijas.length;
  const ordenesTrabajoConFoto =
    totalOrdenesTrabajo === 0
      ? capturas.length > 0
        ? 1
        : 0
      : hijas.filter((hija) => conFoto.has(hija.id)).length;

  const ordenesTrabajoConAlistoCompleto =
    totalOrdenesTrabajo === 0
      ? countAlistoCompletoForOt(null)
        ? 1
        : 0
      : hijas.filter((hija) => countAlistoCompletoForOt(hija)).length;

  const ordenesTrabajoConRevisoCompleto =
    totalOrdenesTrabajo === 0
      ? countRevisoCompletoForOt(null)
        ? 1
        : 0
      : hijas.filter((hija) => countRevisoCompletoForOt(hija)).length;

  const ordenesTrabajoConFactura =
    totalOrdenesTrabajo === 0
      ? countFacturaForOt(null)
        ? 1
        : 0
      : hijas.filter((hija) => countFacturaForOt(hija)).length;

  const ordenesTrabajoConDespacho =
    totalOrdenesTrabajo === 0
      ? countDespachoForOt(null)
        ? 1
        : 0
      : hijas.filter((hija) => countDespachoForOt(hija)).length;

  const siguiente = computeEstadoAlistamientoFromCapturas({
    totalOrdenesTrabajo,
    ordenesTrabajoConFoto,
    ordenesTrabajoConAlistoCompleto,
    ordenesTrabajoConRevisoCompleto,
    ordenesTrabajoConFactura,
    ordenesTrabajoConDespacho,
  });

  if (!siguiente || !estadoSurtidoEsAvance(estadoActual, siguiente)) {
    return { estado: estadoActual, updated: false };
  }

  const { error: updateError } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta",
  )
    .update({
      estado: siguiente,
      updated_at: new Date().toISOString(),
    })
    .eq("id_orden_venta", input.idOrdenVenta);

  if (updateError) throw new Error(updateError.message);

  try {
    const { recordOrdenVentaLogServer } = await import(
      "../services/orden-venta-log.server"
    );
    const ot = normalizeIdOrdenTrabajo(input.idOrdenTrabajo);
    const labelEstado =
      siguiente === "alistamiento"
        ? "en alistamiento"
        : siguiente === "alistada"
          ? "alistada"
          : siguiente === "revisada"
            ? "revisada"
            : siguiente === "facturada"
              ? "facturada"
              : siguiente === "despachada"
                ? "despachada"
                : siguiente;
    await recordOrdenVentaLogServer({
      idOrdenVenta: input.idOrdenVenta,
      codigoCuenta: ctx.codigoCuenta,
      accion: "cambio_estado",
      mensaje: `Estado de la orden actualizado a ${labelEstado}.`,
      idOrdenTrabajo: ot || null,
      payloadExtra: {
        tipo: "estado_alistamiento",
        estadoAnterior: estadoActual,
        estadoNuevo: siguiente,
      },
    });
  } catch (logError) {
    console.warn(
      "[surtido] log estado alistamiento falló:",
      logError instanceof Error ? logError.message : logError,
    );
  }

  return { estado: siguiente, updated: true };
}