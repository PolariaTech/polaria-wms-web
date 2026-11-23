import type { OrdenVentaOperadorRow } from "@/modules/sales";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import type { JefeBodegaSalidaOrdenVentaPrefill } from "../../types/jefe-bodega-salida.types";
import type { JefeBodegaSlotPickerOption } from "./JefeBodegaSlotPickerModal";

export function formatOrdenVentaLabel(orden: OrdenVentaOperadorRow): string {
  return `${orden.venta} — ${orden.comprador}`;
}

export function resolveOrdenFromList(
  rows: OrdenVentaOperadorRow[],
  prefill: JefeBodegaSalidaOrdenVentaPrefill,
): OrdenVentaOperadorRow | undefined {
  if (prefill.idOrdenVenta?.trim()) {
    const byId = rows.find(
      (row) => row.idOrdenVenta === prefill.idOrdenVenta?.trim(),
    );
    if (byId) return byId;
  }

  const codigo = prefill.ovCodigo?.trim().toUpperCase();
  if (!codigo) return undefined;

  return rows.find((row) => row.venta.toUpperCase() === codigo);
}

export function buildSalidaDestinoOptions(
  ubicacionesPicking: UbicacionEstadoBodegaDbRow[],
): JefeBodegaSlotPickerOption[] {
  return [...ubicacionesPicking]
      .sort((a, b) => a.codigo.localeCompare(b.codigo, "es"))
      .map((ubicacion, index) => {
        const libre =
          (ubicacion.estado_slot?.toLowerCase() ?? "libre") === "libre";

        return {
          id: ubicacion.id_ubicacion,
          title: ubicacion.codigo,
          subtitle: libre ? "Zona salida · libre" : `Estado: ${ubicacion.estado_slot}`,
          slotNumber: index + 1,
          codigo: ubicacion.codigo,
          visual: libre ? ("vacia" as const) : ("ocupada_primario" as const),
          detalle: libre
            ? null
            : {
                productoNombre: ubicacion.codigo,
                idPaquete: null,
                cliente: null,
                cantidad: "—",
                posicion: ubicacion.codigo,
                temperatura: null,
                ordenCompraCodigo: null,
                lockedBy: null,
              },
        };
      });
}
