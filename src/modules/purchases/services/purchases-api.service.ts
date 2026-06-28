import { DomainServiceError } from "@/lib/domain-service-error";
import { ApiError, apiRequest } from "@/services/api";
import type {
  CreateSolicitudCompraApiInput,
  OrdenCompraApiRow,
  SolicitudCompraApiRow,
} from "../types/purchases-api.types";

async function postComprasApi<T>(path: string, body?: unknown): Promise<T> {
  try {
    return await apiRequest<T>(path, {
      method: "POST",
      auth: true,
      body,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}

/** Crea una solicitud de compra vía API Nest (escritura). */
export async function createSolicitudCompraApi(
  input: CreateSolicitudCompraApiInput,
): Promise<SolicitudCompraApiRow> {
  const idProveedor = input.idProveedor.trim();
  const idBodega = input.idBodega.trim();
  const observaciones = input.observaciones?.trim() ?? "";

  if (!idProveedor) {
    throw new DomainServiceError(
      "Selecciona un proveedor.",
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
    idProveedor,
    idBodega,
    observaciones: observaciones || null,
    lineas,
  });
}

/** Envía una solicitud a aprobación. */
export async function enviarSolicitudCompraAprobacionApi(
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
    `/compras/solicitudes/${encodeURIComponent(id)}/enviar-aprobacion`,
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
    `/compras/solicitudes/${encodeURIComponent(id)}/convertir-orden`,
  );
}

/** Emite una orden de compra en borrador. */
export async function emitirOrdenCompraApi(
  idOrdenCompra: string,
): Promise<OrdenCompraApiRow> {
  const id = idOrdenCompra.trim();
  if (!id) {
    throw new DomainServiceError(
      "La orden no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  return postComprasApi<OrdenCompraApiRow>(
    `/compras/ordenes/${encodeURIComponent(id)}/emitir`,
  );
}
