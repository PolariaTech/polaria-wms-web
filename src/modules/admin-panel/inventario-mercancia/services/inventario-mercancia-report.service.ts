import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";

export type InventarioMercanciaEtapaId =
  | "proveedor"
  | "transporte"
  | "bodega_interna"
  | "bodega_externa"
  | "ventas";

export interface InventarioMercanciaEtapa {
  id: InventarioMercanciaEtapaId;
  label: string;
  kg: number;
}

export interface InventarioMercanciaReport {
  etapas: InventarioMercanciaEtapa[];
}

function parseCantidad(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumCantidadPendienteOrdenCompra(
  rows: {
    cantidad: string | number;
    cantidad_recibida: string | number;
    orden_compra: { estado: string } | { estado: string }[] | null;
  }[],
): number {
  const estadosPendientes = new Set(["emitida", "parcialmente_recibida"]);

  return rows.reduce((total, row) => {
    const orden = Array.isArray(row.orden_compra)
      ? row.orden_compra[0]
      : row.orden_compra;
    if (!orden || !estadosPendientes.has(orden.estado)) return total;

    const pendiente =
      parseCantidad(row.cantidad) - parseCantidad(row.cantidad_recibida);
    return total + Math.max(pendiente, 0);
  }, 0);
}

function sumCantidadPedidaOrdenVenta(
  rows: {
    cantidad_pedida: string | number;
    orden_venta: { estado: string } | { estado: string }[] | null;
  }[],
  estados: Set<string>,
): number {
  return rows.reduce((total, row) => {
    const orden = Array.isArray(row.orden_venta)
      ? row.orden_venta[0]
      : row.orden_venta;
    if (!orden || !estados.has(orden.estado)) return total;
    return total + parseCantidad(row.cantidad_pedida);
  }, 0);
}

/** Resumen de inventario por etapa de la cadena (kg). */
export async function getInventarioMercanciaReport(
  codigoCuentaInput: string,
): Promise<InventarioMercanciaReport> {
  const codigoCuenta = requireCodigoCuenta(codigoCuentaInput);

  const [stockRows, ordenCompraLineas, ordenVentaLineas, guiasEnTransito] =
    await Promise.all([
      runDomainQuery<
        {
          cantidad: string | number;
          bodega: { tipo: string } | { tipo: string }[] | null;
        }[]
      >((client) => {
        const query = client
          .from("warehouse_state")
          .select("cantidad,bodega!inner(tipo,codigo_cuenta)")
          .eq("codigo_cuenta", codigoCuenta);

        return query as unknown as Promise<{
          data:
            | {
                cantidad: string | number;
                bodega: { tipo: string } | { tipo: string }[] | null;
              }[]
            | null;
          error: { message: string } | null;
        }>;
      }),
      runDomainQuery<
        {
          cantidad: string | number;
          cantidad_recibida: string | number;
          orden_compra: { estado: string; codigo_cuenta: string } | { estado: string; codigo_cuenta: string }[] | null;
        }[]
      >((client) => {
        const query = client
          .from("orden_compra_linea")
          .select(
            "cantidad,cantidad_recibida,orden_compra!inner(estado,codigo_cuenta)",
          )
          .eq("orden_compra.codigo_cuenta", codigoCuenta);

        return query as unknown as Promise<{
          data:
            | {
                cantidad: string | number;
                cantidad_recibida: string | number;
                orden_compra:
                  | { estado: string; codigo_cuenta: string }
                  | { estado: string; codigo_cuenta: string }[]
                  | null;
              }[]
            | null;
          error: { message: string } | null;
        }>;
      }),
      runDomainQuery<
        {
          cantidad_pedida: string | number;
          orden_venta: { estado: string; codigo_cuenta: string } | { estado: string; codigo_cuenta: string }[] | null;
        }[]
      >((client) => {
        const query = client
          .from("orden_venta_linea")
          .select(
            "cantidad_pedida,orden_venta!inner(estado,codigo_cuenta)",
          )
          .eq("orden_venta.codigo_cuenta", codigoCuenta);

        return query as unknown as Promise<{
          data:
            | {
                cantidad_pedida: string | number;
                orden_venta:
                  | { estado: string; codigo_cuenta: string }
                  | { estado: string; codigo_cuenta: string }[]
                  | null;
              }[]
            | null;
          error: { message: string } | null;
        }>;
      }),
      runDomainQuery<{ id_guia: string }[]>((client) => {
        const query = client
          .from("guia_envio")
          .select("id_guia")
          .eq("codigo_cuenta", codigoCuenta)
          .eq("estado", "en_transito");

        return query as unknown as Promise<{
          data: { id_guia: string }[] | null;
          error: { message: string } | null;
        }>;
      }),
    ]);

  let bodegaInternaKg = 0;
  let bodegaExternaKg = 0;

  for (const row of stockRows) {
    const bodega = Array.isArray(row.bodega) ? row.bodega[0] : row.bodega;
    const cantidad = parseCantidad(row.cantidad);
    if (bodega?.tipo === "interna") bodegaInternaKg += cantidad;
    if (bodega?.tipo === "externa") bodegaExternaKg += cantidad;
  }

  const proveedorKg = sumCantidadPendienteOrdenCompra(ordenCompraLineas);

  const ventasKg = sumCantidadPedidaOrdenVenta(
    ordenVentaLineas,
    new Set(["confirmada", "en_preparacion", "parcialmente_despachada"]),
  );

  // Transporte: cantidad pedida en OV vinculadas a guías en tránsito (aprox.).
  let transporteKg = 0;
  if (guiasEnTransito.length > 0) {
    transporteKg = sumCantidadPedidaOrdenVenta(
      ordenVentaLineas,
      new Set([
        "confirmada",
        "en_preparacion",
        "parcialmente_despachada",
        "despachada",
      ]),
    );
    // Si hay guías activas pero sin OV asociadas en líneas, mantener 0 hasta integración fina.
    if (transporteKg === 0 && guiasEnTransito.length > 0) {
      transporteKg = 0;
    }
  }

  const etapas: InventarioMercanciaEtapa[] = [
    { id: "proveedor", label: "Proveedor", kg: proveedorKg },
    { id: "transporte", label: "Transporte", kg: transporteKg },
    { id: "bodega_interna", label: "Bodega interna", kg: bodegaInternaKg },
    { id: "bodega_externa", label: "Bodega externa", kg: bodegaExternaKg },
    { id: "ventas", label: "Ventas", kg: ventasKg },
  ];

  return { etapas };
}

export function formatInventarioKg(kg: number): string {
  return kg.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export function getInventarioEtapa(
  report: InventarioMercanciaReport,
  id: InventarioMercanciaEtapaId,
): InventarioMercanciaEtapa {
  const etapa = report.etapas.find((item) => item.id === id);
  return etapa ?? { id, label: id, kg: 0 };
}

/** Etapas con kg > 0 (aplican y se resaltan en el diagrama, como en frio). */
export function getInventarioEtapasConKg(
  report: InventarioMercanciaReport,
): InventarioMercanciaEtapaId[] {
  return report.etapas.filter((etapa) => etapa.kg > 0).map((etapa) => etapa.id);
}

/** @deprecated Preferir `getInventarioEtapasConKg`. */
export function getInventarioEtapaDestacada(
  report: InventarioMercanciaReport,
): InventarioMercanciaEtapaId | null {
  return getInventarioEtapasConKg(report)[0] ?? null;
}

export function etapaInventarioPermiteEntrada(kg: number): boolean {
  return kg > 0;
}
