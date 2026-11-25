import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "../../shared/types/sales.types";
import {
  cleanCorreoBodyForNotas,
  isCuerpoMensajeFormato,
} from "../utils/origen/texto-origen-pedido";
import type { LineaVentaFromIa } from "../utils/pedido/map-pedido-extraido-to-form";
import { formatPrecioInput } from "../utils/pedido/orden-venta-create-helpers";

export function construirMissingFieldsPedidoIa(params: {
  baseMissingFields: Iterable<string>;
  tieneCliente: boolean;
  direccion: string;
}): Set<string> {
  const nextMissing = new Set(params.baseMissingFields);
  if (!params.tieneCliente) {
    nextMissing.add("cliente");
  } else {
    nextMissing.delete("cliente");
  }
  if (!params.direccion.trim()) nextMissing.add("direccion");
  else nextMissing.delete("direccion");
  return nextMissing;
}

export function mapLineasPedidoIaAForm(
  lineas: readonly LineaVentaFromIa[],
): LineaVentaForm[] {
  return lineas.map((linea) => ({
    idProducto: linea.idProducto,
    nombre: linea.nombre,
    codigo: linea.codigo,
    idBodega: linea.idBodega,
    cantidadInput: linea.cantidadInput,
    cajasInput: linea.cajasInput,
    presentacion: linea.presentacion,
    especificacion: linea.especificacion,
    ivaPct: "0",
    kgDisponible: linea.kgDisponible,
    unidadMedida: linea.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
    precioUnitario: linea.precioUnitario,
    precioInput: formatPrecioInput(linea.precioUnitario),
    precioManual: linea.precioManual,
    aliasCliente: linea.aliasCliente,
    filledByIa: linea.filledByIa,
    otId: linea.otId,
    catalogPending: linea.catalogPending,
    catalogAmbiguo: linea.catalogAmbiguo,
    sugerencia: linea.sugerencia ?? null,
    sugerenciasAlternativas: linea.sugerenciasAlternativas ?? [],
  }));
}

export function construirAvisosPedidoIa(params: {
  advertencia?: string | null;
  archivosNoLegibles: readonly string[];
  lineas: ReadonlyArray<{ catalogPending?: boolean }>;
  tieneCliente: boolean;
  nombreCliente?: string | null;
  cantidadSugeridos: number;
}): string[] {
  const avisos: string[] = [];
  if (params.advertencia) avisos.push(params.advertencia);
  if (params.archivosNoLegibles.length > 0) {
    avisos.push(
      `No se pudieron leer: ${params.archivosNoLegibles.join(", ")}. Se guardan como respaldo.`,
    );
  }
  const pendingCatalog = params.lineas.filter(
    (linea) => linea.catalogPending,
  ).length;
  if (params.lineas.length === 0 && !params.advertencia) {
    avisos.push(
      "No se reconocieron productos del pedido. Revisa el mensaje y agrégalos a mano.",
    );
  } else if (pendingCatalog > 0) {
    avisos.push(
      pendingCatalog === 1
        ? "1 producto no identificado."
        : `${pendingCatalog} productos no identificados.`,
    );
  }
  if (!params.tieneCliente) {
    const nombreLimpio = params.nombreCliente?.trim();
    avisos.push(
      nombreLimpio
        ? params.cantidadSugeridos > 0
          ? `El cliente «${nombreLimpio}» no coincide exacto: revisa la sugerencia o elige otro.`
          : `El cliente «${nombreLimpio}» no está en clientes. Selecciónalo para continuar.`
        : "Selecciona el cliente para continuar.",
    );
  }
  return avisos;
}

export function resolverTextoOrigenParaPersistir(
  textoOrigenPedido: string | null | undefined,
  origenTexto: string,
): string {
  return (
    textoOrigenPedido?.trim() ||
    (origenTexto.trim()
      ? isCuerpoMensajeFormato(origenTexto)
        ? origenTexto.trim()
        : cleanCorreoBodyForNotas(origenTexto)
      : "")
  );
}
