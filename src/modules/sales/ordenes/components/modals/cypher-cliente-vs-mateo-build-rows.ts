import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { resolveMateoCoincidencia } from "../../utils/match/mateo-coincidencia";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../../utils/origen/origen-correo-ordenes-trabajo";
import { scoreMatch } from "../../utils/ot/filter-lineas-by-orden-trabajo";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import {
  firstNonEmpty,
  formatCantidadCorreo,
  formatMateoRef,
  formatPrecioCorreo,
  mateoSoloSugerencia,
  suggestProductoMateo,
  usuarioSiConfirmado,
} from "./cypher-cliente-vs-mateo-helpers";
import type { CompareRow, MateoSuggestContext } from "./cypher-cliente-vs-mateo.types";

export { buildGeneralesRows } from "./cypher-cliente-vs-mateo-build-generales-rows";

export function buildOtRows(
  orden: OrdenVentaDetalleRow,
  hija: OrdenTrabajoHija,
  otIndex: number,
  usuarioConfirmado: boolean,
  ctx: MateoSuggestContext,
): CompareRow[] {
  const lineas = orden.lineas ?? [];
  const used = new Set<number>();
  const out: CompareRow[] = [];

  const correoDestino = firstNonEmpty([
    hija.almacen,
    hija.renglones[0]?.Destino,
    hija.renglones[0]?.["Direccion entrega"],
  ]);
  const mateoDestino = "";
  const usuarioDestino = usuarioSiConfirmado(
    usuarioConfirmado,
    firstNonEmpty([
      orden.centro_consumo,
      orden.direccion_entrega,
      orden.bodega_destino_nombre,
    ]),
  );

  out.push({
    campo: "Destino",
    correo: correoDestino,
    mateo: mateoDestino,
    usuario: usuarioDestino,
    coincidencia: resolveMateoCoincidencia({
      correo: correoDestino,
      mateo: mateoDestino,
      usuario: usuarioDestino,
      mateoSinPropuesta: true,
    }),
    group: `TAREA ${otIndex + 1}`,
  });

  hija.renglones.forEach((renglon: OrigenCorreoRenglon, lineIndex) => {
    let bestIndex = -1;
    let bestScore = -1;
    for (let i = 0; i < lineas.length; i++) {
      if (used.has(i)) continue;
      const linea = lineas[i]!;
      const score = scoreMatch(
        {
          cantidad_pedida: linea.cantidad_pedida,
          matchNombre: linea.match_producto?.elegidoUsuario.nombre,
          matchCodigo: linea.match_producto?.elegidoUsuario.codigo,
          producto: linea.producto,
        },
        renglon,
      );
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    const linea = bestIndex >= 0 ? lineas[bestIndex]! : null;
    if (bestIndex >= 0) used.add(bestIndex);

    const match = linea?.match_producto ?? null;
    const group = `L${lineIndex + 1}`;

    const correoProducto = firstNonEmpty([
      match?.textoCliente,
      renglon.Producto,
      renglon["Codigo producto"],
    ]);
    const fromPersist = formatMateoRef(match?.sugeridoMateo);
    const suggested = suggestProductoMateo(
      correoProducto,
      fromPersist,
      ctx.productos,
    );
    const mateoProducto = suggested.label;
    const usuarioProducto = usuarioSiConfirmado(
      usuarioConfirmado,
      firstNonEmpty([
        formatMateoRef(match?.elegidoUsuario),
        linea?.producto?.descripcion,
        linea?.producto?.sku,
      ]),
    );
    const idsMatch = Boolean(
      usuarioConfirmado &&
        match?.sugeridoMateo?.idProducto &&
        match.elegidoUsuario.idProducto &&
        match.sugeridoMateo.idProducto === match.elegidoUsuario.idProducto,
    );

    out.push({
      campo: "Producto",
      group,
      correo: correoProducto,
      mateo: mateoProducto,
      usuario: usuarioProducto,
      coincidencia: resolveMateoCoincidencia({
        correo: correoProducto,
        mateo: mateoProducto,
        usuario: usuarioProducto,
        idsMatch,
        mateoSinPropuesta: !mateoProducto,
      }),
    });

    const correoCantidad = formatCantidadCorreo(renglon.Cantidad);
    const mateoCantidad = "";
    const usuarioCantidad = usuarioSiConfirmado(
      usuarioConfirmado,
      linea != null ? formatKgEs(linea.cantidad_pedida) : "",
    );

    out.push({
      campo: "Cantidad",
      group,
      correo: correoCantidad,
      mateo: mateoCantidad,
      usuario: usuarioCantidad,
      coincidencia: resolveMateoCoincidencia({
        correo: correoCantidad,
        mateo: mateoCantidad,
        usuario: usuarioCantidad,
        mateoSinPropuesta: true,
      }),
    });

    const correoUnidad = (renglon.Unidad ?? "").toString().trim();
    const unidadCatalogo = (suggested.producto?.unidadMedida ?? "").trim();
    const mateoUnidad = mateoSoloSugerencia(unidadCatalogo, correoUnidad);
    const usuarioUnidad = usuarioSiConfirmado(
      usuarioConfirmado,
      firstNonEmpty([linea?.unidad_medida, linea?.presentacion]),
    );

    out.push({
      campo: "Unidad",
      group,
      correo: correoUnidad,
      mateo: mateoUnidad,
      usuario: usuarioUnidad,
      coincidencia: resolveMateoCoincidencia({
        correo: correoUnidad,
        mateo: mateoUnidad,
        usuario: usuarioUnidad,
        mateoSinPropuesta: !mateoUnidad,
      }),
    });

    const correoPrecio = formatPrecioCorreo(renglon.Precio);
    const precioCatalogo =
      suggested.producto && Number(suggested.producto.precioUnitario) > 0
        ? `$${formatPrecioEs(suggested.producto.precioUnitario)}`
        : "";
    const mateoPrecio = mateoSoloSugerencia(precioCatalogo, correoPrecio);
    const usuarioPrecio = usuarioSiConfirmado(
      usuarioConfirmado,
      linea != null && Number(linea.precio_unitario) > 0
        ? `$${formatPrecioEs(linea.precio_unitario)}`
        : "",
    );

    out.push({
      campo: "Precio unitario",
      group,
      correo: correoPrecio,
      mateo: mateoPrecio,
      usuario: usuarioPrecio,
      coincidencia: resolveMateoCoincidencia({
        correo: correoPrecio,
        mateo: mateoPrecio,
        usuario: usuarioPrecio,
        mateoSinPropuesta: !mateoPrecio,
      }),
    });
  });

  return out;
}