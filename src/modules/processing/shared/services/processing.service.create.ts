import { requireCodigoCuenta, requireIdBodega } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { createSolicitudProcesamientoApi } from "./processing-api.service";
import type {
  CreateSolicitudProcesamientoInput,
  SolicitudProcesamientoOperadorRow,
} from "../types/processing.types";
import {
  fetchProductoLabels,
  mapSolicitudOperadorRow,
} from "./processing.service.shared";
import { getStockProductoBodega } from "./processing.service.lists";

export async function createSolicitudProcesamiento(
  input: CreateSolicitudProcesamientoInput,
): Promise<SolicitudProcesamientoOperadorRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idBodega = requireIdBodega(input.idBodega);
  const idSolicitante = input.idSolicitante.trim();
  const idProductoPrimario = input.idProductoPrimario.trim();
  const idProductoSecundario = input.idProductoSecundario.trim();

  if (!idSolicitante) {
    throw new DomainServiceError(
      "No se encontró el usuario solicitante.",
      "INVALID_ARGUMENT",
    );
  }

  if (!idProductoPrimario || !idProductoSecundario) {
    throw new DomainServiceError(
      "Selecciona insumo y resultado válidos.",
      "INVALID_ARGUMENT",
    );
  }

  if (input.kilosPrimario <= 0) {
    throw new DomainServiceError(
      "Indica una cantidad a procesar mayor a cero.",
      "INVALID_ARGUMENT",
    );
  }

  if (input.reglaConversionUnidadesSecundario <= 0) {
    throw new DomainServiceError(
      "Indica una conversión válida.",
      "INVALID_ARGUMENT",
    );
  }

  const stock = await getStockProductoBodega(
    idBodega,
    idProductoPrimario,
    codigoCuenta,
  );

  if (stock <= 0) {
    throw new DomainServiceError(
      "Sin stock disponible en el mapa para el insumo seleccionado.",
      "INVALID_ARGUMENT",
    );
  }

  if (input.kilosPrimario > stock) {
    throw new DomainServiceError(
      "La cantidad a procesar supera el stock del mapa.",
      "INVALID_ARGUMENT",
    );
  }

  const row = await createSolicitudProcesamientoApi({
    codigoCuenta,
    idBodega,
    idSolicitante,
    idProductoPrimario,
    idProductoSecundario,
    kilosPrimario: input.kilosPrimario,
    reglaConversionCantidadPrimario: input.reglaConversionCantidadPrimario,
    reglaConversionUnidadesSecundario: input.reglaConversionUnidadesSecundario,
    estimadoUnidadesSecundario: input.estimadoUnidadesSecundario,
  });

  const productLabels = await fetchProductoLabels([
    row.id_producto_primario,
    row.id_producto_secundario,
  ]);

  return mapSolicitudOperadorRow(row, productLabels);
}
