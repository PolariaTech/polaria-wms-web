import type { CompradorListRow } from "@/modules/admin-panel";
import type {
  MatchProductoLinea,
  ProductoVentaOption,
} from "../../../shared/types/sales.types";
import { buildMatchProductoLinea } from "../match/build-match-producto";
import { indiceFrasesCliente } from "../match/frase-cliente";
import { parseOrigenCorreoJson } from "./origen-correo-ordenes-trabajo";
import {
  asignarMadurezAProductos,
  madurezDesdeRegistro,
} from "../pedido/madurez-linea";
import {
  especificacionConPiezas,
  piezasAproxKgParaLinea,
} from "../pedido/piezas-aprox-kg";
import { resolveCantidadPrecioDesdeEnvase } from "../pedido/resolve-cantidad-envase";
import { resolveEspecificacionPedidoLinea } from "../pedido/resolve-especificacion-pedido-linea";
import { resolveUnidadPedidoLinea } from "../pedido/resolve-unidad-pedido-linea";
import { stripLeadingProductoCodigo } from "../../../shared/utils/producto-venta-nombre";
import {
  parseCantidad,
  parseFechaOrigen,
  parsePrecio,
} from "./parse-origen-renglon";
import {
  compradorDesdeOrigen,
  resolveProductoForRenglon,
  valorMasFrecuente,
} from "./materialize-ov-match";

export {
  parseFechaOrigen,
  resolveFechaEntregaDesdeOrigen,
} from "./parse-origen-renglon";
export { compradorDesdeOrigen } from "./materialize-ov-match";

export interface MaterializeLineaPlan {
  idProducto: string;
  cantidadPedida: number;
  precioUnitario: number;
  /** Unidad OC/Mateo o catálogo (REQ-363). */
  unidadMedida: string;
  aliasCliente: string;
  codigoProductoCliente: string;
  nombreProducto: string;
  /** REQ-124: frase de envase u otra especificación a persistir. */
  especificacion: string;
  matchProducto: MatchProductoLinea;
}

export interface MaterializeOvPlan {
  idComprador: string | null;
  ordenCompraHotel: string | null;
  centroConsumo: string | null;
  contactoEntrega: string | null;
  fechaEntrega: string | null;
  lineas: MaterializeLineaPlan[];
  sinMatchProductos: string[];
  nombreClienteOrigen: string | null;
}

/**
 * Arma el plan de materialización a partir de origen_correo + catálogos.
 * No escribe en BD.
 */
export function buildMaterializeOvDesdeOrigenPlan(params: {
  origenCorreo: unknown;
  productos: readonly ProductoVentaOption[];
  compradores: readonly CompradorListRow[];
  /** Cuerpo del correo, si todavía trae la columna de maduración. */
  origenTexto?: string | null;
}): MaterializeOvPlan {
  const renglones = parseOrigenCorreoJson(params.origenCorreo);
  const nombreClienteOrigen =
    renglones.map((r) => r["Nombre cliente"]?.trim()).find(Boolean) ?? null;
  const idComprador = compradorDesdeOrigen({
    origenCorreo: params.origenCorreo,
    compradores: params.compradores,
  });
  const indiceFrases = indiceFrasesCliente(params.productos);

  const ordenCompraHotel =
    valorMasFrecuente(
      renglones.map((r) => (r["Numero pedido"] ?? "").toString()),
    ) ?? null;
  const centroConsumo =
    valorMasFrecuente(renglones.map((r) => (r.Almacen ?? "").toString())) ??
    null;
  const contactoEntrega =
    valorMasFrecuente(
      renglones.map((r) => (r["Responsable externo"] ?? "").toString()),
    ) ?? null;
  const fechaEntrega =
    parseFechaOrigen(
      renglones.map((r) => r.Fecha?.trim()).find(Boolean) ?? null,
    ) ?? null;

  const lineas: MaterializeLineaPlan[] = [];
  const sinMatchProductos: string[] = [];
  const niveles = asignarMadurezAProductos({
    productos: renglones.map((renglon) => renglon.Producto?.trim() || ""),
    textoFuente: params.origenTexto,
    madurezPorRenglon: renglones.map((renglon) => madurezDesdeRegistro(renglon)),
  });

  for (let index = 0; index < renglones.length; index++) {
    const renglon = renglones[index]!;
    const alias = renglon.Producto?.trim() || "";
    const piezas = piezasAproxKgParaLinea({
      producto: alias,
      textosLinea: [
        alias,
        typeof renglon.Cantidad === "string" ? renglon.Cantidad : null,
      ],
      textoFuente: params.origenTexto,
    });
    const cantidad = piezas?.kg ?? parseCantidad(renglon.Cantidad);
    if (cantidad <= 0) continue;

    const resolucion = resolveProductoForRenglon(
      renglon,
      params.productos,
      indiceFrases,
    );
    if (!resolucion) {
      if (alias) sinMatchProductos.push(alias);
      continue;
    }
    const match = resolucion.producto;
    const matchProducto = buildMatchProductoLinea({
      textoCliente: alias,
      sugeridoMateo: {
        idProducto: match.idProducto,
        nombre: match.nombre,
        codigo: match.codigo,
      },
      elegidoUsuario: {
        idProducto: match.idProducto,
        nombre: match.nombre,
        codigo: match.codigo,
      },
      fuente: resolucion.fuente,
    });
    if (!matchProducto) continue;

    const precioDoc = parsePrecio(renglon.Precio);
    const converted = resolveCantidadPrecioDesdeEnvase({
      textoOriginal: alias,
      unidadMedidaCatalogo: match.unidadMedida,
      cantidadRaw: cantidad,
      precioDoc,
    });
    const unidadOrigen =
      typeof renglon.Unidad === "string" ? renglon.Unidad : null;
    const especOrigen =
      typeof renglon.Especificacion === "string"
        ? renglon.Especificacion
        : null;
    // REQ-363: unidad OC/Mateo gana sobre catálogo (KG↔PZA).
    const unidadMedida =
      resolveUnidadPedidoLinea({
        unidadOrigen,
        unidadCatalogo: match.unidadMedida,
        textoProducto: alias,
        textoExtra: especOrigen,
      }) ||
      match.unidadMedida?.trim() ||
      "";
    const nombreProducto = stripLeadingProductoCodigo(
      match.nombre,
      match.codigo,
    );
    lineas.push({
      idProducto: match.idProducto,
      cantidadPedida: piezas ? piezas.kg : (converted?.cantidad ?? cantidad),
      precioUnitario:
        converted?.precioUnitario ??
        precioDoc ??
        match.precioUnitario ??
        0,
      unidadMedida,
      aliasCliente: alias,
      codigoProductoCliente: renglon["Codigo producto"]?.trim() || "",
      nombreProducto,
      especificacion: especificacionConPiezas(
        resolveEspecificacionPedidoLinea({
          especificacionIa: niveles[index] ?? null,
          envase: converted,
          textoOriginal: alias,
          nombreCatalogo: nombreProducto,
          especificacionOrigen: especOrigen,
        }),
        piezas,
      ),
      matchProducto,
    });
  }

  return {
    idComprador,
    ordenCompraHotel,
    centroConsumo,
    contactoEntrega,
    fechaEntrega,
    lineas,
    sinMatchProductos,
    nombreClienteOrigen,
  };
}
