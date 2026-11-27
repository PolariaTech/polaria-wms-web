"use client";

import { useMemo } from "react";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaLineaRow,
} from "../../../shared/types/sales.types";
import { useFolioFacturaDetalle } from "../../hooks/use-folio-factura-detalle";
import { resolveNotasGeneralesDesdeDetalle } from "../../print/resolve-cabecera-print-desde-detalle";
import {
  formatCompradorOrdenVenta,
  resolveOrdenVentaLineaTitulo,
} from "../../utils/display/orden-venta-display";
import { filterLineasByOrdenTrabajoHija } from "../../utils/ot/filter-lineas-by-orden-trabajo";
import { parseOrdenVentaCapturaObservaciones } from "../../utils/pedido/build-orden-venta-captura-observaciones";
import { buildAvisoTotalSolicitudVsOv } from "../../utils/pedido/total-solicitud-vs-ov";
import { useTotalOcDetalle } from "../../utils/pedido/use-total-oc-detalle";
import {
  parseOrigenCorreoJson,
  type OrdenTrabajoHija,
} from "../../utils/origen/origen-correo-ordenes-trabajo";
import { calcularMontosDetalle } from "./detalle-venta-montos";
import { buildCapturaDetalleVista } from "./detalle-venta-presentacion";
import { OrdenVentaDetalleDatosPedidoEntrega } from "./OrdenVentaDetalleDatosPedidoEntrega";
import { OrdenVentaDetalleOrigenFallback } from "./OrdenVentaDetalleOrigenFallback";
import { OrdenVentaDetalleProductos } from "./OrdenVentaDetalleProductos";
import { OrdenVentaDetalleSection } from "./OrdenVentaDetalleSection";

export interface OrdenVentaDetalleContentProps {
  orden: OrdenVentaDetalleRow;
  hija?: OrdenTrabajoHija | null;
  codigoCuenta: string | null;
  idOrdenVenta: string;
  mostrarTotalOv: boolean;
  tareaTotal?: number;
}

/** Cuerpo del detalle de venta: datos del pedido/entrega y productos de la OT activa. */
export function OrdenVentaDetalleContent({
  orden,
  hija = null,
  codigoCuenta,
  idOrdenVenta,
  mostrarTotalOv,
  tareaTotal = 1,
}: OrdenVentaDetalleContentProps) {
  const allLineItems = useMemo(() => orden.lineas ?? [], [orden.lineas]);
  const lineItems: OrdenVentaLineaRow[] = useMemo(() => {
    // Enriquecer con nombre aunque el SKU esté archivado (ARCH-*), para empatar OT.
    const enriched = allLineItems.map((linea) => ({
      ...linea,
      matchNombre: resolveOrdenVentaLineaTitulo(linea),
      matchCodigo: linea.producto?.sku ?? "",
    }));
    return filterLineasByOrdenTrabajoHija(enriched, hija, {
      emptyFallback: "none",
    });
  }, [allLineItems, hija]);

  const origenRenglonesFallback = useMemo(() => {
    if (lineItems.length > 0) return [];
    if (hija?.renglones?.length) return hija.renglones;
    return parseOrigenCorreoJson(orden.origen_correo);
  }, [hija, lineItems.length, orden.origen_correo]);

  const clienteOrigenFallback = useMemo(() => {
    const fromComprador = formatCompradorOrdenVenta(orden);
    if (fromComprador && fromComprador !== "—") return fromComprador;
    const rows = parseOrigenCorreoJson(orden.origen_correo);
    return rows.map((r) => r["Nombre cliente"]?.trim()).find(Boolean) || "—";
  }, [orden]);

  const fromObs = parseOrdenVentaCapturaObservaciones(orden.observaciones);
  const ventanaFlat =
    orden.ventana_desde?.trim() || orden.ventana_hasta?.trim()
      ? `${orden.ventana_desde?.trim() || "—"} – ${orden.ventana_hasta?.trim() || "—"}`
      : "";
  const captura = buildCapturaDetalleVista(
    orden,
    hija,
    fromObs,
    tareaTotal,
    ventanaFlat,
  );
  const totalOc = useTotalOcDetalle(orden);
  const folioFactura = useFolioFacturaDetalle(
    codigoCuenta,
    idOrdenVenta,
    hija?.id,
  );
  // REQ-311 / REQ-281: mismo contrato que el PDF — sello (también vacío) manda.
  const notasGenerales = resolveNotasGeneralesDesdeDetalle({
    notas_almacen: orden.notas_almacen,
    origen_correo: orden.origen_correo,
  });
  const { montosLinea, subtotalOt, ivaOt, totalOt, totalOv } =
    calcularMontosDetalle({
      lineItems,
      todasLineas: orden.lineas ?? [],
      notasLineas: captura.notasLineas,
      hija,
    });
  // REQ-371 / REQ-425: si el total de la OV no cuadra con el de la OC (cuerpo o PDF), se resalta.
  const avisoTotal = buildAvisoTotalSolicitudVsOv({
    totalOv,
    totalSolicitud: totalOc,
  });

  return (
    <>
      <OrdenVentaDetalleDatosPedidoEntrega
        orden={orden}
        clienteNombre={clienteOrigenFallback}
        ordenCompraHotel={captura.ordenCompraHotel}
        folioFactura={folioFactura}
        centroConsumo={captura.centroConsumo}
        moneda={captura.moneda}
        fechaEntrega={captura.fechaEntrega}
        ventanaEntrega={captura.ventanaEntrega}
        contacto={captura.contacto}
        telefono={captura.telefono}
        correo={captura.correo}
        direccion={captura.direccion}
        notasGenerales={notasGenerales}
      />

      <OrdenVentaDetalleSection title="Productos">
        {lineItems.length === 0 && origenRenglonesFallback.length === 0 ? (
          <p className="polaria-text-body-sm text-polaria-w-50">
            Sin líneas registradas.
          </p>
        ) : lineItems.length === 0 ? (
          <OrdenVentaDetalleOrigenFallback renglones={origenRenglonesFallback} />
        ) : (
          <OrdenVentaDetalleProductos
            filas={montosLinea}
            hija={hija}
            subtotal={subtotalOt}
            iva={ivaOt}
            total={totalOt}
            mostrarTotalOv={mostrarTotalOv}
            totalOv={totalOv}
            avisoTotal={avisoTotal}
          />
        )}
      </OrdenVentaDetalleSection>

      {/* Cuerpo del correo: solo en Cypher → 01 Correo (no duplicar aquí). */}
    </>
  );
}
