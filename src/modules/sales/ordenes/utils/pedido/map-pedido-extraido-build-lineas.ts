import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { fraseClienteAmbigua, indiceFrasesCliente } from "../match/frase-cliente";
import { shouldAutoAcceptProductoSuggestion } from "../match/find-closest-producto-catalogo";
import { stripLeadingProductoCodigo } from "../../../shared/utils/producto-venta-nombre";
import { contiguousOtIdsFromPedidoLineas } from "../origen/origen-correo-ot-contigua";
import { resolveLineaCantidadPrecioEmpaque } from "./resolve-linea-cantidad-precio-empaque";
import { camposUnidadEspecLinea } from "./map-pedido-unidad-y-espec";
import type { LineaVentaFromIa } from "./map-pedido-extraido-to-form.types";
import {
  buildProductoCatalogIndexes,
  extractCodigoFromCatalogKey,
  norm,
  PRESENTACION_SET,
  parsePrecioIa,
} from "./map-pedido-extraido-catalog-helpers";
import {
  findVecinosAmbiguos,
  pickSugerencias,
  resolveProductoMatch,
  toSugerencia,
} from "./map-pedido-extraido-product-match";

export function buildLineasVentaFromPedido(params: {
  pedido: PedidoExtraido;
  productos: ProductoVentaOption[];
}): LineaVentaFromIa[] {
  const { pedido, productos } = params;
  const { byKey, byKeyNorm, byCodigo } = buildProductoCatalogIndexes(productos);
  const indiceFrases = indiceFrasesCliente(productos);

  const lineas: LineaVentaFromIa[] = [];
  // REQ-238: misma clave OT que groupOrigenCorreoToOrdenesTrabajo / origen_correo
  // (cabecera rellena almacen y OC si la línea no los trae; si no, la revisión
  // ve hija `…|almacen:comedor` y líneas `…|almacen:_` → falso «Sin productos».
  const otIdsPorLinea = contiguousOtIdsFromPedidoLineas(
    pedido.lineas.map((linea) => ({
      ...linea,
      numeroPedido: linea.numeroPedido || pedido.ordenCompraHotel,
      almacen: linea.almacen || pedido.centroConsumo,
    })),
  );

  for (let index = 0; index < pedido.lineas.length; index += 1) {
    const linea = pedido.lineas[index]!;
    const resolucion = resolveProductoMatch(linea, byKey, byCodigo, byKeyNorm, indiceFrases);
    const match = resolucion?.producto;
    const textoOriginal = linea.textoOriginal?.trim() || "";

    const presentacion =
      linea.presentacion && PRESENTACION_SET.has(linea.presentacion)
        ? linea.presentacion
        : "";

    const precioDoc = parsePrecioIa(linea.precioUnitario);
    const otId = otIdsPorLinea[index] ?? "default";

    if (match) {
      const qty = resolveLineaCantidadPrecioEmpaque({
        textoOriginal,
        unidadMedidaCatalogo: match.unidadMedida,
        cantidad: linea.cantidad,
        cajas: linea.cajas,
        presentacion,
        precioDoc,
        precioCatalogo: match.precioUnitario,
        especificacionIa: linea.especificacion,
      });
      // Clave exacta: si el texto también se parece a otro producto, pedir confirmación.
      const vecinos =
        resolucion.fuente === "frase"
          ? []
          : findVecinosAmbiguos(textoOriginal || match.nombre, match, productos);
      if (vecinos.length > 0) {
        const codigoCliente =
          linea.codigoProductoCliente?.trim() ||
          extractCodigoFromCatalogKey(textoOriginal) ||
          "";
        lineas.push({
          ...camposUnidadEspecLinea({ textoOriginal, especificacionIa: linea.especificacion, especificacionEnvase: qty.especificacionEnvase, unidadOrigen: linea.unidad, unidadCatalogo: match.unidadMedida }),
          idProducto: "",
          nombre: textoOriginal || stripLeadingProductoCodigo(match.nombre, match.codigo),
          codigo: codigoCliente || "—",
          idBodega: match.idBodega,
          cantidadInput: qty.cantidadInput,
          cajasInput: qty.cajasInput,
          presentacion: qty.presentacion,
          ivaPct: "0",
          kgDisponible: match.kgDisponible,
          precioUnitario: qty.precioUnitario,
          precioManual: qty.precioManual,
          aliasCliente: textoOriginal,
          filledByIa: true,
          otId,
          packHint: qty.packHint,
          autoPackFields: qty.autoPackFields,
          catalogPending: true,
          catalogAmbiguo: true,
          sugerencia: toSugerencia(match),
          sugerenciasAlternativas: vecinos.map(toSugerencia),
          propuestaSistema: { producto: null, fuente: null },
        });
        continue;
      }

      lineas.push({
        ...camposUnidadEspecLinea({ textoOriginal, especificacionIa: linea.especificacion, especificacionEnvase: qty.especificacionEnvase, unidadOrigen: linea.unidad, unidadCatalogo: match.unidadMedida }),
        idProducto: match.idProducto,
        nombre: stripLeadingProductoCodigo(match.nombre, match.codigo),
        codigo: match.codigo,
        idBodega: match.idBodega,
        cantidadInput: qty.cantidadInput,
        cajasInput: qty.cajasInput,
        presentacion: qty.presentacion,
        ivaPct: "0",
        kgDisponible: match.kgDisponible,
        precioUnitario: qty.precioUnitario,
        precioManual: qty.precioManual,
        aliasCliente: textoOriginal,
        filledByIa: true,
        otId,
        packHint: qty.packHint,
        autoPackFields: qty.autoPackFields,
        catalogPending: false,
        catalogAmbiguo: false,
        sugerencia: null,
        sugerenciasAlternativas: [],
        propuestaSistema: {
          producto: { idProducto: match.idProducto, nombre: match.nombre, codigo: match.codigo },
          fuente: resolucion.fuente,
        },
      });
      continue;
    }

    // Sin clave exacta de Mateo: sugerencias cercanas; auto-asignar si es claro.
    const picked = pickSugerencias(linea, productos);
    const { sugerencia, alternativas, ambiguo } = picked;
    const qty = resolveLineaCantidadPrecioEmpaque({
      textoOriginal,
      unidadMedidaCatalogo: sugerencia?.unidadMedida ?? "",
      cantidad: linea.cantidad,
      cajas: linea.cajas,
      presentacion,
      precioDoc,
      precioCatalogo: sugerencia?.precioUnitario ?? 0,
      especificacionIa: linea.especificacion,
    });
    const precioUnitario = qty.precioUnitario;

    const codigoClienteNorm = norm(linea.codigoProductoCliente);
    const codigoEnTextoNorm = norm(
      extractCodigoFromCatalogKey(textoOriginal) ?? "",
    );
    const mismoCodigo =
      Boolean(sugerencia) &&
      (codigoClienteNorm === norm(sugerencia?.codigo) ||
        codigoEnTextoNorm === norm(sugerencia?.codigo));

    const autoAccept =
      sugerencia != null &&
      !fraseClienteAmbigua(textoOriginal, indiceFrases) &&
      (mismoCodigo ||
        shouldAutoAcceptProductoSuggestion({
          query: picked.queryUsed || textoOriginal,
          sugerenciaNombre: sugerencia.nombre,
          sugerenciaCodigo: sugerencia.codigo,
          topScore: picked.topScore,
          secondScore: picked.secondScore,
          ambiguous: ambiguo,
        }));

    if (autoAccept && sugerencia) {
      const catalogo = productos.find(
        (p) => p.idProducto === sugerencia.idProducto,
      );
      lineas.push({
        ...camposUnidadEspecLinea({ textoOriginal, especificacionIa: linea.especificacion, especificacionEnvase: qty.especificacionEnvase, unidadOrigen: linea.unidad, unidadCatalogo: sugerencia.unidadMedida }),
        idProducto: sugerencia.idProducto,
        nombre: stripLeadingProductoCodigo(catalogo?.nombre ?? sugerencia.nombre, sugerencia.codigo),
        codigo: sugerencia.codigo,
        idBodega: sugerencia.idBodega,
        cantidadInput: qty.cantidadInput,
        cajasInput: qty.cajasInput,
        presentacion: qty.presentacion,
        ivaPct: "0",
        kgDisponible: sugerencia.kgDisponible,
        precioUnitario,
        precioManual: qty.precioManual,
        aliasCliente: textoOriginal,
        filledByIa: true,
        otId,
        packHint: qty.packHint,
        autoPackFields: qty.autoPackFields,
        catalogPending: false,
        catalogAmbiguo: false,
        sugerencia: null,
        sugerenciasAlternativas: [],
        propuestaSistema: {
          producto: {
            idProducto: sugerencia.idProducto,
            nombre: catalogo?.nombre ?? sugerencia.nombre,
            codigo: sugerencia.codigo,
          },
          fuente: "difuso",
        },
      });
      continue;
    }

    const codigoClientePending =
      linea.codigoProductoCliente?.trim() ||
      extractCodigoFromCatalogKey(textoOriginal) ||
      "";
    lineas.push({
      ...camposUnidadEspecLinea({ textoOriginal, especificacionIa: linea.especificacion, especificacionEnvase: qty.especificacionEnvase, unidadOrigen: linea.unidad, unidadCatalogo: sugerencia?.unidadMedida ?? "" }),
      idProducto: "",
      nombre: textoOriginal || "Producto no identificado",
      codigo: codigoClientePending || "—",
      idBodega: sugerencia?.idBodega ?? "",
      cantidadInput: qty.cantidadInput,
      cajasInput: qty.cajasInput,
      presentacion: qty.presentacion,
      ivaPct: "0",
      kgDisponible: sugerencia?.kgDisponible ?? 0,
      precioUnitario,
      precioManual: qty.precioManual,
      aliasCliente: textoOriginal,
      filledByIa: true,
      otId,
      packHint: qty.packHint,
      autoPackFields: qty.autoPackFields,
      catalogPending: true,
      catalogAmbiguo: ambiguo,
      sugerencia,
      sugerenciasAlternativas: alternativas,
      propuestaSistema: { producto: null, fuente: null },
    });
  }

  return lineas;
}