import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type {
  BodegaDestinoCompraRow,
  CreateOrdenCompraApiInput,
  OrdenCompraApiRow,
  UpdateOrdenDestinoApiInput,
} from "../../shared/types/purchases-api.types";
import type { DestinoTipoOrden } from "../../shared/types/purchases.types";
import { fechaOrdenInputToStorage } from "../../ordenes/utils/orden-compra-display";
import { postComprasApi, requestComprasApi } from "./purchases-api.service.http";

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