import {
  requireCodigoCuenta,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type {
  CreateOrdenVentaInput,
  OrdenVentaOperadorRow,
  OrdenVentaRow,
  UpdateOrdenVentaInput,
} from "../types/sales.types";
import {
  insertOrdenVentaOrigenOnlyDraft,
  isOrigenOnlyFirstDraft,
} from "./create-orden-venta-origen-only-draft";
import { ordenVentaCaptureFields } from "./orden-venta-capture-fields";
import { resolveClienteCuentaDefault } from "./sales-resolve-cliente-cuenta-default";
import {
  buildLineasResumenCreate,
  insertLineasOrdenVenta,
  mapOrdenCreadaOperadorRow,
  saveOrdenVentaCabecera,
  updateHeaderOnlyDraft,
} from "./sales-create-orden-venta-persist";
import {
  resolveCompradorParaCreate,
  validateLineasCreateOrdenVenta,
} from "./sales-create-orden-venta-validation";
import { type OrdenVentaLineasResumen } from "./sales-orden-venta.db";
import { fetchPreciosUnitariosProductos } from "./sales-precios-venta";
import {
  assertCompradorDeCuenta,
  resolveBodegaVenta,
  resolveClienteVenta,
} from "./sales-validacion-venta";

/** Crea una OV en por_confirmar con una o más líneas (scope tenant, Supabase directo). */
export async function createOrdenVenta(
  input: CreateOrdenVentaInput & { idOrdenVenta?: string },
): Promise<OrdenVentaOperadorRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idComprador = input.idComprador?.trim() || "";
  const idBodegaDestino = input.idBodegaDestino?.trim() || null;
  const observaciones = input.observaciones?.trim() || null;
  const idCreador = input.idCreador?.trim() || null;
  const guardarAvance = Boolean(input.guardarAvance);
  const idOrdenVentaExistente =
    "idOrdenVenta" in input && typeof input.idOrdenVenta === "string"
      ? input.idOrdenVenta.trim()
      : "";

  const lineas =
    input.lineas && input.lineas.length > 0
      ? input.lineas
      : input.idProducto?.trim()
        ? [
            {
              idProducto: input.idProducto.trim(),
              cantidadPedida: input.cantidadPedida ?? 1,
              idBodega: input.idBodega,
            },
          ]
        : [];

  const tieneOrigenCaptura =
    Boolean(input.origenTexto?.trim()) ||
    Boolean(input.origenCorreo && input.origenCorreo.length > 0) ||
    Boolean(input.origenArchivos && input.origenArchivos.length > 0);
  const origenOnlyFirstDraft = isOrigenOnlyFirstDraft({
    guardarAvance,
    idOrdenVentaExistente,
    tieneOrigenCaptura,
  });

  const idCompradorResuelto = await resolveCompradorParaCreate({
    idComprador,
    codigoCuenta,
    guardarAvance,
    idOrdenVentaExistente,
    origenOnlyFirstDraft,
  });

  /** REQ-134: avance sin productos de catálogo → solo cabecera (no borra líneas). */
  const headerOnlyDraft =
    guardarAvance && Boolean(idOrdenVentaExistente) && lineas.length === 0;

  if (lineas.length === 0 && !headerOnlyDraft && !origenOnlyFirstDraft) {
    throw new DomainServiceError(
      "Agrega al menos un producto a la venta.",
      "INVALID_ARGUMENT",
    );
  }

  validateLineasCreateOrdenVenta(lineas, guardarAvance);

  if (idCompradorResuelto) {
    await assertCompradorDeCuenta(codigoCuenta, idCompradorResuelto);
  }

  const capture = ordenVentaCaptureFields(input);

  if (idOrdenVentaExistente) {
    if (!input.origenTexto?.trim()) {
      delete capture.origen_texto;
    }
    if (!input.origenArchivos || input.origenArchivos.length === 0) {
      delete capture.origen_archivos;
    }
    if (!input.origenCorreo || input.origenCorreo.length === 0) {
      delete capture.origen_correo;
    }
  }

  let orden: OrdenVentaRow;

  if (headerOnlyDraft) {
    orden = await updateHeaderOnlyDraft({
      codigoCuenta,
      idComprador: idCompradorResuelto,
      idBodegaDestino,
      capture,
      observaciones,
      idOrdenVentaExistente,
    });
    return mapOrdenCreadaOperadorRow(orden, idCompradorResuelto);
  }

  if (origenOnlyFirstDraft && lineas.length === 0) {
    const [idBodega, idCliente] = await Promise.all([
      resolveBodegaVenta(codigoCuenta, input.idBodega),
      resolveClienteCuentaDefault(codigoCuenta),
    ]);
    orden = await insertOrdenVentaOrigenOnlyDraft({
      codigoCuenta,
      idBodega,
      idCliente,
      idComprador: idCompradorResuelto,
      idCreador,
      idBodegaDestino,
      capture,
      observaciones,
    });
    return mapOrdenCreadaOperadorRow(orden, idCompradorResuelto);
  }

  const primeraLinea = lineas[0]!;
  const productoIds = lineas.map((linea) => linea.idProducto.trim());
  const [idBodega, idCliente, preciosUnitarios] = await Promise.all([
    resolveBodegaVenta(
      codigoCuenta,
      input.idBodega ?? primeraLinea.idBodega,
    ),
    resolveClienteVenta(codigoCuenta, primeraLinea.idProducto.trim()),
    fetchPreciosUnitariosProductos(codigoCuenta, productoIds),
  ]);

  for (const idProducto of productoIds) {
    if (!preciosUnitarios.has(idProducto)) {
      throw new DomainServiceError(
        "Uno de los productos seleccionados no es válido.",
        "INVALID_ARGUMENT",
      );
    }
  }

  orden = await saveOrdenVentaCabecera({
    codigoCuenta,
    idBodega,
    idCliente,
    idComprador: idCompradorResuelto,
    idCreador,
    idBodegaDestino,
    capture,
    observaciones,
    idOrdenVentaExistente,
  });

  await insertLineasOrdenVenta(orden.id_orden_venta, lineas, preciosUnitarios);

  const lineasResumen = new Map<string, OrdenVentaLineasResumen>([
    [orden.id_orden_venta, buildLineasResumenCreate(lineas, preciosUnitarios)],
  ]);

  return mapOrdenCreadaOperadorRow(orden, idCompradorResuelto, lineasResumen);
}

/** Actualiza cabecera y líneas de una OV editable (no despachada/cerrada/cancelada). */
export async function updateOrdenVenta(
  input: UpdateOrdenVentaInput,
): Promise<OrdenVentaOperadorRow> {
  const idOrdenVenta = input.idOrdenVenta.trim();
  if (!idOrdenVenta) {
    throw new DomainServiceError(
      "La orden de venta no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  return createOrdenVenta({ ...input, idOrdenVenta });
}
