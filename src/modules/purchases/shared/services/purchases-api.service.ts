import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import type {
  CerrarRecepcionCompraApiInput,
  CreateOrdenCompraApiInput,
  CreateSolicitudCompraApiInput,
  BodegaDestinoCompraRow,
  OrdenCompraApiRow,
  RecepcionCompraApiRow,
  RecepcionLineaApiInput,
  SolicitudCompraApiRow,
  UpdateOrdenDestinoApiInput,
} from "../../shared/types/purchases-api.types";
import type { DestinoTipoOrden } from "../../shared/types/purchases.types";
import { fechaOrdenInputToStorage } from "../../ordenes/utils/orden-compra-display";

async function requestComprasApi<T>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH"; body?: unknown } = {},
): Promise<T> {
  try {
    return await apiRequest<T>(path, {
      method: options.method ?? "GET",
      auth: true,
      body: options.body,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}

async function postComprasApi<T>(path: string, body?: unknown): Promise<T> {
  return requestComprasApi<T>(path, { method: "POST", body });
}

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

/** Crea una orden de compra manual vía API Nest (escritura). */
export async function createOrdenCompraApi(
  input: CreateOrdenCompraApiInput,
): Promise<OrdenCompraApiRow> {
  const codigoCuenta = input.codigoCuenta.trim();
  const idBodega = input.idBodega.trim();
  const idProveedor = input.idProveedor.trim();
  const observaciones = input.observaciones?.trim() ?? "";
  const fechaEntregaEstimada = input.fechaEntregaEstimada?.trim() ?? "";

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

  if (!idProveedor) {
    throw new DomainServiceError(
      "Selecciona un proveedor para la orden.",
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

  return postComprasApi<OrdenCompraApiRow>("/compras/ordenes", {
    codigoCuenta,
    idBodega,
    idProveedor,
    observaciones: observaciones || null,
    ...(fechaEntregaEstimada
      ? { fechaEntregaEstimada }
      : {}),
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
    `/compras/solicitudes/${encodeURIComponent(id)}/convertir-oc`,
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

/** Bodegas destino disponibles para una orden (tipo + slots libres). */
export async function listBodegasDestinoCompraApi(params: {
  codigoCuenta: string;
  tipo: DestinoTipoOrden;
}): Promise<BodegaDestinoCompraRow[]> {
  const codigoCuenta = params.codigoCuenta.trim();
  const tipo = params.tipo;

  if (!codigoCuenta) {
    throw new DomainServiceError(
      "No se encontró la cuenta activa.",
      "INVALID_ARGUMENT",
    );
  }

  if (tipo !== "interna" && tipo !== "externa") {
    throw new DomainServiceError(
      "El tipo de destino no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  const searchParams = new URLSearchParams({
    codigoCuenta,
    tipo,
  });

  const rows = await requestComprasApi<BodegaDestinoCompraRow[]>(
    `/compras/bodegas-destino?${searchParams.toString()}`,
  );

  return Array.isArray(rows) ? rows : [];
}

/** Actualiza destino de una orden en borrador vía API Nest. */
export async function updateOrdenCompraDestinoApi(
  idOrdenCompra: string,
  input: UpdateOrdenDestinoApiInput,
): Promise<OrdenCompraApiRow> {
  const id = idOrdenCompra.trim();
  const idBodega = input.idBodega.trim();
  const destinoTipo = input.destinoTipo;

  if (!id) {
    throw new DomainServiceError(
      "La orden no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  if (!idBodega) {
    throw new DomainServiceError(
      "Selecciona una bodega destino.",
      "INVALID_ARGUMENT",
    );
  }

  if (destinoTipo !== "interna" && destinoTipo !== "externa") {
    throw new DomainServiceError(
      "Selecciona el tipo de bodega destino.",
      "INVALID_ARGUMENT",
    );
  }

  const fechaEntregaEstimada =
    input.fechaEntregaEstimada === undefined
      ? undefined
      : input.fechaEntregaEstimada === null || input.fechaEntregaEstimada === ""
        ? null
        : input.fechaEntregaEstimada.includes("T")
          ? input.fechaEntregaEstimada
          : fechaOrdenInputToStorage(input.fechaEntregaEstimada);

  return requestComprasApi<OrdenCompraApiRow>(
    `/compras/ordenes/${encodeURIComponent(id)}/destino`,
    {
      method: "PATCH",
      body: {
        destinoTipo,
        idBodega,
        ...(fechaEntregaEstimada !== undefined
          ? { fechaEntregaEstimada }
          : {}),
      },
    },
  );
}

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
