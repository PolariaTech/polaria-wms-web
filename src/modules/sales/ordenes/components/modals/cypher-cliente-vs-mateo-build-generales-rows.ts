import { formatDateTime } from "@/components/shared/utils/formatters";
import { rankCompradoresFromNombre } from "../../utils/match/match-comprador-from-nombre";
import { resolveMateoCoincidencia } from "../../utils/match/mateo-coincidencia";
import { formatCompradorOrdenVenta } from "../../utils/display/orden-venta-display";
import { parseOrigenCorreoJson } from "../../utils/origen/origen-correo-ordenes-trabajo";
import { resolveOrdenCompraLimpia } from "../../utils/pedido/normalize-numero-pedido";
import { buildPedidoExtraidoFromOrigenCorreo } from "../../utils/origen/pedido-from-origen-correo";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import {
  firstNonEmpty,
  mateoSoloSugerencia,
  usuarioSiConfirmado,
} from "./cypher-cliente-vs-mateo-helpers";
import type { CompareRow, MateoSuggestContext } from "./cypher-cliente-vs-mateo.types";

export function buildGeneralesRows(
  orden: OrdenVentaDetalleRow,
  usuarioConfirmado: boolean,
  ctx: MateoSuggestContext,
): CompareRow[] {
  const origenRows = parseOrigenCorreoJson(orden.origen_correo);
  const pedido = buildPedidoExtraidoFromOrigenCorreo({
    origenCorreo: orden.origen_correo,
    origenTexto: orden.origen_texto,
    notasAlmacen: orden.notas_almacen,
  });

  const correoCliente = firstNonEmpty([
    ...origenRows.map((row) => row["Nombre cliente"]),
    pedido.nombreCliente,
  ]);
  const compradorRank = rankCompradoresFromNombre(
    correoCliente || pedido.nombreCliente,
    ctx.compradores,
  );
  const mateoCliente = firstNonEmpty([
    compradorRank.best?.comprador,
    compradorRank.exact?.comprador,
  ]);
  const usuarioCliente = usuarioSiConfirmado(
    usuarioConfirmado,
    formatCompradorOrdenVenta(orden),
  );

  const correoOccRaw = firstNonEmpty([
    ...origenRows.map((row) => row["Numero pedido"]),
    pedido.ordenCompraHotel,
  ]);
  const correoOcc = resolveOrdenCompraLimpia(
    correoOccRaw,
    orden.origen_texto ?? pedido.textoOrigen ?? "",
  );
  const mateoOcc = mateoSoloSugerencia(
    resolveOrdenCompraLimpia(
      pedido.ordenCompraHotel,
      orden.origen_texto ?? pedido.textoOrigen ?? "",
    ),
    correoOcc,
  );
  const usuarioOcc = usuarioSiConfirmado(
    usuarioConfirmado,
    resolveOrdenCompraLimpia(
      orden.orden_compra_hotel,
      orden.origen_texto ?? "",
    ),
  );

  const correoFecha = firstNonEmpty([
    ...origenRows.map((row) => row.Fecha),
    ...origenRows.map((row) => row.Horario),
  ]);
  const mateoFecha = pedido.fechaEntrega?.trim()
    ? formatDateTime(pedido.fechaEntrega)
    : "";
  const usuarioFecha = usuarioSiConfirmado(
    usuarioConfirmado,
    orden.fecha_entrega?.trim() ? formatDateTime(orden.fecha_entrega) : "",
  );

  return [
    {
      campo: "Cliente",
      correo: correoCliente,
      mateo: mateoCliente,
      usuario: usuarioCliente,
      coincidencia: resolveMateoCoincidencia({
        correo: correoCliente,
        mateo: mateoCliente,
        usuario: usuarioCliente,
        mateoSinPropuesta: !mateoCliente,
      }),
    },
    {
      campo: "OCC",
      correo: correoOcc,
      mateo: mateoOcc,
      usuario: usuarioOcc,
      coincidencia: resolveMateoCoincidencia({
        correo: correoOcc,
        mateo: mateoOcc,
        usuario: usuarioOcc,
        mateoSinPropuesta: !mateoOcc,
      }),
    },
    {
      campo: "Fecha de entrega",
      correo: correoFecha,
      mateo: mateoFecha,
      usuario: usuarioFecha,
      coincidencia: resolveMateoCoincidencia({
        correo: correoFecha,
        mateo: mateoFecha,
        usuario: usuarioFecha,
        mateoSinPropuesta: !mateoFecha,
      }),
    },
  ];
}
