import {
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { listCompradoresAdmin } from "@/modules/admin-panel/compradores/services/compradores.service";
import { normalizeEstadoOrdenVenta } from "../constants/sales-status";
import { buildNotasLineasText } from "../../ordenes/utils/pedido/build-orden-venta-captura-observaciones";
import {
  buildMaterializeOvDesdeOrigenPlan,
  compradorDesdeOrigen,
} from "../../ordenes/utils/origen/materialize-ov-desde-origen";
import { productosConFrasesDelComprador } from "./frases-comprador.service";
import { parseOrigenCorreoJson } from "../../ordenes/utils/origen/origen-correo-ordenes-trabajo";
import { leerCabeceraUsuarioSello } from "../../ordenes/utils/pedido/sellar-edicion-usuario-origen";
import type { ProductoVentaOption } from "../types/sales.types";

/** Una reserva sin líneas más vieja que esto se considera caída y se puede retomar. */
const RESERVA_MATERIALIZACION_VENCE_MS = 2 * 60 * 1000;

/**
 * Reserva atómica de la materialización de líneas (columna
 * `orden_venta.lineas_materializadas_at`, migración 118). Devuelve true solo a
 * la primera sesión que llega; también retoma una reserva vencida.
 */
async function reservarMaterializacionLineas(params: {
  codigoCuenta: string;
  idOrdenVenta: string;
}): Promise<boolean> {
  const ahora = Date.now();
  const venceAntesDe = new Date(
    ahora - RESERVA_MATERIALIZACION_VENCE_MS,
  ).toISOString();

  const filas = await runDomainMutation<{ id_orden_venta: string }[]>(
    (client) => {
      const query = client
        .from("orden_venta")
        .update({ lineas_materializadas_at: new Date(ahora).toISOString() })
        .eq("codigo_cuenta", params.codigoCuenta)
        .eq("id_orden_venta", params.idOrdenVenta)
        .or(
          `lineas_materializadas_at.is.null,lineas_materializadas_at.lt.${venceAntesDe}`,
        )
        .select("id_orden_venta");

      return query as unknown as Promise<{
        data: { id_orden_venta: string }[] | null;
        error: { message: string } | null;
      }>;
    },
  );

  return (filas ?? []).length > 0;
}

async function liberarMaterializacionLineas(params: {
  codigoCuenta: string;
  idOrdenVenta: string;
}): Promise<void> {
  try {
    await runDomainMutation((client) => {
      const query = client
        .from("orden_venta")
        .update({ lineas_materializadas_at: null })
        .eq("codigo_cuenta", params.codigoCuenta)
        .eq("id_orden_venta", params.idOrdenVenta);

      return query as unknown as Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    });
  } catch {
    // Si falla, la reserva vence sola a los 2 minutos.
  }
}

/**
 * Si una OV por_confirmar llegó del bot/tercero solo con origen_correo
 * (sin líneas ni comprador), materializa cabecera + líneas desde ese JSON.
 */
export async function materializeOrdenVentaDesdeOrigenSiVacia(params: {
  codigoCuenta: string;
  idOrdenVenta: string;
  /** Catálogo de venta; se inyecta para no importar sales.service (ciclo). */
  listProductos: (p: {
    codigoCuenta: string;
  }) => Promise<ProductoVentaOption[]>;
}): Promise<{ materializado: boolean; lineas: number }> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idOrdenVenta = params.idOrdenVenta.trim();
  if (!idOrdenVenta) return { materializado: false, lineas: 0 };

  const header = await runDomainQuery<{
    estado: string;
    id_comprador: string | null;
    orden_compra_hotel: string | null;
    centro_consumo: string | null;
    contacto_entrega: string | null;
    correo_contacto: string | null;
    fecha_entrega: string | null;
    notas_lineas: string | null;
    origen_correo: unknown;
    origen_texto: string | null;
  } | null>((client) => {
    const query = client
      .from("orden_venta")
      .select(
        "estado,id_comprador,orden_compra_hotel,centro_consumo,contacto_entrega,correo_contacto,fecha_entrega,notas_lineas,origen_correo,origen_texto",
      )
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_orden_venta", idOrdenVenta)
      .maybeSingle();

    return query as unknown as Promise<{
      data: {
        estado: string;
        id_comprador: string | null;
        orden_compra_hotel: string | null;
        centro_consumo: string | null;
        contacto_entrega: string | null;
        correo_contacto: string | null;
        fecha_entrega: string | null;
        notas_lineas: string | null;
        origen_correo: unknown;
        origen_texto: string | null;
      } | null;
      error: { message: string } | null;
    }>;
  });

  if (!header) return { materializado: false, lineas: 0 };
  if (normalizeEstadoOrdenVenta(header.estado) !== "por_confirmar") {
    return { materializado: false, lineas: 0 };
  }

  const origen = parseOrigenCorreoJson(header.origen_correo);
  if (origen.length === 0) return { materializado: false, lineas: 0 };

  const lineasExistentes = await runDomainQuery<
    { id_linea_orden_venta: string }[]
  >((client) => {
    const query = client
      .from("orden_venta_linea")
      .select("id_linea_orden_venta")
      .eq("id_orden_venta", idOrdenVenta)
      .limit(1);

    return query as unknown as Promise<{
      data: { id_linea_orden_venta: string }[] | null;
      error: { message: string } | null;
    }>;
  });

  const headerLineasCount = lineasExistentes.length;
  const needsLines = headerLineasCount === 0;
  const sinSello = !leerCabeceraUsuarioSello(origen);
  const needsHeader =
    !header.id_comprador?.trim() ||
    (sinSello &&
      (!header.orden_compra_hotel?.trim() ||
        !header.centro_consumo?.trim() ||
        !header.contacto_entrega?.trim() ||
        !header.fecha_entrega?.trim()));

  if (!needsLines && !needsHeader) {
    return { materializado: false, lineas: headerLineasCount };
  }

  const [productos, compradores] = await Promise.all([
    params.listProductos({ codigoCuenta }),
    listCompradoresAdmin({ codigoCuenta, limit: 5000 }),
  ]);
  const idComprador =
    header.id_comprador?.trim() ||
    compradorDesdeOrigen({ origenCorreo: origen, compradores });
  const productosConFrases = await productosConFrasesDelComprador({
    codigoCuenta,
    idComprador,
    productos,
  });
  const plan = buildMaterializeOvDesdeOrigenPlan({
    origenCorreo: origen,
    productos: productosConFrases,
    compradores,
    origenTexto: header.origen_texto,
  });

  const patch: Record<string, unknown> = {};
  if (!header.id_comprador?.trim() && plan.idComprador) {
    patch.id_comprador = plan.idComprador;
  }
  if (sinSello && !header.orden_compra_hotel?.trim() && plan.ordenCompraHotel) {
    patch.orden_compra_hotel = plan.ordenCompraHotel;
  }
  if (sinSello && !header.centro_consumo?.trim() && plan.centroConsumo) {
    patch.centro_consumo = plan.centroConsumo;
  }
  if (sinSello && !header.contacto_entrega?.trim() && plan.contactoEntrega) {
    patch.contacto_entrega = plan.contactoEntrega;
  }
  if (sinSello && !header.fecha_entrega?.trim() && plan.fechaEntrega) {
    patch.fecha_entrega = plan.fechaEntrega;
  }
  const correoFromOrigen =
    origen
      .map((fila) =>
        typeof fila === "object" && fila && "Correo contacto" in fila
          ? String(
              (fila as { "Correo contacto"?: unknown })["Correo contacto"] ?? "",
            ).trim()
          : "",
      )
      .find(Boolean) || "";
  if (sinSello && !header.correo_contacto?.trim() && correoFromOrigen) {
    patch.correo_contacto = correoFromOrigen;
  }

  if (Object.keys(patch).length > 0) {
    await runDomainMutation((client) => {
      const query = client
        .from("orden_venta")
        .update(patch)
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_orden_venta", idOrdenVenta);

      return query as unknown as Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    });
  }

  let inserted = 0;
  // REQ-280: solo quien gana la reserva inserta.
  const reservada =
    needsLines && plan.lineas.length > 0
      ? await reservarMaterializacionLineas({ codigoCuenta, idOrdenVenta })
      : false;
  if (reservada) {
    try {
      await runDomainMutation((client) => {
        const query = client.from("orden_venta_linea").insert(
          plan.lineas.map((linea) => ({
            id_orden_venta: idOrdenVenta,
            id_producto: linea.idProducto,
            cantidad_pedida: linea.cantidadPedida,
            precio_unitario:
              linea.precioUnitario > 0 ? linea.precioUnitario : 0,
            cajas: null,
            presentacion: null,
            unidad_medida: linea.unidadMedida?.trim() || null,
            match_producto: linea.matchProducto,
          })),
        );

        return query as unknown as Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      });
    } catch (error) {
      // Si no se pudo insertar, se libera la reserva para poder reintentar.
      await liberarMaterializacionLineas({ codigoCuenta, idOrdenVenta });
      throw error;
    }
    inserted = plan.lineas.length;

    // REQ-124: persistir frase de envase en notas_lineas (PDF / form).
    if (!header.notas_lineas?.trim()) {
      const notasLineas = buildNotasLineasText(
        plan.lineas.map((linea) => ({
          nombre: linea.nombreProducto || linea.aliasCliente,
          cantidad: linea.cantidadPedida,
          especificacion: linea.especificacion,
        })),
      );
      if (notasLineas) {
        await runDomainMutation((client) => {
          const query = client
            .from("orden_venta")
            .update({ notas_lineas: notasLineas })
            .eq("codigo_cuenta", codigoCuenta)
            .eq("id_orden_venta", idOrdenVenta);

          return query as unknown as Promise<{
            data: unknown;
            error: { message: string } | null;
          }>;
        });
      }
    }
  }

  return {
    materializado: inserted > 0 || Object.keys(patch).length > 0,
    lineas: inserted || headerLineasCount,
  };
}
