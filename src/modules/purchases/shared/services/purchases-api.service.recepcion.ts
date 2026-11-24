import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type {
  CerrarRecepcionCompraApiInput,
  RecepcionCompraApiRow,
  RecepcionLineaApiInput,
} from "../../shared/types/purchases-api.types";
import { postComprasApi } from "./purchases-api.service.http";

/** Cierra recepción de mercancía contra una orden de compra emitida (POL-5). */
export async function cerrarRecepcionCompraApi(
  input: CerrarRecepcionCompraApiInput,
): Promise<RecepcionCompraApiRow> {
  const idOrdenCompra = input.idOrdenCompra.trim();
  const codigoCuenta = input.codigoCuenta.trim();
  const idBodega = input.idBodega.trim();
  const notas = input.notas?.trim() ?? "";
  const idUbicacionIngreso = input.idUbicacionIngreso?.trim() ?? "";

  if (!idOrdenCompra) {
    throw new DomainServiceError(
      "La orden de compra no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigoCuenta) {
    throw new DomainServiceError(
      "No se encontró la cuenta activa.",
      "INVALID_ARGUMENT",
    );
  }

  if (!idBodega) {
    throw new DomainServiceError(
      "No se encontró la bodega activa.",
      "INVALID_ARGUMENT",
    );
  }

  if (!input.lineas.length) {
    throw new DomainServiceError(
      "Agrega al menos una línea de recepción.",
      "INVALID_ARGUMENT",
    );
  }

  const lineas: RecepcionLineaApiInput[] = input.lineas.map((linea, index) => {
    const idLineaOrdenCompra = linea.idLineaOrdenCompra.trim();
    const cantidadRecibida = linea.cantidadRecibida;

    if (!idLineaOrdenCompra) {
      throw new DomainServiceError(
        `La línea ${index + 1} no es válida.`,
        "INVALID_ARGUMENT",
      );
    }

    if (!Number.isFinite(cantidadRecibida) || cantidadRecibida < 0) {
      throw new DomainServiceError(
        `La cantidad recibida de la línea ${index + 1} no es válida.`,
        "INVALID_ARGUMENT",
      );
    }

    return {
      idLineaOrdenCompra,
      cantidadRecibida,
      ...(linea.temperaturaRegistrada != null &&
      Number.isFinite(linea.temperaturaRegistrada)
        ? { temperaturaRegistrada: linea.temperaturaRegistrada }
        : {}),
    };
  });

  return postComprasApi<RecepcionCompraApiRow>(
    `/compras/recepciones/ordenes/${encodeURIComponent(idOrdenCompra)}/cerrar`,
    {
      codigoCuenta,
      idBodega,
      lineas,
      ...(idUbicacionIngreso ? { idUbicacionIngreso } : {}),
      ...(notas ? { notas } : {}),
    },
  );
}