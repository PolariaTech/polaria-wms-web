import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type {
  CreateSolicitudCompraApiInput,
  OrdenCompraApiRow,
  SolicitudCompraApiRow,
} from "../../shared/types/purchases-api.types";
import { postComprasApi } from "./purchases-api.service.http";

/** Crea una solicitud de compra vía API Nest (escritura). */
export async function createSolicitudCompraApi(
  input: CreateSolicitudCompraApiInput,
): Promise<SolicitudCompraApiRow> {
  const codigoCuenta = input.codigoCuenta.trim();
  const idBodega = input.idBodega.trim();
  const observaciones = input.observaciones?.trim() ?? "";
  const idProveedor = input.idProveedor?.trim() ?? "";

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
      "Agrega al menos una línea de producto.",
      "INVALID_ARGUMENT",
    );
  }

  const lineas = input.lineas.map((linea, index) => {
    const idProducto = linea.idProducto.trim();
    const cantidad = linea.cantidad;

    if (!idProducto) {
      throw new DomainServiceError(
        `Selecciona un producto en la línea ${index + 1}.`,
        "INVALID_ARGUMENT",
      );
    }

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new DomainServiceError(
        `La cantidad de la línea ${index + 1} debe ser mayor a cero.`,
        "INVALID_ARGUMENT",
      );
    }

    return { idProducto, cantidad };
  });

  return postComprasApi<SolicitudCompraApiRow>("/compras/solicitudes", {
    codigoCuenta,
    idBodega,
    ...(idProveedor ? { idProveedor } : {}),
    observaciones: observaciones || null,
    lineas,
  });
}

/** Envía una solicitud a aprobación. Puede asignar proveedor si la SOL no lo traía. */
export async function enviarSolicitudCompraAprobacionApi(
  idSolicitudCompra: string,
  input?: { idProveedor?: string | null },
): Promise<SolicitudCompraApiRow> {
  const id = idSolicitudCompra.trim();
  if (!id) {
    throw new DomainServiceError(
      "La solicitud no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  const idProveedor = input?.idProveedor?.trim() ?? "";

  return postComprasApi<SolicitudCompraApiRow>(
    `/compras/solicitudes/${encodeURIComponent(id)}/enviar-aprobacion`,
    idProveedor ? { idProveedor } : {},
  );
}

/** Aprueba una solicitud de compra. */
export async function aprobarSolicitudCompraApi(
  idSolicitudCompra: string,
): Promise<SolicitudCompraApiRow> {
  const id = idSolicitudCompra.trim();
  if (!id) {
    throw new DomainServiceError(
      "La solicitud no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  return postComprasApi<SolicitudCompraApiRow>(
    `/compras/solicitudes/${encodeURIComponent(id)}/aprobar`,
  );
}

/** Convierte una solicitud aprobada en orden de compra. */
export async function convertirSolicitudCompraAOrdenApi(
  idSolicitudCompra: string,
): Promise<OrdenCompraApiRow> {
  const id = idSolicitudCompra.trim();
  if (!id) {
    throw new DomainServiceError(
      "La solicitud no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  return postComprasApi<OrdenCompraApiRow>(
    `/compras/solicitudes/${encodeURIComponent(id)}/convertir-oc`,
  );
}