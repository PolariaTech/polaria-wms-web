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
import {
  buildCabeceraPatchDesdeOrigen,
  buildFilasInsertarOrdenVentaLinea,
  necesitaMaterializarCabecera,
  type OrdenVentaHeaderMaterializacion,
} from "./materializar-lineas-desde-origen-cabecera";

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

  const header = await runDomainQuery<OrdenVentaHeaderMaterializacion | null>(
    (client) => {
      const query = client
        .from("orden_venta")
        .select(
          "estado,id_comprador,orden_compra_hotel,centro_consumo,contacto_entrega,correo_contacto,fecha_entrega,notas_lineas,origen_correo,origen_texto",
        )
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_orden_venta", idOrdenVenta)
        .maybeSingle();

      return query as unknown as Promise<{
        data: OrdenVentaHeaderMaterializacion | null;
        error: { message: string } | null;
      }>;
    },
  );

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
  const needsHeader = necesitaMaterializarCabecera(header, sinSello);

  if (!needsLines && !needsHeader) {
    return { materializado: false, lineas: headerLineasCount };
  }

  const [productos, compradores] = await Promise.all([
    params.listProductos({ codigoCuenta }),
    listCompradoresAdmin({ codigoCuenta, limit: 1000, soloActivos: true }),
  ]);
  const idComprador =
    header.id_comprador?.trim() ||
    compradorDesdeOrigen({ origenCorreo: origen, compradores });
  const productosConFrases = await productosConFrasesDelComprador({
    codigoCuenta,
    idComprador,
    productos,
  }).catch(() => productos);
  const plan = buildMaterializeOvDesdeOrigenPlan({
    origenCorreo: origen,
    productos: productosConFrases,
    compradores,
    origenTexto: header.origen_texto,
  });

  const patch = buildCabeceraPatchDesdeOrigen({
    header,
    plan,
    origen,
    sinSello,
  });

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
        const query = client
          .from("orden_venta_linea")
          .insert(buildFilasInsertarOrdenVentaLinea(idOrdenVenta, plan.lineas));

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
