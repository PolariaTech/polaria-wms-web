import { runDomainQuery } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type { OrdenVentaLineaInput } from "../types/sales.types";

/** Si no viene comprador: en avance sobre OV existente lo recupera; si no, exige uno. */
export async function resolveCompradorParaCreate(params: {
  idComprador: string;
  codigoCuenta: string;
  guardarAvance: boolean;
  idOrdenVentaExistente: string;
  origenOnlyFirstDraft: boolean;
}): Promise<string> {
  const {
    codigoCuenta,
    guardarAvance,
    idOrdenVentaExistente,
    origenOnlyFirstDraft,
  } = params;
  let idComprador = params.idComprador;

  if (!idComprador) {
    if (guardarAvance && idOrdenVentaExistente) {
      const existingComprador = await runDomainQuery<{
        id_comprador: string | null;
      } | null>((client) => {
        const query = client
          .from("orden_venta")
          .select("id_comprador")
          .eq("codigo_cuenta", codigoCuenta)
          .eq("id_orden_venta", idOrdenVentaExistente)
          .maybeSingle();

        return query as unknown as Promise<{
          data: { id_comprador: string | null } | null;
          error: { message: string } | null;
        }>;
      });
      idComprador = existingComprador?.id_comprador?.trim() || "";
    }
    if (
      !idComprador &&
      !(guardarAvance && idOrdenVentaExistente) &&
      !origenOnlyFirstDraft
    ) {
      throw new DomainServiceError(
        "Selecciona un comprador.",
        "INVALID_ARGUMENT",
      );
    }
  }

  return idComprador;
}

export function validateLineasCreateOrdenVenta(
  lineas: OrdenVentaLineaInput[],
  guardarAvance: boolean,
): void {
  for (const linea of lineas) {
    const idProducto = linea.idProducto.trim();
    const cantidadPedida = linea.cantidadPedida;

    if (!idProducto) {
      throw new DomainServiceError(
        "Cada línea debe tener un producto del catálogo.",
        "INVALID_ARGUMENT",
      );
    }

    // REQ-138 / REQ-235: avance y confirmación permiten precio vacío/0; cantidad > 0 solo al confirmar.
    if (!Number.isFinite(cantidadPedida) || cantidadPedida < 0) {
      throw new DomainServiceError(
        "La cantidad de cada producto no puede ser negativa.",
        "INVALID_ARGUMENT",
      );
    }
    if (!guardarAvance && cantidadPedida <= 0) {
      throw new DomainServiceError(
        "La cantidad de cada producto debe ser mayor a cero.",
        "INVALID_ARGUMENT",
      );
    }

    if (
      linea.precioUnitario != null &&
      (!Number.isFinite(linea.precioUnitario) || linea.precioUnitario < 0)
    ) {
      throw new DomainServiceError(
        "El precio de cada producto no puede ser negativo.",
        "INVALID_ARGUMENT",
      );
    }
  }
}
